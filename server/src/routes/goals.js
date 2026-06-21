const express = require('express');
const Goal = require('../models/Goal');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/goals
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  const goals = await Goal.find(filter).sort('-createdAt');
  res.json({ goals });
}));

// POST /api/goals
router.post('/', asyncHandler(async (req, res) => {
  const goal = await Goal.create({ ...req.body, user: req.user._id });
  res.status(201).json({ goal });
}));

// PATCH /api/goals/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json({ goal });
}));

// DELETE /api/goals/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Goal deleted' });
}));

// PATCH /api/goals/:id/milestones/:milestoneId
router.patch('/:id/milestones/:milestoneId', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });

  const milestone = goal.milestones.id(req.params.milestoneId);
  if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

  Object.assign(milestone, req.body);
  if (req.body.completed) milestone.completedAt = new Date();

  // Auto-update progress based on milestones
  const done = goal.milestones.filter(m => m.completed).length;
  if (goal.milestones.length > 0) {
    goal.progress = Math.round((done / goal.milestones.length) * 100);
  }

  await goal.save();
  res.json({ goal });
}));

// POST /api/goals/:id/milestones
router.post('/:id/milestones', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  goal.milestones.push(req.body);
  await goal.save();
  res.json({ goal });
}));

module.exports = router;
