import {Result, DataSource} from '@openmicrostep/aspects';
import {Session, R_AuthenticationPWD, R_AuthenticationLDAP, R_Person, R_Authorization, R_Software_Context, R_Application, R_Right} from './classes';
import {SecureHash} from './securehash';
import {authLdap} from './ldap';

Session.category('server', {
  setData(data) {
    this._data = data;
  },
  data() {
    return this._data;
  }
} as Session.ImplCategories.server<Session & { _data: any }>);

Session.category('client', {
  isAuthenticated() {
    return !!this.data().isAuthenticated;
  },
  logout() {
    this.data().isAuthenticated = false;
  },
  async loginByPassword({ context: { ccc } }, q) {
    let db = ccc.find('odb') as DataSource.Aspects.server;
    let inv = await ccc.farPromise(db.rawQuery, {
      name: 'auths' ,
      where: { $union: [
        { $instanceOf: "R_AuthenticationPWD" , _mlogin: q.login },
        { $instanceOf: "R_AuthenticationPK"  , _mlogin: q.login },
        { $instanceOf: "R_AuthenticationLDAP", _mlogin: q.login }
      ] }, scope: {
        R_AuthenticationPWD:  { '.': ['_mlogin', '_hashed_password'] },
        R_AuthenticationPK:   { '.': ['_mlogin', '_public_key'     ] },
        R_AuthenticationLDAP: { '.': ['_mlogin', '_ldap_dn'        ] },
      },
    });
    let authenticated_person: R_Person | undefined = undefined;
    if (inv.hasOneValue()) {
      let auths = inv.value()['auths'];
      try {
        this.controlCenter().registerComponent(this);
        if (auths.length === 1) {
          let a = auths[0];
          let inv = await ccc.farPromise(db.rawQuery, { name: 'p', where: { $instanceOf: "R_Person" , _r_authentication: { $has: a } }, scope: ['_disabled'] });
          if (inv.hasOneValue() && inv.value().p.length === 1) {
            let p = inv.value().p[0] as R_Person;
            if (!p._disabled && a instanceof R_AuthenticationPWD) {
              if (await SecureHash.isValid(q.password, a._hashed_password!))
                authenticated_person = p;
            }
            else if (!p._disabled && a instanceof R_AuthenticationLDAP) {
              authenticated_person = await authLdap(ccc, db, q.login, q.password, p, a);
            }
          }
          else
            console.error(inv.diagnostics());
        }
        else {
          authenticated_person = await authLdap(ccc, db, q.login, q.password, undefined, undefined);
        }
      }
      finally {
        this.controlCenter().unregisterComponent(this);
      }
    }
    else
      console.error(inv.diagnostics());
    if (authenticated_person) {
      let res = await ccc.farPromise(db.rawQuery, {
        "A=": {
          $instanceOf: "R_Authorization",
          r_authenticable: { $has: authenticated_person }
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
      if (!res.hasOneValue())
        authenticated_person = undefined;
      else {
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
        this.data().rights = computed_rights;
        this.data().person = {
          id: authenticated_person.id(),
        };
        this.data().is_admin = (computed_rights["repository"] || {})["repository-superadmin"] === "r_superuse";
      }
    }
    this.data().isAuthenticated = !!authenticated_person;
    return Result.fromDiagnosticsAndValue(authenticated_person ? [] : [{ is: "error", msg: `bad login/password` }], !!authenticated_person);
  }
} as Session.ImplCategories.client<Session.Aspects.server>);

