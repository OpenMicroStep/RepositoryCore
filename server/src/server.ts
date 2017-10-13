require('source-map-support').install();
import * as express from 'express';
import {config} from './config';

export const modules: { [s: string]: (app: express.Router, module_cfg: any) => Promise<void> } = {};
export const session: express.RequestHandler = (function() {
  if (config.session.type === "mongo") {
    const session = require('express-session');
    const MongoStore = require('connect-mongo')(session);
    return session({
      saveUninitialized: true,
      store: new MongoStore({ url: config.session.url, mongoOptions: config.session.options }),
      secret: config.session.secret,
      resave: true,
    });
  }
  throw new Error(`unsupported session type ${config.session.type}`);
})();
import './api-multidb';
import './api-aspect';

/*
async function boot_sqlite() {
  const sqlite3 = require('sqlite3').verbose();
  const connector = SqliteDBConnectorFactory(sqlite3, {
    filename: ":memory:",
    // filename: "repository.sqlite",
    trace: sql => trace && console.info(sql),
  }, { max: 1 });
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_ID`  (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_INT` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_STR` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` varchar(144) NOT NULL, PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  const creator = await boot(connector);
  const app = express();
  app.use('/api/v1', api_v1(creator));
}*/

(async function boot() {
  console.info(`Starting repository...`);
  const app = express();
  for (let m of config.modules) {
    let boot_m = modules[m.type];
    if (!boot_m)
      console.error(`module ${m} not found`);
    else {
      let router = express.Router();
      await boot_m(app, m);
      if (m["path"])
        app.use(m["path"], router);
      console.info(`module ${m.type} initialized`);
    }
  }
  app.listen(config.port);
  console.info(`Repository started`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
