'use strict';
const { getAllTransactions } = require('./transactionService');
const { getUserBudgets }     = require('./budgetService');

const generateSavingsTips = (income, expenses, byCategory) => {
  const tips = [];
  if (income > 0 && expenses / income > 0.8)
    tips.push('Your expenses are very high. Consider reducing discretionary spending.');
  if (expenses > 0 && (byCategory.food || 0) / expenses > 0.3)
    tips.push('Food expenses are high (>30% of total). Consider meal prepping to save money.');
  if (expenses > 0 && (byCategory.entertainment || 0) / expenses > 0.15)
    tips.push('Entertainment spending is above average (>15%). Consider cheaper alternatives.');
  if (expenses > 0 && (byCategory.shopping || 0) / expenses > 0.2)
    tips.push('Shopping expenses are significant (>20%). Try setting a monthly shopping budget.');
  if (income - expenses > 0)
    tips.push('Great job! You are saving money. Consider investing your surplus.');
  tips.push('Set up automatic transfers to a savings account each payday.');
  tips.push('Review your subscriptions monthly and cancel unused ones.');
  return tips;
};

const getSummary = async (userId, filters = {}) => {
  const transactions = await getAllTransactions({ userId, ...filters });
  let totalIncome = 0, totalExpenses = 0;
  const byCategory = {}, monthlyMap = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
    const month = t.date.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { month, income: 0, expenses: 0 };
    if (t.type === 'income') monthlyMap[month].income   += t.amount;
    else                     monthlyMap[month].expenses += t.amount;
  }

  Object.keys(byCategory).forEach((k) => {
    byCategory[k] = Math.round(byCategory[k] * 100) / 100;
  });

  const monthlyTrends = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month));

  const budgets = await getUserBudgets(userId);
  const cm = new Date().toISOString().substring(0, 7);

  return {
    totalIncome:      Math.round(totalIncome * 100)               / 100,
    totalExpenses:    Math.round(totalExpenses * 100)             / 100,
    balance:          Math.round((totalIncome - totalExpenses) * 100) / 100,
    transactionCount: transactions.length,
    byCategory,
    monthlyTrends,
    savingsTips: generateSavingsTips(totalIncome, totalExpenses, byCategory),
    budget: budgets.find((b) => b.month === (filters.month || cm)) || null,
  };
};

module.exports = { getSummary, generateSavingsTips };
