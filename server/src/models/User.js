const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  preferences: {
    currency: { type: String, default: 'INR' },
    weekStartsOn: { type: Number, default: 1 }, // 0=Sun, 1=Mon
    theme: { type: String, default: 'dark' },
    budgetLimits: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ Food: 5000, Transport: 2000, Shopping: 3000, Entertainment: 1500, Education: 2000 }),
    },
  },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
