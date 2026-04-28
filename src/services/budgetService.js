'use strict';
const { readData, writeData } = require('../utils/fileStore');
const Budget = require('../models/Budget');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const ENTITY = 'budgets';

const createBudget = async (data) => {
  if (!data.month || !/^\d{4}-\d{2}$/.test(data.month))
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
