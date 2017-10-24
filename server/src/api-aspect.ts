import {DataSource} from '@openmicrostep/aspects';
import {SqliteDBConnectorFactory} from '@openmicrostep/aspects.sql';
import {Session, cfg} from './classes';
import { queries } from './queries';
import * as express from 'express';
import {ExpressTransport} from '@openmicrostep/aspects.express';
import {ModuleMultiDb} from './config';
import {modules, session} from './server';
import { boot } from './boot';

async function boot_singledb(app: express.Router, m: ModuleMultiDb) {
  const sqlite3 = require('sqlite3').verbose();
  const connector = SqliteDBConnectorFactory(sqlite3, {
    filename: "repository.sqlite",
  }, { max: 1 });
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_ID`  (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_INT` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_STR` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` varchar(144) NOT NULL, PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  let creator = await boot(connector);
  app.use(session);
  app.use('/', express.static(__dirname + "/../../../repository app/"));
  let transport = new ExpressTransport(app, async (cstor, id, req) => {
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
}
modules['singledb'] = boot_singledb;

