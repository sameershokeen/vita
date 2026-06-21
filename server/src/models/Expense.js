const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['expense', 'income', 'transfer'], required: true },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Education', 'Rent', 'Utilities', 'Income', 'Investment', 'Other'],
    required: true,
  },
  emoji: { type: String, default: '💸' },
  date: { type: String, required: true }, // YYYY-MM-DD
  note: { type: String, default: '' },
  tags: [String],
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', null], default: null },
}, { timestamps: true });

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
