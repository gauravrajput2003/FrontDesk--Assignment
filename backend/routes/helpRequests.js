const express = require('express');
const router = express.Router();

const { HelpRequest, KnowledgeBase } = require('../models');

// Create Help Request (called by AI agent)
router.post('/', async (req, res) => {
  try {
    const { question, callerPhone } = req.body;

    if (!question || !callerPhone) {
      return res.status(400).json({ error: 'Question and callerPhone are required' });
    }

    const helpRequest = new HelpRequest({ question, callerPhone });
    await helpRequest.save();

    // Simulate supervisor notification
    console.log(`📞 SUPERVISOR ALERT: New help request from ${callerPhone}`);
    console.log(`   Question: "${question}"`);
    console.log(`   Request ID: ${helpRequest._id}`);

    res.status(201).json({
      success: true,
      requestId: helpRequest._id,
      message: 'Help request created successfully',
    });
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(500).json({ error: 'Failed to create help request' });
  }
});

// Get all help requests (for supervisor UI)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await HelpRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Failed to fetch help requests' });
  }
});

// Get single help request
router.get('/:id', async (req, res) => {
  try {
    const request = await HelpRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ success: true, request });
  } catch (error) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ error: 'Failed to fetch help request' });
  }
});

// Resolve help request (supervisor submits answer)
router.post('/:id/resolve', async (req, res) => {
  try {
    const { answer, supervisorName } = req.body;

    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const request = await HelpRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already resolved or timed out' });
    }

    // Update help request
    request.status = 'resolved';
    request.answer = answer;
    request.resolvedAt = new Date();
    request.resolvedBy = supervisorName || 'Supervisor';
    await request.save();

    // Add to knowledge base
    const knowledgeEntry = new KnowledgeBase({
      question: request.question,
      answer,
      sourceRequestId: request._id,
    });
    await knowledgeEntry.save();

    // Simulate text back to customer
    console.log(`📱 TEXTING CUSTOMER: ${request.callerPhone}`);
    console.log(`   Message: "Hi! Regarding your question: '${request.question}'"`);
    console.log(`   Answer: "${answer}"`);

    res.json({
      success: true,
      message: 'Request resolved and customer notified',
      request,
    });
  } catch (error) {
    console.error('Error resolving help request:', error);
    res.status(500).json({ error: 'Failed to resolve help request' });
  }
});

// Manual timeout checker
router.post('/check-timeouts', async (req, res) => {
  try {
    const count = await HelpRequest.timeoutExpiredRequests();
    res.json({ success: true, timedOutCount: count });
  } catch (error) {
    console.error('Error checking timeouts:', error);
    res.status(500).json({ error: 'Failed to check timeouts' });
  }
});

module.exports = router;
