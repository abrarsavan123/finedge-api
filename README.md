# FinEdge - Personal Finance & Expense Tracker API

A RESTful API for managing personal finances: track income/expenses, set budgets, and get smart savings insights.

## Features

- JWT Authentication (register & login)
- Full CRUD for Transactions (income and expense)
- Budget planning with monthly goals and savings targets
- Financial summary with analytics and monthly trends
- Auto-categorization of expenses by description keywords
- AI-generated savings tips based on spending patterns
- In-memory TTL cache for the /summary endpoint (5 min default)
- Rate limiting: 100 requests per 15 minutes per IP
- Request logging with method, URL, status code, and timing
- File persistence using Node.js built-in fs/promises (JSON files)
- MVC architecture with modular routes, controllers, and services
- Custom error classes with appropriate HTTP status codes
- Jest + Supertest integration tests

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Auth | jsonwebtoken |
| Passwords | bcryptjs |
| IDs | uuid |
| Persistence | fs/promises (JSON files) |
| Testing | Jest + Supertest |

## Quick Start

    npm install
    cp .env.example .env   # edit JWT_SECRET before deploying
    npm run dev            # starts on http://localhost:3000
    npm test               # run all tests

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| PORT | 3000 | Server port |
| JWT_SECRET | change-me | JWT signing secret |
| NODE_ENV | development | Runtime environment |
| DATA_DIR | src/data | Directory for JSON data files |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX | 100 | Max requests per window per IP |
| CACHE_TTL | 300 | Summary cache TTL in seconds |

## Project Structure

    src/
    +-- controllers/        userController, transactionController, budgetController, summaryController
    +-- routes/             userRoutes, transactionRoutes, budgetRoutes, summaryRoutes
    +-- services/           userService, transactionService, budgetService, summaryService
    +-- middleware/         auth, cache, errorHandler, logger, rateLimiter, validateTransaction
    +-- models/             User, Transaction, Budget
    +-- utils/              errors (custom classes), fileStore (fs/promises), jwt
    +-- data/               users.json, transactions.json, budgets.json
    tests/
      api.test.js
    server.js

## API Reference

### Health

    GET /health

### Authentication

    POST /users/register   Body: { name, email, password, preferences? }
    POST /users/login      Body: { email, password }
    GET  /users/me         Requires: Bearer token

Both register and login return: { success, data: { user, token } }

### Transactions   (all require Bearer token)

    POST   /transactions           Body: { type, category, amount, description?, date }
    GET    /transactions           Query: ?type=&category=&startDate=&endDate=&month=
    GET    /transactions/:id
    PATCH  /transactions/:id       Body: partial fields
    DELETE /transactions/:id

    Valid types:       income | expense
    Valid categories:  food | transport | utilities | entertainment
                       health | salary | shopping | other

    Tip: omit category and it is auto-detected from description keywords.

### Budgets   (require Bearer token)

    POST  /budgets       Body: { month (YYYY-MM), monthlyGoal, savingsTarget? }
    GET   /budgets
    PATCH /budgets/:id

### Summary   (requires Bearer token)

    GET /summary         Query: ?month=&startDate=&endDate=

    Response: {
      totalIncome, totalExpenses, balance, transactionCount,
      byCategory, monthlyTrends, savingsTips, budget
    }
    Cached for CACHE_TTL seconds. Cache invalidated on any transaction change.

## Auto-Categorization Keywords

| Category | Trigger words |
|---|---|
| food | burger, pizza, restaurant, grocery, cafe, coffee, lunch, dinner... |
| transport | uber, taxi, bus, metro, petrol, fuel, parking... |
| utilities | electricity, water, internet, phone, bill, rent... |
| entertainment | netflix, movie, spotify, cinema, game, concert... |
| health | hospital, doctor, medicine, pharmacy, gym... |
| salary | salary, wages, paycheck, freelance... |
| shopping | amazon, mall, clothes, shoes, electronics... |

## Error Format

    { "success": false, "error": "Descriptive message" }

| Code | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Missing / invalid token |
| 403 | Forbidden (not your resource) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 429 | Too many requests |
| 500 | Internal server error |
