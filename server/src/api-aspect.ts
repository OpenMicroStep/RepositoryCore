import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, DataSourceQuery, SafeValidator} from '@openmicrostep/aspects';
import {CreateContext, Session, cfg} from './classes';
import { queries } from './queries';
import * as express from 'express';
import * as express_s from 'express-serve-static-core';
import {ExpressTransport} from '@openmicrostep/aspects.express';
const session = require('express-session');

export function api_aspect(creator: CreateContext) : express.Router {
  let router = express.Router();
  router.use('/', express.static(__dirname + "/../../../repository app/"));
  router.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true }
  }));
  let transport = new ExpressTransport(router, async (cstor, id, req) => {
    const {cc, session, db} = creator();
    session.setData(req.session);
    db.setQueries(queries);
    if (id === 'session')
      return Promise.resolve(session);
    if (session.data().isAuthenticated === true) {
      if (id === 'odb')
        return Promise.resolve(db);
      return Promise.reject('not found');
    }
    return Promise.reject('not authenticated');
  });
  cfg.installPublicTransport(transport, DataSource, ["server"]);
  cfg.installPublicTransport(transport, Session, ["client"]);
  return router;
}
