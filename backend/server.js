const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/frontdesk-ai', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Models (used by background jobs)
const { HelpRequest } = require('./models');

// Routes
const helpRequestsRouter = require('./routes/helpRequests');
const knowledgeBaseRouter = require('./routes/knowledgeBase');
const agentRouter = require('./routes/agent');
const livekitRouter = require('./routes/livekit');
const ttsRouter = require('./routes/tts');

app.use('/api/help-requests', helpRequestsRouter);
app.use('/api/knowledge-base', knowledgeBaseRouter);
app.use('/api/agent', agentRouter);
app.use('/api/livekit', livekitRouter);
app.use('/api/tts', ttsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Periodic timeout check (every 5 minutes)
setInterval(async () => {
  try {
    if (HelpRequest && HelpRequest.timeoutExpiredRequests) {
      const count = await HelpRequest.timeoutExpiredRequests();
      if (count > 0) {
        console.log(`⏰ Timed out ${count} pending request(s)`);
      }
    }
  } catch (error) {
    console.error('Error in timeout checker:', error);
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});