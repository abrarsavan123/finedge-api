'use strict';
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
