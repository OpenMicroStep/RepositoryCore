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
import {api_v1} from './api-v1';
import {api_v2} from './api-v2';
import {clearSession} from './session';

async function boot_multidb(app: express.Router, m: ModuleMultiDb) {
  const multidb_cache = new MultiDbCache(m);
  console.info(__dirname + "/../../../repository app/");
  let api_v1_r = express.Router();
  api_v1_r.use('/v1', api_v1());
  api_v1_r.use('/v2', api_v2());
  app.use('/:client_id/:repo_name', express.static(__dirname + "/../../../repository app/"));
  app.use('/:client_id/:repo_name', async function (req, res, next) {
    try {
      req.multidb_configuration = await multidb_cache.configuration(req.params["client_id"], req.params["repo_name"]);
      req.multidb_configuration.session(req, res, next);
    }
    catch (err) {
      console.info(`client_id: ${req.params["client_id"]}, repo_name: ${req.params["repo_name"]}`, (err && err.message) || err);
      res.status(403).send();
    }
  }, api_multidb(), api_v1_r);
}
modules['multidb'] = boot_multidb;

function has_timedout(start_time: number, timeout: number) {
  return start_time === 0 || start_time + timeout < Date.now();
}

export class LazyLoad<T> {
  static readonly work_timeout = 60 * 1000; // 60s timeout
  last_resolve_time = 0;
  private _work_start_time = 0;
  private _work_id = {};
  private _destroy: () => void = () => {};
  private _promise: Promise<T> | undefined = undefined;
  constructor(private create: () => Promise<{ data: T, destroy(): void }>) {

  }
  invalidate_if_older_than(time_in_ms: number) {
    if (this.last_resolve_time < time_in_ms)
      this.invalidate();
  }
  invalidate() {
    if (has_timedout(this._work_start_time, LazyLoad.work_timeout)) {
      this._destroy();
      this._destroy = () => {};
      this._promise = undefined;
      this._work_id = {};
    }
  }
  promise(label = "") {
    if (!this._promise) {
      this._work_start_time = Date.now();
      let work_id = this._work_id = {};
      this._promise = (async () => {
        try {
          console.info(`lazy load ${label} start`);
          let r = await this.create();
          if (work_id !== this._work_id) {
            console.info(`lazy load ${label} timedout`);
            r.destroy();
          }
          else {
            this.last_resolve_time = Date.now();
            this._work_start_time = 0;
            this._destroy = r.destroy;
            console.info(`lazy load ${label} done`);
          }
          return r.data;
        }
        catch (e) {
          this._work_start_time = 0;
          console.warn(`lazy load ${label} error`, e);
          throw e;
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
  constructor(private _m: ModuleMultiDb) {}
  async configuration(client_id: string, repo_name: string) : Promise<MultiDbConfig> {
    let cfg = this._configurations.get(client_id);
    if (!cfg) {
      this._configurations.set(client_id, cfg = new LazyLoad(async () => {
        console.info(`lazy load ${client_id}/${repo_name}: begin`);
        let url = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(client_id)
          ? this._m.resolve_customer_uuid_url + client_id
          : this._m.resolve_customer_name_url + client_id;
        let res = JSON.parse(await request(url));
        console.info(`lazy load ${client_id}/${repo_name}: resolved`);
        let repositories = res && res.generals && res.generals.repositories;
        let storages = res && res.generals && res.generals.storages;
        let repo_config = repositories && repositories[repo_name.toUpperCase()];
        let db = storages && repo_config && storages[repo_config.storage];
        if (!repo_config || !db || db["type"] !== "postgresql")
          return Promise.reject(`no repository configuration found`);
        console.info(`lazy load ${client_id}/${repo_name}: pg`);
        const pg = require('pg');
        pg.types.setTypeParser(20, val => parseInt(val)); // BIGINT as number not string
        const connector = PostgresDBConnectorFactory(pg, { ...db, trace: (sql) => console.info(sql) }, { max: 4 });
        await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS "TJ_VAL_ID"  ("VAL_INST" BIGINT NOT NULL, "VAL_CAR" BIGINT NOT NULL, "VAL" BIGINT NOT NULL  , PRIMARY KEY ("VAL_INST","VAL_CAR","VAL"))', bind: []})
        await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS "TJ_VAL_INT" ("VAL_INST" BIGINT NOT NULL, "VAL_CAR" BIGINT NOT NULL, "VAL" BIGINT NOT NULL  , PRIMARY KEY ("VAL_INST","VAL_CAR","VAL"))', bind: []})
        await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS "TJ_VAL_STR" ("VAL_INST" BIGINT NOT NULL, "VAL_CAR" BIGINT NOT NULL, "VAL" TEXT NOT NULL, PRIMARY KEY ("VAL_INST","VAL_CAR","VAL"))', bind: []})
        console.info(`lazy load ${client_id}/${repo_name}: booting`);
        let creator = await boot(connector);
        console.info(`lazy load ${client_id}/${repo_name}: booted`);
        return {
          data: { creator: creator, client_id: client_id, repo_name: repo_name, session: session(`/${client_id}/`) },
          destroy: () => {
            console.info(`lazy load ${client_id}/${repo_name}: unloaded`);
            connector.close()
          }
        };
      }));
    }
    cfg.invalidate_if_older_than(Date.now() - MultiDbCache.cache_time);
    return cfg.promise(`${client_id}/${repo_name}`);
  }
}

declare module "express-serve-static-core" {
  export namespace Express {
    export interface Request {
      multidb_configuration: MultiDbConfig;
    }
  }
}

export function api_multidb() : express.Router {
  let router = express.Router();
  let transport = new ExpressTransport(router, async (cstor, id, req) => {
    const { session, db } = req.multidb_configuration.creator();
    if (req.session.is_authenticated && req.session.client_id !== req.multidb_configuration.client_id) {
      clearSession(req.session);
      console.info(`bad client_id ${req.session.client_id} !== ${req.multidb_configuration.client_id}`);
    }
    req.session.client_id = req.multidb_configuration.client_id;
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
