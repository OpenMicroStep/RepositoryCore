import {VersionedObject, ControlCenter, Result, ControlCenterContext, DataSource, Identifier} from '@openmicrostep/aspects';
import {MSTE} from '@openmicrostep/mstools';
import * as express from 'express';
import * as Classes from './classes';
import {SecureHash, SecurePK} from './securehash';
import {session_configuration} from './server';
import { SessionData, authsByLogin, authenticableFromAuth, loadComputedRights } from './session';
import { Session, R_Person } from './classes';
const bodyParser = require('body-parser');
const json_parser = bodyParser.json({ type: "application/json" });

export function api_v2() : express.Router {
  let r = express.Router();
  const session_config = session_configuration();

  const session = require('express-session');
  const uid = require('uid-safe').sync
  const signature = require('cookie-signature');
  const onHeaders = require('on-headers');

  // register event listeners for the store to track readiness
  let store = session_config.store;
  let secret = session_config.secret;
  let storeReady = true;
  store.on('disconnect', function ondisconnect() {
    storeReady = false;
  });
  store.on('connect', function onconnect() {
    storeReady = true;
  });
  store.generate = function(req){
    req.sessionID = uid(24);
    req.session = new session.Session(req);
    req.session.cookie = new session.Cookie({});
    req.session.cookie.secure = true;
  };
  function shouldDestroy(req) {
    return req.sessionID && req.session == null;
  }
  function session_handler(req: express.Request & { sessionID: string | undefined, session: any, sessionStore: any }, res: express.Response, next: express.NextFunction): void {
    console.info("storeReady", storeReady, req.session);
    if (req.session || !storeReady) {
      next();
      return;
    }

    let touched = false;
    let api_key = req.headers["x-apikey"];
    let sessionID = api_key ? signature.unsign(req.headers["x-apikey"], secret) : false;
    if (sessionID === false)
      sessionID = undefined;
    req.sessionStore = store;
    req.sessionID = sessionID;

    onHeaders(res, function() {
      if (!req.session || !req.sessionID) {
        return;
      }
      res.setHeader("X-ApiKey", signature.sign(req.sessionID, secret));
    });

    store.get(req.sessionID, function(err, sess) {
      // error handling
      if (err) {
        if (err.code !== 'ENOENT') {
          next(err);
          return;
        }

        store.generate(req);
      // no session
      } else if (!sess) {
        store.generate(req);
      // populate req.session
      } else {
        store.createSession(req, sess);
      }
      next();
    });
  }

  r.use('/', session_handler);

  function safe_next(work: (ccc: ControlCenterContext, db: DataSource.Aspects.server, session: Session.Aspects.server, input: any) => Promise<{ status: 200 | 403, json?: any }>): express.RequestHandler {
    return async (req, res) => {
      let { cc, db, session } = req.multidb_configuration.creator();
      session.setData(req.session);
      try {
        let old_session = JSON.stringify(session.data());
        let response = await cc.safe(ccc => work(ccc, db, session, req.body));
        if (session.data()) {
          let new_session = JSON.stringify(session.data());
          if (old_session !== new_session) {
            await new Promise((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
          }
        }
        else {
          await new Promise((resolve, reject) => req.session.destroy((err) => err ? reject(err) : resolve()));
        }
        if (response.status === 200)
          res.status(200).json(response.json);
        else
          res.sendStatus(response.status);
      }
      catch(e) {
        console.error(e);
        res.sendStatus(500)
      }
    };
  }

  async function loadPersonInfo(ccc: ControlCenterContext, db: DataSource.Aspects.server, person_id: Identifier): Promise<{ urn: string, first_name: string, last_name: string, mail?: string, parameters: { [s: string]: string } }> {
    let res = await ccc.farPromise(db.safeLoad, { objects: [ccc.findOrCreate(person_id, "R_Person")], scope: {
      R_Person: { '.': ['_urn', '_first_name', '_last_name', '_mail', '_parameter'] },
      Parameter: { '_parameter.': ['_label', '_string'] }
    } });
    if (res.hasDiagnostics())
      throw new Error(JSON.stringify(res.diagnostics()));
    let [person] = res.value() as R_Person[];
    let parameters: any = {};
    for (let p of person._parameter) {
      parameters[p._label!] = p._string;
    }
    return {
      urn: person._urn!,
      first_name: person._first_name!,
      last_name: person._last_name!,
      mail: person._mail,
      parameters
    };
  }

  r.post('/externalLoginByPassword', json_parser, safe_next(async (ccc, db, session, input) => {
    let l = await ccc.farPromise(session.loginByPassword, input);
    if (l.hasOneValue() && l.value()) {
      let { rights, person } = session.data();
      return { status: 200, json: { person: await loadPersonInfo(ccc, db, person.id), rights } };
      // nom, prenom, id, mail params { matricule: number }
    }
    else {
      return { status: 403 }
    }
  }));
  r.get('/externalIsSessionValid', safe_next(async (ccc, db, session, input) : Promise<{ status: 200, json: boolean }> => {
    return { status: 200, json: !!session.data().is_authenticated };
  }));
  r.get('/externalRights', safe_next(async (ccc, db, session) => {
    if (!session.data().is_authenticated)
      return { status: 403 };
    return { status: 200, json: { person: await loadComputedRights(ccc, db, session.data().person.id) } };
  }));
  r.get('/externalPersonInfo', safe_next(async (ccc, db, session) => {
    if (!session.data().is_authenticated)
      return { status: 403 };
    return { status: 200, json: { person: await loadPersonInfo(ccc, db, session.data().person.id) } };
  }));
  r.delete('/external', safe_next(async (ccc, db, session) => {
    if (!session.data().is_authenticated)
      return { status: 403 };
    session.setData(null);
    return { status: 200, json: true };
  }));

  return r;
}
