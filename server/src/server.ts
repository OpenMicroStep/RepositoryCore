require('source-map-support').install();
import * as express from 'express';
import {config} from './config';

export const modules: { [s: string]: (app: express.Router, module_cfg: any) => Promise<void> } = {};
export function session(path = '/') : express.RequestHandler {
  if (config.session.type === "mongo") {
    const session = require('express-session');
    const MongoStore = require('connect-mongo')(session);
    return session({
      cookie: { path: path },
      saveUninitialized: true,
      store: new MongoStore({ url: config.session.url, mongoOptions: config.session.options }),
      secret: config.session.secret,
      resave: true,
    });
  }
  else if (config.session.type === "memory") {
    const session = require('express-session');
    return session({
      cookie: { path: path },
      saveUninitialized: true,
      secret: config.session.secret,
      resave: true,
    });
  }
  throw new Error(`unsupported session type ${config.session.type}`);
}
import './api-multidb';
import './api-aspect';

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
