'use strict';
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
