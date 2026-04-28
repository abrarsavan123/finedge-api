'use strict';
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
