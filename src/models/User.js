'use strict';
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
