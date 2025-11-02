const express = require('express');
const router = express.Router();

// Lazy import OpenAI to avoid startup errors if key missing
let OpenAI;
try { OpenAI = require('openai'); } catch (_) {}

/**
 * POST /api/tts
 * Body: { text: string, voice?: string, format?: 'mp3'|'wav' }
 * Returns audio bytes (audio/mpeg default)
 */
router.post('/', async (req, res) => {
  try {
    if (!OpenAI) {
      return res.status(500).json({ error: 'OpenAI SDK not installed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    const { text, voice = 'alloy', format = 'mp3' } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const openai = new OpenAI({ apiKey });

    // OpenAI TTS (gpt-4o-mini-tts)
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text.trim(),
      format,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', format === 'wav' ? 'audio/wav' : 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({ error: 'Failed to generate TTS audio' });
  }
});

module.exports = router;
