const data = {
  lgtd1: {
    "_id": "00000001-297C-4B75-96F5-DFFBB4D55A0C",
    "name": "Logitud #1 TEST RAPO",
    "versions": {
        "cntsender": {
            "version": "1.1.7",
            "versionChange": "2016-12-22T15:35:50.409Z"
        },
        "lsmobile": {
            "version": "188dceb",
            "versionChange": "2017-03-09T09:59:36.694Z"
        },
        "vehicles": {
            "version": "1.0.4",
            "versionChange": "2016-06-06T13:26:28.028Z"
        },
        "natinfs": {
            "version": "4.19.1",
            "versionChange": "2017-03-09T10:26:08.317Z"
        },
        "villes": {
            "version": "1.0.1",
            "versionChange": "2016-04-20T12:56:24.707Z"
        }
    },
    "security": {
        "repository-server": "GVS",
        "gvs": {
            "common-storage-server": "COMMON-STORAGE",
            "antai-cycle": "COMPLETE",
            "fps-waiting-period": 5760,
            "fps-claim": {
                "storage-server": "SECURITY-STORAGE",
                "signature-book": "SECURITY-SIGN-BOOK",
                "others-parameters": "..."
            },
            "sfps": [
                {
                    "type": "default",
                    "url": "https://fps-dev.logitud.fr/fps_server",
                    "version": "v1",
                    "disabled-date": "",
                    "authentications": {
                        "auth-method": "none"
                    }
                }
            ],
            "abstract-services": {
                "services": [
                    "api-rapo-logitud",
                    "api-controls-fps",
                    "api-location"
                ]
            }
        },
        "fpssync": {
            "active": true
        },
        "gve": {
            "info": "For the future we will transfer HERE the root node GVE"
        }
    },
    "gve": {
        "infos": "test gvs",
        "tickets": {
            "graceminutes": 240,
            "thresholds": [
                {
                    "threshold": 0,
                    "color": "#00FF00"
                },
                {
                    "threshold": 10,
                    "color": "#FF6600"
                },
                {
                    "threshold": 240,
                    "color": "#FF0000"
                }
            ],
            "zones": [
                {
                    "name": "Zone Orange",
                    "color": "#FFA500"
                },
                {
                    "name": "Zone Verte",
                    "color": "#008000"
                },
                {
                    "name": "Zone Verte (TEST 9999)",
                    "color": "#008000"
                },
                {
                    "name": "Zone Jaune",
                    "color": "#FFF168"
                }
            ],
            "services": [
                {
                    "type": "logitud"
                }
            ]
        }
    },
    "generals": {
        "repositories": {
            "GVS": {
                "name": "Annuaire des agents GVS",
                "url": "https://repository:8080",
                "storage": "PG-REPOSITORY-GVS"
            }
        },
        "signature-books": {
            "SECURITY-SIGN-BOOK": {
                "url": "https://services-dev:8085",
                "storage": "COMMON-STORAGE",
                "autorized-domains": [
                    "FPS, RAPO-DECISIONS"
                ]
            }
        },
        "storages": {
            "PG-REPOSITORY-GVS": {
                "is": "storage",
                "type": "postgresql",
                "host": "postgres",
                "database": "00000001-297C-4B75-96F5-DFFBB4D55A0C",
                "user": "repo",
                "password": "nhiFNsfsRMgP4p94kujC",
                "_ssl": {
                    "ca": "PEM Encoded CA",
                    "key": "PEM Encoded Key",
                    "cert": "PEM Encoded Cert"
                }
            },
            "COMMON-STORAGE": {
                "is": "storage",
                "type": "mongodb",
                "host": "services-dev.logitud.fr:XXXX",
                "database": "LOGITUD",
                "user": "logitud",
                "password": "123456"
            },
            "SECURITY-STORAGE": {
                "is": "storage",
                "type": "mongodb",
                "host": "fps-dev.logitud.fr:27017",
                "database": "fps_rapo",
                "user": "fpsrapouser",
                "password": "i2h8GFL7q3Yu"
            }
        }
    },
    "public-identifiers": {
        "name": "Local #1",
        "name-url": "local1",
        "siret": "",
        "insee": ""
    },
    "version": 2
  },
  lgtd4: {
    "_id": "00000004-297C-4B75-96F5-DFFBB4D55A0C",
    "name": "Logitud #4 TEST RAPO",
    "versions": {
        "cntsender": {
            "version": "1.1.7",
            "versionChange": "2016-12-22T15:35:50.409Z"
        },
        "lsmobile": {
            "version": "188dceb",
            "versionChange": "2017-03-09T09:59:36.694Z"
        },
        "vehicles": {
            "version": "1.0.4",
            "versionChange": "2016-06-06T13:26:28.028Z"
        },
        "natinfs": {
            "version": "4.19.1",
            "versionChange": "2017-03-09T10:26:08.317Z"
        },
        "villes": {
            "version": "1.0.1",
            "versionChange": "2016-04-20T12:56:24.707Z"
        }
    },
    "security": {
        "repository-server": "GVS",
        "gvs": {
            "common-storage-server": "COMMON-STORAGE",
            "antai-cycle": "COMPLETE",
            "fps-waiting-period": 5760,
            "fps-claim": {
                "storage-server": "SECURITY-STORAGE",
                "signature-book": "SECURITY-SIGN-BOOK",
                "others-parameters": "..."
            },
            "sfps": [
                {
                    "type": "default",
                    "url": "https://fps-dev.logitud.fr/fps_server",
                    "version": "v1",
                    "disabled-date": "",
                    "authentications": {
                        "auth-method": "none"
                    }
                }
            ],
            "abstract-services": {
                "services": [
                    "api-rapo-logitud",
                    "api-controls-fps",
                    "api-location"
                ]
            }
        },
        "fpssync": {
            "active": true
        },
        "gve": {
            "info": "For the future we will transfer HERE the root node GVE"
        }
    },
    "gve": {
        "infos": "test gvs",
        "tickets": {
            "graceminutes": 240,
            "thresholds": [
                {
                    "threshold": 0,
                    "color": "#00FF00"
                },
                {
                    "threshold": 10,
                    "color": "#FF6600"
                },
                {
                    "threshold": 240,
                    "color": "#FF0000"
                }
            ],
            "zones": [
                {
                    "name": "Zone Orange",
                    "color": "#FFA500"
                },
                {
                    "name": "Zone Verte",
                    "color": "#008000"
                },
                {
                    "name": "Zone Verte (TEST 9999)",
                    "color": "#008000"
                },
                {
                    "name": "Zone Jaune",
                    "color": "#FFF168"
                }
            ],
            "services": [
                {
                    "type": "logitud"
                }
            ]
        }
    },
    "generals": {
        "repositories": {
            "GVS": {
                "name": "Annuaire des agents GVS",
                "url": "https://repository:8080",
                "storage": "PG-REPOSITORY-GVS"
            }
        },
        "signature-books": {
            "SECURITY-SIGN-BOOK": {
                "url": "https://services-dev:8085",
                "storage": "COMMON-STORAGE",
                "autorized-domains": [
                    "FPS, RAPO-DECISIONS"
                ]
            }
        },
        "storages": {
            "PG-REPOSITORY-GVS": {
                "is": "storage",
                "type": "postgresql",
                "host": "postgres",
                "database": "00000004-297C-4B75-96F5-DFFBB4D55A0C",
                "user": "repo",
                "password": "nhiFNsfsRMgP4p94kujC",
                "_ssl": {
                    "ca": "PEM Encoded CA",
                    "key": "PEM Encoded Key",
                    "cert": "PEM Encoded Cert"
                }
            },
            "COMMON-STORAGE": {
                "is": "storage",
                "type": "mongodb",
                "host": "services-dev.logitud.fr:XXXX",
                "database": "LOGITUD",
                "user": "logitud",
                "password": "123456"
            },
            "SECURITY-STORAGE": {
                "is": "storage",
                "type": "mongodb",
                "host": "fps-dev.logitud.fr:27017",
                "database": "fps_rapo",
                "user": "fpsrapouser",
                "password": "i2h8GFL7q3Yu"
            }
        }
    },
    "public-identifiers": {
        "name": "Local #4",
        "name-url": "local4",
        "siret": "",
        "insee": ""
    },
    "version": 2
  },
  lgtd3: {
    "_id": "00000003-297C-4B75-96F5-DFFBB4D55A0C",
    "name": "Logitud #3 TEST RAPO",
    "versions": {
        "cntsender": {
            "version": "1.1.7",
            "versionChange": "2016-12-22T15:35:50.409Z"
        },
        "lsmobile": {
            "version": "188dceb",
            "versionChange": "2017-03-09T09:59:36.694Z"
        },
        "vehicles": {
            "version": "1.0.4",
            "versionChange": "2016-06-06T13:26:28.028Z"
        },
        "natinfs": {
            "version": "4.19.1",
            "versionChange": "2017-03-09T10:26:08.317Z"
        },
        "villes": {
            "version": "1.0.1",
            "versionChange": "2016-04-20T12:56:24.707Z"
        }
    },
    "security": {
        "repository-server": "GVS",
        "gvs": {
            "common-storage-server": "COMMON-STORAGE",
            "antai-cycle": "COMPLETE",
            "fps-waiting-period": 5760,
            "fps-claim": {
                "storage-server": "SECURITY-STORAGE",
                "signature-book": "SECURITY-SIGN-BOOK",
                "others-parameters": "..."
            },
            "sfps": [
                {
                    "type": "default",
                    "url": "https://fps-dev.logitud.fr/fps_server",
                    "version": "v1",
                    "disabled-date": "",
                    "authentications": {
                        "auth-method": "none"
                    }
                }
            ],
            "abstract-services": {
                "services": [
                    "api-rapo-logitud",
                    "api-controls-fps",
                    "api-location"
                ]
            }
        },
        "fpssync": {
            "active": true
        },
        "gve": {
            "info": "For the future we will transfer HERE the root node GVE"
        }
    },
    "gve": {
        "infos": "test gvs",
        "tickets": {
            "graceminutes": 240,
            "thresholds": [
                {
                    "threshold": 0,
                    "color": "#00FF00"
                },
                {
                    "threshold": 10,
                    "color": "#FF6600"
                },
                {
                    "threshold": 240,
                    "color": "#FF0000"
                }
            ],
            "zones": [
                {
                    "name": "Zone Orange",
                    "color": "#FFA500"
                },
                {
                    "name": "Zone Verte",
                    "color": "#008000"
                },
                {
                    "name": "Zone Verte (TEST 9999)",
                    "color": "#008000"
                },
                {
                    "name": "Zone Jaune",
                    "color": "#FFF168"
                }
            ],
            "services": [
                {
                    "type": "logitud"
                }
            ]
        }
    },
    "generals": {
        "repositories": {
            "GVS": {
                "name": "Annuaire des agents GVS #3",
                "url": "https://repository:8080",
                "storage": "PG-REPOSITORY-GVS"
            }
        },
        "signature-books": {
            "SECURITY-SIGN-BOOK": {
                "url": "https://services-dev:8085",
                "storage": "COMMON-STORAGE",
                "autorized-domains": [
                    "FPS, RAPO-DECISIONS"
                ]
            }
        },
        "storages": {
            "PG-REPOSITORY-GVS": {
                "is": "storage",
                "type": "postgresql",
                "host": "postgres",
                "database": "00000003-297C-4B75-96F5-DFFBB4D55A0C",
                "user": "repo",
                "password": "nhiFNsfsRMgP4p94kujC",
                "_ssl": {
                    "ca": "PEM Encoded CA",
                    "key": "PEM Encoded Key",
                    "cert": "PEM Encoded Cert"
                }
            },
            "COMMON-STORAGE": {
                "is": "storage",
                "type": "mongodb",
                "host": "services-dev.logitud.fr:XXXX",
                "database": "LOGITUD",
                "user": "logitud",
                "password": "123456"
            },
            "SECURITY-STORAGE": {
                "is": "storage",
                "type": "mongodb",
                "host": "fps-dev.logitud.fr:27017",
                "database": "fps_rapo",
                "user": "fpsrapouser",
                "password": "i2h8GFL7q3Yu"
            }
        }
    },
    "public-identifiers": {
        "name": "Local #3",
        "name-url": "local3",
        "siret": "",
        "insee": ""
    },
    "version": 2
  },
};

const config = {
  couchdb: {
    url: "http://couchdb:5984/",
    users: "logitud",
  },
  pg: {
    host: "postgres",
    user: "repo",
    database: "repo",
    password: "nhiFNsfsRMgP4p94kujC",
  },
  v1: {
    filename: __dirname + '/v1_plaintext.db'
  },
}

const Async = require('@openmicrostep/async').Async;
const nano = require('nano')(config.couchdb.url);
const nano_users = nano.use(config.couchdb.users);
const pg = new (require('pg').Client)(config.pg);
const v1 = new (require('sqlite3').verbose().Database)(config.v1.filename);

function log_continue(f, what) {
  return function(err) {
    console.info(what, err ? err.message || err : "ok");
    f.continue();
  }
}

function migrate_v1(f, v1, db) {
  const schema = "public";
  const pg = new (require('pg').Client)({ ...config.pg, database: db });
  let sql = `
    DROP TABLE IF EXISTS "${schema}"."TJ_VAL_ID" ;
    DROP TABLE IF EXISTS "${schema}"."TJ_VAL_INT";
    DROP TABLE IF EXISTS "${schema}"."TJ_VAL_STR";
    CREATE TABLE "${schema}"."TJ_VAL_ID" ( "VAL_INST" bigint NOT NULL, "VAL_CAR" bigint NOT NULL, "VAL" bigint NOT NULL, PRIMARY KEY ("VAL_INST","VAL_CAR","VAL") );
    CREATE TABLE "${schema}"."TJ_VAL_INT" ( "VAL_INST" bigint NOT NULL, "VAL_CAR" bigint NOT NULL, "VAL" bigint NOT NULL, PRIMARY KEY ("VAL_INST","VAL_CAR","VAL") );
    CREATE TABLE "${schema}"."TJ_VAL_STR" ( "VAL_INST" bigint NOT NULL, "VAL_CAR" bigint NOT NULL, "VAL" TEXT NOT NULL, PRIMARY KEY ("VAL_INST","VAL_CAR","VAL") );
  `;
  f.setFirstElements([
    f => pg.connect(log_continue(f, `pg connect ${db}`)),
    f => v1.each("SELECT * from TJ_VAL_ID;", function(err, row) {
      if (err) console.info(err);
      sql += `INSERT INTO "${schema}"."TJ_VAL_ID" ("VAL_INST", "VAL_CAR", "VAL") values (${row["VAL_INST"]}, ${row["VAL_CAR"]}, ${row["VAL"]});\n`;
    }, () => f.continue()),
    f => v1.each("SELECT * from TJ_VAL_INT;", function(err, row) {
      if (err) console.info(err);
      sql += `INSERT INTO "${schema}"."TJ_VAL_INT" ("VAL_INST", "VAL_CAR", "VAL") values (${row["VAL_INST"]}, ${row["VAL_CAR"]}, ${row["VAL"]});\n`;
    }, () => f.continue()),
    f => v1.each("SELECT * from TJ_VAL_STR;", function(err, row) {
      if (err) console.info(err);
      sql += `INSERT INTO "${schema}"."TJ_VAL_STR" ("VAL_INST", "VAL_CAR", "VAL") values (${row["VAL_INST"]}, ${row["VAL_CAR"]}, '${row["VAL"].replace('\'','\'\'')}');\n`;
    }, () => f.continue()),
    f => {
      sql += "COMMIT;";
      console.info("inserting...");
      pg.query(sql, [], log_continue(f, "pg fill lgtd1" + sql.length));
    },
    f => { pg.end(); f.continue() },
  ]);
  f.continue();
}

Async.run({}, [
  f => nano_users.insert(data.lgtd1, log_continue(f, "insert lgtd1")),
  f => nano_users.insert(data.lgtd3, log_continue(f, "insert lgtd3")),
  f => nano_users.insert(data.lgtd4, log_continue(f, "insert lgtd4")),
  f => pg.connect(log_continue(f, "pg connect")),
  f => pg.query(`CREATE DATABASE "${data.lgtd1.generals.storages["PG-REPOSITORY-GVS"].database}"`, [], log_continue(f, "pg create lgtd1")),
  f => migrate_v1(f, v1, data.lgtd1.generals.storages["PG-REPOSITORY-GVS"].database),
  f => pg.query(`CREATE DATABASE "${data.lgtd3.generals.storages["PG-REPOSITORY-GVS"].database}"`, [], log_continue(f, "pg create lgtd3")),
  f => pg.query(`CREATE DATABASE "${data.lgtd4.generals.storages["PG-REPOSITORY-GVS"].database}"`, [], log_continue(f, "pg create lgtd4")),
  f => { pg.end(); f.continue() },
]);
