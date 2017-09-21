import {
  ControlCenter, VersionedObject, VersionedObjectConstructor, VersionedObjectManager,
  DataSource, Aspect, DataSourceInternal,
  SafePostLoadContext, SafePreSaveContext, SafeValidator, DataSourceTransaction
} from '@openmicrostep/aspects';
import {ObiDataSource, OuiDB, ObiDefinition} from '@openmicrostep/aspects.obi';
import {Reporter} from '@openmicrostep/msbuildsystem.shared';
import {cache, All, R_AuthenticationPWD, Session} from '../../shared/src/classes';
import {SecureHash} from './securehash';
export * from '../../shared/src/classes';

function cachedClasses<T extends object>(classes: { [K in keyof T]: VersionedObjectConstructor }) : (cc: ControlCenter) => T {
  class Cache {
    constructor (public __cc: ControlCenter) {}
  }
  Object.keys(classes).forEach((k: keyof T) => {
    let c = classes[k];
    Object.defineProperty(Cache.prototype, k, {
      get: function(this: Cache) {
        let cstor = this.__cc.cache().createAspect(this.__cc, c.definition.name, c);
        Object.defineProperty(this, k, { value: cstor });
        return cstor;
      }
    });
  });
  return (cc: ControlCenter) => new Cache(cc) as any;
}

const mapClasses = {};
const mapClassesR = {};
const mapAttributes = {};
const rights_by_classname: { [s: string]: {
  read: Set<string>, read_key: string,
  create: Set<string>, create_key: string,
  update: Set<string>, update_key: string,
  delete: Set<string>, delete_key: string,
  attributes: {
    [s: string]: {
      read: Set<string>,
      create: Set<string>,
      update: Set<string>,
      delete: Set<string>,
    }
  },
}} = {};

function admin_of(cc: ControlCenter, of: string, suffix: string) {
  let session = cc.findChecked('session') as Session.Aspects.server;
  return { $unionForAlln: "=U(n)",
    "U(0)=": { $instanceOf: of, _r_administrator: { $has: session.data().person_id } },
    "U(n + 1)=": `=U(n):_r_child_${suffix}s`,
  };
}
function visible_of(cc: ControlCenter, of: string, suffix: string) {
  return { $unionForAlln: "=U(n)",
    "U(0)=": admin_of(cc, of, suffix),
    "U(n + 1)=": `=U(n):_r_parent_${suffix}`,
  };
}
function admin_of_services(cc: ControlCenter) { return admin_of(cc, "R_Service", "service"); }
function admin_of_apptree(cc: ControlCenter) { return admin_of(cc, "R_AppTree", "apptree"); }
function admin_of_devicetree(cc: ControlCenter) { return admin_of(cc, "R_DeviceTree", "devicetree"); }
function is_super_admin(cc: ControlCenter) {
  return (cc.findChecked('session') as Session.Aspects.server).data().is_super_admin === true;
}
const rights_queries: {
  [s: string]: (cc: ControlCenter, objects: VersionedObject[]) => true | false | DataSourceInternal.ObjectSetDefinition,
} = {
  "public": () => true,
  "member": () => true,
  "person_admin": (cc, objects) => {
    return {
      $in: "=S:_r_member",
      _id: { $in: objects.map(m => m.id()) },
      "S=": admin_of_services(cc),
    };
  },
  "app_admin": (cc, objects) => {
    return {
      $in: "=S:_r_application",
      _id: { $in: objects.map(m => m.id()) },
      "S=": admin_of_apptree(cc),
    };
  },
  "device_admin": (cc, objects) => {
    return {
      $in: "=S:_r_device",
      _id: { $in: objects.map(m => m.id()) },
      "S=": admin_of_devicetree(cc),
    };
  },
  "admin": (cc, objects) => {
    let session = cc.findChecked('session') as Session.Aspects.server;
    return !!session.data().is_admin;
  },

};

const valid_entity_operations = new Set(['read', 'create', 'update', 'delete']);
const valid_attribute__operations = new Set(['read', 'create', 'update', 'delete']);
export function buildMaps(ouiDb: OuiDB) {
  let car_pattern = systemObiByName(ouiDb, "pattern");
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

export type Context = { cc: ControlCenter, session: Session.Aspects.server, db: DataSource.Aspects.server, classes: All };
export type CreateContext = () => Context;

export function controlCenterCreator(ouiDb: OuiDB) : CreateContext {

  function load_access_lists(reporter: Reporter, dataSource: DataSource.Categories.raw, access_lists: Map<string, VersionedObject[]>) : Promise<Map<VersionedObject, string[]>> {
    let p: Promise<void>[] = [];
    let r = new Map<VersionedObject, string[]>();
    for (let [access_name, objects] of access_lists) {
      let access_names = access_name.split(',');
      let q: DataSourceInternal.Request = { results: [] };
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
          reporter.diagnostic({ type: "error", msg: `unsupported access_name: ${access_name}` });
        else {
          let r = maker(dataSource.controlCenter(), objects);
          if (r === true)
            apply_access_to(access_name, objects);
          else if (r !== false)
            q.results.push({ name: access_name, where: r });
        }
      }
      if (q.results.length > 0) {
        p.push(dataSource.farPromise('rawQuery', q).then(res => {
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

  function safe_post_load(reporter: Reporter, dataSource: DataSource.Categories.raw) : SafePostLoadContext {
    let all_objects = new Set<VersionedObject>();
    let access_lists = new Map<string, VersionedObject[]>();
    return {
      for_each(vo, path) {
        let manager = vo.manager();
        let access_name = rights_by_classname[manager.name()].read_key;
        if (!access_name)
          reporter.diagnostic({ type: "error", msg: `no access_name for (${manager.name()})` });
        else {
          let objects = access_lists.get(access_name);
          if (!objects)
            access_lists.set(access_name, objects = []);
          objects.push(manager.object());
        }
        all_objects.add(vo);
      },
      async finalize() {
        let r = await load_access_lists(reporter, dataSource, access_lists);
        for (let vo of all_objects) {
          let access = r.get(vo);
          if (!access)
            reporter.diagnostic({ type: "error", msg: `you don't have read access to ${vo.id()} object` });
          else {
            let manager = vo.manager();
            let r = rights_by_classname[manager.name()];
            for (let a of manager.localAttributes().keys()) {
              let ra = r.attributes[a];
              if (!access.some(a => ra.read.has(a)))
                reporter.diagnostic({ type: "error", msg: `you don't have read access to '${a}' on '${vo.id()}'` });
            }
            for (let a of manager.versionAttributes().keys()) {
              let ra = r.attributes[a];
              if (!access.some(a => ra.read.has(a)))
                reporter.diagnostic({ type: "error", msg: `you don't have read access to '${a}' on '${vo.id()}'` });
            }
          }
        }
      }
    };
  }

  function safe_pre_save(reporter: Reporter, dataSource: DataSource.Categories.raw, tr: DataSourceTransaction) : SafePreSaveContext {
    if (is_super_admin(dataSource.controlCenter()))
      return { for_each() {}, finalize() { return Promise.resolve(); } };
    let access_lists = new Map<string, VersionedObject[]>();
    let all_objects = new Set<VersionedObject>();
    return {
      for_each(vo, set) {
        let manager = vo.manager();
        let r = rights_by_classname[manager.name()];
        let access_name: string;
        switch (manager.state()) {
          case VersionedObjectManager.State.NEW: access_name = r.create_key; break;
          case VersionedObjectManager.State.MODIFIED: access_name = r.update_key; break;
          case VersionedObjectManager.State.DELETED: access_name = r.delete_key; break;
          default:
            reporter.diagnostic({ type: "error", msg: `invalid save object state (${manager.id})` });
            return;
        }
        if (!access_name)
          reporter.diagnostic({ type: "error", msg: `no access_name for (${manager.name()})` });
        else {
          let objects = access_lists.get(access_name);
          if (!objects)
            access_lists.set(access_name, objects = []);
          objects.push(vo);
        }
        all_objects.add(vo);
      },
      async finalize() {
        let r = await load_access_lists(reporter, dataSource, access_lists);
        for (let vo of all_objects) {
          let access = r.get(vo);
          if (!access)
            reporter.diagnostic({ type: "error", msg: `you don't have read access to ${vo.id()} object` });
          else {
            let manager = vo.manager();
            let r = rights_by_classname[manager.name()];
            // TODO: handle create & delete rights
            for (let a of manager.localAttributes().keys()) {
              let ra = r.attributes[a];
              if (!access.some(a => ra.update.has(a)))
                reporter.diagnostic({ type: "error", msg: `you don't have update access to '${a}' on '${vo.id()}'` });
            }
            for (let a of manager.versionAttributes().keys()) {
              let ra = r.attributes[a];
              if (!access.some(a => ra.update.has(a)))
                reporter.diagnostic({ type: "error", msg: `you don't have update access to '${a}' on '${vo.id()}'` });
            }
          }
        }
      }
    };
  }

  const safeValidators = new Map<string, SafeValidator>();
  const R_AuthenticationPWD_safe_post_load_context = {
    for_each(vo: R_AuthenticationPWD) {
      vo.manager().filter_anonymize("_hashed_password", "");
    },
    finalize() { return Promise.resolve(); }
  };
  for (let class_name in rights_by_classname) {
    let v: SafeValidator = {
      safe_post_load: [safe_post_load],
      safe_pre_save: [safe_pre_save],
      safe_post_save: [],
    };
    if (class_name === "R_AuthenticationPWD") {
      v.safe_post_load.push(() => R_AuthenticationPWD_safe_post_load_context);
      v.safe_pre_save.push(() => {
        let changes: VersionedObjectManager<R_AuthenticationPWD>[] = [];
        return {
          for_each(vo: R_AuthenticationPWD) {
            if (vo.manager().hasChanges(["_hashed_password"]))
              changes.push(vo.manager());
          },
          async finalize() : Promise<void> {
            for (let m of changes) {
              let hashed_password = await SecureHash.hashedPassword(m.attributeValue("_hashed_password"));
              m.setAttributeValue("_hashed_password", hashed_password);
            }
          }
        };
      });
    }
    safeValidators.set(class_name, v);
  }

  return function createControlCenter() {
    let cc = new ControlCenter();
    let c = cache(cc);
    let DB = ObiDataSource.installAspect(cc, "server");
    let S = Session.installAspect(cc, "server");
    let session = new S();
    let db = new DB(ouiDb, {
      aspectAttribute_to_ObiCar: (a: string) => mapAttributes[a] || a,
      aspectClassname_to_ObiEntity: (c) => mapClasses[c] || c,
      obiEntity_to_aspectClassname: (c) => mapClassesR[c] || c,
    });
    db.setSafeValidators(safeValidators);
    session.manager().setId("session");
    db.manager().setId("odb");
    let cmp = {};
    cc.registerComponent(cmp);
    cc.registerObjects(cmp, [db, session]);
    return { cc: cc, session: session, db: db, classes: c };
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

function systemObiByName(db: OuiDB, name: string): ObiDefinition {
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
      attributes: attributes,
      categories: [],
      farCategories: [],
      aspects: [{
        is: "aspect",
        name: "obi",
        categories: [],
        farCategories: [],
      }]
    }
    static parent = VersionedObject;
  }
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
      s+= `### aspect obi\n`;
      console.info(s);
    }
  }
  console.info(map);
}
function typeToMdType(type: Aspect.Type) {
  let t = "any";
  switch(type.type) {
    case 'primitive': t = type.name; break;
    case 'class': t = type.name.replace(/ /g, '_'); break;
    case 'set': t = `<0,*,${typeToMdType(type.itemType)}>`; break;
    case 'array': t = `[0,*,${typeToMdType(type.itemType)}]`; break;
    case 'or': t = type.types.map(t => typeToMdType(t)).join(' | '); break;
  }
  return t;
}
