import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery} from '@openmicrostep/aspects';
import {SqliteDBConnectorFactory, SqlDataSource} from '@openmicrostep/aspects.sql';
import {ObiDataSource, OuiDB, StdDefinition, ObiDefinition} from '@openmicrostep/aspects.obi';
import {Parser, Reporter} from '@openmicrostep/msbuildsystem.shared';
import * as express from 'express';
import {repositoryV2Definition} from './repository-v2-def';
import {api_v1} from './api-v1';
import {api_v2} from './api-v2';
import {api_aspect} from './api-aspect';
import {api_xnet} from '../../xnet/src/api-xnet';
import {controlCenterCreator, printClassesMd} from './classes';
var sqlite3 = require('sqlite3').verbose();
require('source-map-support').install();


let trace = false;
async function boot() {
  const sqlite3 = require('sqlite3').verbose();
  const connector = SqliteDBConnectorFactory(sqlite3, { 
    filename: ":memory:",
    trace: sql => trace && console.info(sql),
  }, { max: 1 });
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_ID`  (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_INT` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` bigint(20) NOT NULL  , PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  await connector.unsafeRun({ sql: 'CREATE TABLE IF NOT EXISTS `TJ_VAL_STR` (`VAL_INST` bigint(20) NOT NULL, `VAL_CAR` bigint(20) NOT NULL, `VAL` varchar(144) NOT NULL, PRIMARY KEY (`VAL_INST`,`VAL_CAR`,`VAL`))', bind: []})
  
  const ouiDb = new OuiDB(connector);
  const reporter = new Reporter();
  const obis_std = ouiDb.parseObis(new Parser(reporter, StdDefinition));
  if (reporter.diagnostics.length > 0)
    return Promise.reject(reporter.diagnostics);
  await ouiDb.injectObis(obis_std);
  await ouiDb.loadSystemObis();
  trace = false;

  const obis_v2 = ouiDb.parseObis(new Parser(reporter, repositoryV2Definition));
  if (reporter.diagnostics.length > 0)
    return Promise.reject(reporter.diagnostics);
  await ouiDb.injectObis(obis_v2);
  await ouiDb.loadSystemObis();

  if (0) printClassesMd(ouiDb);

  const creator = controlCenterCreator(ouiDb);
  let {cc, db, classes} = creator();

  trace = true;
  let p = new classes.R_Person();
  p._first_name = "Admin";
  p._last_name = "Admin";
  let a = new classes.R_AuthenticationPWD();
  a._mlogin = "admin";
  a._password = "admin";
  p._r_authentication = new Set([a]);

  let plms1 = new classes.R_Application();
  plms1._urn = "planitech-1";
  plms1._label = "Planitech #1";
  let sc_1_0 = new classes.R_Software_Context();
  plms1._r_software_context = sc_1_0;
  sc_1_0._label = "Planitech #1 v4.3 Root";
  sc_1_0._urn = "plms-1-v4.3-root";
  sc_1_0._r_parent_context = undefined;
  let sc_1_1 = new classes.R_Software_Context();
  sc_1_1._label = "Planitech #1 v4.3 Agents";
  sc_1_1._urn = "plms-1-v4.3-agents";
  sc_1_1._r_parent_context = sc_1_0;
  let sc_1_2 = new classes.R_Software_Context();
  sc_1_2._label = "Planitech #1 v4.3 Cities";
  sc_1_2._urn = "plms-1-v4.3-cities";
  sc_1_2._r_parent_context = sc_1_0;
  let sc_1_3 = new classes.R_Software_Context();
  sc_1_3._label = "Planitech #1 v4.3 Sub Cities";
  sc_1_3._urn = "plms-1-v4.3-sub-cities";
  sc_1_3._r_parent_context = sc_1_2;
  let sc_1_4 = new classes.R_Software_Context();
  sc_1_4._label = "Planitech #1 v4.3 A1";
  sc_1_4._urn = "plms-1-v4.3-sub-a1";
  sc_1_4._r_parent_context = sc_1_3;
  let sc_1_5 = new classes.R_Software_Context();
  sc_1_5._label = "Planitech #1 v4.3 A2";
  sc_1_5._urn = "plms-1-v4.3-sub-a2";
  sc_1_5._r_parent_context = sc_1_3;

  let plms2 = new classes.R_Application();
  plms2._urn = "planitech-2";
  plms2._label = "Planitech #2";
  let sc_2_0 = new classes.R_Software_Context();
  plms2._r_software_context = sc_2_0;
  sc_2_0._label = "Planitech #2 v4.3 Root";
  sc_2_0._urn = "plms-2-v4.3-root";
  sc_2_0._r_parent_context = undefined;

  let invs = await db.farPromise("safeSave", [
    a, p, 
    plms1, sc_1_0, sc_1_1, sc_1_2, sc_1_3, sc_1_4, sc_1_5,
    plms2, sc_2_0,
  ]);
  if (invs.hasDiagnostics())
    return Promise.reject(invs.diagnostics());
  let invq = await db.farPromise("safeQuery", {
    name: "p",
    where: { $instanceOf: classes.R_AuthenticationPWD, _mlogin: "repository" },
  });
  if (invq.hasDiagnostics())
    return Promise.reject(invq.diagnostics());
  console.info(invq.result());

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
