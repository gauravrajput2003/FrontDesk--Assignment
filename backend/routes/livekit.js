const express = require('express');
const { AccessToken } = require('livekit-server-sdk');

const router = express.Router();

/**
 * POST /api/livekit/token
 * Body: { room: string, identity: string, ttl?: string, canPublish?: boolean, canSubscribe?: boolean }
 * Returns: { token }
 */
router.post('/token', async (req, res) => {
  try {
    const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ error: 'LIVEKIT_API_KEY and LIVEKIT_API_SECRET are not configured' });
    }

    const {
      room = 'frontdesk-demo',
      identity = `agent-${Math.random().toString(36).slice(2, 8)}`,
      ttl = '10m',
      canPublish = true,
      canSubscribe = true,
    } = req.body || {};

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      ttl,
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish,
      canSubscribe,
    });

    const token = await at.toJwt();
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Error creating LiveKit token:', error);
    return res.status(500).json({ error: 'Failed to create LiveKit token' });
  }
});

/**
 * Optional convenience GET endpoint for quick testing:
 * GET /api/livekit/token?room=...&identity=...
 */
router.get('/token', async (req, res) => {
  try {
    const { room, identity } = req.query;
    req.body = {
      room: room || undefined,
      identity: identity || undefined,
    };
    return router.handle(req, res);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request' });
  }
});

module.exports = router;
