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
  const multidb_cache = new MultiDbCache(m.resolve_customer_uuid_url);
  console.info(__dirname + "/../../../repository app/");
  app.use('/:client_id/:repo_name', express.static(__dirname + "/../../../repository app/"));
  app.use('/:client_id/:repo_name', async function (req, res, next) {
    try {
      req.multidb_configuration = await multidb_cache.configuration(req.params["client_id"], req.params["repo_name"]);
      req.multidb_configuration.session(req, res, next);
    }
    catch (err) {
      console.info(`client_id: ${req.params["client_id"]}, repo_name: ${req.params["repo_name"]}`, err);
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

export type MultiDbConfig = { creator: CreateContext, client_id: string, repo_name: string, session: express.RequestHandler };
export class MultiDbCache {
  static readonly cache_time = 10 * 60 * 1000; // 10 min
  _configurations = new Map<string, LazyLoad<MultiDbConfig>>();
  constructor(private _resolve_customer_uuid_url: string) {}
  async configuration(client_id: string, repo_name: string) : Promise<MultiDbConfig> {
    let cfg = this._configurations.get(client_id);
    if (!cfg)
      this._configurations.set(client_id, cfg = new LazyLoad(async () => {
        let res = JSON.parse(await request(this._resolve_customer_uuid_url + client_id));
        let repositories = res && res.generals && res.generals.repositories;
        let storages = res && res.generals && res.generals.storages;
        let repo_config = repositories && repositories[repo_name.toUpperCase()];
        let db = storages && repo_config && storages[repo_config.storage];
        if (!repo_config || !db || db["type"] !== "postgresql")
          return Promise.reject(`no repository configuration found`);
        const pg = require('pg');
        pg.types.setTypeParser(20, val => parseInt(val)); // BIGINT as number not string
        const connector = PostgresDBConnectorFactory(pg, db, { max: 4 });
        await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS "TJ_VAL_ID"  ("VAL_INST" BIGINT NOT NULL, "VAL_CAR" BIGINT NOT NULL, "VAL" BIGINT NOT NULL  , PRIMARY KEY ("VAL_INST","VAL_CAR","VAL"))', bind: []})
        await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS "TJ_VAL_INT" ("VAL_INST" BIGINT NOT NULL, "VAL_CAR" BIGINT NOT NULL, "VAL" BIGINT NOT NULL  , PRIMARY KEY ("VAL_INST","VAL_CAR","VAL"))', bind: []})
        await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS "TJ_VAL_STR" ("VAL_INST" BIGINT NOT NULL, "VAL_CAR" BIGINT NOT NULL, "VAL" TEXT NOT NULL, PRIMARY KEY ("VAL_INST","VAL_CAR","VAL"))', bind: []})
        let creator = await boot(connector);
        return { creator: creator, client_id: client_id, repo_name: repo_name, session: session(`/${client_id}/`) };
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
  let transport = new ExpressTransport(router, async (cstor, id, req) => {
    const { session, db } = req.multidb_configuration!.creator();
    if (req.session.client_id !== req.multidb_configuration!.client_id) {
      req.session.rights = {};
      req.session.is_admin = false;
      req.session.is_authenticated = false;
    }
    req.session.client_id = req.multidb_configuration!.client_id;
    session.setData(req.session);
    db.setQueries(queries);
    if (id === 'session')
      return Promise.resolve(session);
    if (session.data().is_authenticated === true) {
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
