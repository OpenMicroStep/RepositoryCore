import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery, ImmutableSet} from '@openmicrostep/aspects';
import {ObiDataSource, OuiDB, StdDefinition, ObiDefinition} from '@openmicrostep/aspects.obi';

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
      if (!domain_entities)
        atype = { is: "type", type: "class", name: "VersionedObject" };
      else if (domain_entities.size === 1)
        atype = { is: "type", type: "class", name: (domain_entities.values().next().value as ObiDefinition).system_name! };
      else
        atype = { is: "type", type: "class", name: "VersionedObject" }; // TODO: check multiple domain entities
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

function printClasses(ouiDb: OuiDB) {
  for (let k of ouiDb.systemObiByName.keys()) {
    if (k.startsWith("R_")) {
      let c = systemObiImpl(ouiDb, k);
      let s = `interface ${k.replace(' ', '_')} extends VersionedObject {\n`;
      if (c.definition.attributes) {
        for (let a of c.definition.attributes) {
          s += `  "${a.name}": ${typeToTsType(a.type)};\n`;
        }
      }
      s += `}`;
      console.info(s);
    }
  }
}

function typeToTsType(type: Aspect.Type) {
  let t = "any";
  switch(type.type) {
    case 'primitive': t = type.name; break;
    case 'class': t = type.name.replace(' ', '_'); break;
    case 'set': t = `Set<${typeToTsType(type.itemType)}>`; break;
    case 'array': t = `${typeToTsType(type.itemType)}[]`; break;
  }
  return t;
}

function cachedClasses<T extends object>(classes: { [K in keyof T]: { aspect: string, impl: VersionedObjectConstructor }}) : (cc: ControlCenter) => T {
  class Cache {
    constructor (public __cc: ControlCenter) {}
  }
  Object.keys(classes).forEach(k => {
    let c = classes[k];
    Object.defineProperty(Cache.prototype, k, {
      get: function(this: Cache) {
        let cstor = this.__cc.cache().createAspect(this.__cc, c.aspect, c.impl);
        Object.defineProperty(this, k, { value: cstor });
        return cstor;
      }
    });
  });
  return (cc: ControlCenter) => new Cache(cc) as any;
}

export type Context = { cc: ControlCenter, db: DataSource.Aspects.server, classes: All };
export type CreateContext = () => Context;
export function controlCenterCreator(ouiDb: OuiDB): CreateContext {
  return function createControlCenter() {
    const cache = cachedClasses<All>({
      R_AuthenticationPK : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_AuthenticationPK" ) },
      R_AuthenticationPWD: { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_AuthenticationPWD") },
      R_Person           : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Person"           ) },
      R_Service          : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Service"          ) },
      R_Application      : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Application"      ) },
      R_Use_Profile      : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Use Profile"      ) },
      R_Device_Profile   : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Device Profile"   ) },
      R_License          : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_License"          ) },
      R_Software_Context : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Software Context" ) },
      R_Device           : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Device"           ) },
      R_Authorization    : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Authorization"    ) },
      R_Right            : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Right"            ) },
      R_Element          : { aspect: 'obi', impl: systemObiImpl(ouiDb, "R_Element"          ) },
    });

    let cc = new ControlCenter();
    let DB = ObiDataSource.installAspect(cc, "server");
    let db = new DB(ouiDb, {
      aspectAttribute_to_ObiCar: (classname: string, attribute: string) => attribute === '_version' ? 'version' : attribute,
    });
    let c = cache(cc);
    return { cc: cc, db: db, classes: c };
  }
}
export type All = {
  R_AuthenticationPK : { new(): R_AuthenticationPK  },
  R_AuthenticationPWD: { new(): R_AuthenticationPWD },
  R_Person           : { new(): R_Person            },
  R_Service          : { new(): R_Service           },
  R_Application      : { new(): R_Application       },
  R_Use_Profile      : { new(): R_Use_Profile       },
  R_Device_Profile   : { new(): R_Device_Profile    },
  R_License          : { new(): R_License           },
  R_Software_Context : { new(): R_Software_Context  },
  R_Device           : { new(): R_Device            },
  R_Authorization    : { new(): R_Authorization     },
  R_Right            : { new(): R_Right             },
  R_Element          : { new(): R_Element           },
};
export interface R_AuthenticationPK extends VersionedObject {
  "login": string;
  "public key": string;
  "private key": string;
  "ciphered private key": string;
}

export interface R_AuthenticationPWD extends VersionedObject {
  "login": string;
  "hashed password": string;
  "must change password": boolean;
}

export interface R_Person extends VersionedObject {
  "urn": string;
  "disabled": boolean;
  "r_authentication": ImmutableSet<R_AuthenticationPK | R_AuthenticationPWD>;
  "r_matricule": string;
  "first name": string;
  "middle name": string;
  "last name": string;
}

export interface R_Service extends VersionedObject {
  "urn": string;
  "label": string;
  "disabled": boolean;

  "r_parent service": R_Service;
  "r_administrator": Set<R_Person>;
  "r_member": Set<R_Person>;
}

export interface R_Application extends VersionedObject {
  "urn": string;
  "label": string;
  "disabled": boolean;

  "r_authentication": Set<R_AuthenticationPK | R_AuthenticationPWD>;
  //"parameter": Set<Parameter>;
  "r_sub-license": Set<R_License>;
  "r_software context": R_Software_Context;
  "r_sub-use profile": Set<R_Use_Profile>;
  "r_sub-device profile": Set<R_Device_Profile>;
}
export interface R_Use_Profile extends VersionedObject {
  "label": string;
}
export interface R_Device_Profile extends VersionedObject {
  "label": string;
  "r_device": Set<R_Device>;
}
export interface R_License extends VersionedObject {
  "label": string;
  "r_software context": R_Software_Context;
  "r_use profile": R_Use_Profile;
  "r_device profile": R_Device_Profile;
  "r_license number": string;
}

export interface R_Software_Context extends VersionedObject {
  "label": string;
  "disabled": boolean;
  "urn": string;
  "r_parent context": R_Software_Context;
  "r_license needed": boolean;
}

export interface R_Device extends VersionedObject {
  "urn": string;
  "label": string;
  "disabled": boolean;

  "r_serial number": string;
  "r_out of order": boolean;
}
export interface R_Authorization extends VersionedObject {
  "label": string;
  "disabled": boolean;
  "urn": string;
  "r_authenticable": Set<R_Person | R_Application>;
  "r_sub-right": Set<R_Right>;
}
export interface R_Right extends VersionedObject {
  "label": string;
  "r_action": R_Element;
  "r_application": R_Application;
  "r_software context": R_Software_Context;
  "r_use profile": R_Use_Profile;
  "r_device profile": R_Device_Profile;
}

export interface R_Element extends VersionedObject {
  "system name": string;
  "order": number;
}

