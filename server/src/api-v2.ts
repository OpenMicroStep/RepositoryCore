import {VersionedObject, ControlCenter, Result} from '@openmicrostep/aspects';
import {Reporter, AttributePath, AttributeTypes as V, Diagnostic} from '@openmicrostep/msbuildsystem.shared';
import {MSTE} from '@openmicrostep/mstools';
import * as express from 'express';
import * as Classes from './classes';
import {SecureHash, SecurePK} from './securehash';
import {SessionData, authsByLogin, authenticableFromAuth, writeSession} from './session';
const bodyParser = require('body-parser');
const json_parser = bodyParser.json({ type: "application/json" });

export function api_v2() : express.Router {
  let r = express.Router();
  r.post('/externalLoginByPassword', json_parser, (req, res) => {
    let { cc, db, session } = req.multidb_configuration.creator();
    cc.safe(async ccc => {
      session.setData({});
      let l = await ccc.farPromise(session.loginByPassword, req.body);
      if (l.hasOneValue() && l.value()) {
        let { rights, person } = session.data();
        res.status(200).json({ rights, person });
      }
      else {
        res.sendStatus(403);
      }
    }).catch(() => res.sendStatus(500));
  });

  return r;
}
