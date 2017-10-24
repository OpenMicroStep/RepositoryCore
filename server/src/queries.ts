import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, DataSourceQuery, SafeValidator} from '@openmicrostep/aspects';
import {CreateContext, Session, cfg} from './classes';

function ifText<T>(p: T, q: { [s: string]: any, text?: string }) : T & { $text?: string } {
  if (typeof q.text === "string" && q.text)
    p["$text"] = q.text;
  return p;
}

function admin_of(cc: ControlCenter, of: string, suffix: string) {
  return cc.safe(ccc => {
    let session = ccc.findChecked('session') as Session.Aspects.server;
    return { $unionForAlln: "=U(n)",
      "U(0)=": { $instanceOf: of, _r_administrator: { $contains: session.data().person.id } },
      "U(n + 1)=": `=U(n):_r_child_${suffix}s`,
    };
  });
}
function visible_of(cc: ControlCenter, of: string, suffix: string) {
  return { $unionForAlln: "=U(n)",
    "U(0)=": admin_of(cc, of, suffix),
    "U(n + 1)=": `=U(n):_r_parent_${suffix}`,
  };
}

function admin_of_services(cc: ControlCenter) { return admin_of(cc, "R_Service", "service"); }
function visible_services(cc: ControlCenter) { return visible_of(cc, "R_Service", "service"); }
function admin_of_apptree(cc: ControlCenter) { return admin_of(cc, "R_AppTree", "apptree"); }
function visible_apptree(cc: ControlCenter) { return visible_of(cc, "R_AppTree", "apptree"); }
function admin_of_devicetree(cc: ControlCenter) { return admin_of(cc, "R_DeviceTree", "devicetree"); }
function visible_devicetree(cc: ControlCenter) { return visible_of(cc, "R_DeviceTree", "devicetree"); }

function visible_persons(cc: ControlCenter) {
  return { $instanceOf: "R_Person"/*, $in: "=S:_r_member", "S=": admin_of_services(cc) */ };
}
function visible_applications(cc: ControlCenter) {
  return { $instanceOf: "R_Application"/*, $in: "=S:_r_application", "S=": admin_of_apptree(cc) */ };
}
function visible_devices(cc: ControlCenter) {
  return { $instanceOf: "R_Device"/*, $in: "=S:_r_device", "S=": admin_of_devicetree(cc) */ };
}

export const queries = new Map<string, DataSourceQuery>();
queries.set("actions", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_persons(cc), query),
  scope: ['_first_name', '_last_name', '_disabled']
}));
queries.set("rights", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_persons(cc), query),
  scope: ['_first_name', '_last_name', '_disabled']
}));
queries.set("persons", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_persons(cc), query),
  scope: ['_first_name', '_last_name', '_disabled']
}));
queries.set("services", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_services(cc), query),
  scope: ['_label', '_disabled', '_r_parent_service']
}));
queries.set("apptrees", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_apptree(cc), query),
  scope: ['_label', '_disabled', '_r_parent_apptree', '_r_child_apptrees']
}));
queries.set("devicetrees", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_devicetree(cc), query),
  scope: ['_label', '_disabled', '_r_parent_devicetree', '_r_child_devicetrees']
}));
queries.set("devices", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_devices(cc), query),
  scope: ['_urn', '_label', '_disabled']
}));
queries.set("applications", (reporter, query, cc) => ({
  name: "items",
  where: ifText(visible_applications(cc), query),
  scope: ['_label', '_urn', '_disabled']
}));
queries.set("authorizations", (reporter, query, cc) => ({
  name: "items",
  where: ifText({ $instanceOf: "R_Authorization" }, query),
  scope: ['_label', '_urn', '_disabled']
}));
queries.set("software-contexts", (reporter, query, cc) => ({
  name: "items",
  where: { $instanceOf: "R_Software_Context" },
  scope: ['_label', '_urn', '_disabled', '_r_parent_context']
}));
queries.set("root-software-contexts", (reporter, query, cc) => ({
  name: "items",
  where: { $instanceOf: "R_Software_Context", _r_parent_context: undefined },
  scope: ['_label', '_urn', '_disabled', '_r_parent_context']
}));
queries.set("use-profiles", (reporter, query, cc) => ({
  "application=": ifText({ $instanceOf: "R_Application", _id: query.app_id }, query),
  name: "items",
  where: "=application:_r_sub_use_profile",
  scope: ['_label']
}));
queries.set("device-profiles", (reporter, query, cc) => ({
  "application=": ifText({ $instanceOf: "R_Application", _id: query.app_id }, query),
  name: "items",
  where: "=application:_r_device_profile",
  scope: ['_label']
}));
queries.set("application-tree", (reporter, query, cc) => ({
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
queries.set("settings", (reporter, query, cc) => ({
  "ldap-configurations=": { $instanceOf: "R_LDAPConfiguration" },
  results: [
    { name: "ldap-configurations", where: "=ldap-configurations", scope: {
      R_LDAPConfiguration: { '.': ["_ldap_url", "_ldap_dn", "_ldap_password", "_ldap_user_base", "_ldap_user_filter", "_ldap_attribute_map", "_ldap_group_map"] },
      R_LDAPAttribute: { '_ldap_attribute_map.': ['_ldap_attribute_name', '_ldap_to_attribute_name'] },
      R_LDAPGroup: { '_ldap_group_map.': ['_ldap_dn', '_ldap_group'] },
    }},
  ]
}));
