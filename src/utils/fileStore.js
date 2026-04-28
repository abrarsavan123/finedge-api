'use strict';
const fs   = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DATA_DIR = process.env.DATA_DIR || 'src/data';
const fp = (entity) => path.join(process.cwd(), DATA_DIR, entity + '.json');

const readData = async (entity) => {
  try {
    return JSON.parse(await fs.readFile(fp(entity), 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
};

const writeData = async (entity, data) => {
  const filePath = fp(entity);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const generateId = () => uuidv4();

module.exports = { readData, writeData, generateId };
