'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const r = Router();
r.post('/register', ctrl.register);
r.post('/login',    ctrl.login);
r.get('/me', auth,  ctrl.getMe);
module.exports = r;
