const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // ISO date string YYYY-MM-DD
  completed: { type: Boolean, default: true },
}, { _id: false });

const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Health', 'Fitness', 'Learning', 'Mindfulness', 'Productivity', 'Finance', 'Social', 'Other'],
    default: 'Health',
  },
  icon: { type: String, default: 'ti-checkbox' },
  color: { type: String, default: '#7c6ef7' },
  frequency: {
    type: { type: String, enum: ['daily', 'weekdays', 'weekends', 'custom'], default: 'daily' },
    days: [{ type: Number, min: 0, max: 6 }], // 0=Sun for custom
  },
  targetTime: { type: String, default: '' }, // HH:MM
  completions: [completionSchema],
  isArchived: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual: streak
habitSchema.virtual('streak').get(function () {
  if (!this.completions.length) return 0;
  const sorted = [...this.completions]
    .filter(c => c.completed)
    .map(c => c.date)
    .sort((a, b) => b.localeCompare(a));
  if (!sorted.length) return 0;
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
  return streak;
});

habitSchema.virtual('completedToday').get(function () {
  const today = new Date().toISOString().split('T')[0];
  return this.completions.some(c => c.date === today && c.completed);
});

habitSchema.set('toJSON', { virtuals: true });
habitSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Habit', habitSchema);
