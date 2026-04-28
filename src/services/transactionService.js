'use strict';
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
