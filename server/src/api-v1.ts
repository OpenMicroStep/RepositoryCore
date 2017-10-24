import {VersionedObject, Identifier, Result} from '@openmicrostep/aspects';
import {Reporter, AttributePath, AttributeTypes as V, Diagnostic} from '@openmicrostep/msbuildsystem.shared';
import {MSTE} from '@openmicrostep/mstools';
import * as express from 'express';
import 'express-serve-static-core';
import * as Classes from './classes';
import {SecureHash, SecurePK} from './securehash';
import {SessionData, authsByLogin, authenticableFromAuth, writeSession} from './session';

declare module "express-serve-static-core" {
  interface Request {
    session: SessionData;
  }
}

const validateInteger = { validate: function validateInteger(reporter: Reporter, path: AttributePath, value: any) {
  if (typeof value === "number" && Number.isInteger(value))
    return value;
  path.diagnostic(reporter, { is: "warning", msg: `attribute must be an integer, got ${typeof value}`});
  return undefined;
}, traverse: () => 'integer' };

function mapValue(v) {
  return v instanceof VersionedObject ? v.id() : v;
}
function MSTEEncodedVOList(vo: VersionedObject[]) : any {
  let dico = {};
  for (let o of vo) {
    let r = dico[o.id()] = {};
    let m = o.manager();
    for (let [k, v] of m.versionAttributes()) {
      if (!(v instanceof Set))
        r[k] = v === undefined ? [] : [mapValue(v)];
      else
        r[k] = [...v].map(v => mapValue(v));
    }
  }
  return MSTEEncoded(dico);
}

function MSTEEncoded(o) : any {
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

function authOk(ctx: Classes.Context, req: express.Request, res: express.Response, auths: any, attr: string, validate: (value) => Promise<boolean>): Promise<boolean> {
  return ctx.cc.safe(async ccc => {
    let inv = await ccc.farPromise(ctx.db.rawQuery, {
      'auths=': auths,
      'applications=': {
        $out: '=a',
        "app=": { $elementOf: { $instanceOf: Classes.R_Application } },
        "auth=": { $elementOf: "=auths" },
        '=app._r_authentication': { $contains: '=auth' },
      },
      'persons=': {
        $out: '=a',
        "person=": { $elementOf: { $instanceOf: Classes.R_Person } },
        "auth=": { $elementOf: "=auths" },
        '=person._r_authentication': { $contains: '=auth' },
      },
      results: [
        {name: 'auths', where: '=auths', scope: ['_login', attr] },
        {name: 'authenticables', where: { $union: ['=applications', '=persons'] }, scope: ['_disabled'] },
      ]
    });
    let ok = false;
    if (inv.hasOneValue() && inv.value().auths.length === 1 && inv.value().authenticables.length === 1) {
      let auth = inv.value().auths[0];
      let a = inv.value().authenticables[0] as Classes.R_Application | Classes.R_Person;
      ok = await validate(auth[attr]);
      if (ok) {
        await writeSession(ccc, ctx.db, a, undefined, req.session);
        res.set("MASH-AUTH-RESPONSE", "SUCCESS");
        res.send(200, "SUCCESS");
      }
      return ok;
    }
    return false;
  });
}

async function challengeForLogin(ctx: Classes.Context, login: string, session: SessionData) {
  return await ctx.cc.safe(async ccc => {
    let inv = await authsByLogin(ccc, ctx.db, login);
    let challenge: string | undefined;
    if (inv.hasOneValue()) {
      let auths = inv.value();
      if (auths.length === 1 && auths[0] instanceof Classes.R_AuthenticationPWD) {
        challenge = await SecureHash.challenge(auths[0]["hashed password"]);
        if (challenge)
          session.v1_auth = { type: 'pwd', id: auths[0].id(), challenge: challenge };
      }
    }
    return challenge || SecureHash.fakeChallenge();
  });
}

async function challengeForUrn(ctx: Classes.Context, urn: string, session: SessionData) {
  return await ctx.cc.safe(async ccc => {
    let inv = await authsByLogin(ccc, ctx.db, urn);
    let challenge: string | undefined;
    if (inv.hasOneValue()) {
      let auths = inv.value();
      if (auths.length === 1 && auths[0] instanceof Classes.R_AuthenticationPK) {
        challenge = await SecurePK.challenge();
        session.v1_auth = { type: 'pk', id: auths[0].id(), challenge: challenge };
      }
    }
    return challenge || SecurePK.fakeChallenge();
  });
}

export function api_v1() : express.Router {
  let r = express.Router();
  let ifAuthentified = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.session.is_authenticated) next();
    else res.send(403);
  };
  r.get('/auth', async (req, res) => {
    let session = req.session;
    let ctx = req.multidb_configuration.creator();
    let ok = false;
    // ?ticket=

    try {
      if (req.query.ticket) {
        await ctx.cc.safe(async ccc => {
          let inv = await ccc.farPromise(ctx.db.rawQuery, {
            name: "tickets",
            where: {
              $instanceOf: Classes.R_AuthenticationTicket,
              _r_token: req.query.ticket,
              _creation_date: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // 1h
            },
            scope: ['_disabled', '_r_authenticable', '_r_device'],
          });
          if (inv.hasOneValue()) {
            let { tickets } = inv.value();
            if (tickets.length === 1) {
              let ticket = tickets[0] as Classes.R_AuthenticationTicket;
              if (!ticket._disabled) {
                ticket._disabled = true;
                let save = await ccc.farPromise(ctx.db.rawSave, [ticket]);
                if (!save.hasDiagnostics()) {
                  await writeSession(ccc, ctx.db, ticket._r_authenticable, ticket._r_device, req.session);
                  res.set("MASH-AUTH-RESPONSE", "SUCCESS");
                  res.send(200, "SUCCESS");
                  ok = true;
                }
              }
            }
          }
        });
      }
      else if (session.v1_auth) {
        let password: string, challenge: string;
        if ((password = req.get('mh-password')) && session.v1_auth.type === 'pwd') {
          ok = await authOk(ctx, req, res, { $instanceOf: Classes.R_AuthenticationPWD, _id: session.v1_auth.id },
            'hashed password', (hashedPassword) => SecureHash.isChallengeResponseValid(session.v1_auth!.challenge, password, hashedPassword));
        }
        else if ((challenge = req.get('mh-challenge')) && session.v1_auth.type === 'pk') {
          ok = await authOk(ctx, req, res, { $instanceOf: Classes.R_AuthenticationPK, _id: session.v1_auth.id },
            'public key', (publickey) => Promise.resolve(SecurePK.isChallengeResponseValid(session.v1_auth!.challenge, challenge, publickey)));
        }
      }
      else if (!session.is_authenticated) {
        let login: string, urn: string;
        if ((login = req.get('mh-login'))) {
          res.send(200, await challengeForLogin(ctx, login, session));
          ok = true;
        }
        else if ((urn = req.get('mh-urn'))) {
          res.send(200, await challengeForUrn(ctx, urn, session));
          ok = true;
        }
      }
    }
    catch (e) {
      console.error(e);
      ok = false;
    }
    if (!ok) {
      session.v1_auth = undefined;
      session.is_authenticated = false;
      res.set("MASH-AUTH-RESPONSE", "FAILURE");
      res.send(403, "FAILURE");
    }
  });
  r.get('/logout', ifAuthentified, (req, res) => {
    req.session.destroy(function(err) {
      res.end();
    });
  });
  r.get('/oneTimePassword', ifAuthentified, (req, res) => {
    let {cc, db, session} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        results: [
          {
            name: "devices",
            where: { $instanceOf: Classes.R_Device, _urn: req.query.device },
            scope: ['_disabled']
          },
        ]
      });
      if (inv.hasOneValue()) {
        let devices = inv.value().devices;
        if (devices.length === 1) {
          let token = await ccc.farPromise(session.oneTimePasswordForDevice, devices[0]);
          if (!token.hasDiagnostics())
            res.send(200, token.value());
          else
            res.send(500, "unable to process request");
        }
      }
      res.send(404, "device not found");
    }));
  });

  function safe_res<T>(res, p: Promise<void>) {
    p.catch((err) => {
      res.send(500, "unable to process request");
    });
  }

  // matchingPersons
  const validateMatchingPersons = V.objectValidator({
    "login": V.defaultsTo(V.validateString, undefined),
    "first name": V.defaultsTo(V.validateString, undefined),
    "last name": V.defaultsTo(V.validateString, undefined),
  }, V.validateAnyToUndefined);
  r.post('/matchingPersons', ifAuthentified, ifMSTE, (req, res) => {
    let p = validate(validateMatchingPersons, req, res);
    if (!p) return;
    let {cc, db} = req.multidb_configuration.creator();
    let where = {};
    if (p.login)         where["r_authenticable"] = { $contains: { login: p.login }};
    if (p["first name"]) where["first name"]      = { $eq: p["first name"] };
    if (p["last name"])  where["last name"]       = { $eq: p["last name"] };
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'persons',
        where: where,
        scope: ['urn', 'first name', 'last name', 'middle name'],
      });
      if (inv.hasOneValue())
        res.send(200, MSTEEncodedVOList(inv.value().persons));
      else
        res.send(500, "unable to process request");
    }));
  });

  // managedServices
  const validateManagedServices = V.objectValidator({
    "rootsOnly": V.defaultsTo(V.validateBoolean, false),
  }, V.validateAnyToUndefined);
  r.post('/managedServices', ifAuthentified, ifMSTE, (req, res) => {
    let p = validate(validateManagedServices, req, res);
    if (!p) return;
    let valid_p = p;
    let {cc, db} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let diags: Diagnostic[] = [];
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'services',
        where: { $instanceOf: Classes.R_Service, r_administrator: { $contains: { _id: req.session.person!.id }} },
        scope: ['urn'],
      });
      if (inv.hasOneValue()) {
        let services = inv.value().services as Classes.R_Service[];
        if (!valid_p.rootsOnly) {
          let all = new Set(services);
          let n = 0;
          while (n < all.size) {
            n = all.size;
            let inv = await ccc.farPromise(db.safeQuery, {
              name: 'services',
              where: { $instanceOf: Classes.R_Service, "r_parent service": { $in: services } },
              scope: ['urn', 'r_parent service'],
            });
            if (inv.hasOneValue()) {
              services = inv.value().services as Classes.R_Service[];
              for (let s of services)
                all.add(s);
            }
            else
              diags.push(...inv.diagnostics());
          }
          services = [...all];
        }
        if (diags.length === 0)
          res.send(200, MSTEEncodedVOList(services));
      }
      else
        diags.push(...inv.diagnostics());
      if (diags.length > 0)
        res.send(500, diags);
    }));
  });

  r.get('/authorizationBunchsForDeviceSN', ifAuthentified, async (req, res) => {
    let {db, cc} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        "devices=": {
          $instanceOf: Classes.R_Device,
          _r_serial_number: req.query.deviceSN,
        },
        "device_profiles=": {
          $out: "=p",
          "p=": { $elementOf: { $instanceOf: Classes.R_Device_Profile } },
          "d=": { $elementOf: "=devices" },
          "=p._r_device": { $contains: "=d" }
        },
        "rights=": {
          $out: "=r",
          "r=": { $elementOf: { $instanceOf: Classes.R_Right } },
          "p=": { $elementOf: "=device_profiles" },
          "=r._r_device_profile": { $eq: "=p" }
        },
        "actions=": "=rights:_r_action",
        "use_profiles=": "=rights:_r_use_profile",
        "authorizations=": {
          $out: "=a",
          "a=": { $elementOf: { $instanceOf: Classes.R_Authorization } },
          "r=": { $elementOf: "=rights" },
          "=a._r_sub_right": { $contains: "=r" }
        },
        "applications=": {
          $out: "=A",
          "A=": { $elementOf: { $instanceOf: Classes.R_Application } },
          "a=": { $elementOf: "=authorizations" },
          "=a._r_authenticable": { $contains: "=A" },
        },
        "persons=": {
          $out: "=A",
          "A=": { $elementOf: { $instanceOf: Classes.R_Person } },
          "a=": { $elementOf: "=authorizations" },
          "=a._r_authenticable": { $contains: "=A" }
        },
        results: [
          { name: "all",
            where: { $union: [
              "=devices"  , "=device_profiles", "=rights"         , "=actions"        ,
              "=use_profiles"   , "=authorizations" , "=applications"   , "=persons"        ,
            ]},
            scope: {
              R_Device: { '.': ["_urn", "_label", "_disabled", "_r_out_of_order", "_r_serial_number"] },
              R_Element: { '.': ["_system_name"] },
              R_Authorization: { '.': ["_urn", "_label", "_disabled", "_r_authenticable", "_r_sub_right"] },
              R_Person: { '.': ['_urn', '_disabled', "_first_name", "_middle_name", "_last_name", "_mail"] },
              R_Application: { '.': ["_urn", "_label", "_disabled"] },
            }
          }
        ]
      });
      if (inv.hasOneValue()) {
        res.send(200, MSTEEncodedVOList(inv.value().all));
      }
      else
        res.send(500, inv.diagnostics());
    }));
  });

  const validateInformationsWithKeysForRefs = V.objectValidator({
    "keys": V.validateStringList,
    "refs": V.listValidator(validateInteger),
  }, V.validateAnyToUndefined);
  r.post('/informationsWithKeysForRefs', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateInformationsWithKeysForRefs, req, res);
    if (!p) return;
    let valid_p = p;
    let {db, cc} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'infos',
        where: {
          $or: {
            _id: { $in: valid_p.refs },
            _urn: { $in: valid_p.refs },
          }
        },
        scope: valid_p.keys,
      });
      if (inv.hasOneValue())
        res.send(200, MSTEEncodedVOList(inv.value().infos));
      else
        res.send(500, "unable to process request");
    }));
  });

  const validateQueryInstancesOfEntityWithCars = V.objectValidator({
    "entity": V.validateString,
    "cars": V.objectValidator({}, V.validateAny),
  }, V.validateAnyToUndefined);
  r.post('/queryInstancesOfEntityWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateQueryInstancesOfEntityWithCars, req, res);
    if (!p) return;
    let {db, cc} = req.multidb_configuration.creator();
    let where = Object.assign({ $instanceOf: p.entity }, p.cars);
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'infos',
        where: where,
      });
      if (inv.hasOneValue())
        res.send(200, MSTEEncodedVOList(inv.value().infos));
      else
        res.send(500, "unable to process request");
    }));
  });

  const validateInformationsWithKeysForInstancesOfEntityWithCars = V.objectValidator({
    "entity": V.validateString,
    "keys": V.validateStringList,
    "cars": V.objectValidator({}, V.validateAny),
  }, V.validateAnyToUndefined);
  r.post('/informationsWithKeysForInstancesOfEntityWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateInformationsWithKeysForInstancesOfEntityWithCars, req, res);
    if (!p) return;
    let valid_p = p;
    let {db, cc} = req.multidb_configuration.creator();
    let where = Object.assign({ $instanceOf: p.entity }, p.cars);
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'infos',
        where: where,
        scope: valid_p.keys,
      });
      if (inv.hasOneValue())
        res.send(200, MSTEEncodedVOList(inv.value().infos));
      else
        res.send(500, "unable to process request");
    }));
  });

  const entitiesParentCar = {
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
    let unsafe_p = validate(validateCreateEntityWithCarsWithUpRef, req, res);
    if (!unsafe_p) return;
    let p = unsafe_p;
    let {db, cc} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let e: VersionedObject = ccc.create(p.entity!);
      for (let k in p.cars) {
        let nv = p.cars[k];
        let ov = e[k]; // Set | undefined
        e[k] = ov instanceof Set ? new Set(nv) : nv[0];
      }
      if (p.upRef) {
        let lnk = entitiesParentCar[p.entity!];
        if (!lnk)
          throw `no parent for ${p.entity!}`;
        let pe: VersionedObject = ccc.create(lnk.entity);
        pe.manager().setId(p.upRef);
        e[lnk.car] = e[lnk.car] instanceof Set ? new Set().add(pe) : pe;
      }
      let inv = await ccc.farPromise(db.safeSave, [e]);
      if (inv.hasOneValue())
        res.send(200, MSTEEncoded({ "urn": e.manager().hasAttributeValue("urn" as any) ? e["urn"] : e.id() }));
      else
        res.send(400, MSTEEncoded({ "error description": inv.diagnostics() }));
    }));
  });

  const validateUpdateRefWithCars  = V.objectValidator({
    "ref": validateInteger,
    "cars": V.objectValidator({}, V.validateArray),
  }, V.validateAnyToUndefined);
  r.post('/updateRefWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let unsafe_p = validate(validateUpdateRefWithCars, req, res);
    if (!unsafe_p) return;
    let p = unsafe_p;
    let {db, cc} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let inv_q = await ccc.farPromise(db.safeQuery, { name: 'obi', where: { _id: p.ref } });
      if (!inv_q.hasOneValue() || inv_q.value().obi.length !== 1) {
        res.send(400, MSTEEncoded({ "error description": "entity not found" }));
        return;
      }
      let e = inv_q.value().obi[0];
      for (let k in p.cars) {
        let nv = p.cars[k];
        let ov = e[k]; // Set | undefined
        e[k] = ov instanceof Set ? new Set(nv) : nv[0];
      }
      let inv_save = await ccc.farPromise(db.safeSave, [e]);
      if (inv_save.hasOneValue())
        res.send(200, MSTEEncoded(null));
      else
        res.send(400, MSTEEncoded({ "error description": inv_save.diagnostics() }));
    }));
  });

  const validateDeleteRef  = V.objectValidator({
    "ref": validateInteger,
  }, V.validateAnyToUndefined);
  r.post('/deleteRef', ifAuthentified, ifMSTE, async (req, res) => {
    let unsafe_p = validate(validateDeleteRef, req, res);
    if (!unsafe_p) return;
    let p = unsafe_p;
    let {db, cc} = req.multidb_configuration.creator();
    safe_res(res, cc.safe(async ccc => {
      let invq = await ccc.farPromise(db.safeQuery, { name: 'obi', where: { _id: p.ref } });
      if (!invq.hasOneValue() || invq.value().obi.length !== 1) {
        res.send(400, MSTEEncoded({ "error description": "entity not found" }));
        return;
      }
      let e = invq.value().obi[0];
      e.manager().delete();
      let invs = await ccc.farPromise(db.safeSave, [e]);
      if (invs.hasOneValue())
        res.send(200, MSTEEncoded(null));
      else
        res.send(400, MSTEEncoded({ "error description": invs.diagnostics() }));
    }));
  });
  return r;
}
