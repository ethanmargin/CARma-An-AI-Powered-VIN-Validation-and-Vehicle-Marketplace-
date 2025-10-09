const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ CARma Backend API is running!' });
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, current_database() as database');
    res.json({ 
      success: true, 
      message: '✅ Database connected successfully!',
      data: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '❌ Database connection failed',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
});