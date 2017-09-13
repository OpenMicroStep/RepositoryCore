import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, DataSourceQuery} from '@openmicrostep/aspects';
import {SqliteDBConnectorFactory, SqlDataSource} from '@openmicrostep/aspects.sql';
import {ObiDataSource, OuiDB, StdDefinition, ObiDefinition} from '@openmicrostep/aspects.obi';
import {Parser, Reporter} from '@openmicrostep/msbuildsystem.shared';
import * as express from 'express';
import {repositoryV2Definition} from './repository-v2-def';
import {api_v1} from './api-v1';
import {api_v2} from './api-v2';
import {api_aspect} from './api-aspect';
import {api_xnet} from '../../xnet/src/api-xnet';
import {importCity} from '../../xnet/src/import';
import {controlCenterCreator, printClassesMd, buildMaps} from './classes';
import './session';
var sqlite3 = require('sqlite3').verbose();
require('source-map-support').install();


let trace = false;
async function boot() {
  const sqlite3 = require('sqlite3').verbose();
  const connector = SqliteDBConnectorFactory(sqlite3, {
    filename: "repository.sqlite",
    trace: sql => trace && console.info(sql),
  }, { max: 1 });
  let version = 0;
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_ID`  (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_INT` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_STR` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` varchar(144) NOT NULL, PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  const ouiDb = new OuiDB(connector);
  const creator = controlCenterCreator(ouiDb);
  try {
    let rows = await connector.select({ sql: 'SELECT COUNT(*) nb FROM TJ_VAL_ID', bind: [] });
    if (rows[0]['nb'] === 0)
      throw "empty";
    console.info("Loading Repository...");
    await ouiDb.loadSystemObis();
    buildMaps(ouiDb);
  }
  catch(e) {
    console.info("Creating Initial Repository...");
    const reporter = new Reporter();
    const obis_std = ouiDb.parseObis(new Parser(reporter, StdDefinition));
    if (reporter.diagnostics.length > 0)
      return Promise.reject(reporter.diagnostics);
    await ouiDb.injectObis(obis_std);
    await ouiDb.loadSystemObis();

    const obis_v2 = ouiDb.parseObis(new Parser(reporter, repositoryV2Definition));
    if (reporter.diagnostics.length > 0)
      return Promise.reject(reporter.diagnostics);
    await ouiDb.injectObis(obis_v2);
    await ouiDb.loadSystemObis();
    buildMaps(ouiDb);

    console.info("Inserting initial objects...");
    let {cc, db, classes} = creator();

    let p = new classes.R_Person();
    p._first_name = "Admin";
    p._last_name = "Admin";
    let a = new classes.R_AuthenticationPWD();
    a._mlogin = "admin";
    a._password = "admin";
    p._r_authentication = new Set([a]);

    let s = new classes.R_Service();
    s._label = "Service Racine"
    s._r_administrator = new Set([p]);
    let invs = await db.farPromise("safeSave", [a, p, s]);
    if (invs.hasDiagnostics())
      return Promise.reject(invs.diagnostics());
  }
  if (0) printClassesMd(ouiDb);
  console.info("Repository is ready");

  if (0) {
    let {cc, db, classes} = creator();
    let contexts = importCity(classes, 'std');
    let invs = await db.farPromise("safeSave", contexts);
    if (invs.hasDiagnostics())
      return Promise.reject(invs.diagnostics());
  }
  trace = true;

  const app = express();
  //app.use('/api/v1', api_v1(creator));
  //app.use('/api/v2', api_v2(creator));
  app.use('/', api_aspect(creator));
  app.listen(8080);
}

boot().catch(err => {
  console.error(err)
  process.exit(1);
});
