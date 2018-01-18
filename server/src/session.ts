import {
  ControlCenterContext,
  Result, DataSource, Identifier,
} from '@openmicrostep/aspects';
import {
  Session,
  R_AuthenticationPWD, R_AuthenticationLDAP, R_AuthenticationPK, R_AuthenticationTicket,
  R_Person, R_Authorization, R_Right,
  R_Software_Context, R_Application, R_Device, R_Device_Profile
} from './classes';
import {SecureHash} from './securehash';
import {authLdap} from './ldap';
import * as crypto from 'crypto';
import {config} from './config';
import {exec} from 'child_process';

export interface SessionData {
  is_authenticated: boolean;
  is_admin: boolean;
  client_id: string;
  person?: { id: Identifier };
  device?: { id: Identifier };
  application?: { id: Identifier };
  rights: { [app: string]: { [software_context: string]: string } };
  v1_auth?: { type: 'pk' | 'pwd', id: Identifier, challenge: string };
  pairing_session?: {
    init: {
      fingerprint: string,
    },
    devices: {
      id: string,
      real_id: Identifier,
      label: string,
      brand: string,
      model: string,
      serial: string,
      state: string,
      smartcard?: {
        serial: string,
        lastName: string,
        firstName: string,
        expirationDate: Date,
        uid: string,
      },
      time: number,
      pending_actions: any[],
      action?: any,
      past_actions: any[],
    }[],
  },
  destroy(cb: (err) => void);
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
  session.pairing_session = undefined;
  session.is_admin = false;
  session.is_authenticated = false;
}

export async function writeSession(ccc: ControlCenterContext, db: DataSource.Aspects.server, authenticated_person_or_app: R_Person | R_Application | undefined, device: R_Device | undefined, session: SessionData) {
  clearSession(session);

  if (authenticated_person_or_app) {
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
  },
  async pairingSession({ context: { ccc } }, input) : Promise<Result<any>> {
    let pairing_session = this.data().pairing_session;
    if (!pairing_session) {
      pairing_session = this.data().pairing_session = {
        init: {
          token: "",
          fingerprint: "",
        },
        device_id: 0,
        devices: [],
      }
    }
    pairing_session.init.token = this.data().req.headers.cookie; // TODO: find a nicer way to share pairing_session data;
    pairing_session.init.fingerprint = config.pairing.fingerprint;
    return Result.fromValue(pairing_session.init);
  },
  async pairingSessionPoll({ context: { ccc } }, input) : Promise<Result<any>> {
    let db = ccc.find('odb') as DataSource.Aspects.server;
    let pairing_session = this.data().pairing_session;
    if (!pairing_session)
      return Result.fromDiagnostics([{ is: "error", msg: "no pairing session"}]);
    if (input.kind === "end") {
      this.data().pairing_session = undefined;
      return new Result([]);
    }
    else if (input.kind === "device") {
      let found = pairing_session.devices.find(d => d.serial === input.serial && d.brand === input.brand && d.model === input.model);
      if (!found) {
        let inv: Result = await ccc.farPromise(db.safeQuery, {
          results: [{
            name: 'device',
            where: { $instanceOf: R_Device, _r_serial_number: input.serial },
            scope: ["_label"],
          }]
        });
        let { device: [device] } = inv.value() as { device: R_Device[] };
        if (!device) {
          device = R_Device.create(ccc);
          device._label = `${input.brand} ${input.model} - ${input.serial}`;
          device._r_serial_number = input.serial;
          inv = await ccc.farPromise(db.safeSave, [device]);
        }
        if (inv.hasDiagnostics())
          return Result.fromResultWithoutValue(inv);

        pairing_session.devices.push(found = {
          id: `${++pairing_session.device_id}`,
          real_id: device.id(),
          label: device._label,
          brand: input.brand,
          model: input.model,
          serial: input.serial,
          state: input.state,
          smartcard: undefined,
          time: 0,
          pending_actions: [],
          action: undefined,
          past_actions: [],
        });
      }
      found.smartcard = input.smartcard;
      found.state = input.state;
      if (found.state === "done" && found.action) {
        if (found.action.kind.indexOf("end") !== -1)
          pairing_session.devices = pairing_session.devices.filter(d => d !== found);
        found.past_actions.push(found.action);
        found.action = undefined;
      }
      if (found.state === "init")
        found.action = undefined;
      if (found.action === undefined && found.pending_actions.length > 0)
        found.action = found.pending_actions.shift();
      found.time = Date.now();
      return Result.fromValue({ id: found.id, action: found.action });
    }
    else if (input.kind === "ui") {
      for (let device_action of input.device_actions) {
        let found = pairing_session.devices.find(d => d.serial === device_action.serial && d.brand === device_action.brand && d.model === device_action.model);
        if (!found)
          return Result.fromDiagnostics([{ is: "error", msg: "action device not found" }]);
        let action = device_action.action;
        if (action.kind.indexOf("pair") !== -1) {
          let app: R_Application = action.app;
          let device_profile: R_Device_Profile = action.device_profile;
          let device = ccc.findOrCreate<R_Device>(found.real_id, "R_Device");
          let inv: Result = await ccc.farPromise(db.safeLoad, {
            objects: [app, device_profile, device],
            scope: {
              R_Application: { '.': ["_r_sub_device_profile", "_urn"] },
              R_Device_Profile: { '.': ["_r_device"] },
            },
          });
          if (!inv.hasDiagnostics()) {
            device_profile._r_device = new Set([...device_profile._r_device, device]);
            inv = await ccc.farPromise(db.safeSave, [app]);
          }
          if (inv.hasDiagnostics())
            return Result.fromResultWithoutValue(inv);
          action = { kind: action.kind, app: app._urn };
        }
        found.pending_actions.push(action);
      }
      let now = Date.now();
      return Result.fromValue({ devices: pairing_session.devices.map(d => Object.assign({}, d, { timeout: now - d.time })) });
    }
    else if (input.kind === "sign" && config.pairing.pki_dir) {
      let results: any[] = [];
      let pki_dir = config.pairing.pki_dir;
      for (let instruction of input.instructions) {
        if (instruction.action === "enroll") {
          try {
            let pkcs7_sign = await sign(pki_dir, instruction.csr1);
            let pkcs7_auth = await sign(pki_dir, instruction.csr2);
            results.push({ pkcs7_sign, pkcs7_auth });
          }
          catch (error) {
            results.push({ error });
          }
        }
        else {
          results.push({ });
        }
      }
      return Result.fromValue({ results });
    }
    return Result.fromDiagnostics([{ is: "error", msg: "unsupported poll kind" }]);
  },
} as Session.ImplCategories.client<Session.Aspects.server>);

function sign(pki_dir: string, csr: string) {
  return new Promise<string>((resolve, reject) => {
    csr = csr.trim();
    if (!/^-----BEGIN CERTIFICATE REQUEST-----[a-zA-Z0-9+/\n=]+-----END CERTIFICATE REQUEST-----$/.test(csr))
      reject(`bad csr format`);
    let process = exec(`echo "${csr}" | openssl ca -batch -config openssl-ca.cnf -policy signing_policy -extensions signing_req -in /dev/stdin | openssl crl2pkcs7 -nocrl -certfile cacert.pem -certfile /dev/stdin`,
      { cwd: pki_dir, encoding: "utf8" });
    let data = "";
    process.stdout.on('data', (d: string) => {
      data += d;
    });
    process.stderr.on('data', (d: string) => {
      console.info("openssl ca csr stderr", d);
    });
    process.stdin.on('error', (err) => {
      console.info("openssl ca csr stdin error", err);
    });
    process.stdout.on('error', (err) => {
      console.info("openssl ca csr stdout error", err);
    });
    process.stderr.on('error', (err) => {
      console.info("openssl ca csr stderr error", err);
    });
    process.on('error', (err) => {
      reject(`${err.message}`);
    });
    process.on('close', (code) => {
      if (code === 0) {
        //let crt = data.match(/-----BEGIN CERTIFICATE-----[a-zA-Z0-9+/\n=]+-----END CERTIFICATE-----/);
        let crt = data.match(/-----BEGIN PKCS7-----[a-zA-Z0-9+/\n=]+-----END PKCS7-----/);
        if (crt)
          resolve(crt[0]);
        else {
          console.error("unable to parse crt", data);
          reject(`unable to parse crt`);
        }
      }
      else
        reject(`${code} != 0`);
    });
    process.stdin.write(csr);
  });
}
