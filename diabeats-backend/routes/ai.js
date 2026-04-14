const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route  POST /api/ai/analyze
// @desc   Proxy meal analysis to Anthropic API (keeps key server-side)
// @access Private
router.post('/analyze', protect, async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
      return res.status(503).json({ message: 'AI service not configured on server. Use client-side key.' });
    }

    const { prompt, imageBase64 } = req.body;

    const systemPrompt = `You are a clinical nutrition AI specialized in diabetes management. Return ONLY raw JSON, no markdown. Fields: meal_name, calories, carbohydrates_g, protein_g, fat_g, fiber_g, glycemic_index (low/medium/high), sugar_g, diabetes_advice (1-2 sentences), safety_level (safe/caution/avoid), confidence_pct (0-100). Respond in same language as user input.`;

    let userContent;
    if (imageBase64) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: prompt || 'Analyze this meal for a diabetic patient.' }
      ];
    } else {
      userContent = prompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ message: data.error.message });

    const text = data.content.map(i => i.text || '').join('');
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/ai/chat
// @desc   Proxy AI nutrition chat
// @access Private
router.post('/chat', protect, async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
      return res.status(503).json({ message: 'AI service not configured on server. Use client-side key.' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const systemPrompt = `You are DiaBEATS AI, a warm nutrition assistant specialized in diabetes management and African cuisine. Help patients with Type 1, Type 2, and gestational diabetes understand their diet. Keep responses concise (2-4 sentences), friendly, and practical. Always remind users to consult their doctor for medical decisions. Respond in the same language the user writes in.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ message: data.error.message });

    const text = data.content.map(i => i.text || '').join('');
    res.json({ reply: text });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
