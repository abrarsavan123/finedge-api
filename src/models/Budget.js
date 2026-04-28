'use strict';
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
