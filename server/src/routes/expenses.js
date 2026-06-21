const express = require('express');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/expenses?month=YYYY-MM&limit=50
router.get('/', asyncHandler(async (req, res) => {
  const { month, limit = 50, skip = 0 } = req.query;
  const filter = { user: req.user._id };
  if (month) {
    filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
  }
  const expenses = await Expense.find(filter).sort('-date -createdAt').limit(+limit).skip(+skip);
  const total = await Expense.countDocuments(filter);
  res.json({ expenses, total });
}));

// POST /api/expenses
router.post('/', asyncHandler(async (req, res) => {
  const expense = await Expense.create({ ...req.body, user: req.user._id });
  res.status(201).json({ expense });
}));

// PATCH /api/expenses/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ expense });
}));

// DELETE /api/expenses/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Deleted' });
}));

// GET /api/expenses/summary?month=YYYY-MM
router.get('/summary', asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const expenses = await Expense.find({
    user: req.user._id,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  });

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const byCategory = {};
  expenses.filter(e => e.type === 'expense').forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  res.json({
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
    byCategory,
    transactionCount: expenses.length,
  });
}));

module.exports = router;
