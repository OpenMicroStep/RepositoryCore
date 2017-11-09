import {
  ControlCenter, ControlCenterContext,
  VersionedObject, VersionedObjectConstructor, VersionedObjectManager,
  DataSource, Aspect, DataSourceInternal, AspectConfiguration, AspectSelection,
  SafePostLoadContext, SafePreSaveContext, SafeValidator, DataSourceTransaction,
} from '@openmicrostep/aspects';
import {ObiDataSource, OuiDB, ObiDefinition} from '@openmicrostep/aspects.obi';
import {Reporter} from '@openmicrostep/msbuildsystem.shared';
import {R_AuthenticationPWD, Session} from '../../shared/src/classes';
import * as interfaces from '../../shared/src/classes';
import {SecureHash} from './securehash';
import {exec} from 'child_process';
import * as crypto from 'crypto';
export * from '../../shared/src/classes';
import './session';

export const mapClasses = {};
const mapClassesR = {};
export const mapAttributes = {};
type AttributeRights = {
  read: Set<string>,
  create: Set<string>,
  update: Set<string>,
  delete: Set<string>,
};
type ClassRights = {
  read: Set<string>, read_key: string,
  create: Set<string>, create_key: string,
  update: Set<string>, update_key: string,
  delete: Set<string>, delete_key: string,
  attributes: {
    [s: string]: AttributeRights
  }
};
const rights_by_classname: { [s: string]: ClassRights } = {};
const sub_object_classes = new Map<string, { classname: string, attribute: string }[]>();

function admin_of(ccc: ControlCenterContext, of: string, suffix: string) {
  let session = ccc.findChecked('session') as Session.Aspects.server;
  return { $unionForAlln: "=U(n)",
    "U(0)=": { $instanceOf: of, _r_administrator: { $contains: session.data().person_id } },
    "U(n + 1)=": `=U(n):_r_child_${suffix}s`,
  };
}
function visible_of(ccc: ControlCenterContext, of: string, suffix: string) {
  return { $unionForAlln: "=U(n)",
    "U(0)=": admin_of(ccc, of, suffix),
    "U(n + 1)=": `=U(n):_r_parent_${suffix}`,
  };
}
function admin_of_services(ccc: ControlCenterContext) { return admin_of(ccc, "R_Service", "service"); }
function admin_of_apptree(ccc: ControlCenterContext) { return admin_of(ccc, "R_AppTree", "apptree"); }
function admin_of_devicetree(ccc: ControlCenterContext) { return admin_of(ccc, "R_DeviceTree", "devicetree"); }
function is_super_admin(cc: ControlCenter) {
  return cc.safe(ccc => (ccc.findChecked('session') as Session.Aspects.server).data().is_admin === true);
}
const rights_queries: {
  [s: string]: (ccc: ControlCenterContext, objects: VersionedObject[]) => true | false | DataSourceInternal.ObjectSetDefinition,
} = {
  "public": () => true,
  "member": () => true,
  "auth_admin": (ccc, objects) => {
    return {
      $in: "=S:_r_application",
      "S=": admin_of_apptree(ccc),
    };
  },
  "person_admin": (ccc, objects) => {
    return {
      $in: "=S:_r_member",
      _id: { $in: objects.map(m => m.id()) },
      "S=": admin_of_services(ccc),
    };
  },
  "app_admin": (ccc, objects) => {
    return {
      $in: "=S:_r_application",
      _id: { $in: objects.map(m => m.id()) },
      "S=": admin_of_apptree(ccc),
    };
  },
  "device_admin": (ccc, objects) => {
    return {
      $in: "=S:_r_device",
      _id: { $in: objects.map(m => m.id()) },
      "S=": admin_of_devicetree(ccc),
    };
  },
  "admin": (ccc, objects) => {
    let session = ccc.findChecked('session') as Session.Aspects.server;
    return !!session.data().is_admin;
  },

};

const valid_entity_operations = new Set(['read', 'create', 'update', 'delete']);
const valid_attribute__operations = new Set(['read', 'create', 'update', 'delete']);
export function buildMaps(ouiDb: OuiDB) {
  mapAttributes['_version'] = 'version';
  let will_build: [string, ObiDefinition][] = [];
  for (let obi of ouiDb.systemObiByName.values()) {
    if (obi.is.system_name === "ENT") {
      let n = obi.system_name.replace(/[ -]/g, '_');
      mapClasses[n] = obi.system_name;
      mapClassesR[obi.system_name] = n;
      will_build.push([n, obi]);
    }
    if (obi.is.system_name === "Car") {
      let n = '_' + obi.system_name.replace(/[ -]/g, '_');
      mapAttributes[n] = obi.system_name;
    }
  }
  for (let [n, obi] of will_build)
    if (n !== "R_Element")
      rights_by_classname[n] = buildRights(obi);

  function buildRights(obi: ObiDefinition) {
    const r_internal_right = systemObiByName(ouiDb, "r_internal right");
    const r_who = systemObiByName(ouiDb, "r_who");
    const r_operation = systemObiByName(ouiDb, "r_operation");
    const pattern = systemObiByName(ouiDb, "pattern");
    const characteristic = systemObiByName(ouiDb, "characteristic");
    let patterns = obi.attributes.get(pattern)! as Set<ObiDefinition>;
    let rights = {
      read: new Set<string>(),
      create: new Set<string>(),
      update: new Set<string>(),
      delete: new Set<string>(),
    };
    let attributes: { [s: string]: {
      read: Set<string>,
      create: Set<string>,
      update: Set<string>,
      delete: Set<string>,
     } } = {};
    for (let pattern of patterns) {
      let car = getOne(pattern, characteristic) as ObiDefinition;
      let internal_rights = (pattern.attributes.get(r_internal_right) || []) as Iterable<ObiDefinition>;
      if (car.system_name === "entity") {
        build_car_rights(internal_rights, rights, valid_entity_operations);
      }
      else if (car.system_name === "urn") {
        attributes["_urn"] = { // rights on urn are the same as on entity
          read: rights.read,
          create: rights.create,
          update: new Set<string>(),
          delete: rights.delete,
        };
      }
      else if (car.system_name !== "version") {
        let a_name = '_' + car.system_name!.replace(/[ -]/g, '_');
        let a = attributes[a_name] = {
          read: new Set<string>(),
          create: new Set<string>(),
          update: new Set<string>(),
          delete: new Set<string>(),
        };
        build_car_rights(internal_rights, a, valid_attribute__operations);
      }
    }
    return {
      read  : rights.read  , read_key  : [...rights.read  ].join(','),
      create: rights.create, create_key: [...rights.create].join(','),
      update: rights.update, update_key: [...rights.update].join(','),
      delete: rights.delete, delete_key: [...rights.delete].join(','),
      attributes: attributes
    };

    function build_car_rights(
      internal_rights: Iterable<ObiDefinition>,
      a: { read: Set<string>; create: Set<string>; update: Set<string>; delete: Set<string>; },
      valid_operations: Set<string>
    ) {
      for (let right of internal_rights) {
        for (let who of (right.attributes.get(r_who) || []) as Iterable<ObiDefinition>) {
          for (let operation of (right.attributes.get(r_operation) || []) as Iterable<ObiDefinition>) {
            let who_name = who.system_name;
            if (!who_name)
              throw new Error(`invalid who ${who._id} for ${obi.system_name}`);

            if (!valid_operations.has(operation.system_name!))
              throw new Error(`invalid operation ${operation.system_name!} ${operation._id} for ${obi.system_name}`);
            a[operation.system_name!].add(who_name);
            if (operation.system_name !== 'read')
              a['read'].add(who_name);
          }
        }
      }
    }
  }
}

export type Context = { cc: ControlCenter, session: Session.Aspects.server, db: DataSource.Aspects.server };
export type CreateContext = () => Context;
export const selection = new AspectSelection([
  interfaces.Session.Aspects.server            ,
  ObiDataSource.Aspects.server                 ,
  interfaces.R_AuthenticationTicket.Aspects.obi,
  interfaces.R_AuthenticationPK.Aspects.obi    ,
  interfaces.R_AuthenticationPWD.Aspects.obi   ,
  interfaces.R_AuthenticationLDAP.Aspects.obi  ,
  interfaces.R_Person.Aspects.obi              ,
  interfaces.R_Service.Aspects.obi             ,
  interfaces.R_DeviceTree.Aspects.obi          ,
  interfaces.R_AppTree.Aspects.obi             ,
  interfaces.R_Application.Aspects.obi         ,
  interfaces.R_Use_Profile.Aspects.obi         ,
  interfaces.R_Device_Profile.Aspects.obi      ,
  interfaces.R_License.Aspects.obi             ,
  interfaces.R_Software_Context.Aspects.obi    ,
  interfaces.R_Device.Aspects.obi              ,
  interfaces.R_Authorization.Aspects.obi       ,
  interfaces.R_Right.Aspects.obi               ,
  interfaces.R_Element.Aspects.obi             ,
  interfaces.Parameter.Aspects.obi             ,
  interfaces.R_LDAPAttribute.Aspects.obi       ,
  interfaces.R_LDAPGroup.Aspects.obi           ,
  interfaces.R_LDAPConfiguration.Aspects.obi   ,
]);
export const cfg = new AspectConfiguration(selection);
export function controlCenterCreator(ouiDb: OuiDB) : CreateContext {
  function load_access_lists(ccc: ControlCenterContext, reporter: Reporter, dataSource: DataSource.Categories.raw, access_lists: Map<string, VersionedObject[]>) : Promise<Map<VersionedObject, string[]>> {
    let p: Promise<void>[] = [];
    let r = new Map<VersionedObject, string[]>();
    for (let [access_name, objects] of access_lists) {
      let access_names = access_name.split(',');
      let q: DataSourceInternal.RequestDefinition = { results: [] };
      function apply_access_to(access_name: string, objects: VersionedObject[]) {
        for (let object of objects) {
          let access = r.get(object);
          if (!access)
            r.set(object, access = []);
          access.push(access_name);
        }
      }
      for (let access_name of access_names) {
        let maker = rights_queries[access_name];
        if (!maker)
          reporter.diagnostic({ is: "error", msg: `unsupported access_name: ${access_name}` });
        else {
          let r = maker(ccc, objects);
          if (r === true)
            apply_access_to(access_name, objects);
          else if (r !== false)
            q.results.push({ name: access_name, where: r });
        }
      }
      if (q.results.length > 0) {
        p.push(ccc.farPromise(dataSource.rawQuery, q).then(res => {
          if (res.hasOneValue()) {
            let v = res.value();
            for (let access_name of access_names) {
              let objects = v[access_name];
              if (objects)
                apply_access_to(access_name, objects);
            }
          }
        }));
      }
    }
    return Promise.all(p).then(() => r);
  }

  function safe_is_admin(reporter: Reporter, dataSource: DataSource.Categories.raw) : SafePostLoadContext & SafePreSaveContext {
    let is_admin = is_super_admin(dataSource.controlCenter());
    return {
      for_each(vo, path) {},
      finalize() {
        return is_admin ? Promise.resolve() : Promise.reject("not an admin");
      }
    };
  }

  function safe_post_load(reporter: Reporter, dataSource: DataSource.Categories.raw) : SafePostLoadContext {
    let all_objects = new Set<VersionedObject>();
    let access_lists = new Map<string, VersionedObject[]>();
    return {
      for_each(vo, path) {
        let manager = vo.manager();
        if (!manager.isSubObject()) {
          let access_name = rights_by_classname[manager.name()].read_key;
          if (!access_name)
            reporter.diagnostic({ is: "error", msg: `no access_name for (${manager.name()})` });
          else {
            let objects = access_lists.get(access_name);
            if (!objects)
              access_lists.set(access_name, objects = []);
            objects.push(manager.object());
          }
        }
        all_objects.add(vo);
      },
      finalize: () => dataSource.controlCenter().safe(async ccc => {
        let r = await load_access_lists(ccc, reporter, dataSource, access_lists);
        for (let vo of all_objects) {
          let manager = vo.manager();
          let access = r.get(manager.rootObject());
          if (!access)
            reporter.diagnostic({ is: "error", msg: `you don't have read access to ${vo.id()} object` });
          else {
            let r = rights_by_classname[manager.name()];
            for (let a of manager.localAttributes().keys())
              check_access(r, a, manager, access, vo);
            for (let a of manager.versionAttributes().keys())
              check_access(r, a, manager, access, vo);
          }
        }
      }),
    };

    function check_access(r: ClassRights, a: string, manager: VersionedObjectManager<VersionedObject>, access: string[], vo: VersionedObject) {
      let ra = r.attributes[a];
      if (!ra) {
        let attr = manager.aspect().attributes.get(a)!;
        if (attr && attr.relation)
          ra = rights_by_classname[attr.relation.class.name].attributes[attr.relation.attribute.name];
      }
      if (!ra || !access.some(a => ra.read.has(a)))
        reporter.diagnostic({ is: "error", msg: `you don't have read access to '${a}' on '${vo.id()}'` });
    }
  }

  function safe_pre_save(reporter: Reporter, dataSource: DataSource.Categories.raw, tr: DataSourceTransaction) : SafePreSaveContext {
    if (is_super_admin(dataSource.controlCenter()))
      return { for_each() {}, finalize() { return Promise.resolve(); } };
    let access_lists = new Map<string, VersionedObject[]>();
    let all_objects = new Set<VersionedObject>();
    return {
      for_each(vo, set) {
        let manager = vo.manager();
        if (!manager.isSubObject()) {
          let r = rights_by_classname[manager.name()];
          let access_name: string;
          switch (manager.state()) {
            case VersionedObjectManager.State.NEW: access_name = r.create_key; break;
            case VersionedObjectManager.State.MODIFIED: access_name = r.update_key; break;
            case VersionedObjectManager.State.DELETED: access_name = r.delete_key; break;
            default:
              reporter.diagnostic({ is: "error", msg: `invalid save object state (${manager.id})` });
              return;
          }
          if (!access_name)
            reporter.diagnostic({ is: "error", msg: `no access_name for (${manager.name()})` });
          else {
            let objects = access_lists.get(access_name);
            if (!objects)
              access_lists.set(access_name, objects = []);
            objects.push(vo);
          }
        }
        all_objects.add(vo);
      },
      finalize: () => dataSource.controlCenter().safe(async ccc => {
        let r = await load_access_lists(ccc, reporter, dataSource, access_lists);
        for (let vo of all_objects) {
          let manager = vo.manager();
          let access = r.get(manager.rootObject());
          if (!access)
            reporter.diagnostic({ is: "error", msg: `you don't have read access to ${vo.id()} object` });
          else {
            let r = rights_by_classname[manager.name()];
            // TODO: handle create & delete rights
            for (let a of manager.localAttributes().keys()) {
              let ra = r.attributes[a];
              if (!access.some(a => ra.update.has(a)))
                reporter.diagnostic({ is: "error", msg: `you don't have update access to '${a}' on '${vo.id()}'` });
            }
            for (let a of manager.versionAttributes().keys()) {
              let ra = r.attributes[a];
              if (!access.some(a => ra.update.has(a)))
                reporter.diagnostic({ is: "error", msg: `you don't have update access to '${a}' on '${vo.id()}'` });
            }
          }
        }
      }),
    };
  }

  const safeValidators = new Map<string, SafeValidator>();
  const R_AuthenticationPWD_safe_post_load_context = {
    for_each(vo: R_AuthenticationPWD) {
      vo.manager().filter_anonymize("_hashed_password", "");
      vo.manager().filter_anonymize("_ciphered_private_key", "");
    },
    finalize() { return Promise.resolve(); }
  };
  for (let class_name in rights_by_classname) {
    let v: SafeValidator = {
      safe_post_load: [safe_is_admin],
      safe_pre_save: [safe_is_admin],
      safe_post_save: [],
    };
    if (class_name === "R_AuthenticationPWD") {
      v.safe_post_load.push(() => R_AuthenticationPWD_safe_post_load_context);
      v.safe_pre_save.push((reporter, datasource) => {
        let changes: R_AuthenticationPWD[] = [];
        return {
          for_each(vo: R_AuthenticationPWD) {
            if (vo.manager().hasChanges(["_hashed_password"]))
              changes.push(vo);
          },
          async finalize() : Promise<void> { return datasource.controlCenter().safe(async ccc => {
            let inv = await ccc.farPromise(datasource.rawLoad, { objects: changes, scope: ["_hashed_password", "_ciphered_private_key"] });
            if (!inv.hasOneValue())
              return Promise.reject(inv.diagnostics());
            for (let vo of changes) {
              let m = vo.manager();
              let password = m.attributeValue("_hashed_password");
              let hashed_password = await SecureHash.hashedPassword(password);
              m.setAttributeValue("_hashed_password", hashed_password);
              let has_weak_pk = m.attributeValue("_ciphered_private_key");
              if (has_weak_pk) {
                let hashed_sk_password = await SecureHash.hashedPassword(m.attributeValue("_hashed_password"));
                let private_key = await new Promise<string>((resolve, reject) => {
                  exec("openssl genrsa 2048", (err, stdout) => {
                    if (err) return reject(err);
                    resolve(stdout);
                  });
                });
                const aes = crypto.createCipher('AES-256-CBC', hashed_sk_password);
                let encrypted = aes.update(private_key, 'utf8', 'base64');
                encrypted += aes.final('base64');
                let [algorithm, hardness, salt] = (hashed_sk_password.match(/^(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>([a-zA-Z0-9+\/=]+)$/) || []) as string[];
                let ciphered_private_key = `${algorithm}:${hardness}<${salt}>${encrypted}`;
                m.setAttributeValue("_ciphered_private_key", ciphered_private_key);
              }
              else {
                m.setAttributeValue("_ciphered_private_key", undefined);
              }
            }
            return Promise.resolve();
          }); }
        };
      });
      v.safe_post_save.push(() => R_AuthenticationPWD_safe_post_load_context);
    }
    safeValidators.set(class_name, v);
  }

  return function createControlCenter() {
    let cc = new ControlCenter(cfg);
    let ccc = cc.registerComponent({});
    let session = Session.Aspects.server.create(ccc);
    let db = ObiDataSource.Aspects.server.create(ccc, ouiDb, {
      aspectAttribute_to_ObiCar: (a: string) => mapAttributes[a] || a,
      aspectClassname_to_ObiEntity: (c) => mapClasses[c] || c,
      obiEntity_to_aspectClassname: (c) => mapClassesR[c] || c,
      aspectValue_to_obiValue: (value, attribute: Aspect.InstalledAttribute) => {
        if (attribute.name === "_creation_date")
          return Math.floor(value.getTime() / 1000);
        if (attribute.type.type === "primitive" && attribute.type.name === "boolean")
          return value ? 1 : 0;
        return value;
      },
      obiValue_to_aspectValue: (value, attribute: Aspect.InstalledAttribute) => {
        if (attribute.name === "_creation_date")
          return new Date(value * 1000);
        if (attribute.type.type === "primitive" && attribute.type.name === "boolean")
          return value ? true : false;
        return value;
      },
    });
    db.setSafeValidators(safeValidators);
    session.manager().setId("session");
    db.manager().setId("odb");
    return { cc: cc, session: session, db: db };
  };
}

function getOne(def: ObiDefinition, attribute: ObiDefinition, defaultValue?: string | number | ObiDefinition) {
  let set = def.attributes.get(attribute);
  if (!set && defaultValue !== undefined)
    return defaultValue;
  if (!set)
    throw new Error(`attribute ${attribute.system_name} not found in { is: ${def.is}, _id: ${def._id}, system_name: ${def.system_name} }`);
  if (set.size !== 1)
    throw new Error(`attribute ${attribute.system_name} cardinality is not one { is: ${def.is}, _id: ${def._id}, system_name: ${def.system_name} }`);
  return set.values().next().value;
}

function systemObiByName(db: OuiDB, name: string) : ObiDefinition {
  let obi = db.systemObiByName.get(name);
  if (!obi)
    throw new Error(`obi ${name} not found`);
  return obi;
}

function systemObiImpl(db: OuiDB, name: string): VersionedObjectConstructor {
  let obi = systemObiByName(db, name);
  let car_pattern = systemObiByName(db, "pattern");
  let car_car = systemObiByName(db, "characteristic");
  let car_type = systemObiByName(db, "type");
  let car_domain_entity = systemObiByName(db, "domain entity");
  let car_mandatory = systemObiByName(db, "mandatory");
  let car_cardinality = systemObiByName(db, "cardinality");
  let one = systemObiByName(db, "one");
  let multi = systemObiByName(db, "multi");

  let patterns = obi.attributes.get(car_pattern)! as Set<ObiDefinition>;
  let attributes: Aspect.Attribute[] = [];
  patterns.forEach((pattern: ObiDefinition) => {
    let car = getOne(pattern, car_car) as ObiDefinition;
    if (car.system_name === "version")
      return;

    let type = getOne(car, car_type) as ObiDefinition;
    let mandatory = getOne(pattern, car_mandatory, 1) as number;
    let cardinality = getOne(pattern, car_cardinality, multi) as ObiDefinition;
    let atype: Aspect.Type;
    if (type.system_name === "SID" || type.system_name === "ID") {
      let domain_entities = car.attributes.get(car_domain_entity);
      let class_names = domain_entities && [...domain_entities].map((v: ObiDefinition) => v.system_name!);
      if (!class_names)
        atype = { is: "type", type: "class", name: "VersionedObject" };
      else if (class_names.length === 1)
        atype = { is: "type", type: "class", name: class_names[0] };
      else
        atype = { is: "type", type: "or", types: class_names.map<Aspect.Type>(n => ({ is: "type", type: "class", name: n })) }; // TODO: check multiple domain entities
    }
    else
      atype = db.config.mapTypes[type.system_name!];
    if (cardinality === multi)
      atype = { is: "type", type: "set", itemType: atype, min: 0, max: '*' };
    attributes.push({
      is: "attribute",
      name: car.system_name!,
      type: atype,
      relation: undefined
    });
  });
  return class ObiVersionedObject extends VersionedObject {
    static definition: Aspect.Definition = {
      is: "class",
      name: obi.system_name!,
      version: 0,
      is_sub_object: false,
      attributes: attributes,
      categories: [],
      farCategories: [],
      aspects: [{
        is: "aspect",
        name: "obi",
        categories: [],
        farCategories: [],
      }]
    };
    static parent = VersionedObject;
  };
}

export function printClassesMd(ouiDb: OuiDB) {
  let map = { '_version': 'version' };
  for (let k of ouiDb.systemObiByName.keys()) {
    if (k.startsWith("R_")) {
      let c = systemObiImpl(ouiDb, k);
      let s = `## class ${k.replace(/ /g, '_')}\n`;
      s += `### attributes\n`;
      if (c.definition.attributes) {
        for (let a of c.definition.attributes) {
          if (a.name === "entity") continue;
          let n = '_' + a.name.replace(/[ -]/g, '_');
          map[n] = a.name;
          s += `#### \`${n}\`: ${typeToMdType(a.type)}\n`;
        }
      }
      s += `### aspect obi\n`;
      console.info(s);
    }
  }
  console.info(map);
}
function typeToMdType(type: Aspect.Type) {
  let t = "any";
  switch (type.type) {
    case 'primitive': t = type.name; break;
    case 'class': t = type.name.replace(/ /g, '_'); break;
    case 'set': t = `<0,*,${typeToMdType(type.itemType)}>`; break;
    case 'array': t = `[0,*,${typeToMdType(type.itemType)}]`; break;
    case 'or': t = type.types.map(t => typeToMdType(t)).join(' | '); break;
  }
  return t;
}
