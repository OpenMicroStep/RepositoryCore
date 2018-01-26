import {
  ControlCenterContext,
  Result, DataSource, Identifier,
} from '@openmicrostep/aspects';
import {
  Session,
  R_AuthenticationPWD, R_AuthenticationLDAP, R_AuthenticationPK, R_AuthenticationTicket,
  R_Person, R_Authorization, R_Right,
  R_Software_Context, R_Application, R_Device
} from './classes';
import {SecureHash} from './securehash';
import {authLdap} from './ldap';
import * as crypto from 'crypto';

export interface SessionData {
  is_authenticated: boolean;
  is_admin: boolean;
  client_id: string;
  person?: { id: Identifier };
  device?: { id: Identifier };
  application?: { id: Identifier };
  rights: { [app: string]: { [software_context: string]: string } };
  v1_auth?: { type: 'pk' | 'pwd', id: Identifier, challenge: string };
  destroy(cb: (err) => void);
  save(cb: (err) => void);
}

function mapResult<I, O>(i: Result<I>, map: (v: I) => O) : Result<O> {
  if (i.hasOneValue())
    return Result.fromResultWithNewValue(i, map(i.value()));
  return i as Result<any>;
}

export async function authsByLogin(ccc: ControlCenterContext, db: DataSource.Aspects.server, login: string) : Promise<Result<(R_AuthenticationPWD | R_AuthenticationLDAP | R_AuthenticationPK)[]>> {
  let inv = await ccc.farPromise(db.rawQuery, {
    name: 'auths' ,
    where: { $union: [
      { $instanceOf: "R_AuthenticationPWD" , _mlogin: login },
      { $instanceOf: "R_AuthenticationPK"  , _mlogin: login },
      { $instanceOf: "R_AuthenticationLDAP", _mlogin: login }
    ] }, scope: {
      R_AuthenticationPWD:  { '.': ['_mlogin', '_hashed_password'] },
      R_AuthenticationPK:   { '.': ['_mlogin', '_public_key'     ] },
      R_AuthenticationLDAP: { '.': ['_mlogin', '_ldap_dn'        ] },
    },
  });
  return mapResult(inv, v => v.auths as (R_AuthenticationPWD | R_AuthenticationLDAP | R_AuthenticationPK)[]);
}

export async function authenticableFromAuth(ccc: ControlCenterContext, db: DataSource.Aspects.server, auth: R_AuthenticationPWD | R_AuthenticationLDAP | R_AuthenticationPK) : Promise<Result<R_Person | R_Application>> {
  let inv = await ccc.farPromise(db.rawQuery, {
    name: 'authenticables',
    where: { $union: [
      { $instanceOf: "R_Person", _r_authentication: { $contains: auth } },
      { $instanceOf: "R_Application", _r_authentication: { $contains: auth } },
    ] },
    scope: ['_disabled'],
  });
  if (inv.hasOneValue()) {
    let v = inv.value()['authenticables'];
    if (v.length === 1)
      return Result.fromResultWithNewValue(inv, inv.value().authenticables[0] as R_Person | R_Application);
    return new Result([{ is: "error", msg: `person not found` }]);
  }
  return Result.fromItemsWithoutValue(inv.items());
}
export function clearSession(session: SessionData) {
  session.rights = {};
  session.person = undefined;
  session.device = undefined;
  session.application = undefined;
  session.is_admin = false;
  session.is_authenticated = false;
}

export async function loadComputedRights(ccc: ControlCenterContext, db: DataSource.Aspects.server, authenticated_person_or_app: R_Person | R_Application) {
  let res = await ccc.farPromise(db.rawQuery, {
    "A=": {
      $instanceOf: "R_Authorization",
      _r_authenticable: { $contains: authenticated_person_or_app }
    },
    "C=": { $unionForAlln: "=U(n)",
      "U(0)=": "=A:_r_sub_right:_r_application:_r_software_context",
      "U(n + 1)=": `=U(n):_r_child_contexts`,
    },
    results: [
      { name: "authorization", where: "=A", scope: {
        R_Authorization: { '.': ['_r_sub_right'] },
        R_Right: { '_r_sub_right.': ['_r_action', '_r_application', '_r_software_context', '_r_use_profile', '_r_device_profile'] },
        R_Element: { '_r_sub_right._r_action.': ['_system_name', '_order'] },
        R_Application: { '_r_sub_right._r_application.': ['_urn', '_r_software_context'] },
      }},
      { name: "software_context", where: "=C", scope: {
        R_Software_Context: { '.': ['_urn', '_r_child_contexts', '_r_parent_context'] },
      }}
    ]
  });
  if (res.hasOneValue()) {
    let { authorization, software_context } = res.value() as { authorization: R_Authorization[], software_context: R_Software_Context[] };
    let rights_by_sc = new Map<R_Software_Context, R_Right[]>();
    let applications = new Set<R_Application>();

    for (let a of authorization) {
      for (let r of a._r_sub_right) {
        if (r._r_application)
          applications.add(r._r_application);
        let sc = r._r_software_context;
        if (sc) {
          let rights = rights_by_sc.get(sc);
          if (!rights)
            rights_by_sc.set(sc, rights = []);
            rights.push(r);
        }
      }
    }

    let computed_rights: { [s: string]: { [s: string]: string } } = {};
    for (let a of applications) {
      let rights: { [s: string]: string } = computed_rights[a._urn!] = {};
      if (a._r_software_context)
        compute_rights(rights, [a._r_software_context]);
      function compute_rights(rights: { [s: string]: string }, software_context: Iterable<R_Software_Context>) {
        for (let sc of software_context) {
          let sc_up: R_Software_Context | undefined = sc;
          let r: R_Right | undefined = undefined;
          while (sc_up && !r) {
            r = (rights_by_sc.get(sc_up) || []).find(r => r._r_application === a);
            sc_up = sc_up._r_parent_context;
          }
          rights[sc._urn!] = (r && r._r_action && r._r_action._system_name) || "r_none";
          compute_rights(rights, sc._r_child_contexts);
        }
      }
    }
    return computed_rights;
  }
  return undefined;
}
export async function writeSession(ccc: ControlCenterContext, db: DataSource.Aspects.server, authenticated_person_or_app: R_Person | R_Application | undefined, device: R_Device | undefined, session: SessionData) {
  clearSession(session);

  if (authenticated_person_or_app) {
    let computed_rights = await loadComputedRights(ccc, db, authenticated_person_or_app);
    if (computed_rights) {
      session.rights = computed_rights;
      if (authenticated_person_or_app instanceof R_Application)
        session.application = { id: authenticated_person_or_app.id() };
      else
        session.person = { id: authenticated_person_or_app.id() };
      if (device instanceof R_Device)
        session.device = { id: device.id() };
      session.is_admin = (computed_rights["repository"] || {})["repository-superadmin"] === "r_superuse";
      session.is_authenticated = true;
      console.info(`${authenticated_person_or_app.id()} is authenticated`);
    }
  }
}

Session.category('server', {
  setData(data) {
    this._data = data;
  },
  data() {
    return this._data;
  }
} as Session.ImplCategories.server<Session & { _data: any }>);

const hex_2_alpha = "ABCDEFGHIJKLMNOP".split('');
Session.category('client', {
  isAuthenticated() {
    return !!this.data().is_authenticated;
  },
  logout() {
    clearSession(this.data());
    return new Promise<Result<void>>((resolve, reject) =>  { this.data().destroy(() => resolve(new Result([]))); });
  },
  async loginByPassword({ context: { ccc } }, q) {
    let db = ccc.find('odb') as DataSource.Aspects.server;
    let inv = await authsByLogin(ccc, db, q.login);
    let authenticated_person: R_Person | R_Application | undefined = undefined;
    if (inv.hasOneValue()) {
      let auths = inv.value();
      if (auths.length === 1) {
        let auth = auths[0];
        let inv_p = await authenticableFromAuth(ccc, db, auth);
        if (inv_p.hasOneValue()) {
          let p = inv_p.value();
          if (!p._disabled && auth instanceof R_AuthenticationPWD) {
            if (await SecureHash.isValid(q.password, auth._hashed_password!))
              authenticated_person = p;
          }
          else if (!p._disabled && auth instanceof R_AuthenticationLDAP && p instanceof R_Person) {
            authenticated_person = await authLdap(ccc, db, q.login, q.password, p, auth);
          }
        }
      }
      else if (auths.length === 0) {
        authenticated_person = await authLdap(ccc, db, q.login, q.password, undefined, undefined);
      }
    }
    await writeSession(ccc, db, authenticated_person, undefined, this.data());
    return Result.fromDiagnosticsAndValue(authenticated_person ? [] : [{ is: "error", msg: `mauvais nom d'utilisateur/mot de passe` }], !!authenticated_person);
  },
  async oneTimePasswordForDevice({ context: { ccc } }, device) : Promise<Result<string>> {
    let db = ccc.find('odb') as DataSource.Aspects.server;
    let token = await new Promise<string>((resolve, reject) => {
      crypto.randomBytes(4, (err, buf) => {
        if (err) return reject(err);
        let str = "";
        for (let i = 0; i < buf.length; i++) {
          let byte = buf[i];
          str += hex_2_alpha[byte >> 4];
          str += hex_2_alpha[byte & 0xf];
        }
        resolve(str);
      });
    });
    let ticket = R_AuthenticationTicket.create(ccc);
    ticket._r_device = device;
    ticket._r_authenticable = ccc.findOrCreate(this.data().person.id, "R_Person");
    ticket._creation_date = new Date();
    ticket._r_token = token;
    let save =  await ccc.farPromise(db.rawSave, [ticket]);
    if (!save.hasDiagnostics())
      return Result.fromValue(token);
    return Result.fromItemsWithoutValue(save.items());
  }
} as Session.ImplCategories.client<Session.Aspects.server>);


