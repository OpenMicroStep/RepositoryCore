import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery, ImmutableSet} from '@openmicrostep/aspects';
import {ObiDataSource, OuiDB, StdDefinition, ObiDefinition} from '@openmicrostep/aspects.obi';
import {cache, All} from '../../shared/src/classes';
export * from '../../shared/src/classes';

function cachedClasses<T extends object>(classes: { [K in keyof T]: VersionedObjectConstructor }) : (cc: ControlCenter) => T {
  class Cache {
    constructor (public __cc: ControlCenter) {}
  }
  Object.keys(classes).forEach(k => {
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

function reverse(map: { [s: string]: string }) : { [s: string]: string } {
  let ret = {};
  for (let k in map)
    ret[map[k]] = k;
  return ret;
}
const mapClasses = {
  R_Internal_Right   : "R_Internal Right"   ,
  R_Element          : "R_Element"          ,
  R_Person           : "R_Person"           ,
  R_AuthenticationPK : "R_AuthenticationPK" ,
  R_AuthenticationPWD: "R_AuthenticationPWD",
  R_Service          : "R_Service"          ,
  Parameter          : "Parameter"          ,
  R_Application      : "R_Application"      ,
  R_License          : "R_License"          ,
  R_Software_Context : "R_Software Context" ,
  R_Use_Profile      : "R_Use Profile"      ,
  R_Device_Profile   : "R_Device Profile"   ,
  R_Device           : "R_Device"           ,
  R_Right            : "R_Right"            ,
  R_Authorization    : "R_Authorization"    ,
}
const mapClassesR = reverse(mapClasses);
const mapAttributes = { 
  _version: 'version',
  _string: 'string',
  _r_operation: 'r_operation',
  _r_who: 'r_who',
  _system_name: 'system name',
  _order: 'order',
  _disabled: 'disabled',
  _urn: 'urn',
  _r_authentication: 'r_authentication',
  _r_matricule: 'r_matricule',
  _first_name: 'first name',
  _middle_name: 'middle name',
  _last_name: 'last name',
  _login: 'login',
  _public_key: 'public key',
  _private_key: 'private key',
  _ciphered_private_key: 'ciphered private key',
  _hashed_password: 'hashed password',
  _must_change_password: 'must change password',
  _label: 'label',
  _r_parent_service: 'r_parent service',
  _r_administrator: 'r_administrator',
  _r_member: 'r_member',
  _parameter: 'parameter',
  _r_sub_license: 'r_sub-license',
  _r_software_context: 'r_software context',
  _r_sub_use_profile: 'r_sub-use profile',
  _r_sub_device_profile: 'r_sub-device profile',
  _r_use_profile: 'r_use profile',
  _r_device_profile: 'r_device profile',
  _r_license_number: 'r_license number',
  _r_parent_context: 'r_parent context',
  _r_license_needed: 'r_license needed',
  _r_device: 'r_device',
  _r_serial_number: 'r_serial number',
  _r_out_of_order: 'r_out of order',
  _r_action: 'r_action',
  _r_application: 'r_application',
  _r_authenticable: 'r_authenticable',
  _r_sub_right: 'r_sub-right'
};

export type Context = { cc: ControlCenter, db: DataSource.Aspects.server, classes: All };
export type CreateContext = () => Context;
export function controlCenterCreator(ouiDb: OuiDB): CreateContext {
  return function createControlCenter() {
    let cc = new ControlCenter();
    let DB = ObiDataSource.installAspect(cc, "server");
    let db = new DB(ouiDb, {
      aspectAttribute_to_ObiCar: (c: string, a: string) => mapAttributes[a] || a,
      aspectClassname_to_ObiEntity: (c) => mapClasses[c] || c,
      obiEntity_to_aspectClassname: (c) => mapClassesR[c] || c,
    });
    let c = cache(cc);
    return { cc: cc, db: db, classes: c };
  }
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
    static definition = {
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