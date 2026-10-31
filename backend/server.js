require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const memberRoutes = require('./routes/members');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health checks
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Family Tree API is running' }));
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Auth routes (support both /api/auth and /auth)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Member routes (support both /api/members and /members)
app.use('/api/members', memberRoutes);
app.use('/members', memberRoutes);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, ()=> console.log(`Server running on ${PORT}`)))
  .catch(err => console.error(err));
