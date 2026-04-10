// server/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { requireAuth, attachUser } = require('./middleware/auth');
const errorHandler                = require('./middleware/errorHandler');

const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/students');
const adminRoutes   = require('./routes/admin');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/students', requireAuth, attachUser, studentRoutes);
app.use('/admin',    requireAuth, attachUser, adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
