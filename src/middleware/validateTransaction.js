'use strict';
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
