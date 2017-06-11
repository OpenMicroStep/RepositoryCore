import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery} from '@openmicrostep/aspects';
import {SqliteDBConnectorFactory, SqlDataSource} from '@openmicrostep/aspects.sql';
import {ObiDataSource, OuiDB, StdDefinition, ObiDefinition} from '@openmicrostep/aspects.obi';
import {Parser, Reporter} from '@openmicrostep/msbuildsystem.shared';
import * as express from 'express';
import {repositoryV2Definition} from './repository-v2-def';
import {api_v1} from './api-v1';
import {api_v2} from './api-v2';
import {api_aspect} from './api-aspect';
import {controlCenterCreator, printClassesMd} from './classes';
import './bcoding';
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
  let p = new classes.R_Person();
  let a = new classes.R_AuthenticationPWD();
  a._login = "repository";
  a._hashed_password = "1:1000<d3fjmT9+psw=>D6AE70DA5152A6C7CCB1CEFE989CE0790DDC89FD26D96A0B116578E378452C3B59E4A7155CEC53166ED01B7D874568CC9F5F8BE4EEF38E531D5289988CBE0555";
  p._first_name = "Admin";
  p._last_name = "Admin";
  p._r_authentication = new Set([a]);
  let invs = await db.farPromise("safeSave", [a, p]);
  if (invs.hasDiagnostics())
    return Promise.reject(invs.diagnostics());
  let invq = await db.farPromise("safeQuery", {
    name: "p",
    where: { $instanceOf: classes.R_AuthenticationPWD, _login: "repository" },
  });
  if (invq.hasDiagnostics())
    return Promise.reject(invq.diagnostics());
  console.info(invq.result());

  const app = express();
  app.use('/api/v1', api_v1(creator));
  app.use('/api/v2', api_v2(creator));
  app.use('/', api_aspect(creator));
  app.listen(8080);
trace = true;
}

boot().catch(err => {
  console.error(err)
  process.exit(1);
});
