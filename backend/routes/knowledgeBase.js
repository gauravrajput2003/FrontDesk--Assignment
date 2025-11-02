const express = require('express');
const router = express.Router();

const { KnowledgeBase } = require('../models');

// Get knowledge base
router.get('/', async (req, res) => {
  try {
    const knowledge = await KnowledgeBase.find().sort({ createdAt: -1 });
    res.json({ success: true, knowledge });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Search knowledge base
router.get('/search', async (req, res) => {
  try {
    const { question } = req.query;

    if (!question) {
      return res.status(400).json({ error: 'Question parameter is required' });
    }

    // Use model static that prefers text search then regex
    const results = await KnowledgeBase.searchByQuestion(question);

    // Update usage stats for the top result
    if (results.length > 0) {
      await KnowledgeBase.updateOne(
        { _id: results[0]._id },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date() },
        }
      );
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

module.exports = router;
