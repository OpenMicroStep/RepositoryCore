import {CreateCenterCreator} from './classes';
import * as express from 'express';
import * as express_s from 'express-serve-static-core';
const session = require('express-session');

export function api_v2(creator: CreateCenterCreator) : express.Router {
  let r = express.Router();
  r.get('/query', (req, res) => {

  });
  r.get('/save', (req, res) => {
    
  });
  return r;
}