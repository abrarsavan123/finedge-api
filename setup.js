#!/usr/bin/env node
/**
 * FinEdge API – Automated Project Setup
 * Run: node setup.js   (from inside the project folder)
 */

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

function write(filePath, content) {
  const abs = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
  console.log('  ✅  ' + filePath);
}

console.log('\n🔨  Setting up FinEdge API...\n');

// ─── package.json ─────────────────────────────────────────────────────────────
write('package.json', JSON.stringify({
  name: 'finedge-api', version: '1.0.0',
  description: 'FinEdge - Personal Finance & Expense Tracker API',
  main: 'server.js',
  scripts: {
    start: 'node server.js',
    dev: 'nodemon server.js',
    test: 'jest --forceExit --detectOpenHandles'
  },
  keywords: ['finance', 'expense', 'tracker', 'api'],
  author: '', license: 'MIT',
  dependencies: {
    bcryptjs: '^2.4.3', cors: '^2.8.5', dotenv: '^16.3.1',
    express: '^4.18.2', jsonwebtoken: '^9.0.2', uuid: '^9.0.0'
  },
  devDependencies: { jest: '^29.7.0', nodemon: '^3.0.2', supertest: '^6.3.4' },
  jest: { testEnvironment: 'node', testTimeout: 15000 }
}, null, 2));

// ─── .gitignore ────────────────────────────────────────────────────────────────
write('.gitignore', 'node_modules/\n.env\n*.log\ncoverage/\n');

// ─── .env / .env.example ──────────────────────────────────────────────────────
const envContent = [
  'PORT=3000',
  'JWT_SECRET=finedge_secret_key_change_in_production',
  'NODE_ENV=development',
  'DATA_DIR=src/data',
  'RATE_LIMIT_WINDOW_MS=900000',
  'RATE_LIMIT_MAX=100',
  'CACHE_TTL=300',
].join('\n');
write('.env.example', envContent);
write('.env', envContent);

// ─── Data files ───────────────────────────────────────────────────────────────
write('src/data/users.json', '[]\n');
write('src/data/transactions.json', '[]\n');
write('src/data/budgets.json', '[]\n');

// ─── src/utils/errors.js ──────────────────────────────────────────────────────
write('src/utils/errors.js', `'use strict';
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
class ValidationError  extends AppError { constructor(m) { super(m, 400); this.name = 'ValidationError';  } }
class NotFoundError    extends AppError { constructor(m) { super(m || 'Resource not found', 404); this.name = 'NotFoundError';    } }
class UnauthorizedError extends AppError { constructor(m) { super(m || 'Unauthorized', 401); this.name = 'UnauthorizedError'; } }
class ConflictError    extends AppError { constructor(m) { super(m, 409); this.name = 'ConflictError';    } }
class ForbiddenError   extends AppError { constructor(m) { super(m || 'Forbidden', 403); this.name = 'ForbiddenError';   } }
module.exports = { AppError, ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError };
`);

// ─── src/utils/fileStore.js ────────────────────────────────────────────────────
write('src/utils/fileStore.js', `'use strict';
const fs   = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DATA_DIR = process.env.DATA_DIR || 'src/data';
const fp = (entity) => path.join(process.cwd(), DATA_DIR, entity + '.json');

const readData = async (entity) => {
  try {
    return JSON.parse(await fs.readFile(fp(entity), 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
};

const writeData = async (entity, data) => {
  const filePath = fp(entity);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const generateId = () => uuidv4();

module.exports = { readData, writeData, generateId };
`);

// ─── src/utils/jwt.js ─────────────────────────────────────────────────────────
write('src/utils/jwt.js', `'use strict';
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
`);

// ─── src/models/User.js ───────────────────────────────────────────────────────
write('src/models/User.js', `'use strict';
const { generateId } = require('../utils/fileStore');

class User {
  constructor({ name, email, password, preferences = {} }) {
    this.id          = generateId();
    this.name        = name;
    this.email       = email;
    this.password    = password;
    this.preferences = { currency: preferences.currency || 'USD', monthlyBudget: preferences.monthlyBudget || 0 };
    this.createdAt   = new Date().toISOString();
  }
  toJSON() {
    const { password, ...rest } = this; // eslint-disable-line no-unused-vars
    return rest;
  }
}

module.exports = User;
`);

// ─── src/models/Transaction.js ────────────────────────────────────────────────
write('src/models/Transaction.js', `'use strict';
const { generateId } = require('../utils/fileStore');

const VALID_TYPES      = ['income', 'expense'];
const VALID_CATEGORIES = ['food', 'transport', 'utilities', 'entertainment', 'health', 'salary', 'shopping', 'other'];

class Transaction {
  constructor({ userId, type, category, amount, description = '', date }) {
    this.id          = generateId();
    this.userId      = userId;
    this.type        = type;
    this.category    = category;
    this.amount      = parseFloat(amount);
    this.description = description;
    this.date        = date || new Date().toISOString();
    this.createdAt   = new Date().toISOString();
  }
}

module.exports = { Transaction, VALID_TYPES, VALID_CATEGORIES };
`);

// ─── src/models/Budget.js ─────────────────────────────────────────────────────
write('src/models/Budget.js', `'use strict';
const { generateId } = require('../utils/fileStore');

class Budget {
  constructor({ userId, month, monthlyGoal, savingsTarget = 0 }) {
    this.id            = generateId();
    this.userId        = userId;
    this.month         = month;
    this.monthlyGoal   = parseFloat(monthlyGoal);
    this.savingsTarget = parseFloat(savingsTarget);
    this.createdAt     = new Date().toISOString();
  }
}

module.exports = Budget;
`);

// ─── src/middleware/errorHandler.js ───────────────────────────────────────────
write('src/middleware/errorHandler.js', `'use strict';
const { AppError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
};

module.exports = errorHandler;
`);

// ─── src/middleware/logger.js ─────────────────────────────────────────────────
write('src/middleware/logger.js', `'use strict';

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
`);

// ─── src/middleware/validateTransaction.js ────────────────────────────────────
write('src/middleware/validateTransaction.js', `'use strict';
const { ValidationError } = require('../utils/errors');
const { VALID_TYPES, VALID_CATEGORIES } = require('../models/Transaction');

const validateTransaction = (req, res, next) => {
  try {
    const { type, category, amount, date } = req.body;
    if (!type || !VALID_TYPES.includes(type))
      throw new ValidationError('Type must be one of: ' + VALID_TYPES.join(', '));
    const parsed = parseFloat(amount);
    if (amount == null || isNaN(parsed) || parsed <= 0)
      throw new ValidationError('Amount must be a positive number');
    if (!category || !VALID_CATEGORIES.includes(category))
      throw new ValidationError('Category must be one of: ' + VALID_CATEGORIES.join(', '));
    if (date && isNaN(Date.parse(date)))
      throw new ValidationError('Date must be a valid date string');
    next();
  } catch (e) { next(e); }
};

module.exports = validateTransaction;
`);

// ─── src/middleware/rateLimiter.js ────────────────────────────────────────────
write('src/middleware/rateLimiter.js', `'use strict';
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
`);

// ─── src/middleware/cache.js ──────────────────────────────────────────────────
write('src/middleware/cache.js', `'use strict';

class CacheService {
  constructor() { this.store = new Map(); }

  get(key) {
    if (!this.store.has(key)) return null;
    const { value, expiresAt } = this.store.get(key);
    if (Date.now() > expiresAt) { this.store.delete(key); return null; }
    return value;
  }

  set(key, value, ttlSec) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
  }

  invalidate(key) { this.store.delete(key); }

  invalidatePattern(pattern) {
    const re = new RegExp(pattern);
    for (const k of this.store.keys()) if (re.test(k)) this.store.delete(k);
  }

  clear() { this.store.clear(); }
}

module.exports = new CacheService();
`);

// ─── src/middleware/auth.js ───────────────────────────────────────────────────
write('src/middleware/auth.js', `'use strict';
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
`);

// ─── src/services/userService.js ──────────────────────────────────────────────
write('src/services/userService.js', `'use strict';
const bcrypt = require('bcryptjs');
const { readData, writeData } = require('../utils/fileStore');
const User = require('../models/User');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

const ENTITY = 'users';

const createUser = async ({ name, email, password, preferences }) => {
  if (!name || !email || !password)
    throw new ValidationError('Name, email, and password are required');
  const users = await readData(ENTITY);
  if (users.find((u) => u.email === email))
    throw new ConflictError('User with this email already exists');
  const hashed = await bcrypt.hash(password, 10);
  const user   = new User({ name, email, password: hashed, preferences });
  users.push({ ...user, password: hashed });
  await writeData(ENTITY, users);
  return user.toJSON();
};

const findUserById = async (id) => {
  const users = await readData(ENTITY);
  const user  = users.find((u) => u.id === id);
  if (!user) throw new NotFoundError('User not found');
  const { password, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
};

const findUserByEmail = async (email) => {
  const users = await readData(ENTITY);
  return users.find((u) => u.email === email) || null;
};

const getAllUsers = async () => {
  const users = await readData(ENTITY);
  return users.map(({ password, ...u }) => u); // eslint-disable-line no-unused-vars
};

const updateUser = async (id, updates) => {
  const users = await readData(ENTITY);
  const idx   = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new NotFoundError('User not found');
  const { password, id: _id, ...allowed } = updates; // eslint-disable-line no-unused-vars
  users[idx] = { ...users[idx], ...allowed, id };
  await writeData(ENTITY, users);
  const { password: _pw, ...rest } = users[idx]; // eslint-disable-line no-unused-vars
  return rest;
};

const validatePassword = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { createUser, findUserById, findUserByEmail, getAllUsers, updateUser, validatePassword };
`);

// ─── src/services/transactionService.js ──────────────────────────────────────
write('src/services/transactionService.js', `'use strict';
const { readData, writeData } = require('../utils/fileStore');
const { Transaction }         = require('../models/Transaction');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const ENTITY = 'transactions';

const KEYWORDS = {
  food:          ['burger','pizza','restaurant','food','eat','cafe','coffee','lunch','dinner','breakfast','grocery','supermarket'],
  transport:     ['uber','taxi','bus','metro','train','petrol','fuel','parking','lyft'],
  utilities:     ['electricity','water','internet','phone','gas','bill','rent'],
  entertainment: ['netflix','movie','cinema','game','spotify','music','concert'],
  health:        ['hospital','doctor','medicine','pharmacy','gym','fitness'],
  salary:        ['salary','wages','paycheck','freelance'],
  shopping:      ['amazon','mall','clothes','shoes','electronics'],
};

const autoCategorizTransaction = (desc) => {
  if (!desc) return 'other';
  const low = desc.toLowerCase();
  for (const [cat, kws] of Object.entries(KEYWORDS))
    if (kws.some((k) => low.includes(k))) return cat;
  return 'other';
};

const createTransaction = async (data) => {
  const list = await readData(ENTITY);
  if (!data.category && data.description)
    data.category = autoCategorizTransaction(data.description);
  const t = new Transaction(data);
  list.push({ ...t });
  await writeData(ENTITY, list);
  return t;
};

const getTransactionById = async (id) => {
  const list = await readData(ENTITY);
  const t    = list.find((x) => x.id === id);
  if (!t) throw new NotFoundError('Transaction not found');
  return t;
};

const getAllTransactions = async (f = {}) => {
  let list = await readData(ENTITY);
  if (f.userId)    list = list.filter((t) => t.userId   === f.userId);
  if (f.type)      list = list.filter((t) => t.type     === f.type);
  if (f.category)  list = list.filter((t) => t.category === f.category);
  if (f.startDate) list = list.filter((t) => new Date(t.date) >= new Date(f.startDate));
  if (f.endDate)   list = list.filter((t) => new Date(t.date) <= new Date(f.endDate));
  if (f.month)     list = list.filter((t) => t.date.startsWith(f.month));
  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const updateTransaction = async (id, updates, userId) => {
  const list = await readData(ENTITY);
  const idx  = list.findIndex((t) => t.id === id);
  if (idx === -1) throw new NotFoundError('Transaction not found');
  if (userId && list[idx].userId !== userId) throw new ForbiddenError('Not authorized');
  const { id: _i, userId: _u, createdAt, ...allowed } = updates; // eslint-disable-line no-unused-vars
  if (allowed.amount !== undefined) allowed.amount = parseFloat(allowed.amount);
  list[idx] = { ...list[idx], ...allowed };
  await writeData(ENTITY, list);
  return list[idx];
};

const deleteTransaction = async (id, userId) => {
  const list = await readData(ENTITY);
  const idx  = list.findIndex((t) => t.id === id);
  if (idx === -1) throw new NotFoundError('Transaction not found');
  if (userId && list[idx].userId !== userId) throw new ForbiddenError('Not authorized');
  const [deleted] = list.splice(idx, 1);
  await writeData(ENTITY, list);
  return deleted;
};

module.exports = {
  createTransaction, getTransactionById, getAllTransactions,
  updateTransaction, deleteTransaction, autoCategorizTransaction,
};
`);

// ─── src/services/budgetService.js ────────────────────────────────────────────
write('src/services/budgetService.js', `'use strict';
const { readData, writeData } = require('../utils/fileStore');
const Budget = require('../models/Budget');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const ENTITY = 'budgets';

const createBudget = async (data) => {
  if (!data.month || !/^\\d{4}-\\d{2}$/.test(data.month))
    throw new ValidationError('Month must be in YYYY-MM format');
  const goal = parseFloat(data.monthlyGoal);
  if (!data.monthlyGoal || isNaN(goal) || goal <= 0)
    throw new ValidationError('Monthly goal must be a positive number');
  const budgets = await readData(ENTITY);
  const b = new Budget(data);
  budgets.push({ ...b });
  await writeData(ENTITY, budgets);
  return b;
};

const getBudgetById = async (id) => {
  const budgets = await readData(ENTITY);
  const b = budgets.find((x) => x.id === id);
  if (!b) throw new NotFoundError('Budget not found');
  return b;
};

const getUserBudgets = async (userId) => {
  const budgets = await readData(ENTITY);
  return budgets.filter((b) => b.userId === userId);
};

const updateBudget = async (id, updates, userId) => {
  const budgets = await readData(ENTITY);
  const idx = budgets.findIndex((b) => b.id === id);
  if (idx === -1) throw new NotFoundError('Budget not found');
  if (userId && budgets[idx].userId !== userId) throw new ForbiddenError('Not authorized');
  const { id: _i, userId: _u, createdAt, ...allowed } = updates; // eslint-disable-line no-unused-vars
  budgets[idx] = { ...budgets[idx], ...allowed };
  await writeData(ENTITY, budgets);
  return budgets[idx];
};

module.exports = { createBudget, getBudgetById, getUserBudgets, updateBudget };
`);

// ─── src/services/summaryService.js ───────────────────────────────────────────
write('src/services/summaryService.js', `'use strict';
const { getAllTransactions } = require('./transactionService');
const { getUserBudgets }     = require('./budgetService');

const generateSavingsTips = (income, expenses, byCategory) => {
  const tips = [];
  if (income > 0 && expenses / income > 0.8)
    tips.push('Your expenses are very high. Consider reducing discretionary spending.');
  if (expenses > 0 && (byCategory.food || 0) / expenses > 0.3)
    tips.push('Food expenses are high (>30% of total). Consider meal prepping to save money.');
  if (expenses > 0 && (byCategory.entertainment || 0) / expenses > 0.15)
    tips.push('Entertainment spending is above average (>15%). Consider cheaper alternatives.');
  if (expenses > 0 && (byCategory.shopping || 0) / expenses > 0.2)
    tips.push('Shopping expenses are significant (>20%). Try setting a monthly shopping budget.');
  if (income - expenses > 0)
    tips.push('Great job! You are saving money. Consider investing your surplus.');
  tips.push('Set up automatic transfers to a savings account each payday.');
  tips.push('Review your subscriptions monthly and cancel unused ones.');
  return tips;
};

const getSummary = async (userId, filters = {}) => {
  const transactions = await getAllTransactions({ userId, ...filters });
  let totalIncome = 0, totalExpenses = 0;
  const byCategory = {}, monthlyMap = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
    const month = t.date.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { month, income: 0, expenses: 0 };
    if (t.type === 'income') monthlyMap[month].income   += t.amount;
    else                     monthlyMap[month].expenses += t.amount;
  }

  Object.keys(byCategory).forEach((k) => {
    byCategory[k] = Math.round(byCategory[k] * 100) / 100;
  });

  const monthlyTrends = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month));

  const budgets = await getUserBudgets(userId);
  const cm = new Date().toISOString().substring(0, 7);

  return {
    totalIncome:      Math.round(totalIncome * 100)               / 100,
    totalExpenses:    Math.round(totalExpenses * 100)             / 100,
    balance:          Math.round((totalIncome - totalExpenses) * 100) / 100,
    transactionCount: transactions.length,
    byCategory,
    monthlyTrends,
    savingsTips: generateSavingsTips(totalIncome, totalExpenses, byCategory),
    budget: budgets.find((b) => b.month === (filters.month || cm)) || null,
  };
};

module.exports = { getSummary, generateSavingsTips };
`);

// ─── src/controllers/userController.js ───────────────────────────────────────
write('src/controllers/userController.js', `'use strict';
const userService = require('../services/userService');
const { generateToken } = require('../utils/jwt');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

const register = async (req, res, next) => {
  try {
    const { name, email, password, preferences } = req.body;
    if (!name || !email || !password)
      throw new ValidationError('Name, email, and password are required');
    const user  = await userService.createUser({ name, email, password, preferences });
    const token = generateToken({ id: user.id, email: user.email });
    res.status(201).json({ success: true, data: { user, token } });
  } catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new ValidationError('Email and password are required');
    const user = await userService.findUserByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    const valid = await userService.validatePassword(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid email or password');
    const { password: _pw, ...u } = user; // eslint-disable-line no-unused-vars
    const token = generateToken({ id: user.id, email: user.email });
    res.json({ success: true, data: { user: u, token } });
  } catch (e) { next(e); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.user.id);
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
};

module.exports = { register, login, getMe };
`);

// ─── src/controllers/transactionController.js ────────────────────────────────
write('src/controllers/transactionController.js', `'use strict';
const txService = require('../services/transactionService');
const cache     = require('../middleware/cache');

const createTransaction = async (req, res, next) => {
  try {
    const t = await txService.createTransaction({ ...req.body, userId: req.user.id });
    cache.invalidatePattern('summary_' + req.user.id);
    res.status(201).json({ success: true, data: t });
  } catch (e) { next(e); }
};

const getTransactions = async (req, res, next) => {
  try {
    const list = await txService.getAllTransactions({ ...req.query, userId: req.user.id });
    res.json({ success: true, data: list, count: list.length });
  } catch (e) { next(e); }
};

const getTransactionById = async (req, res, next) => {
  try {
    const t = await txService.getTransactionById(req.params.id);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

const updateTransaction = async (req, res, next) => {
  try {
    const t = await txService.updateTransaction(req.params.id, req.body, req.user.id);
    cache.invalidatePattern('summary_' + req.user.id);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const t = await txService.deleteTransaction(req.params.id, req.user.id);
    cache.invalidatePattern('summary_' + req.user.id);
    res.json({ success: true, message: 'Transaction deleted', data: t });
  } catch (e) { next(e); }
};

module.exports = { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction };
`);

// ─── src/controllers/budgetController.js ─────────────────────────────────────
write('src/controllers/budgetController.js', `'use strict';
const budgetService = require('../services/budgetService');

const createBudget = async (req, res, next) => {
  try {
    const b = await budgetService.createBudget({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: b });
  } catch (e) { next(e); }
};

const getBudgets = async (req, res, next) => {
  try {
    const list = await budgetService.getUserBudgets(req.user.id);
    res.json({ success: true, data: list, count: list.length });
  } catch (e) { next(e); }
};

const updateBudget = async (req, res, next) => {
  try {
    const b = await budgetService.updateBudget(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: b });
  } catch (e) { next(e); }
};

module.exports = { createBudget, getBudgets, updateBudget };
`);

// ─── src/controllers/summaryController.js ────────────────────────────────────
write('src/controllers/summaryController.js', `'use strict';
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
`);

// ─── Routes ───────────────────────────────────────────────────────────────────
write('src/routes/userRoutes.js', `'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const r = Router();
r.post('/register', ctrl.register);
r.post('/login',    ctrl.login);
r.get('/me', auth,  ctrl.getMe);
module.exports = r;
`);

write('src/routes/transactionRoutes.js', `'use strict';
const { Router }  = require('express');
const ctrl        = require('../controllers/transactionController');
const auth        = require('../middleware/auth');
const validate    = require('../middleware/validateTransaction');
const r = Router();
r.use(auth);
r.post('/',    validate, ctrl.createTransaction);
r.get('/',              ctrl.getTransactions);
r.get('/:id',           ctrl.getTransactionById);
r.patch('/:id',         ctrl.updateTransaction);
r.delete('/:id',        ctrl.deleteTransaction);
module.exports = r;
`);

write('src/routes/budgetRoutes.js', `'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/budgetController');
const auth = require('../middleware/auth');
const r = Router();
r.use(auth);
r.post('/',    ctrl.createBudget);
r.get('/',     ctrl.getBudgets);
r.patch('/:id', ctrl.updateBudget);
module.exports = r;
`);

write('src/routes/summaryRoutes.js', `'use strict';
const { Router }    = require('express');
const { getSummary } = require('../controllers/summaryController');
const auth          = require('../middleware/auth');
const r = Router();
r.get('/', auth, getSummary);
module.exports = r;
`);

// ─── server.js ────────────────────────────────────────────────────────────────
write('server.js', `'use strict';
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
`);

// ─── tests/api.test.js ────────────────────────────────────────────────────────
write('tests/api.test.js', `'use strict';
const request    = require('supertest');
const app        = require('../server');
const { writeData } = require('../src/utils/fileStore');

beforeAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
  await writeData('budgets', []);
});
afterAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
  await writeData('budgets', []);
});

let token, txId, budgetId;

// ── Health ─────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status info', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.timestamp).toBeDefined();
  });
});

// ── User Auth ─────────────────────────────────────────────────────────────────
describe('User Auth', () => {
  it('POST /users/register – creates user and returns token', async () => {
    const r = await request(app).post('/users/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass1234' });
    expect(r.status).toBe(201);
    expect(r.body.data.token).toBeDefined();
    expect(r.body.data.user.password).toBeUndefined();
    token = r.body.data.token;
  });

  it('POST /users/register – rejects duplicate email', async () => {
    const r = await request(app).post('/users/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass1234' });
    expect(r.status).toBe(409);
  });

  it('POST /users/register – rejects missing fields', async () => {
    const r = await request(app).post('/users/register').send({ email: 'x@test.com' });
    expect(r.status).toBe(400);
  });

  it('POST /users/login – returns token', async () => {
    const r = await request(app).post('/users/login')
      .send({ email: 'alice@test.com', password: 'pass1234' });
    expect(r.status).toBe(200);
    expect(r.body.data.token).toBeDefined();
  });

  it('POST /users/login – rejects wrong password', async () => {
    const r = await request(app).post('/users/login')
      .send({ email: 'alice@test.com', password: 'wrong' });
    expect(r.status).toBe(401);
  });

  it('GET /users/me – returns authenticated user', async () => {
    const r = await request(app).get('/users/me')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.email).toBe('alice@test.com');
    expect(r.body.data.password).toBeUndefined();
  });

  it('GET /users/me – rejects without token', async () => {
    const r = await request(app).get('/users/me');
    expect(r.status).toBe(401);
  });
});

// ── Transactions ──────────────────────────────────────────────────────────────
describe('Transactions', () => {
  it('POST /transactions – creates an expense', async () => {
    const r = await request(app).post('/transactions')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'food', amount: 25.5, description: 'Lunch', date: '2024-01-15' });
    expect(r.status).toBe(201);
    expect(r.body.data.amount).toBe(25.5);
    txId = r.body.data.id;
  });

  it('POST /transactions – rejects invalid type', async () => {
    const r = await request(app).post('/transactions')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'bad', category: 'food', amount: 10, date: '2024-01-01' });
    expect(r.status).toBe(400);
  });

  it('POST /transactions – rejects negative amount', async () => {
    const r = await request(app).post('/transactions')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'food', amount: -5, date: '2024-01-01' });
    expect(r.status).toBe(400);
  });

  it('POST /transactions – rejects unauthenticated', async () => {
    const r = await request(app).post('/transactions')
      .send({ type: 'expense', category: 'food', amount: 10, date: '2024-01-01' });
    expect(r.status).toBe(401);
  });

  it('GET /transactions – returns list', async () => {
    const r = await request(app).get('/transactions')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.count).toBeGreaterThan(0);
  });

  it('GET /transactions?type=expense – filters by type', async () => {
    const r = await request(app).get('/transactions?type=expense')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.every((t) => t.type === 'expense')).toBe(true);
  });

  it('GET /transactions/:id – returns transaction', async () => {
    const r = await request(app).get('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.id).toBe(txId);
  });

  it('GET /transactions/:id – 404 for unknown id', async () => {
    const r = await request(app).get('/transactions/nonexistent')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(404);
  });

  it('PATCH /transactions/:id – updates amount', async () => {
    const r = await request(app).patch('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token)
      .send({ amount: 30 });
    expect(r.status).toBe(200);
    expect(r.body.data.amount).toBe(30);
  });

  it('DELETE /transactions/:id – deletes transaction', async () => {
    const r = await request(app).delete('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.message).toBe('Transaction deleted');
  });

  it('GET /transactions/:id – 404 after deletion', async () => {
    const r = await request(app).get('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(404);
  });
});

// ── Summary & Cache ───────────────────────────────────────────────────────────
describe('Summary & Cache', () => {
  beforeAll(async () => {
    await request(app).post('/transactions').set('Authorization', 'Bearer ' + token)
      .send({ type: 'income',  category: 'salary',    amount: 5000, date: '2024-02-01' });
    await request(app).post('/transactions').set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'food',      amount:  200, date: '2024-02-10' });
    await request(app).post('/transactions').set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'transport', amount:  100, date: '2024-02-15' });
  });

  it('GET /summary – returns analytics', async () => {
    const r = await request(app).get('/summary')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.totalIncome).toBeGreaterThan(0);
    expect(r.body.data.totalExpenses).toBeGreaterThan(0);
    expect(r.body.data.balance).toBeDefined();
    expect(Array.isArray(r.body.data.savingsTips)).toBe(true);
    expect(Array.isArray(r.body.data.monthlyTrends)).toBe(true);
    expect(r.body.cached).toBe(false);
  });

  it('GET /summary – uses cache on 2nd request', async () => {
    const r = await request(app).get('/summary')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.cached).toBe(true);
  });

  it('GET /summary – rejects without token', async () => {
    const r = await request(app).get('/summary');
    expect(r.status).toBe(401);
  });
});

// ── Budgets ───────────────────────────────────────────────────────────────────
describe('Budgets', () => {
  it('POST /budgets – creates a budget', async () => {
    const r = await request(app).post('/budgets')
      .set('Authorization', 'Bearer ' + token)
      .send({ month: '2024-02', monthlyGoal: 3000, savingsTarget: 500 });
    expect(r.status).toBe(201);
    expect(r.body.data.month).toBe('2024-02');
    budgetId = r.body.data.id;
  });

  it('POST /budgets – rejects invalid month format', async () => {
    const r = await request(app).post('/budgets')
      .set('Authorization', 'Bearer ' + token)
      .send({ month: '02-2024', monthlyGoal: 3000 });
    expect(r.status).toBe(400);
  });

  it('GET /budgets – returns budget list', async () => {
    const r = await request(app).get('/budgets')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.count).toBeGreaterThan(0);
  });

  it('PATCH /budgets/:id – updates monthly goal', async () => {
    const r = await request(app).patch('/budgets/' + budgetId)
      .set('Authorization', 'Bearer ' + token)
      .send({ monthlyGoal: 3500 });
    expect(r.status).toBe(200);
    expect(r.body.data.monthlyGoal).toBe(3500);
  });
});
`);

// ─── README.md ────────────────────────────────────────────────────────────────
write('README.md', `# FinEdge - Personal Finance & Expense Tracker API

A RESTful API for managing personal finances: track income/expenses, set budgets, and get smart savings insights.

## Features

- JWT Authentication (register & login)
- Full CRUD for Transactions (income and expense)
- Budget planning with monthly goals and savings targets
- Financial summary with analytics and monthly trends
- Auto-categorization of expenses by description keywords
- AI-generated savings tips based on spending patterns
- In-memory TTL cache for the /summary endpoint (5 min default)
- Rate limiting: 100 requests per 15 minutes per IP
- Request logging with method, URL, status code, and timing
- File persistence using Node.js built-in fs/promises (JSON files)
- MVC architecture with modular routes, controllers, and services
- Custom error classes with appropriate HTTP status codes
- Jest + Supertest integration tests

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Auth | jsonwebtoken |
| Passwords | bcryptjs |
| IDs | uuid |
| Persistence | fs/promises (JSON files) |
| Testing | Jest + Supertest |

## Quick Start

    npm install
    cp .env.example .env   # edit JWT_SECRET before deploying
    npm run dev            # starts on http://localhost:3000
    npm test               # run all tests

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| PORT | 3000 | Server port |
| JWT_SECRET | change-me | JWT signing secret |
| NODE_ENV | development | Runtime environment |
| DATA_DIR | src/data | Directory for JSON data files |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX | 100 | Max requests per window per IP |
| CACHE_TTL | 300 | Summary cache TTL in seconds |

## Project Structure

    src/
    +-- controllers/        userController, transactionController, budgetController, summaryController
    +-- routes/             userRoutes, transactionRoutes, budgetRoutes, summaryRoutes
    +-- services/           userService, transactionService, budgetService, summaryService
    +-- middleware/         auth, cache, errorHandler, logger, rateLimiter, validateTransaction
    +-- models/             User, Transaction, Budget
    +-- utils/              errors (custom classes), fileStore (fs/promises), jwt
    +-- data/               users.json, transactions.json, budgets.json
    tests/
      api.test.js
    server.js

## API Reference

### Health

    GET /health

### Authentication

    POST /users/register   Body: { name, email, password, preferences? }
    POST /users/login      Body: { email, password }
    GET  /users/me         Requires: Bearer token

Both register and login return: { success, data: { user, token } }

### Transactions   (all require Bearer token)

    POST   /transactions           Body: { type, category, amount, description?, date }
    GET    /transactions           Query: ?type=&category=&startDate=&endDate=&month=
    GET    /transactions/:id
    PATCH  /transactions/:id       Body: partial fields
    DELETE /transactions/:id

    Valid types:       income | expense
    Valid categories:  food | transport | utilities | entertainment
                       health | salary | shopping | other

    Tip: omit category and it is auto-detected from description keywords.

### Budgets   (require Bearer token)

    POST  /budgets       Body: { month (YYYY-MM), monthlyGoal, savingsTarget? }
    GET   /budgets
    PATCH /budgets/:id

### Summary   (requires Bearer token)

    GET /summary         Query: ?month=&startDate=&endDate=

    Response: {
      totalIncome, totalExpenses, balance, transactionCount,
      byCategory, monthlyTrends, savingsTips, budget
    }
    Cached for CACHE_TTL seconds. Cache invalidated on any transaction change.

## Auto-Categorization Keywords

| Category | Trigger words |
|---|---|
| food | burger, pizza, restaurant, grocery, cafe, coffee, lunch, dinner... |
| transport | uber, taxi, bus, metro, petrol, fuel, parking... |
| utilities | electricity, water, internet, phone, bill, rent... |
| entertainment | netflix, movie, spotify, cinema, game, concert... |
| health | hospital, doctor, medicine, pharmacy, gym... |
| salary | salary, wages, paycheck, freelance... |
| shopping | amazon, mall, clothes, shoes, electronics... |

## Error Format

    { "success": false, "error": "Descriptive message" }

| Code | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Missing / invalid token |
| 403 | Forbidden (not your resource) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 429 | Too many requests |
| 500 | Internal server error |
`);

console.log('\n  ✨  All ' + Object.keys(require).length + ' files created.');
console.log('\n  Next steps:');
console.log('    1. npm install');
console.log('    2. npm run dev   →  http://localhost:3000/health');
console.log('    3. npm test\n');
