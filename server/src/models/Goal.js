const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  order: { type: Number, default: 0 },
});

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Health', 'Career', 'Finance', 'Learning', 'Personal', 'Fitness', 'Relationships', 'Other'],
    default: 'Personal',
  },
  color: { type: String, default: 'accent' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  targetDate: { type: Date },
  milestones: [milestoneSchema],
  status: { type: String, enum: ['active', 'completed', 'paused', 'abandoned'], default: 'active' },
  linkedHabits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Habit' }],
  notes: { type: String, default: '' },
}, { timestamps: true });

goalSchema.pre('save', function (next) {
  if (this.progress >= 100) this.status = 'completed';
  next();
});

module.exports = mongoose.model('Goal', goalSchema);
