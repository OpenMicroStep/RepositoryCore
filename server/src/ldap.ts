import { DataSource, VersionedObject, ControlCenterContext } from '@openmicrostep/aspects';
import { AttributeTypes as V } from '@openmicrostep/msbuildsystem.shared';
import { R_LDAPConfiguration, R_Person, R_AuthenticationLDAP } from '../../shared/src/classes';
import * as ldap from 'ldapjs';
import AndFilter = ldap.filters.AndFilter;
import OrFilter = ldap.filters.OrFilter;
import EqualityFilter = ldap.filters.EqualityFilter;
declare module 'ldapjs' {
  namespace filters {
    class Filter {}
    class AndFilter extends Filter {
      constructor(opts: { filters: Filter });
    }
    class OrFilter extends Filter {
      constructor(opts: { filters: Filter });
    }
    class EqualityFilter extends Filter {
      constructor(opts: {
        attribute: string,
        value: string
      })
    }
  }
}
export const validateLdapConfig = V.objectValidator({
  link: V.objectValidator({
    url: V.validateString,
  }),
  reader: V.objectValidator({
    dn: V.validateString,
    password: V.validateString,
  }),
  users: V.objectValidator({
    suffix: V.validateString,
    filter: V.validateString,
  }),
});

async function findLdapUser(cfg: R_LDAPConfiguration, login: string, dn: string | undefined) : Promise<{ dn: string, [s: string]: string } | undefined> {
  let link = { url: cfg._ldap_url! };
  let user: { dn: string, [s: string]: string } | undefined = dn ? { dn: dn } : undefined;
  if (!user) {
    let adminClient = ldap.createClient(link);
    await new Promise<void>((resolve, reject) => adminClient.bind(cfg._ldap_dn!, cfg._ldap_password!, (err) => err ? reject(err) : resolve()));
    let attributes = [...cfg._ldap_attribute_map].map(a => a._ldap_attribute_name!);
    let users = await new Promise<{ dn: string, [s: string]: string }[]>((resolve, reject) => {
      adminClient.search(cfg._ldap_user_base!, {
        scope: "sub",
        attributes: attributes,
        filter: cfg._ldap_user_filter!.replace(/\$login/g, login),
      }, function (err, ldapResult) {
        if (err) return reject(err);
        let res: any[] = [];
        ldapResult.on("end", () => resolve(res));
        ldapResult.on("searchEntry", (entry) => {
          res.push(entry);
        });
      });
    });
    if (users.length === 1)
      user = users[0];
  }
  return user;
}
async function bindLdapUser(
  ccc: ControlCenterContext,
  db: DataSource.Aspects.server, cfg: R_LDAPConfiguration,
  login: string, password: string, user: { dn: string, [s: string]: string },
  person: R_Person | undefined, auth: R_AuthenticationLDAP | undefined
) {
  let link = { url: cfg._ldap_url! };
  let userClient = ldap.createClient(link);
  let ok = await new Promise<boolean>((resolve, reject) => userClient.bind(user!.dn, password, (err) => {
    resolve(!err);
  }));
  if (ok) {
    let save: VersionedObject[] = [];
    if (!auth) {
      if (!person) {
        person = R_Person.create(ccc);
        let user_object = user.object;
        for (let a of cfg._ldap_attribute_map)
          person[a._ldap_to_attribute_name!] = user_object[a._ldap_attribute_name!];
        save.push(person);
      }
      let a = R_AuthenticationLDAP.create(ccc);
      a._mlogin = login;
      a._ldap_dn = user.dn;
      person._r_authentication = new Set(person._r_authentication).add(a);
      person._login = new Set(person._login).add(login);
      save.push(a);
    }
    if (person) { // update groups
      let map = [...cfg._ldap_group_map];
      let filters = map.map(g => new EqualityFilter({ attribute: 'member', value: user.dn }));
      let f = new OrFilter({ filters: filters });
      let ldap_groups = await new Promise<{ dn: string, [s: string]: string }[]>((resolve, reject) => {
        userClient.search(cfg._ldap_user_base!, {
          scope: "sub",
          attributes: ['dn'],
          filter: f as any,
        }, function (err, ldapResult) {
          if (err) return reject(err);
          let res: any[] = [];
          ldapResult.on("end", () => resolve(res));
          ldapResult.on("searchEntry", (entry) => {
            res.push(entry);
          });
        });
      });
      for (let group of map) {
        let ldap_group = ldap_groups.find(g => group._ldap_dn === g.dn);
        let auth = group._ldap_group!;
        let _r_authenticable = new Set(auth._r_authenticable);
        _r_authenticable[ldap_group ? 'add' : 'delete'](person);
        auth._r_authenticable = _r_authenticable;
        save.push(auth);
      }
    }
    if (save.length) {
      let inv = await db.controlCenter().safe(ccc => ccc.farPromise(db.rawSave, save));
      if (inv.hasDiagnostics())
        return Promise.reject('failed to update user');
    }
  }
  return ok ? person : undefined;
}

export async function authLdap(
  ccc: ControlCenterContext,
  db: DataSource.Aspects.server, login: string, password: string,
  person: R_Person | undefined, auth: R_AuthenticationLDAP | undefined
) {
  if (!(/^[a-zA-Z0-9_-]+$/.test(login)))
    return Promise.reject(`login is too complex for ldap api`);

  let inv = await ccc.farPromise(db.rawQuery, { results: [
    { name: 'configurations',
      where: { $instanceOf: "R_LDAPConfiguration" },
      scope: ['_ldap_url', '_ldap_dn', '_ldap_password', '_ldap_user_base', '_ldap_user_filter', '_ldap_attribute_map', '_ldap_group_map'],
    },
    { name: '_ldap_group_map',
      where: { $instanceOf: "R_LDAPGroup" },
      scope: ['_ldap_dn', '_ldap_group'],
    },
    { name: '_ldap_group',
      where: { $instanceOf: "R_Authorization" },
      scope: ['_r_authenticable'],
    },
    { name: '_ldap_attribute_map',
      where: { $instanceOf: "R_LDAPAttribute" },
      scope: ['_ldap_attribute_name', '_ldap_to_attribute_name'],
    },
  ]});
  if (inv.hasOneValue()) {
    let configurations = inv.value().configurations as R_LDAPConfiguration[];
    let users = await Promise.all(configurations.map(cfg => findLdapUser(cfg, login, auth ? auth._ldap_dn : undefined)));
    let nb = users.filter(u => !!u).length;
    if (nb === 1) {
      let i = users.findIndex(u => !!u);
      return await bindLdapUser(ccc, db, configurations[i], login, password, users[i]!, person, auth);
    }
    if (nb > 1)
      return Promise.reject(`user is present in multiple LDAP`);
    return Promise.reject(`user not found`);
  }
  return Promise.reject(`no LDAP configuration`);
}
