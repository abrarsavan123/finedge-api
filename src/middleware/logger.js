'use strict';

const logger = (req, res, next) => {
  const start = Date.now();
  const ts    = new Date().toISOString();
  res.on('finish', () => {
    const ms  = Date.now() - start;
    const lvl = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log('[' + ts + '] [' + lvl + '] ' + req.method + ' ' + req.originalUrl + ' ' + res.statusCode + ' ' + ms + 'ms');
  });
  next();
};

module.exports = logger;
