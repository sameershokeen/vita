const express = require('express');
const Habit = require('../models/Habit');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/habits
router.get('/', asyncHandler(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id, isArchived: false }).sort('order');
  res.json({ habits });
}));

// POST /api/habits
router.post('/', asyncHandler(async (req, res) => {
  const habit = await Habit.create({ ...req.body, user: req.user._id });
  res.status(201).json({ habit });
}));

// PATCH /api/habits/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!habit) return res.status(404).json({ message: 'Habit not found' });
  res.json({ habit });
}));

// DELETE /api/habits/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isArchived: true }
  );
  res.json({ message: 'Habit archived' });
}));

// POST /api/habits/:id/toggle  — toggle today's completion
router.post('/:id/toggle', asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  const date = req.body.date || new Date().toISOString().split('T')[0];
  const idx = habit.completions.findIndex(c => c.date === date);

  if (idx >= 0) {
    habit.completions[idx].completed = !habit.completions[idx].completed;
  } else {
    habit.completions.push({ date, completed: true });
  }
  await habit.save();
  res.json({ habit });
}));

// GET /api/habits/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/stats', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const habits = await Habit.find({ user: req.user._id, isArchived: false });

  const stats = habits.map(h => {
    const completions = h.completions.filter(c =>
      (!from || c.date >= from) && (!to || c.date <= to) && c.completed
    );
    return {
      id: h._id,
      name: h.name,
      category: h.category,
      streak: h.streak,
      completedToday: h.completedToday,
      totalCompletions: completions.length,
    };
  });

  res.json({ stats });
}));

module.exports = router;
