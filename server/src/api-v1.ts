import {VersionedObject, ControlCenter, Result} from '@openmicrostep/aspects';
import {Reporter, AttributePath, AttributeTypes as V, Diagnostic} from '@openmicrostep/msbuildsystem.shared';
import {MSTE} from '@openmicrostep/mstools';
import * as express from 'express';
import * as Classes from './classes';
import {SecureHash, SecurePK} from './securehash';
import {SessionData, authsByLogin, authenticableFromAuth, writeSession} from './session';
const bodyParser = require('body-parser');
const raw_parser = bodyParser.text({ type: () => true });
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

function urnOrId(vo: VersionedObject) : string {
  return (vo.manager().aspect().attributes.has('_urn') && vo.manager().attributeValue("_urn")) || vo.id().toString();
}
function VOList(vo: VersionedObject[]) {
  let encoded = new Set<VersionedObject>();
  let dico = {};
  for (let o of vo) {
    encode(o);
  }
  return dico;

  function encode(o: VersionedObject) {
    if (!encoded.has(o)) {
      encoded.add(o);
      let m = o.manager();
      let r = dico[urnOrId(o)] = { entity: [Classes.mapClasses[m.classname()]]};
      for (let attribute of m.attributes()) {
        let v = m.attributeValueFast(attribute);
        let v1k = Classes.mapAttributes[attribute.name] as string;
        if (v1k === "r_action" && v)
          v = (v as any as Classes.R_Element)._system_name as any;
        if (v1k === "parameter" && o instanceof Classes.R_Person) {
          v1k = "r_matricule";
          r["r_matricule"] = [...(v as any)].filter(p => p._label === "matricule").map(p => p._string);
        }
        else if (v1k === "r_authentication") {
          let exportables: Classes.R_AuthenticationPWD[] = [...(v as any)].filter(a => a instanceof Classes.R_AuthenticationPWD && a._ciphered_private_key);
          r["login"] = exportables.map(a => a._mlogin);
          r["ciphered private key"] = exportables.map(a => a._ciphered_private_key);
        }
        else if (!(v instanceof Set))
          r[v1k] = v === undefined ? [] : [mapValue(v)];
        else
          r[v1k] = [...v].map(v => mapValue(v));
      }
    }
    return o;
  }

  function mapValue(v) {
    return v instanceof VersionedObject ? urnOrId(encode(v)) : v;
  }
}
function MSTEEncodedVOList(vo: VersionedObject[]) : any {
  return MSTEEncoded(VOList(vo));
}

function MSTEEncoded(o) : any {
  return MSTE.stringify(o);
}
function ifMSTE(req: express.Request, res: express.Response, next: express.NextFunction) {
  raw_parser(req, res, (err) => {
    try {
      req.body = MSTE.parse(req.body);
      next();
    } catch (e) {
      res.status(400).send(MSTEEncoded(e));
    }
  });
}
function validate<T>(validator: V.Validator0<T>, req: express.Request, res: express.Response) : T | undefined {
  let reporter = new Reporter();
  let ret = validator.validate(reporter, new AttributePath('req.body'), req.body);
  if (!ret)
    res.status(400).send(MSTEEncoded(reporter.diagnostics));
  return ret;
}

function authOk(ctx: Classes.Context, req: express.Request, res: express.Response, auths: any, attr: string, validate: (value) => Promise<boolean>): Promise<boolean> {
  return ctx.cc.safe(async ccc => {
    let inv = await ccc.farPromise(ctx.db.rawQuery, {
      'auths=': auths,
      'applications=': {
        $out: '=app',
        "app=": { $elementOf: { $instanceOf: Classes.R_Application } },
        "auth=": { $elementOf: "=auths" },
        '=app._r_authentication': { $contains: '=auth' },
      },
      'persons=': {
        $out: '=person',
        "person=": { $elementOf: { $instanceOf: Classes.R_Person } },
        "auth=": { $elementOf: "=auths" },
        '=person._r_authentication': { $contains: '=auth' },
      },
      results: [
        {name: 'auths', where: '=auths', scope: ['_mlogin', attr] },
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
        res.status(200).send("SUCCESS");
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
      let [auth] = inv.value();
      if (auth instanceof Classes.R_AuthenticationPWD && auth._hashed_password) {
        challenge = await SecureHash.challenge(auth._hashed_password!);
        if (challenge)
          session.v1_auth = { type: 'pwd', id: auth.id(), challenge: challenge };
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
    else res.sendStatus(403);
  };
  r.get('/auth', async (req, res) => {
    if (req.session.is_authenticated) {
      res.sendStatus(200);
      return;
    }
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
                  res.status(200).send("SUCCESS");
                  ok = true;
                }
              }
            }
          }
        });
      }
      else if (session.v1_auth) {
        let password: string | undefined, challenge: string | undefined;
        if ((password = req.get('mh-password')) && session.v1_auth.type === 'pwd') {
          ok = await authOk(ctx, req, res, { $instanceOf: Classes.R_AuthenticationPWD, _id: session.v1_auth.id },
            '_hashed_password', (hashedPassword) => SecureHash.isChallengeResponseValid(session.v1_auth!.challenge, password!, hashedPassword));
        }
        else if ((challenge = req.get('mh-challenge')) && session.v1_auth.type === 'pk') {
          ok = await authOk(ctx, req, res, { $instanceOf: Classes.R_AuthenticationPK, _id: session.v1_auth.id },
            '_public_key', (publickey) => Promise.resolve(SecurePK.isChallengeResponseValid(session.v1_auth!.challenge, challenge!, publickey)));
        }
      }
      else if (!session.is_authenticated) {
        let login: string | undefined, urn: string | undefined;
        if ((login = req.get('mh-login'))) {
          res.status(200).send(await challengeForLogin(ctx, login, session));
          ok = true;
        }
        else if ((urn = req.get('mh-urn'))) {
          res.status(200).send(await challengeForUrn(ctx, urn, session));
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
      res.status(403).send("FAILURE");
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
            res.status(200).send(token.value());
          else
            res.status(500).send("unable to process request");
        }
      }
      res.status(404).send("device not found");
    }));
  });

  function safe_res<T>(res, p: Promise<void>) {
    p.catch((err) => {
      res.status(500).send("unable to process request");
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
    let {cc, db, session} = req.multidb_configuration.creator();
    session.setData(req.session);
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
        res.status(200).send(MSTEEncodedVOList(inv.value().persons));
      else
        res.status(500).send("unable to process request");
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
    let {cc, db, session} = req.multidb_configuration.creator();
    session.setData(req.session);
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
          res.status(200).send(MSTEEncodedVOList(services));
      }
      else
        diags.push(...inv.diagnostics());
      if (diags.length > 0)
        res.status(500).send(diags);
    }));
  });

  const validateSmartCardCertificate = V.objectValidator({
    "publicKey": V.validateString,
    "uid": V.validateString,
  }, V.validateAnyToUndefined);
  r.post('/smartCardCertificate', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateSmartCardCertificate, req, res);
    if (!p) return;
    let { uid: matricule, publicKey: public_key } = p;
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'user',
        where: {
          $out: "=u",
          "u=": { $elementOf: { $instanceOf: Classes.R_Person } },
          "p=": { $elementOf: { $instanceOf: Classes.Parameter, _label: "matricule", _string: matricule } },
          "=u._parameter": { $contains: "=p" },
        },
        scope: {
          R_Person: {
            '.': ['_urn', '_r_authentication', '_login'],
          },
          R_AuthenticationPK: {
            '_r_authentication.': ['_mlogin', '_public_key'],
          },
        },
      });
      if (!inv.hasOneValue())
        res.status(400).send(MSTEEncoded({ "error description": inv.diagnostics() }));
      else {
        let { user: [user] } = inv.value() as { user: Classes.R_Person[] };
        if (!user)
          res.status(400).send(MSTEEncoded({ "error description": "unable to find matching person" }));
        else {
          let pk = [...user._r_authentication].find(a => a instanceof Classes.R_AuthenticationPK && a._mlogin === user._urn) as Classes.R_AuthenticationPK | undefined;
          if (!pk) {
            pk = Classes.R_AuthenticationPK.create(ccc);
            pk._mlogin = user._urn;
            user._r_authentication = new Set([...user._r_authentication, pk]);
          }
          pk._public_key = public_key;
          let inv_save = await ccc.farPromise(db.safeSave, [user, pk]);
          if (!inv_save.hasDiagnostics())
            res.status(200).send(MSTEEncoded(null));
          else
            res.status(400).send(MSTEEncoded({ "error description": inv_save.diagnostics() }));
        }
      }
    }));
  });

  r.get('/allowedApplicationUrnsForAuthenticable', ifAuthentified, (req, res) => {
    let urn = req.get('mh-urn');
    if (urn) {
      let {db, cc, session} = req.multidb_configuration.creator();
      session.setData(req.session);
      safe_res(res, cc.safe(async ccc => {

        let inv = await ccc.farPromise(db.rawQuery, {
          "P=": {
            $instanceOf: "R_Person",
            _urn: urn,
          },
          "A=": {
            $out: "=a",
            "a=": { $elementOf: { $instanceOf: "R_Authorization" } },
            "p=": { $elementOf: "=P" },
            "=a._r_authenticable": { $contains: "=p" }
          },
          results: [
            { name: "authorizations", where: "=A", scope: {
              R_Authorization: { '.': ['_r_sub_right'] },
              R_Right: { '_r_sub_right.': ['_r_action', '_r_application'] },
              R_Element: { '_r_sub_right._r_action.': ['_system_name', '_order'] },
              R_Application: { '_r_sub_right._r_application.': ['_urn', '_r_software_context'] },
            }},
          ]
        });
        if (inv.hasOneValue()) {
          let { authorizations } = inv.value() as { authorizations: Classes.R_Authorization[] };
          let applications = new Set<string>();
          for (let a of authorizations) {
            for (let r of a._r_sub_right) {
              if (r._r_application && r._r_application._urn && r._r_action && r._r_action._system_name !== 'r_none')
                applications.add(r._r_application._urn);
            }
          }
          res.status(200).send(MSTEEncoded([...applications]));
        }
        else {
          res.status(500).send(inv.diagnostics());
        }
      }));
    }
    else {
      res.status(400).send(`header 'mh-urn' was expected`);
    }
  });

  r.get('/authorizationBunchsForDeviceSN', ifAuthentified, async (req, res) => {
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.rawQuery, {
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
        "applications=": "=rights:_r_application",
        "persons=": {
          $out: "=u",
          "u=": { $elementOf: { $instanceOf: Classes.R_Person } },
          "a=": { $elementOf: "=authorizations" },
          "=a._r_authenticable": { $contains: "=u" },
        },
        results: [
          { name: "all",
            where: { $union: [
              "=devices"  , "=device_profiles", "=rights"         , "=actions"        ,
              "=use_profiles"   , "=authorizations" , "=applications"   , "=persons"        ,
            ]},
            scope: {
              R_Right: { '.': ["_label", "_r_action", "_r_application", "_r_software_context", "_r_use_profile", "_r_device_profile"] },
              R_Device: { '.': ["_urn", "_label", "_disabled", "_r_out_of_order", "_r_serial_number"] },
              R_Element: { '.': ["_system_name"] },
              R_Authorization: { '.': ["_urn", "_label", "_disabled", "_r_authenticable", "_r_sub_right"] },
              R_Person: { '.': ['_urn', '_disabled', "_first_name", "_middle_name", "_last_name", "_mail", "_parameter", "_r_authentication"] },
              R_AuthenticationPWD: { '_r_authentication.': ['_mlogin', '_ciphered_private_key'] },
              R_AuthenticationPK: { '_r_authentication.': ['_mlogin'] },
              R_Application: { '.': ["_urn", "_label", "_disabled", "_parameter"] },
              R_Software_Context: { '_r_software_context.': ["_urn", "_label", "_disabled"] },
              Parameter: {
                '_parameter.': ["_label", "_string"],
              },
            }
          }
        ]
      });
      if (inv.hasOneValue()) {
        res.status(200).send(MSTEEncoded({
          protocolVersion: 1,
          modelVersion: 1,
          mode: 1,
          objects: VOList(inv.value().all)
        }));
      }
      else
        res.status(500).send(inv.diagnostics());
    }));
  });

  function build_where(cc: ControlCenter, entity, cars) {
    let aspect = cc.aspectChecked(entity);
    let where = { $out: "=x", "x=": { $elementOf: { $instanceOf: entity } } };
    let n = 0;
    for (let car in cars) {
      let v = cars[car];
      let _car = Classes.mapAttributesR[car];
      if (_car) {
        let a = aspect.attributes.get(_car)!;
        if (a.contains_vo && typeof v === "string") { // _urn
          let y = `v${++n}`;
          where[`${y}=`] = { $elementOf: { _urn: v } };
          where[`=x.${_car}`] = { $contains: `=${y}` };
        }
        else {
          where[`=x.${_car}`] = v;
        }
      }
    }
    return where;
  }

  function build_scope(scope) {
    let s = scope.map(car => Classes.mapAttributesR[car]);
    s.push('_urn');
    return s;
  }

  const validateInformationsWithKeysForRefs = V.objectValidator({
    "keys": V.validateStringList,
    "refs": V.validateArray,
  }, V.validateAnyToUndefined);
  r.post('/informationsWithKeysForRefs', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateInformationsWithKeysForRefs, req, res);
    if (!p) return;
    let valid_p = p;
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    safe_res(res, cc.safe(async ccc => {
      let inv: Result = await ccc.farPromise(db.safeQuery, {
        name: 'infos',
        where: {
          $or: [
            { _id: { $in: valid_p.refs!.filter(v => typeof v === "number") } },
            { _urn: { $in: valid_p.refs!.filter(v => typeof v === "string") } },
          ]
        }
      });
      if (inv.hasOneValue())
        inv = await ccc.farPromise(db.safeLoad, { objects: inv.value().infos, scope: build_scope(valid_p.keys) });
      if (inv.hasOneValue())
        res.status(200).send(MSTEEncodedVOList(inv.value()));
      else
        res.status(500).send(MSTEEncoded({ "error description": inv.diagnostics() }));
    }));
  });

  const validateQueryInstancesOfEntityWithCars = V.objectValidator({
    "entity": V.validateString,
    "cars": V.objectValidator({}, V.validateAny),
  }, V.validateAnyToUndefined);
  r.post('/queryInstancesOfEntityWithCars', ifAuthentified, ifMSTE, async (req, res) => {
    let p = validate(validateQueryInstancesOfEntityWithCars, req, res);
    if (!p) return;
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    let where = build_where(cc, p.entity, p.cars);
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'infos',
        where: where,
        scope: ['_urn'],
      });
      if (inv.hasOneValue())
        res.status(200).send(MSTEEncoded(Object.keys(VOList(inv.value().infos))));
      else
        res.status(500).send(MSTEEncoded({ "error description": inv.diagnostics() }));
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
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    let where = build_where(cc, p.entity, p.cars);
    safe_res(res, cc.safe(async ccc => {
      let inv = await ccc.farPromise(db.safeQuery, {
        name: 'infos',
        where: where,
        scope: build_scope(valid_p.keys),
      });
      if (inv.hasOneValue())
        res.status(200).send(MSTEEncodedVOList(inv.value().infos));
      else
        res.status(500).send(MSTEEncoded({ "error description": inv.diagnostics() }));
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
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
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
        res.status(200).send(MSTEEncoded({ "urn": e.manager().hasAttributeValue("urn" as any) ? e["urn"] : e.id() }));
      else
        res.status(400).send(MSTEEncoded({ "error description": inv.diagnostics() }));
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
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    safe_res(res, cc.safe(async ccc => {
      let inv_q = await ccc.farPromise(db.safeQuery, { name: 'obi', where: { _id: p.ref } });
      if (!inv_q.hasOneValue() || inv_q.value().obi.length !== 1) {
        res.status(400).send(MSTEEncoded({ "error description": "entity not found" }));
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
        res.status(200).send(MSTEEncoded(null));
      else
        res.status(400).send(MSTEEncoded({ "error description": inv_save.diagnostics() }));
    }));
  });

  const validateDeleteRef  = V.objectValidator({
    "ref": validateInteger,
  }, V.validateAnyToUndefined);
  r.post('/deleteRef', ifAuthentified, ifMSTE, async (req, res) => {
    let unsafe_p = validate(validateDeleteRef, req, res);
    if (!unsafe_p) return;
    let p = unsafe_p;
    let {db, cc, session} = req.multidb_configuration.creator();
    session.setData(req.session);
    safe_res(res, cc.safe(async ccc => {
      let invq = await ccc.farPromise(db.safeQuery, { name: 'obi', where: { _id: p.ref } });
      if (!invq.hasOneValue() || invq.value().obi.length !== 1) {
        res.status(400).send(MSTEEncoded({ "error description": "entity not found" }));
        return;
      }
      let e = invq.value().obi[0];
      e.manager().setPendingDeletion(true);
      let invs = await ccc.farPromise(db.safeSave, [e]);
      if (invs.hasOneValue())
        res.status(200).send(MSTEEncoded(null));
      else
        res.status(400).send(MSTEEncoded({ "error description": invs.diagnostics() }));
    }));
  });
  return r;
}
