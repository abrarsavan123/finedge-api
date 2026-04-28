'use strict';
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const logger      = require('./src/middleware/logger');
const rateLimiter = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(logger);
app.use(rateLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({
    success: true,
    message: 'FinEdge API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/users',        require('./src/routes/userRoutes'));
app.use('/transactions', require('./src/routes/transactionRoutes'));
app.use('/budgets',      require('./src/routes/budgetRoutes'));
app.use('/summary',      require('./src/routes/summaryRoutes'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, error: 'Route not found' })
);

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('');
    console.log('  🚀  FinEdge API  →  http://localhost:' + PORT);
    console.log('  ❤️   Health      →  http://localhost:' + PORT + '/health');
    console.log('');
  });
}

module.exports = app;
