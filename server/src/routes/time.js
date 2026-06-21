const express = require('express');
const TimeBlock = require('../models/TimeBlock');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/time?date=YYYY-MM-DD
router.get('/', asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const blocks = await TimeBlock.find({ user: req.user._id, date }).sort('startTime');
  res.json({ blocks });
}));

// GET /api/time/week?from=YYYY-MM-DD
router.get('/week', asyncHandler(async (req, res) => {
  const from = req.query.from || new Date().toISOString().split('T')[0];
  const to = new Date(new Date(from).getTime() + 6 * 86400000).toISOString().split('T')[0];
  const blocks = await TimeBlock.find({ user: req.user._id, date: { $gte: from, $lte: to } }).sort('date startTime');
  res.json({ blocks });
}));

// POST /api/time
router.post('/', asyncHandler(async (req, res) => {
  const block = await TimeBlock.create({ ...req.body, user: req.user._id });
  res.status(201).json({ block });
}));

// PATCH /api/time/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const block = await TimeBlock.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!block) return res.status(404).json({ message: 'Block not found' });
  res.json({ block });
}));

// DELETE /api/time/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await TimeBlock.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Block deleted' });
}));

// GET /api/time/stats?month=YYYY-MM
router.get('/stats', asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const from = `${month}-01`;
  const to = `${month}-31`;
  const blocks = await TimeBlock.find({ user: req.user._id, date: { $gte: from, $lte: to } });

  const byCategory = {};
  let totalMinutes = 0;
  let completedMinutes = 0;

  blocks.forEach(b => {
    byCategory[b.category] = (byCategory[b.category] || 0) + b.duration;
    totalMinutes += b.duration;
    if (b.completed) completedMinutes += b.duration;
  });

  res.json({ byCategory, totalMinutes, completedMinutes, totalBlocks: blocks.length });
}));

module.exports = router;
