const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./modules/auth/authRoutes');
const caseRoutes = require('./modules/case/case.routes');

const app = express();
connectDB();

app.use(cors({
  origin: ['http://localhost:5173', 'https://claimant.lawyerslog.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

app.get('/', (req, res) => res.json({ message: 'LawyersLog API is running' }));

app.use((err, req, res, next) => {
  console.error('=== EXPRESS ERROR ===', err.stack);
  res.status(500).json({ success: false, message: err.message });
});

module.exports = app;
