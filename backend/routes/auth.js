const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const rawUsername = (req.body.username || '').trim().toLowerCase();
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const firstName = (req.body.firstName || '').trim();
    const lastName = (req.body.lastName || '').trim();

    if (!rawUsername || !rawEmail || !password || !firstName) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email: rawEmail }, { username: rawUsername }] });
    if (existingUser) {
      return res.status(400).json({ error: existingUser.email === rawEmail ? 'Email already registered' : 'Username already taken' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username: rawUsername, email: rawEmail, password: hashedPassword, firstName, lastName });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName }, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  res.json({ user: req.user });
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;