const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  mood: {
    emoji: { type: String, default: '😊' },
    score: { type: Number, min: 1, max: 5, default: 4 }, // 1=awful 5=great
  },
  tags: [String],
  isPrivate: { type: Boolean, default: true },
  prompt: { type: String, default: '' }, // optional writing prompt used
  wordCount: { type: Number, default: 0 },
}, { timestamps: true });

journalSchema.pre('save', function (next) {
  this.wordCount = this.body.trim().split(/\s+/).filter(Boolean).length;
  next();
});

journalSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Journal', journalSchema);
