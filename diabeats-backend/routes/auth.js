const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route  POST /api/auth/register
// @desc   Register new user
// @access Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, diabetesType, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      diabetesType: diabetesType || 'type2',
      language: language || 'en'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      diabetesType: user.diabetesType,
      language: user.language,
      dailyCalorieGoal: user.dailyCalorieGoal,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/auth/login
// @desc   Login user
// @access Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      diabetesType: user.diabetesType,
      language: user.language,
      dailyCalorieGoal: user.dailyCalorieGoal,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/auth/me
// @desc   Get logged in user profile
// @access Private
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route  PUT /api/auth/me
// @desc   Update user profile
// @access Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, diabetesType, dailyCalorieGoal, language } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (diabetesType) user.diabetesType = diabetesType;
    if (dailyCalorieGoal) user.dailyCalorieGoal = dailyCalorieGoal;
    if (language) user.language = language;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, diabetesType: user.diabetesType, language: user.language, dailyCalorieGoal: user.dailyCalorieGoal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
