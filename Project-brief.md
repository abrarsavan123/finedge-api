Brief
Project Requirements
1. Fundamentals & Setup (10 Points)
Initialize project with npm init

Setup folder structure using MVC architecture

Create a /health route to verify server running

2. REST API Development (30 Points)
Core Entities:

User → manages authentication and preferences

Transaction → type (income/expense), category, amount, date

Budget → monthly goal and savings target

Core Endpoints:

Method

Route

Description

POST

/users

Register new user

POST

/transactions

Add income/expense

GET

/transactions

Fetch all transactions

GET

/transactions/:id

View single transaction

PATCH

/transactions/:id

Update transaction

DELETE

/transactions/:id

Delete transaction

GET

/summary

Fetch income-expense summary


3. Async Programming & Middleware (20 Points)
Use async/await for DB or file I/O operations

Implement global error-handling middleware

Add custom middleware for:

Logging request details

Validating transaction inputs

4. Advanced Node Concepts (20 Points)
Use modular routes and controllers

Create reusable services for business logic

Add environment variables for configuration management

Implement custom error classes

Use built-in fs/promises for file persistence

Add test cases for core endpoints

Bonus: Implement simple JWT-based user session (mock)

5. Bonus Features (20 Points)
Choose any two of the following:

A. Analytics & Reporting

Calculate total income, expenses, and balance

Filter transactions by category/date

Show monthly trends


B. AI or Automation Feature

Suggest saving tips or budgets based on past spending

Auto-categorize expenses using keyword matching

Real-time updates on new transactions

C. Data Persistence

Store and retrieve data using JSON files or MongoDB

D. Advanced Middleware

Add rate limiter for requests

Implement CORS and request logging

Implement a simple in-memory cache service with TTL expiry. Use it in /summary to avoid recomputing data repeatedly.


FinEdge .pdf


Submission guidelines
Submission guidelines

Write a clear and concise README file

To submit your project, please provide a link to your GitHub repository.

[Important] Make sure the repository is public.


Deliverables

GitHub link

GitHub PR link
