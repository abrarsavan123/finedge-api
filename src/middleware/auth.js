'use strict';
const { verifyToken }     = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      throw new UnauthorizedError('Authorization token required');
    req.user = verifyToken(header.split(' ')[1]);
    next();
  } catch (e) { next(e); }
};

module.exports = auth;
