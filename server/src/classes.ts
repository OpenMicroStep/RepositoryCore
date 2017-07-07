import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery, ImmutableSet, SafeValidator, Invocation} from '@openmicrostep/aspects';
import {ObiDataSource, OuiDB, StdDefinition, ObiDefinition} from '@openmicrostep/aspects.obi';
import {cache, All, R_AuthenticationPWD, R_AuthenticationLDAP, R_Person, Session} from '../../shared/src/classes';
import {SecureHash, SecurePK} from './securehash';
export * from '../../shared/src/classes';
import {authLdap} from './ldap';

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

const mapClasses = {}
const mapClassesR = {};
const mapAttributes = {};
export function buildMaps(ouiDb: OuiDB) {
  let car_pattern = systemObiByName(ouiDb, "pattern");
  mapAttributes['_version'] = 'version';
  for (let obi of ouiDb.systemObiByName.values()) {
    if (obi.is.system_name === "ENT") {
      let n = obi.system_name.replace(/[ -]/g, '_');
      mapClasses[n] = obi.system_name;
      mapClassesR[obi.system_name] = n;
    }
    if (obi.is.system_name === "Car") {
      let n = '_' + obi.system_name.replace(/[ -]/g, '_');
      mapAttributes[n] = obi.system_name;
    }
  }
}

export type Context = { cc: ControlCenter, session: Session.Aspects.server, db: DataSource.Aspects.server, classes: All };
export type CreateContext = () => Context;
export function controlCenterCreator(ouiDb: OuiDB): CreateContext {
  let safeValidators = new Map<string, SafeValidator>();
  safeValidators.set("R_AuthenticationPWD", {
    preSaveAttributes: ["_hashed_password"],
    filterObject(object) {
      let m =  object.manager();
      let hpwd = m.hasAttributeValue("_hashed_password");
      m.unload(["_password", "_hashed_password"]);
      (m.versionAttributes() as any).set("_password", ""); // TODO: fix this workaround FAST (virtual attribute on all datasource ?)
    },
    async preSavePerObject(reporter, set, object) {
      let m = object.manager();
      if (m.hasChanges(["_password"])) {
        let hashed_password = await SecureHash.hashedPassword(m.attributeValue("_password"));
        m.setAttributeValue("_hashed_password", hashed_password);
        m.unload(["_password"]);
      }
    }
  } as SafeValidator<R_AuthenticationPWD>);

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

Session.category('client', {
  isAuthenticated() {
    return !!this.data().isAuthenticated;
  },
  logout() {
    this.data().isAuthenticated = false;
  },
  async loginByPassword(q) {
    let db = this.controlCenter().registeredObject('odb') as DataSource.Aspects.server;
    let inv = await db.farPromise('rawQuery', { results: [
      { name: 'bypwd' , where: { $instanceOf: "R_AuthenticationPWD" , _mlogin: q.login }, scope: ['_mlogin', '_hashed_password'] },
      { name: 'bypk'  , where: { $instanceOf: "R_AuthenticationPK"  , _mlogin: q.login }, scope: ['_mlogin', '_public_key'     ] },
      { name: 'byldap', where: { $instanceOf: "R_AuthenticationLDAP", _mlogin: q.login }, scope: ['_mlogin', '_ldap_dn'        ] },
    ]});
    let ok = false;
    if (inv.hasResult()) {
      let r = inv.result();
      let auths = [...r.bypwd, ...r.bypk, ...r.byldap]; // TODO: $union
      if (auths.length === 1) {
        let a = auths[0];
        let inv = await db.farPromise('rawQuery', { name: 'p', where: { $instanceOf: "R_Person" , _r_authentication: { $has: a } }, scope: ['_disabled'] });
        if (inv.hasResult() && inv.result().p.length === 1) {
          let p = inv.result().p[0] as R_Person;
          if (p._disabled)
            ok = false;
          else if (a instanceof R_AuthenticationPWD)
            ok = await SecureHash.isValid(q.password, a._hashed_password!)
          else if (a instanceof R_AuthenticationLDAP) {
            let cmp = {};
            this.controlCenter().registerComponent(cmp);
            this.controlCenter().registerObjects(cmp, [p, a]);
            ok = await authLdap(db, q.login, q.password, p, a);
            this.controlCenter().unregisterComponent(cmp);
          }
        }
        else
          console.error(inv.diagnostics());
      }
      else {
        ok = await authLdap(db, q.login, q.password, undefined, undefined);
      }
    }
    else
      console.error(inv.diagnostics());
    this.data().isAuthenticated = ok;
    return new Invocation<boolean>(ok ? [] : [{ type: "error", msg: `bad login/password` }], true, ok);
  }
} as Session.ImplCategories.client<Session.Aspects.server>)

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
