'use strict';
const { Router }    = require('express');
const { getSummary } = require('../controllers/summaryController');
const auth          = require('../middleware/auth');
const r = Router();
r.get('/', auth, getSummary);
module.exports = r;
