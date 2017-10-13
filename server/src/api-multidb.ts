import {DataSource} from '@openmicrostep/aspects';
import {PostgresDBConnectorFactory} from '@openmicrostep/aspects.sql';
import {CreateContext, Session, cfg} from './classes';
import { queries } from './queries';
import { boot } from './boot';
import * as express from 'express';
import * as request from 'request-promise-native';
import {ExpressTransport} from '@openmicrostep/aspects.express';
import {ModuleMultiDb} from './config';
import {modules, session} from './server';

async function boot_multidb(app: express.Router, m: ModuleMultiDb) {
  const multidb_cache = new MultiDbCache();
  app.use('/:client_id/:repo_name', express.static(__dirname + "/../../../repository app/"));
  app.use('/:client_id/:repo_name', async function (req, res, next) {
    try {
      req.multidb_configuration = await multidb_cache.configuration(req.params["client_id"], req.params["repo_name"]);
      next!();
    }
    catch (err) {
      res.status(403).send();
    }
  }, api_multidb());
}
modules['multidb'] = boot_multidb;

export class LazyLoad<T> {
  last_resolve_time = 0;
  private _wip = false;
  private _promise: Promise<T> | undefined = undefined;
  constructor(private get_work: () => Promise<T>) {}
  invalidate_if_older_than(time_in_ms: number) {
    if (!this._wip && this.last_resolve_time < time_in_ms)
      this._promise = undefined;
  }
  invalidate() {
    if (!this._wip)
      this._promise = undefined;
  }
  promise() {
    if (!this._promise) {
      this._wip = true;
      this._promise = (async () => {
        try {
          let r = await this.get_work();
          this.last_resolve_time = Date.now();
          return r;
        }
        finally {
          this._wip = false;
        }
      })();
    }
    return this._promise;
  }
}

export type MultiDbConfig = { creator: CreateContext };
export class MultiDbCache {
  static readonly cache_time = 10 * 60 * 1000; // 10 min
  _configurations = new Map<string, LazyLoad<MultiDbConfig>>();
  async configuration(client_id: string, repo_name: string) : Promise<MultiDbConfig> {
    let cfg = this._configurations.get(client_id);
    if (!cfg)
      this._configurations.set(client_id, cfg = new LazyLoad(async () => {
        let res = JSON.parse(await request(config_url + client_id));
        let repositories = res && res.generals && res.generals.repositories;
        let storages = res && res.generals && res.generals.storages;
        let repo_config = repositories && repositories[repo_name];
        let db = storages && repo_config && storages[repo_config.storage];
        if (!repo_config || !db || db["type"] !== "postgresql")
          return Promise.reject(`no repository configuration found`);
        const pg = require('pg');
        pg.types.setTypeParser(20, val => parseInt(val)); // BIGINT as number not string
        const connector = PostgresDBConnectorFactory(pg, db, { max: 4 });
        let creator = await boot(connector);
        return { creator: creator };
      }));
    cfg.invalidate_if_older_than(Date.now() - MultiDbCache.cache_time);
    return cfg.promise();
  }
}

declare module "express-serve-static-core" {
  export namespace Express {
    export interface Request {
      multidb_configuration: MultiDbConfig | undefined;
      session: any;
    }
  }
}

export function api_multidb() : express.Router {
  let router = express.Router();
  router.use(session);
  let transport = new ExpressTransport(router, async (cstor, id, req) => {
    const { session, db } = req.multidb_configuration!.creator();
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
