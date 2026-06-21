const express = require('express');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');
const TimeBlock = require('../models/TimeBlock');
const Expense = require('../models/Expense');
const Journal = require('../models/Journal');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/progress/overview — full dashboard summary
router.get('/overview', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  const [habits, goals, blocks, expenses, journalStreak] = await Promise.all([
    Habit.find({ user: req.user._id, isArchived: false }),
    Goal.find({ user: req.user._id, status: 'active' }),
    TimeBlock.find({ user: req.user._id, date: today }),
    Expense.find({ user: req.user._id, date: { $gte: `${month}-01`, $lte: `${month}-31` } }),
    Journal.find({ user: req.user._id }).distinct('date'),
  ]);

  const habitsDoneToday = habits.filter(h => h.completedToday).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  // Journal streak
  const sortedDates = journalStreak.sort((a, b) => b.localeCompare(a));
  let jStreak = 0;
  let cur = today;
  for (const date of sortedDates) {
    if (date === cur) {
      jStreak++;
      const d = new Date(cur);
      d.setDate(d.getDate() - 1);
      cur = d.toISOString().split('T')[0];
    } else break;
  }

  res.json({
    habits: { total: habits.length, doneToday: habitsDoneToday, bestStreak },
    goals: { active: goals.length, avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0 },
    time: { blocksToday: blocks.length, plannedMinutes: blocks.reduce((s, b) => s + b.duration, 0) },
    expenses: { monthTotal: totalExpenses, monthIncome: totalIncome, balance: totalIncome - totalExpenses },
    journal: { streak: jStreak, totalEntries: journalStreak.length },
  });
}));

// GET /api/progress/habits/monthly?months=6
router.get('/habits/monthly', asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const habits = await Habit.find({ user: req.user._id, isArchived: false });

  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toISOString().slice(0, 7);
    const from = `${month}-01`;
    const to = `${month}-31`;

    let completions = 0;
    habits.forEach(h => {
      completions += h.completions.filter(c => c.date >= from && c.date <= to && c.completed).length;
    });
    result.push({ month, completions, habits: habits.length });
  }
  res.json({ monthly: result });
}));

module.exports = router;
