require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// 1. Immediately establish the database connection
connectDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
});

// 2. Keep app.listen ONLY for local development testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 LifeTrack server running on port ${PORT}`);
  });
}

// 3. CRITICAL: Export the app instance so Vercel can track it serverlessly
module.exports = app;