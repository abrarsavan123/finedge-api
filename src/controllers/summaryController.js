'use strict';
const summaryService = require('../services/summaryService');
const cache          = require('../middleware/cache');
require('dotenv').config();

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

const getSummary = async (req, res, next) => {
  try {
    const userId   = req.user.id;
    const cacheKey = 'summary_' + userId + '_' + JSON.stringify(req.query);
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });
    const summary  = await summaryService.getSummary(userId, req.query);
    cache.set(cacheKey, summary, CACHE_TTL);
    res.json({ success: true, data: summary, cached: false });
  } catch (e) { next(e); }
};

module.exports = { getSummary };
