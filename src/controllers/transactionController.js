'use strict';
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
