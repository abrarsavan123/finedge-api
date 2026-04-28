'use strict';
const request    = require('supertest');
const app        = require('../server');
const { writeData } = require('../src/utils/fileStore');

beforeAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
  await writeData('budgets', []);
});
afterAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
  await writeData('budgets', []);
});

let token, txId, budgetId;

// ── Health ─────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status info', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.timestamp).toBeDefined();
  });
});

// ── User Auth ─────────────────────────────────────────────────────────────────
describe('User Auth', () => {
  it('POST /users/register – creates user and returns token', async () => {
    const r = await request(app).post('/users/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass1234' });
    expect(r.status).toBe(201);
    expect(r.body.data.token).toBeDefined();
    expect(r.body.data.user.password).toBeUndefined();
    token = r.body.data.token;
  });

  it('POST /users/register – rejects duplicate email', async () => {
    const r = await request(app).post('/users/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'pass1234' });
    expect(r.status).toBe(409);
  });

  it('POST /users/register – rejects missing fields', async () => {
    const r = await request(app).post('/users/register').send({ email: 'x@test.com' });
    expect(r.status).toBe(400);
  });

  it('POST /users/login – returns token', async () => {
    const r = await request(app).post('/users/login')
      .send({ email: 'alice@test.com', password: 'pass1234' });
    expect(r.status).toBe(200);
    expect(r.body.data.token).toBeDefined();
  });

  it('POST /users/login – rejects wrong password', async () => {
    const r = await request(app).post('/users/login')
      .send({ email: 'alice@test.com', password: 'wrong' });
    expect(r.status).toBe(401);
  });

  it('GET /users/me – returns authenticated user', async () => {
    const r = await request(app).get('/users/me')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.email).toBe('alice@test.com');
    expect(r.body.data.password).toBeUndefined();
  });

  it('GET /users/me – rejects without token', async () => {
    const r = await request(app).get('/users/me');
    expect(r.status).toBe(401);
  });
});

// ── Transactions ──────────────────────────────────────────────────────────────
describe('Transactions', () => {
  it('POST /transactions – creates an expense', async () => {
    const r = await request(app).post('/transactions')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'food', amount: 25.5, description: 'Lunch', date: '2024-01-15' });
    expect(r.status).toBe(201);
    expect(r.body.data.amount).toBe(25.5);
    txId = r.body.data.id;
  });

  it('POST /transactions – rejects invalid type', async () => {
    const r = await request(app).post('/transactions')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'bad', category: 'food', amount: 10, date: '2024-01-01' });
    expect(r.status).toBe(400);
  });

  it('POST /transactions – rejects negative amount', async () => {
    const r = await request(app).post('/transactions')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'food', amount: -5, date: '2024-01-01' });
    expect(r.status).toBe(400);
  });

  it('POST /transactions – rejects unauthenticated', async () => {
    const r = await request(app).post('/transactions')
      .send({ type: 'expense', category: 'food', amount: 10, date: '2024-01-01' });
    expect(r.status).toBe(401);
  });

  it('GET /transactions – returns list', async () => {
    const r = await request(app).get('/transactions')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.count).toBeGreaterThan(0);
  });

  it('GET /transactions?type=expense – filters by type', async () => {
    const r = await request(app).get('/transactions?type=expense')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.every((t) => t.type === 'expense')).toBe(true);
  });

  it('GET /transactions/:id – returns transaction', async () => {
    const r = await request(app).get('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.id).toBe(txId);
  });

  it('GET /transactions/:id – 404 for unknown id', async () => {
    const r = await request(app).get('/transactions/nonexistent')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(404);
  });

  it('PATCH /transactions/:id – updates amount', async () => {
    const r = await request(app).patch('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token)
      .send({ amount: 30 });
    expect(r.status).toBe(200);
    expect(r.body.data.amount).toBe(30);
  });

  it('DELETE /transactions/:id – deletes transaction', async () => {
    const r = await request(app).delete('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.message).toBe('Transaction deleted');
  });

  it('GET /transactions/:id – 404 after deletion', async () => {
    const r = await request(app).get('/transactions/' + txId)
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(404);
  });
});

// ── Summary & Cache ───────────────────────────────────────────────────────────
describe('Summary & Cache', () => {
  beforeAll(async () => {
    await request(app).post('/transactions').set('Authorization', 'Bearer ' + token)
      .send({ type: 'income',  category: 'salary',    amount: 5000, date: '2024-02-01' });
    await request(app).post('/transactions').set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'food',      amount:  200, date: '2024-02-10' });
    await request(app).post('/transactions').set('Authorization', 'Bearer ' + token)
      .send({ type: 'expense', category: 'transport', amount:  100, date: '2024-02-15' });
  });

  it('GET /summary – returns analytics', async () => {
    const r = await request(app).get('/summary')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.data.totalIncome).toBeGreaterThan(0);
    expect(r.body.data.totalExpenses).toBeGreaterThan(0);
    expect(r.body.data.balance).toBeDefined();
    expect(Array.isArray(r.body.data.savingsTips)).toBe(true);
    expect(Array.isArray(r.body.data.monthlyTrends)).toBe(true);
    expect(r.body.cached).toBe(false);
  });

  it('GET /summary – uses cache on 2nd request', async () => {
    const r = await request(app).get('/summary')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.cached).toBe(true);
  });

  it('GET /summary – rejects without token', async () => {
    const r = await request(app).get('/summary');
    expect(r.status).toBe(401);
  });
});

// ── Budgets ───────────────────────────────────────────────────────────────────
describe('Budgets', () => {
  it('POST /budgets – creates a budget', async () => {
    const r = await request(app).post('/budgets')
      .set('Authorization', 'Bearer ' + token)
      .send({ month: '2024-02', monthlyGoal: 3000, savingsTarget: 500 });
    expect(r.status).toBe(201);
    expect(r.body.data.month).toBe('2024-02');
    budgetId = r.body.data.id;
  });

  it('POST /budgets – rejects invalid month format', async () => {
    const r = await request(app).post('/budgets')
      .set('Authorization', 'Bearer ' + token)
      .send({ month: '02-2024', monthlyGoal: 3000 });
    expect(r.status).toBe(400);
  });

  it('GET /budgets – returns budget list', async () => {
    const r = await request(app).get('/budgets')
      .set('Authorization', 'Bearer ' + token);
    expect(r.status).toBe(200);
    expect(r.body.count).toBeGreaterThan(0);
  });

  it('PATCH /budgets/:id – updates monthly goal', async () => {
    const r = await request(app).patch('/budgets/' + budgetId)
      .set('Authorization', 'Bearer ' + token)
      .send({ monthlyGoal: 3500 });
    expect(r.status).toBe(200);
    expect(r.body.data.monthlyGoal).toBe(3500);
  });
});
