import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery, SafeValidator} from '@openmicrostep/aspects';
import {CreateContext, Session} from './classes';
import * as express from 'express';
import * as express_s from 'express-serve-static-core';
import {ExpressTransport} from '@openmicrostep/aspects.express';
const session = require('express-session');

export function api_aspect(creator: CreateContext) : express.Router {
  let router = express.Router();
  router.use('/', express.static(__dirname + "/../../../repository app/"));

  let queries = new Map<string, DataSourceQuery>();
  queries.set("actions", (reporter, query) => ({
    name: "items",
    where: { $instanceOf: "R_Person", $text: query.text }, 
    scope: ['_first_name', '_last_name', '_disabled']
  }));
  queries.set("rights", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Person", $text: query.text }, 
    scope: ['_first_name', '_last_name', '_disabled']
  }));
  queries.set("persons", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Person", $text: query.text }, 
    scope: ['_first_name', '_last_name', '_disabled']
  }));
  queries.set("devices", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Device", $text: query.text }, 
    scope: ['_urn', '_label', '_disabled']
  }));
  queries.set("applications", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Application", $text: query.text },
    scope: ['_label', '_urn', '_disabled']
  }));
  queries.set("authorizations", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Authorization", $text: query.text },
    scope: ['_label', '_urn', '_disabled']
  }));
  queries.set("software-contexts", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Software_Context" },
    scope: ['_label', '_urn', '_disabled', '_r_parent_context']
  }));
  queries.set("use-profiles", (reporter, query) => ({
    "application=": { $instanceOf: "R_Application", _id: query.app_id, $text: query.text },
    name: "items",
    where: "=application:_r_sub_use_profile",
    scope: ['_label']
  }));
  queries.set("device-profiles", (reporter, query) => ({
    "application=": { $instanceOf: "R_Application", _id: query.app_id, $text: query.text },
    name: "items",
    where: "=application:_r_device_profile",
    scope: ['_label']
  }));
  queries.set("application-tree", (reporter, query) => ({ 
    "applications=": { $instanceOf: "R_Application" },
    results: [
      { name: "applications", where: "=applications", scope: ['_label', '_urn', '_disabled', '_r_software_context', '_r_sub_use_profile', '_r_sub_device_profile'] },
      { name: "use-profiles", where: "=applications:_r_sub_use_profile", scope: ['_label'] },
      { name: "device-profiles", where: "=applications:_r_sub_device_profile", scope: ['_label'] },
      {
        name: "software-contexts",
        where: { $instanceOf: "R_Software_Context" },
        scope: ['_label', '_urn', '_disabled', '_r_parent_context', '_r_child_contexts'],
      },
      {
        name: "actions",
        where: { $instanceOf: "R_Element", _system_name: { $in: ["r_none", "r_authenticate", "r_use", "r_superuse"] } },
        scope: ['_system_name', '_order'],
      },
    ]
  }));
  queries.set("settings", (reporter, query) => ({
    "ldap-configurations=": { $instanceOf: "R_LDAPConfiguration" },
    results: [
      { name: "ldap-configurations", where: "=ldap-configurations", scope: ["_ldap_url", "_ldap_dn", "_ldap_password", "_ldap_user_base", "_ldap_user_filter", "_ldap_attribute_map", "_ldap_group_map"] },
      { name: "_ldap_attribute_map", where: "=ldap-configurations:_ldap_attribute_map", scope: ['_ldap_attribute_name', '_ldap_to_attribute_name'] },
      { name: "_ldap_group_map", where: "=ldap-configurations:_ldap_group_map", scope: ['_ldap_dn', '_ldap_group'] },
    ]
  }));
  let transport = new ExpressTransport(router, async (cstor, id) => {
    const {cc, session, db} = creator();
    db.setQueries(queries);
    if (id === 'odb')
        return Promise.resolve(db);
    if (id === 'session')
        return Promise.resolve(session);
    return Promise.reject('not found');
  });
  ControlCenter.globalCache.installPublicTransport(transport, DataSource, ["server"]);
  ControlCenter.globalCache.installPublicTransport(transport, Session, ["client"]);
  return router;
}