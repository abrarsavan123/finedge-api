'use strict';
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('./errors');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'finedge_default_secret';

const generateToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '7d' });

const verifyToken = (token) => {
  try { return jwt.verify(token, SECRET); }
  catch { throw new UnauthorizedError('Invalid or expired token'); }
};

module.exports = { generateToken, verifyToken };
