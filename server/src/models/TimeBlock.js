const mongoose = require('mongoose');

const timeBlockSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:MM
  duration: { type: Number, required: true, min: 5 }, // minutes
  category: {
    type: String,
    enum: ['deep-work', 'learning', 'meeting', 'admin', 'exercise', 'break', 'personal', 'other'],
    default: 'deep-work',
  },
  color: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  pomodoros: { type: Number, default: 0 },
  linkedGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
}, { timestamps: true });

timeBlockSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('TimeBlock', timeBlockSchema);
