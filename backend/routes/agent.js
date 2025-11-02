const express = require('express');
const router = express.Router();

const { HelpRequest, KnowledgeBase } = require('../models');

// Agent incoming call: check KB, respond or escalate
router.post('/incoming-call', async (req, res) => {
  try {
    const { question, callerPhone = '+1555000000' } = req.body || {};

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Try KB search
    const results = await KnowledgeBase.searchByQuestion(question);
    if (results.length > 0) {
      const top = results[0];
      await KnowledgeBase.updateOne(
        { _id: top._id },
        { $inc: { usageCount: 1 }, $set: { lastUsed: new Date() } }
      );

      console.log(`🤖 AI Agent answered from KB: ${top.question}`);
      return res.json({ success: true, answered: true, answer: top.answer });
    }

    // Escalate: create help request
    console.log('🆘 AI Agent: "Let me check with my supervisor and get back to you."');
    const helpRequest = new HelpRequest({ question, callerPhone });
    await helpRequest.save();

    // Simulate supervisor notification
    console.log(`📞 SUPERVISOR ALERT: New help request from ${callerPhone}`);
    console.log(`   Question: "${question}"`);
    console.log(`   Request ID: ${helpRequest._id}`);

    return res.status(201).json({
      success: true,
      answered: false,
      requestId: helpRequest._id,
      message: 'Escalated to supervisor',
    });
  } catch (error) {
    console.error('Error handling incoming call:', error);
    res.status(500).json({ error: 'Failed to handle incoming call' });
  }
});

module.exports = router;
