import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery} from '@openmicrostep/aspects';
import {CreateContext} from './classes';
import * as express from 'express';
import * as express_s from 'express-serve-static-core';
import {ExpressTransport} from '@openmicrostep/aspects.express';
const session = require('express-session');

export function api_aspect(creator: CreateContext) : express.Router {
  let router = express.Router();
  router.use('/', express.static(__dirname + "/../../../repository app/"));

  let queries = new Map<string, DataSourceQuery>();
  queries.set("persons", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Person", $text: query.text }, 
    scope: ['_first_name', '_last_name', '_disabled']
  }));
  queries.set("applications", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Application", $text: query.text },
    scope: ['_label', '_urn', '_disabled']
  }));
  queries.set("authorizations", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Authorization", $text: query.text },
    scope: ['_label', '_urn', '_disabled']
  }));
  queries.set("software-contexts", (reporter, query) => ({ 
    name: "items",
    where: { $instanceOf: "R_Software_Context" },
    scope: ['_label', '_urn', '_disabled', '_r_parent_context']
  }));
  queries.set("use-profiles", (reporter, query) => ({
    "application=": { $instanceOf: "R_Application", _id: query.app_id, $text: query.text },
    name: "items",
    where: "=application:_r_sub_use_profile",
    scope: ['_label']
  }));
  queries.set("device-profiles", (reporter, query) => ({
    "application=": { $instanceOf: "R_Application", _id: query.app_id, $text: query.text },
    name: "items",
    where: "=application:_r_device_profile",
    scope: ['_label']
  }));
  let transport = new ExpressTransport(router, async (cstor, id) => {
    const {cc, db} = creator();
    db.setQueries(queries);
    if (id === 'odb')
        return Promise.resolve(db);
    return Promise.reject('not found')
  });
  ControlCenter.globalCache.installPublicTransport(transport, DataSource, ["server"]);
  return router;
}