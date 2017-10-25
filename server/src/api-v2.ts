import {CreateContext} from './classes';
import * as express from 'express';
import {ExpressTransport} from '@openmicrostep/aspects.express';
const session = require('express-session');

export function api_v2(creator: CreateContext) : express.Router {
  let r = express.Router();
  r.get('/query', (req, res) => {

  });
  r.get('/save', (req, res) => {

  });
  return r;
}
