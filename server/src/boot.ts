import {DBConnector} from '@openmicrostep/aspects.sql';
import {OuiDB, StdDefinition} from '@openmicrostep/aspects.obi';
import {Parser, Reporter} from '@openmicrostep/msbuildsystem.shared';
import {controlCenterCreator, buildMaps} from './classes';
import {repositoryV2Definition} from './repository-v2-def';
import * as Classes from './classes';

export async function boot(connector: DBConnector) {
  const ouiDb = new OuiDB(connector);
  let rows = await connector.select(connector.maker.select(
    [connector.maker.column_alias("COUNT(*)", "nb")],
    connector.maker.from("TJ_VAL_ID"),
    [],
  ));
  let must_insert_initial_objects = +rows[0]['nb'] === 0;
  if (must_insert_initial_objects) {
    console.info("Creating Initial Repository...");
    const reporter = new Reporter();
    const obis_std = ouiDb.parseObis(new Parser(reporter, StdDefinition));
    if (reporter.diagnostics.length > 0)
      return Promise.reject(reporter.diagnostics);
    await ouiDb.injectObis(obis_std);
    await ouiDb.loadSystemObis();

    const obis_repo = ouiDb.parseObis(new Parser(reporter, repositoryV2Definition));
    if (reporter.diagnostics.length > 0)
      return Promise.reject(reporter.diagnostics);
    await ouiDb.injectObis(obis_repo);
  }

  console.info("Loading Repository...");
  await ouiDb.loadSystemObis();
  buildMaps(ouiDb);

  const creator = controlCenterCreator(ouiDb);
  if (must_insert_initial_objects) {
    console.info("Inserting initial objects...");
    let {cc, db, session} = creator();
    await cc.safe(async ccc => {
      session.setData({
        is_super_admin: true,
      });

      let actions = await ccc.farPromise(db.safeQuery, {
        name: "actions",
        where: { $instanceOf: "R_Element", _system_name: { $in: ["r_superuse"] } },
        scope: ['_system_name', '_order'],
      });
      let r_superuse = actions.value()["actions"][0] as Classes.R_Element;

      console.info("Creating administration entities...");
      let p = Classes.R_Person.create(ccc);
      p._first_name = "Admin";
      p._last_name = "Admin";

      let p_admin = Classes.R_Service.create(ccc);
      p_admin._label = "Administrateurs d'utilisateurs";
      p_admin._r_administrator = new Set([p]);
      p_admin._r_member = new Set([p]);

      let a_admin = Classes.R_AppTree.create(ccc);
      a_admin._label = "Administrateurs d'applications";
      a_admin._r_administrator = new Set([p]);

      let r_admin = Classes.R_DeviceTree.create(ccc);
      r_admin._label = "Administrateurs de resources";
      r_admin._r_administrator = new Set([p]);

      let s_repo = Classes.R_Software_Context.create(ccc);
      s_repo._urn = "repository-superadmin";
      s_repo._label = "Super administrateurs de l'annuaire";

      let a_repo = Classes.R_Application.create(ccc);
      a_repo._label = "Annuaire";
      a_repo._urn = "repository";
      a_repo._r_software_context = s_repo;

      let right_superadmin = Classes.R_Right.create(ccc);
      right_superadmin._label = "Super administrateurs de l'annuaire";
      right_superadmin._r_action = r_superuse;
      right_superadmin._r_application = a_repo;
      right_superadmin._r_software_context = s_repo;

      let auth_repo = Classes.R_Authorization.create(ccc);
      auth_repo._label = "Super administrateurs de l'annuaire";
      auth_repo._r_authenticable = new Set([p]);
      auth_repo._r_sub_right = new Set([right_superadmin]);

      let a = Classes.R_AuthenticationPWD.create(ccc);
      a._mlogin = "admin";
      a._hashed_password = "admin";
      p._r_authentication = new Set([a]);

      let res = await ccc.farPromise(db.safeSave, [
        a, p, p_admin, a_admin, r_admin,
        s_repo, a_repo, right_superadmin, auth_repo,
      ]);
      if (res.hasDiagnostics())
        return Promise.reject(res.diagnostics());
    });
  }
  return creator;
}
