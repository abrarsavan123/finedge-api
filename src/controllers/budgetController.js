'use strict';
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
