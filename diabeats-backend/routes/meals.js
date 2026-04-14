const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const { protect } = require('../middleware/auth');

// @route  POST /api/meals
// @desc   Log a new meal
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      mealName, scanMethod, calories, carbohydrates, protein,
      fat, fiber, sugar, glycemicIndex, safetyLevel,
      diabetesAdvice, confidencePct, notes
    } = req.body;

    if (!mealName) {
      return res.status(400).json({ message: 'Meal name is required' });
    }

    const meal = await Meal.create({
      user: req.user._id,
      mealName, scanMethod, calories, carbohydrates, protein,
      fat, fiber, sugar, glycemicIndex, safetyLevel,
      diabetesAdvice, confidencePct, notes
    });

    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/meals
// @desc   Get all meals for logged-in user (paginated)
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const meals = await Meal.find({ user: req.user._id })
      .sort({ loggedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Meal.countDocuments({ user: req.user._id });

    res.json({ meals, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/meals/today
// @desc   Get today's meals + daily summary
// @access Private
router.get('/today', protect, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      user: req.user._id,
      loggedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ loggedAt: -1 });

    const summary = meals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.carbohydrates += meal.carbohydrates || 0;
      acc.protein += meal.protein || 0;
      acc.fat += meal.fat || 0;
      acc.fiber += meal.fiber || 0;
      return acc;
    }, { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 });

    res.json({ meals, summary, mealCount: meals.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/meals/stats
// @desc   Get weekly nutrition stats
// @access Private
router.get('/stats', protect, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const meals = await Meal.find({
      user: req.user._id,
      loggedAt: { $gte: sevenDaysAgo }
    });

    const dailyStats = {};
    meals.forEach(meal => {
      const day = meal.loggedAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { calories: 0, carbohydrates: 0, protein: 0, fat: 0, mealCount: 0 };
      }
      dailyStats[day].calories += meal.calories || 0;
      dailyStats[day].carbohydrates += meal.carbohydrates || 0;
      dailyStats[day].protein += meal.protein || 0;
      dailyStats[day].fat += meal.fat || 0;
      dailyStats[day].mealCount += 1;
    });

    res.json({ dailyStats, totalMeals: meals.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  DELETE /api/meals/:id
// @desc   Delete a meal entry
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    if (meal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this meal' });
    }
    await meal.deleteOne();
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
