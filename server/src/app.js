const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const goalRoutes = require('./routes/goals');
const timeRoutes = require('./routes/time');
const expenseRoutes = require('./routes/expenses');
const journalRoutes = require('./routes/journal');
const progressRoutes = require('./routes/progress');
const healthRoute = require('./routes/health');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);

// Security & parsing
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoute);

// Protected routes
app.use('/api/habits', authenticate, habitRoutes);
app.use('/api/goals', authenticate, goalRoutes);
app.use('/api/time', authenticate, timeRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/journal', authenticate, journalRoutes);
app.use('/api/progress', authenticate, progressRoutes);
//mess=================================area
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Vita API running"
  });
});
//end ===================================here
app.use(errorHandler);

module.exports = app;
