const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealName: {
    type: String,
    required: true,
    trim: true
  },
  scanMethod: {
    type: String,
    enum: ['camera', 'voice', 'text', 'demo'],
    default: 'text'
  },
  calories: { type: Number, default: 0 },
  carbohydrates: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  glycemicIndex: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  safetyLevel: {
    type: String,
    enum: ['safe', 'caution', 'avoid'],
    default: 'safe'
  },
  diabetesAdvice: { type: String, default: '' },
  confidencePct: { type: Number, default: 80 },
  notes: { type: String, default: '' },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast queries by user and date
mealSchema.index({ user: 1, loggedAt: -1 });

module.exports = mongoose.model('Meal', mealSchema);
