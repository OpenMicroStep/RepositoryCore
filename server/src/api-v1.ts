import {VersionedObject, Identifier} from '@openmicrostep/aspects';
import {Reporter, AttributePath, AttributeTypes as V, Diagnostic} from '@openmicrostep/msbuildsystem.shared';
import {MSTE} from '@openmicrostep/mstools';
import * as express from 'express';
import * as express_s from 'express-serve-static-core';
import * as Classes from './classes';
import {SecureHash, SecurePK} from './securehash';
const session = require('express-session');

const allowDangerousApi = false;

declare module "express-serve-static-core" {
  interface Request {
    session: { 
      authenticated: boolean;
      r_authenticable?: { id: Identifier, auth_id: Identifier },
      auth?: { type: 'pk' | 'pwd', id: Identifier, challenge: string }
      destroy(cb: (err) => void);
    };
  }
}

const validateInteger = { validate: function validateInteger(reporter: Reporter, path: AttributePath, value: any) {
  if (typeof value === "number" && Number.isInteger(value))
    return value;
  path.diagnostic(reporter, { type: "warning", msg: `attribute must be an integer, got ${typeof value}`});
  return undefined;
}, traverse: () => 'integer' }

function mapValue(v) {
  return v instanceof VersionedObject ? v.id() : v;
}
function MSTEEncodedVOList(vo: VersionedObject[]): any {
  let dico = {};
  for (let o of vo) {
    let r = dico[o.id()] = {};
    let m = o.manager();
    for (let [k, v] of m.versionAttributes()) {
      if (!(v instanceof Set))
        r[k] = [mapValue(v)];
      else
        r[k] = [...v].map(v => mapValue(v));
    }
  }
  return MSTEEncoded(dico);
}

function MSTEEncoded(o): any {
  return MSTE.stringify(o);
}
function ifMSTE(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    req.body = MSTE.parse(req.body);
    next();
  } catch (e) {
    res.send(400, MSTEEncoded(e));
  }
}
function validate<T>(validator: V.Validator0<T>, req: express.Request, res: express.Response) : T | undefined {
  let reporter = new Reporter();
  let ret = validator.validate(reporter, new AttributePath('req.body'), req.body);
  if (!ret)
    res.send(400, MSTEEncoded(reporter.diagnostics));
  return ret;
}

async function authOk(ctx: Classes.Context, req: express.Request, res: express.Response, auths: any, attr: string, validate: (value) => Promise<boolean>) {
  let inv = await ctx.db.farPromise('rawQuery', { 
    'auths=': auths,
    'applications=': {
      $out: '=a',
      "A=": { $elementOf: { $instanceOf: ctx.classes.R_Application } },
      "a=": { $elementOf: "=auths" },
      '=A.r_authenticable': { $has: '=a' },
    },
    'persons=': {
      $out: '=a',
      "A=": { $elementOf: { $instanceOf: ctx.classes.R_Person } },
      "a=": { $elementOf: "=auths" },
      '=A.r_authenticable': { $has: '=a' },
    },
    results: [
      {name: 'auths', where: '=auths', scope: ['login', attr] },
      {name: 'authenticables', where: { $union: ['=applications', '=persons'] }, scope: [] },
    ]
  });
  let ok = false;
  if (inv.hasResult() && inv.result().auths.length === 1) {
    let auth = inv.result().auths[0] as Classes.R_AuthenticationPWD;
    let a = inv.result().authenticables[0] as Classes.R_Application | Classes.R_Person;
    ok = await validate(auth[attr]);
    if (ok) {
      req.session.r_authenticable = { id: a.id(), auth_id: auth.id() };
      res.set("MASH-AUTH-RESPONSE", "SUCCESS");
      res.send(200, "SUCCESS");
    }
  }
  req.session.authenticated = ok;
  if (!ok) {
    res.set("MASH-AUTH-RESPONSE", "FAILURE");
    res.send(403, "FAILURE");
  }
}

async function challengeForLogin(ctx: Classes.Context, login: string) {
  let inv = await ctx.db.farPromise('rawQuery', { name: 'auths', where: { $instanceOf: ctx.classes.R_AuthenticationPWD, login: login }, scope: ['login', 'hashed password'] });
  let challenge: string | undefined;
  if (inv.hasResult()) {
    let auths = inv.result().auths as Classes.R_AuthenticationPWD[];
    if (auths.length === 1) {
      challenge = await SecureHash.challenge(auths[0]["hashed password"]);
      if (challenge)
        session.auth = { type: 'pwd', id: auths[0].id(), challenge: challenge };
    }
  }
  return challenge || SecureHash.fakeChallenge();
}

export function api_v1(creator: Classes.CreateContext) : express.Router {
  let r = express.Router();
  let ifAuthentified = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.session.authenticated) next();
    else res.send(403);
  }
  r.use('/', session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));
  r.get('/auth', async (req, res) => {
    let session = req.session;
    let ctx = creator();
    let {db, classes} = ctx;
    if (!session.authenticated) {
      let login: string, urn: string;
      if ((login = req.get('mh-login'))) {
        res.send(200, await challengeForLogin(ctx, login));
      }
      else if ((urn = req.get('mh-urn'))) {
        let inv = await db.farPromise('rawQuery', { name: 'auths', where: { $instanceOf: classes.R_AuthenticationPK, login: urn } });
        let challenge: string | undefined;
        if (inv.hasResult()) {
          let auths = inv.result().auths as Classes.R_AuthenticationPK[];
          if (auths.length === 1) {
            challenge = await SecurePK.challenge();
            session.auth = { type: 'pk', id: auths[0].id(), challenge: challenge };
          }
        }
        res.send(200, challenge || SecurePK.fakeChallenge());
      }
    }
    else if (session.auth) {
      let password: string, challenge: string;
      if ((password = req.get('mh-password')) && session.auth.type === 'pwd') {
        authOk(ctx, req, res, { $instanceOf: classes.R_AuthenticationPWD, _id: session.auth.id }, 
          'hashed password', (hashedPassword) => SecureHash.isChallengeResponseValid(session.auth!.challenge, password, hashedPassword));
      }
      else if ((challenge = req.get('mh-challenge')) && session.auth.type === 'pk') {
        authOk(ctx, req, res, { $instanceOf: classes.R_AuthenticationPK, _id: session.auth.id }, 
          'public key', (publickey) => Promise.resolve(SecurePK.isChallengeResponseValid(session.auth!.challenge, challenge, publickey)));
      }
    }
    session.auth = undefined;
  });
  r.get('/logout', ifAuthentified, (req, res) => {
    req.session.destroy(function(err) {
      res.end();
    });
  });
  if (allowDangerousApi) {
    r.get('/urnForLogin', ifAuthentified, async (req, res) => {
      let login = req.get('mh-login');
      if (!login)
        res.send(400, 'header mh-login was expected');
      else {
        let {db, classes} = creator();
        let inv = await db.farPromise('rawQuery', { name: 'urns', where: { $instanceOf: classes.R_Person, r_authenticable: { $has: { login: login } } }, scope: ['urn'] });
        if (inv.hasResult() && inv.result().urns.length === 1)
          res.send(200, inv.result().urns[0]['urn']);
        else
          res.send(200, ""); // old api would return 200 and nothing if not found
      }
    });
    r.get('/getChallengeInfo', ifAuthentified, async (req, res) => {
      let login = req.get('mh-login');
      if (!login)
        res.send(400, 'header mh-login was expected');
      else {
        res.send(200, await challengeForLogin(creator(), login));
      }
    });
    r.get('/verifyChallenge', ifAuthentified, async (req, res) => {
      let password = req.get('mh-password');
      if (!password)
        res.send(400, 'header mh-password was expected');
      else if (session.auth.type !== 'pwd')
        res.send(400, 'getChallengeInfo wasn\'t the last call');
      else {
        let {db, classes} = creator();
        let inv = await db.farPromise('rawQuery', { name: 'auths', where: { $instanceOf: classes.R_AuthenticationPWD, _id: session.auth.id }, scope: ['login', 'hashed password'] });
        if (inv.hasResult() && inv.result().auths.length === 1) {
          let auth = inv.result().auths[0] as Classes.R_AuthenticationPWD;
          if (await SecureHash.isChallengeResponseValid(session.auth.challenge, password, auth["hashed password"]))
            res.send(200, "OK");
          else
            res.send(200, "FAIL");
        }
      }
    });
    r.get('/getPublicKey', ifAuthentified, async (req, res) => {
      let urn = req.get('mh-urn');
      if (!urn)
        res.send(400, 'header mh-urn was expected');
      else {
        let {db, classes} = creator();
        let inv = await db.farPromise('rawQuery', { name: 'auths', where: { $instanceOf: classes.R_AuthenticationPK, login: urn }, scope: ['login', 'public key'] });
        if (inv.hasResult() && inv.result().auths.length === 1)
          res.send(200, inv.result().auths[0]["public key"]);
        res.send(200, ""); // old api would return 200 and nothing if not found
      }
    });
    r.get('/allowedApplicationUrnsForAuthenticable', ifAuthentified, async (req, res) => {
      let urn = req.get('mh-urn');
      if (!urn)
        res.send(400, 'header mh-urn was expected');
      else {
        let {db, classes} = creator();
        let inv = await db.farPromise('rawQuery', {
          name: 'apps',
          where: {
            $out: "a=",
            "A=": { $elementOf: { $instanceOf: classes.R_Application } },
            "r=": { $elementOf: { $instanceOf: classes.R_Right } },
            "a=": { $elementOf: { $instanceOf: classes.R_Authorization } },
            "=a.r_authenticable": { $has: "=A"},
            "=a.r_sub-right": { $has: "=r" },
            // so no sub-right level checking in the old API...
          },
          scope: ['urn']
        });
        if (inv.hasResult())
          res.send(200, MSTEEncoded(inv.result().apps.map(a => a["urn"])));
        else
          res.send(500, "unable to process request");
      }
    });
  }
  const validateMatchingPersons = V.objectValidator({
    "login": V.defaultsTo(V.validateString, undefined),
    "first name": V.defaultsTo(V.validateString, undefined),
    "last name": V.defaultsTo(V.validateString, undefined),
  }, V.validateAnyToUndefined);
  r.post('/matchingPersons', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateMatchingPersons, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let where = {};
    if (p.login)         where["r_authenticable"] = { $has: { login: p.login }};
    if (p["first name"]) where["first name"]      = { $eq: p["first name"] };
    if (p["last name"])  where["last name"]       = { $eq: p["last name"] };
    let inv = await db.farPromise('safeQuery', {
      name: 'persons',
      where: where,
      scope: ['urn', 'first name', 'last name', 'middle name'],
    });
    if (inv.hasResult())
      res.send(200, MSTEEncodedVOList(inv.result().persons));
    else
      res.send(500, "unable to process request");
  });
  const validateManagedServices = V.objectValidator({
    "rootsOnly": V.defaultsTo(V.validateBoolean, false),
  }, V.validateAnyToUndefined);
  r.post('/managedServices', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateManagedServices, req, res);
    if (!p) return;
    let {cc, db, classes} = creator();
    let where = {};
    let diags: Diagnostic[] = [];
    let inv = await db.farPromise('safeQuery', {
      name: 'services',
      where: { $instanceOf: classes.R_Service, r_administrator: { $has: { _id: req.session.r_authenticable!.id }} },
      scope: ['urn'],
    });
    if (inv.hasResult()) {
      let services = inv.result().services as Classes.R_Service[];
      if (!p.rootsOnly) {
        let all = new Set(services);
        let n = 0;
        let component = {};
        cc.registerComponent(component);
        cc.registerObjects(component, services);
        while (n < all.size) {
          n = all.size;
          let inv = await db.farPromise('safeQuery', {
            name: 'services',
            where: { $instanceOf: classes.R_Service, "r_parent service": { $in: services } },
            scope: ['urn', 'r_parent service'],
          });
          if (inv.hasResult()) {
            services = inv.result().services as Classes.R_Service[];
            cc.registerObjects(component, services);
            for (let s of services)
              all.add(s);
          }
          else
            diags.push(...inv.diagnostics());
        }
        cc.unregisterComponent(component);
        services = [...all];
      }
      if (diags.length === 0)
        res.send(200, MSTEEncodedVOList(services));
    }
    else
      diags.push(...inv.diagnostics());
    if (diags.length > 0)
      res.send(500, diags);
  });
  
  const validateAuthorizationBunchsForDeviceURN = V.objectValidator({
    "deviceURN": V.validateString,
  }, V.validateAnyToUndefined);
  r.post('/authorizationBunchsForDeviceURN', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateAuthorizationBunchsForDeviceURN, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let inv = await db.farPromise('safeQuery', {
      "devices=": { $instanceOf: classes.R_Device, urn: p.deviceURN, disabled: false, "r_out of order": false },
      "device_profiles=": { 
        $out: "=p",
        "p=": { $elementOf: { $instanceOf: classes.R_Device_Profile } },
        "d=": { $elementOf: "=devices" },
        "=p.r_device": { $has: "=d" } 
      },
      "rights=": {
        $out: "=r",
        "r=": { $elementOf: { $instanceOf: classes.R_Right } },
        "p=": { $elementOf: "=device_profiles" },
        "=r.r_device profile": { $eq: "=p" }
      },
      "actions=": "=rights:r_action",
      "use_profiles=": "=rights:r_use profile",
      "authorizations=": {
        $out: "=a",
        "a=": { $elementOf: { $instanceOf: classes.R_Authorization } },
        "r=": { $elementOf: "=rights" },
        "=a.disabled": false,
        "=a.r_sub-right": { $has: "=r" }
      },
      "applications=": {
        $out: "=A",
        "A=": { $elementOf: { $instanceOf: classes.R_Application } },
        "a=": { $elementOf: "=authorizations" },
        "=a.r_authenticable": { $has: "=A" },
        "=A": { $in: "=a.r_authenticable" }, //
      },
      "persons=": {
        $out: "=A",
        "A=": { $elementOf: { $instanceOf: classes.R_Person } },
        "a=": { $elementOf: "=authorizations" },
        "=a.r_authenticable": { $has: "=A" }
      },
      results: [
        { name: "devices"        , where: "=devices"        , scope: ["urn", "label", "r_serial number"] },
        { name: "device_profiles", where: "=device_profiles", scope: ["label"] },
        { name: "rights"         , where: "=rights"         , scope: ["label", "r_action", "r_application", "r_software context", "r_use profile", "r_device profile"] },
        { name: "actions"        , where: "=actions"        , scope: ["system name", "order"] },
        { name: "use_profiles"   , where: "=use_profiles"   , scope: ["label", "r_device"] },
        { name: "authorizations" , where: "=authorizations" , scope: ["urn", "label"] },
        { name: "applications"   , where: "=applications"   , scope: ["urn", "first name", "last name", "middle name"] },
        { name: "persons"        , where: "=persons"        , scope: ["urn", "label"] },
      ]
      /* or
      results: [
        { name: "all", where: { $union: [ 
            "=devices"        , "=device_profiles", "=rights"         , "=actions"        ,
            "=use_profiles"   , "=authorizations" , "=applications"   , "=persons"        ,
          ], scope: [
            "urn", "label", "r_serial number", 
            "r_action", "r_application", "r_software context", "r_use profile", "r_device profile", 
            "system name", "order", 
            "r_device", 
            "first name", "last name", "middle name"
          ]
        }
      ]
      if (inv.hasResult()) {
        res.send(200, MSTEEncodedVOList(inv.result().all));
      }
      */
    });
    if (inv.hasResult()) {
      let set = new Set<VersionedObject>();
      let r = inv.result();
      for (let k in r)
        for (let v of r[k])
          set.add(v);
      res.send(200, MSTEEncodedVOList([...set]));
    }
    else
      res.send(500, "unable to process request");
  });

  const validateInformationsWithKeysForRefs = V.objectValidator({
    "keys": V.validateStringList,
    "refs": V.listValidator(validateInteger),
  }, V.validateAnyToUndefined);
  r.post('/informationsWithKeysForRefs', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateInformationsWithKeysForRefs, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let inv = await db.farPromise('safeQuery', {
      name: 'infos',
      where: { _id: { $in: p.refs } },
      scope: p.keys,
    });
    if (inv.hasResult())
      res.send(200, MSTEEncodedVOList(inv.result().infos));
    else
      res.send(500, "unable to process request");
  });

  const validateQueryInstancesOfEntityWithCars = V.objectValidator({
    "entity": V.validateString,
    "cars": V.objectValidator({}, V.validateAny),
  }, V.validateAnyToUndefined);
  r.post('/queryInstancesOfEntityWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateQueryInstancesOfEntityWithCars, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let where = Object.assign({ $instanceOf: p.entity }, p.cars);
    let inv = await db.farPromise('safeQuery', {
      name: 'infos',
      where: where,
      scope: [],
    });
    if (inv.hasResult())
      res.send(200, MSTEEncodedVOList(inv.result().infos));
    else
      res.send(500, "unable to process request");
  });

  const validateInformationsWithKeysForInstancesOfEntityWithCars = V.objectValidator({
    "entity": V.validateString,
    "keys": V.validateStringList,
    "cars": V.objectValidator({}, V.validateAny),
  }, V.validateAnyToUndefined);
  r.post('/informationsWithKeysForInstancesOfEntityWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateInformationsWithKeysForInstancesOfEntityWithCars, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let where = Object.assign({ $instanceOf: p.entity }, p.cars);
    let inv = await db.farPromise('safeQuery', {
      name: 'infos',
      where: where,
      scope: p.keys,
    });
    if (inv.hasResult())
      res.send(200, MSTEEncodedVOList(inv.result().infos));
    else
      res.send(500, "unable to process request");
  });
  r.post('/changePasswordInfo', ifAuthentified, ifMSTE, async (req, res) => {
    let {db, classes} = creator();
    let inv = await db.farPromise('safeQuery', {
      name: 'auth',
      where: { $instanceOf: classes.R_AuthenticationPWD, _id: req.session.r_authenticable!.auth_id },
      scope: ["hashed password"],
    });
    if (inv.hasResult() && inv.result().auth.length === 1) {
      let auth = inv.result().auth[0] as Classes.R_AuthenticationPWD;
      res.send(200, MSTEEncoded({
        oldPasswordChallengeInfo: SecureHash.challenge(auth["hashed password"]),
        newPasswordRequest: await SecureHash.generatePasswordRequest(),
        newPasswordSkRequest: await SecurePK.generatePasswordRequest(),
      }));
    }
    else {
      res.send(500);
    }
  });
  const entitiesParentCar= {
    MSEntParameterLib     : { entity: "R_Application"  , car: "parameter"            },
    MSREntRightLib        : { entity: "R_Authorization", car: "r_sub-right"          },
    MSREntUseProfileLib   : { entity: "R_Application"  , car: "r_sub-use profile"    },
    MSREntDeviceProfileLib: { entity: "R_Application"  , car: "r_sub-device profile" },
    MSREntLicenseLib      : { entity: "R_Application"  , car: "r_sub-license"        },
    MSREntPersonLib       : { entity: "R_Service"      , car: "r_member"             },
  };
  const validateCreateEntityWithCarsWithUpRef  = V.objectValidator({
    "entity": V.validateString,
    "cars": V.objectValidator({}, V.validateArray),
    "upRef": V.defaultsTo(validateInteger, undefined),
  }, V.validateAnyToUndefined);
  r.post('/createEntityWithCarsWithUpRef', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateCreateEntityWithCarsWithUpRef, req, res);
    if (!p) return;
    let {db, classes} = creator();
    try {
      let e: VersionedObject = new classes[p.entity!];
      for (let k in p.cars) {
        let nv = p.cars[k];
        let ov = e[k]; // Set | undefined
        e[k] = ov instanceof Set ? new Set(nv) : nv[0];
      }
      if (p.upRef) {
        let lnk = entitiesParentCar[p.entity!];
        if (!lnk)
          throw `no parent for ${p.entity!}`;
        let pe: VersionedObject = new classes[lnk.entity];
        pe.manager().setId(p.upRef);
        e[lnk.car] = e[lnk.car] instanceof Set ? new Set().add(pe) : pe;
      }
      let inv = await db.farPromise("safeSave", [e]);
      if (inv.hasResult())
        res.send(200, MSTEEncoded({ "urn": e.manager().hasAttributeValue("urn" as any) ? e["urn"] : e.id() }));
      else
        res.send(400, MSTEEncoded({ "error description": inv.diagnostics() }));
    } catch(e) {
      res.send(400, MSTEEncoded({ "error description": e }));
    }
  });

  const validateUpdateRefWithCars  = V.objectValidator({
    "ref": validateInteger,
    "cars": V.objectValidator({}, V.validateArray),
  }, V.validateAnyToUndefined);
  r.post('/updateRefWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateUpdateRefWithCars, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let inv = await db.farPromise('safeQuery', { name: 'obi', where: { _id: p.ref } });
    if (!inv.hasResult() || inv.result().obi.length !== 1) {
      res.send(400, MSTEEncoded({ "error description": "entity not found" }))
      return;
    }
    let e = inv.result().obi[0];
    try {
      for (let k in p.cars) {
        let nv = p.cars[k];
        let ov = e[k]; // Set | undefined
        e[k] = ov instanceof Set ? new Set(nv) : nv[0];
      }
      let inv = await db.farPromise("safeSave", [e]);
      if (inv.hasResult())
        res.send(200, MSTEEncoded(null))
      else
        res.send(400, MSTEEncoded({ "error description": inv.diagnostics() }));
    } catch(e) {
      res.send(400, MSTEEncoded({ "error description": e }));
    }
  });

  const validateDeleteRef  = V.objectValidator({
    "ref": validateInteger,
  }, V.validateAnyToUndefined);
  r.post('/deleteRef', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateDeleteRef, req, res);
    if (!p) return;
    let {db, classes} = creator();
    let invq = await db.farPromise('safeQuery', { name: 'obi', where: { _id: p.ref } });
    if (!invq.hasResult() || invq.result().obi.length !== 1) {
      res.send(400, MSTEEncoded({ "error description": "entity not found" }))
      return;
    }
    let e = invq.result().obi[0];
    e.manager().delete();
    let invs = await db.farPromise("safeSave", [e]);
    if (invs.hasResult())
      res.send(200, MSTEEncoded(null))
    else
      res.send(400, MSTEEncoded({ "error description": invs.diagnostics() }));
  });
  return r;
}