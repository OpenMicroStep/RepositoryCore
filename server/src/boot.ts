import {DataSourceInternal} from '@openmicrostep/aspects';
import {DBConnector} from '@openmicrostep/aspects.sql';
import {OuiDB, StdDefinition} from '@openmicrostep/aspects.obi';
import {Parser, Reporter} from '@openmicrostep/msbuildsystem.shared';
import {controlCenterCreator, buildMaps} from './classes';
import {repositoryV2Definition} from './repository-v2-def';
import * as Classes from './classes';
import ConstraintType = DataSourceInternal.ConstraintType;
export async function boot(connector: DBConnector) {
  const ouiDb = new OuiDB(connector);
  let maker = connector.maker;
  let rows = await connector.select(maker.select(
    [maker.column("TJ_VAL_INT", "VAL", "repository_version")],
    maker.from("TJ_VAL_INT"), [],
    maker.and([
      maker.op(maker.column("TJ_VAL_INT", "VAL_INST"), ConstraintType.Equal, 9020), // repository version
      maker.op(maker.column("TJ_VAL_INT", "VAL_CAR"), ConstraintType.Equal, 521),
    ]),
  ));
  let repository_version = rows[0] ? rows[0]["repository_version"] : 0;
  if (repository_version === 0) {
    console.info("Creating Initial Repository...");
    const reporter = new Reporter();
    const obis_repo = ouiDb.parseObis(new Parser(reporter, repositoryV2Definition));
    if (reporter.diagnostics.length > 0)
      return Promise.reject(reporter.diagnostics);
    await ouiDb.injectObis(obis_repo);
  }
  else if (repository_version === 1) {
    console.info("Upgrading Repository v1 -> v2");
    console.info("Fixing v1 logic");
    {
      let tr = await connector.transaction();
      await tr.update(maker.update(
        "TJ_VAL_ID",
        [maker.set("VAL_INST", 10030)],
        maker.and([
          maker.op(maker.column("TJ_VAL_ID", "VAL_INST"), ConstraintType.Equal, 11753),
          maker.or([
            maker.op(maker.column("TJ_VAL_ID", "VAL_CAR"), ConstraintType.Equal, 155),
            maker.op(maker.column("TJ_VAL_ID", "VAL"), ConstraintType.Equal, 15),
          ]),
        ]),
      ));
      await tr.update(maker.update(
        "TJ_VAL_ID",
        [maker.set("VAL", 10030)],
        maker.and([
          maker.op(maker.column("TJ_VAL_ID", "VAL_INST"), ConstraintType.Equal, 11753),
          maker.op(maker.column("TJ_VAL_ID", "VAL"), ConstraintType.Equal, 11753),
        ]),
      ));
      await tr.update(maker.update(
        "TJ_VAL_STR",
        [maker.set("VAL_INST", 10030)],
        maker.and([
          maker.op(maker.column("TJ_VAL_STR", "VAL_INST"), ConstraintType.Equal, 11753),
          maker.op(maker.column("TJ_VAL_STR", "VAL"), ConstraintType.Equal, "the r_actions"),
        ]),
      ));
      console.info("Deleting v1 definition (< 19000)");
      await tr.delete(maker.delete("TJ_VAL_ID", maker.and([
        maker.op(maker.column("TJ_VAL_ID", "VAL_INST"), ConstraintType.LessThan, 19000),
      ])));
      await tr.delete(maker.delete("TJ_VAL_INT", maker.and([
        maker.op(maker.column("TJ_VAL_INT", "VAL_INST"), ConstraintType.LessThan, 19000),
        maker.op_bind(maker.and([
          maker.op(maker.column("TJ_VAL_INT", "VAL_INST"), ConstraintType.Equal, 9020),
          maker.op(maker.column("TJ_VAL_INT", "VAL_CAR" ), ConstraintType.Equal, 521),
        ]), ConstraintType.Equal, false)
      ])));
      await tr.delete(maker.delete("TJ_VAL_STR", maker.and([
        maker.op(maker.column("TJ_VAL_STR", "VAL_INST"), ConstraintType.LessThan, 19000),
      ])));
      await tr.commit();
    }

    console.info("Inserting v2 definition");
    {
      const reporter = new Reporter();
      const obis_repo = ouiDb.parseObis(new Parser(reporter, repositoryV2Definition));
      if (reporter.diagnostics.length > 0)
        return Promise.reject(reporter.diagnostics);
      await ouiDb.injectObis(obis_repo);
      await ouiDb.loadSystemObis();
    }

    console.info("Migrating data");
    {
      const tr = await connector.transaction();

      console.info("adding version attribute");
      {
        let rows = await tr.select(maker.select(
          [maker.column("I", "VAL_INST")],
          maker.from("TJ_VAL_ID", "I"), [
            maker.join("left", "TJ_VAL_INT", "V", maker.and([
              maker.compare(maker.column("I", "VAL_INST"), ConstraintType.Equal, maker.column("V", "VAL_INST")),
              maker.op(maker.column("V", "VAL_CAR"), ConstraintType.Equal, 302), // version
            ]))
          ],
          maker.and([
            maker.op(maker.column("I", "VAL_INST"), ConstraintType.GreaterThanOrEqual, 19000),
            maker.op(maker.column("V", "VAL"), ConstraintType.Equal, null),
          ]),
        )) as { VAL_INST: number }[];
        for (let { VAL_INST } of rows) {
          console.info("adding version attribute to:", VAL_INST);
          await ouiDb.raw_insert(tr, "INT", VAL_INST, 302, 1);
        }
      }

      {
        const car_entity = 101;
        const car_urn = 301;
        const car_label = 232;
        const car_login = 321;
        const car_mlogin = 322;
        const car_hashed_password = 323;
        const car_public_key = 331;
        const car_private_key = 333;
        const car_ciphered_private_key = 335;
        const car_parameter = 501;
        const car_string = 511;
        const car_r_authentication = 10020;
        const car_r_matricule = 10545;
        const ent_R_Person = 10101;
        const ent_R_AuthenticationPWD = 13801;
        const ent_R_AuthenticationPK = 13701;
        const ent_Parameter = 25;

        console.info("migrate r_matricule to R_Person.parameter");
        {
          let matricules = await tr.select(maker.select(
            [maker.column("S", "VAL_INST", "_id"), maker.column("S", "VAL", "matricule")],
            maker.from("TJ_VAL_STR", "S"), [],
            maker.op(maker.column("S", "VAL_CAR"), ConstraintType.Equal, car_r_matricule),
          )) as { _id: number, matricule: string }[];
          for (let { _id, matricule } of matricules) {
            console.info(`moving r_matricule for: ${_id} matricule=${matricule}`);
            let p_id = await ouiDb.nextObiId(tr);
            await ouiDb.raw_insert(tr, "ID", p_id, car_entity, ent_Parameter);
            await ouiDb.raw_insert(tr, "STR", p_id, car_label, "matricule");
            await ouiDb.raw_insert(tr, "STR", p_id, car_string, matricule);
            await ouiDb.raw_insert(tr, "ID", _id, car_parameter, p_id);
            await ouiDb.raw_delete(tr, "STR", _id, car_r_matricule, matricule);
          }
        }

        console.info("login/hashed_password/public_key/private_key/ciphered_private_key to R_AuthenticationPWD/R_AuthenticationPK");
        {
          function join_car(table, from, to, car) {
            return maker.join("left", table, to, maker.and([
              maker.compare(maker.column(from, "VAL_INST"), ConstraintType.Equal, maker.column(to, "VAL_INST")),
              maker.op(maker.column(to, "VAL_CAR"), ConstraintType.Equal, car),
            ]));
          }
          let persons = await tr.select(maker.select(
            [
              maker.column("P", "VAL_INST", "_id"),
              maker.column("U", "VAL", "urn"),
              maker.column("L", "VAL", "login"),
              maker.column("HP", "VAL", "hashed_password"),
              maker.column("PK", "VAL", "public_key"),
              maker.column("SK", "VAL", "private_key"),
              maker.column("CSK", "VAL", "ciphered_private_key"),
            ],
            maker.from("TJ_VAL_ID", "P"), [
              join_car("TJ_VAL_STR", "P", "U", car_urn),
              join_car("TJ_VAL_STR", "P", "L", car_login),
              join_car("TJ_VAL_STR", "P", "HP", car_hashed_password),
              join_car("TJ_VAL_STR", "P", "PK", car_public_key),
              join_car("TJ_VAL_STR", "P", "SK", car_private_key),
              join_car("TJ_VAL_STR", "P", "CSK", car_ciphered_private_key),
            ],
            maker.and([
              maker.op(maker.column("P", "VAL_CAR"), ConstraintType.Equal, car_entity),
              maker.op(maker.column("P", "VAL"), ConstraintType.Equal, ent_R_Person),
            ])
          )) as { _id: number, urn: string, login: string, hashed_password: string, public_key: string, private_key: string, ciphered_private_key: string }[];
          for (let { _id, urn, login, hashed_password, public_key, private_key, ciphered_private_key } of persons) {
            console.info(`moving r_authentication for: ${_id} urn=${urn}, login=${login}, hashed_password=${hashed_password && hashed_password.length}, public_key=${public_key && public_key.length}, private_key=${private_key && private_key.length}, ciphered_private_key=${ciphered_private_key && ciphered_private_key.length}`);
            if (login && hashed_password) {
              let a_id = await ouiDb.nextObiId(tr);
              await ouiDb.raw_insert(tr, "ID", a_id, car_entity, ent_R_AuthenticationPWD);
              await ouiDb.raw_insert(tr, "STR", a_id, car_mlogin, login);
              await ouiDb.raw_insert(tr, "STR", a_id, car_hashed_password, hashed_password);
              await ouiDb.raw_insert(tr, "ID", _id, car_r_authentication, a_id);
            }
            if (urn && public_key) {
              let a_id = await ouiDb.nextObiId(tr);
              await ouiDb.raw_insert(tr, "ID", a_id, car_entity, ent_R_AuthenticationPK);
              await ouiDb.raw_insert(tr, "STR", a_id, car_mlogin, urn);
              await ouiDb.raw_insert(tr, "STR", a_id, car_public_key, public_key);
              if (private_key)
                await ouiDb.raw_insert(tr, "STR", a_id, car_private_key, private_key);
              if (ciphered_private_key)
                await ouiDb.raw_insert(tr, "STR", a_id, car_ciphered_private_key, ciphered_private_key);
              await ouiDb.raw_insert(tr, "ID", _id, car_r_authentication, a_id);
              if (urn !== login)
                await ouiDb.raw_insert(tr, "STR", _id, car_login, urn);
            }
          }
        }

        console.info("Migrate super admin rights")
        {

        }

        await tr.update(maker.update(
          "TJ_VAL_INT",
          [maker.set("VAL", 2)],
          maker.and([
            maker.op(maker.column("TJ_VAL_INT", "VAL_INST"), ConstraintType.NotEqual, 9020),
            maker.op(maker.column("TJ_VAL_INT", "VAL_CAR" ), ConstraintType.NotEqual, 521),
          ]),
        ));
      }

      console.info("set repository version to 2");
      {
        await tr.update(maker.update(
          "TJ_VAL_INT",
          [maker.set("VAL", 2)],
          maker.and([
            maker.op(maker.column("TJ_VAL_INT", "VAL_INST"), ConstraintType.NotEqual, 9020),
            maker.op(maker.column("TJ_VAL_INT", "VAL_CAR" ), ConstraintType.NotEqual, 521),
          ]),
        ));
      }

      console.info("commit");
      await tr.commit();
    }
    console.info("Upgrade done");
  }

  console.info("Loading Repository...");
  await ouiDb.loadSystemObis();
  buildMaps(ouiDb);

  const creator = controlCenterCreator(ouiDb);
  if (repository_version === 0) {
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
  console.info("Repository loaded");
  return creator;
}
