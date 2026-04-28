'use strict';
require('dotenv').config();

const WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000;
const MAX    = parseInt(process.env.RATE_LIMIT_MAX)        || 100;
const map    = new Map();

const rateLimiter = (req, res, next) => {
  const ip  = req.ip || 'unknown';
  const now = Date.now();

  if (!map.has(ip) || now > map.get(ip).resetTime) {
    map.set(ip, { count: 1, resetTime: now + WINDOW });
    return next();
  }
  const rec = map.get(ip);
  if (rec.count >= MAX) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((rec.resetTime - now) / 1000),
    });
  }
  rec.count++;
  next();
};

module.exports = rateLimiter;
