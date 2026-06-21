const express = require('express');
const Journal = require('../models/Journal');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const PROMPTS = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "What challenged you today and what did you learn?",
  "Describe your energy levels today and why.",
  "What intention do you want to set for tomorrow?",
  "What's one thing you'd do differently today?",
  "Who or what are you most grateful for this week?",
];

// GET /api/journal
router.get('/', asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0, month } = req.query;
  const filter = { user: req.user._id };
  if (month) filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
  const entries = await Journal.find(filter).sort('-date -createdAt').limit(+limit).skip(+skip);
  const total = await Journal.countDocuments(filter);
  res.json({ entries, total });
}));

// GET /api/journal/prompt — random writing prompt
router.get('/prompt', (req, res) => {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt });
});

// GET /api/journal/streak
router.get('/streak', asyncHandler(async (req, res) => {
  const entries = await Journal.find({ user: req.user._id }).distinct('date');
  const sorted = entries.sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let cur = today;
  for (const date of sorted) {
    if (date === cur) {
      streak++;
      const d = new Date(cur);
      d.setDate(d.getDate() - 1);
      cur = d.toISOString().split('T')[0];
    } else break;
  }
  res.json({ streak, totalEntries: entries.length });
}));

// POST /api/journal
router.post('/', asyncHandler(async (req, res) => {
  const date = req.body.date || new Date().toISOString().split('T')[0];
  const entry = await Journal.create({ ...req.body, date, user: req.user._id });
  res.status(201).json({ entry });
}));

// PATCH /api/journal/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const entry = await Journal.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!entry) return res.status(404).json({ message: 'Entry not found' });
  res.json({ entry });
}));

// DELETE /api/journal/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Deleted' });
}));

// GET /api/journal/mood?days=30
router.get('/mood', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().split('T')[0];

  const entries = await Journal.find(
    { user: req.user._id, date: { $gte: fromStr } },
    { date: 1, 'mood.score': 1, 'mood.emoji': 1 }
  ).sort('date');

  res.json({ moodHistory: entries.map(e => ({ date: e.date, score: e.mood.score, emoji: e.mood.emoji })) });
}));

module.exports = router;
