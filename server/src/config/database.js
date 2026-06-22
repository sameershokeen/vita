// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       dbName: process.env.DB_NAME || 'lifetrack',
//       serverSelectionTimeoutMS: 10000,
//     });
//     console.log(`✅ MongoDB connected: ${conn.connection.host}`);
//     return conn;
//   } catch (err) {
//     console.error('❌ MongoDB connection error:', err.message);
//     throw err; // don't process.exit() — that kills serverless functions
//   }
// };

// module.exports = connectDB;
const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4-first DNS resolution — fixes SRV lookup failures
// seen in some serverless runtimes (Vercel/AWS Lambda) with mongodb+srv:// URIs
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || '';
    console.log('🔍 URI present:', !!uri, '| length:', uri.length, '| starts with:', uri.slice(0, 14));

    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'lifetrack',
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
