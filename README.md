# Frontdesk AI Supervisor - Human-in-the-Loop System

A production-ready AI receptionist system with intelligent human escalation, knowledge base learning, and supervisor management interface.

## 🎯 Project Overview

This system enables an AI voice agent to:
- Handle customer calls autonomously
- Escalate to human supervisors when uncertain
- Learn from supervisor responses
- Build a knowledge base over time
- Track request lifecycle (pending → resolved/timeout)

## 🏗️ Architecture

```
┌─────────────────┐
│  Voice Agent    │  ← AI Voice Assistant
│ (LiveKit opt.)  │
└────────┬────────┘
         │
         │ API Calls
         ↓
┌─────────────────┐
│  Express API    │  ← Backend Server
│   (Node.js)     │
└────────┬────────┘
         │
         │ MongoDB
         ↓
┌─────────────────┐
│   Database      │  ← Data Storage
│   (MongoDB)     │
└─────────────────┘
         ↑
         │ REST API
         │
┌─────────────────┐
│  React UI       │  ← Supervisor Dashboard
│  (Frontend)     │
└─────────────────┘
```

## 🗂️ Database Schema

### Help Requests Collection
```javascript
{
  _id: ObjectId,
  question: String,           // Customer's question
  callerPhone: String,        // Customer phone number
  status: Enum,              // 'pending' | 'resolved' | 'timeout'
  answer: String,            // Supervisor's answer (null if pending)
  resolvedAt: Date,          // When resolved (null if pending)
  resolvedBy: String,        // Supervisor name (null if pending)
  createdAt: Date,           // Request creation time
  timeoutAt: Date            // Auto-timeout time (30 min default)
}
```

### Knowledge Base Collection
```javascript
{
  _id: ObjectId,
  question: String,          // Original question
  answer: String,            // Learned answer
  createdAt: Date,          // When added to KB
  usageCount: Number,       // Times this answer was used
  lastUsed: Date            // Last usage timestamp
}
```

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Optional: LiveKit/OpenAI keys for voice agent experimentation

## 🚀 Setup Instructions

### 1. Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Agent (Node simulator)
cd ../agent
npm install
```

### 2. Environment Configuration

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/frontdesk-ai
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/frontdesk-ai
```

**Agent (.env.local)**
```env
BACKEND_API_URL=http://localhost:5000/api
# Optional for LiveKit/OpenAI experiments
LIVEKIT_URL=
LIVEKIT_TOKEN=
OPENAI_API_KEY=
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/data
```

**Option B: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update MONGODB_URI in backend/.env

### 4. LiveKit (Optional)

You can run the JS agent simulator without any external keys. If you want to experiment with real-time voice via LiveKit, add LIVEKIT_URL/LIVEKIT_TOKEN to agent/.env.local and extend `agent/agent.js`.

### 5. API Keys Setup

**OpenAI:**
1. Visit https://platform.openai.com
2. Create API key
3. Add to agent/.env.local

**Deepgram:**
1. Visit https://deepgram.com (free $200 credit)
2. Create API key
3. Add to agent/.env.local

## 🎮 Running the System

### Terminal 1 - Backend Server
```powershell
cd backend
npm run dev
# ✅ MongoDB Connected
# 🚀 Server running on port 5000
```

### Terminal 2 - Frontend UI
```powershell
cd frontend
npm run dev
# Vite dev server at http://localhost:5173 (or 3000 depending on config)
```

### Terminal 3 - AI Agent Simulator (CLI)
```powershell
cd agent
npm run interactive   # type your questions
# or
npm run test          # runs a short test suite
```

## 📞 Testing the System

### Option 1: Using LiveKit Playground
1. Go to your LiveKit dashboard
2. Open "Playground"
3. Connect to your agent's room
4. Start talking!

### Option 2: Simulated Testing
Use the agent simulator. Try known and unknown questions:

- Known: "What are your hours?" → answered by AI
- Unknown: "Do you offer bridal packages?" → escalated; appears in UI

### Test Flow:
1. **AI receives call** → Answers basic questions from SALON_INFO
2. **Unknown question** → AI says "Let me check with my supervisor"
3. **Help request created** → Appears in supervisor dashboard (auto-refreshes)
4. **Supervisor responds** → Types answer and submits
5. **Customer notified** → Simulated via console log
6. **Knowledge base updated** → Answer saved for future use
7. **Next call** → AI can answer the same question automatically

## 🎯 Key Features Implemented

### ✅ Core Requirements
- [x] AI agent receives and handles calls
- [x] Intelligent escalation when uncertain
- [x] Help request creation with lifecycle tracking
- [x] Supervisor notification (console logs)
- [x] Supervisor UI for viewing/responding
- [x] Customer follow-up (simulated)
- [x] Knowledge base auto-updates
- [x] Timeout handling (30-minute default)

### 🎨 Design Highlights
- **Clean separation of concerns**: Agent, API, UI, Database
- **RESTful API design**: Standard HTTP methods and status codes
- **Automatic timeout checker**: Background job runs every 5 minutes
- **Real-time UI updates**: Auto-refresh pending requests every 10 seconds
- **Error handling**: Try-catch blocks throughout
- **Scalable database schema**: Indexed fields, efficient queries

### 🚀 Scalability Considerations

**Current (10/day) → Future (1,000/day)**

1. **Database Optimization**
   - Add indexes: `{ status: 1, createdAt: -1 }`
   - Add text index on questions for better search
   - Consider sharding by date

2. **API Performance**
   - Implement pagination for list endpoints
   - Add Redis caching for knowledge base
   - Rate limiting with express-rate-limit

3. **Agent Scaling**
   - Deploy multiple agent instances
   - Use LiveKit's built-in load balancing
   - Implement connection pooling

4. **Monitoring**
   - Add logging (Winston/Morgan)
   - Implement health checks
   - Set up alerts for timeout rate

## 📊 API Endpoints

```
POST   /api/agent/incoming-call           Agent flow: answer or escalate
POST   /api/help-requests                 Create help request
GET    /api/help-requests                 List requests (?status=pending|resolved|timeout)
GET    /api/help-requests/:id             Get single request
POST   /api/help-requests/:id/resolve     Resolve request with answer
POST   /api/help-requests/check-timeouts  Manual timeout check
GET    /api/knowledge-base                List learned answers
GET    /api/knowledge-base/search         Search knowledge base
GET    /health                            Health check
```

## 🔧 Configuration Options

### Timeout Duration
Change in `backend/server.js`:
```javascript
timeoutAt: { type: Date, default: () => Date.now() + 30 * 60 * 1000 }
// Modify the 30 (minutes) as needed
```

### Auto-refresh Interval
Change in `frontend/src/App.jsx`:
```javascript
const interval = setInterval(() => {
  fetchRequests('pending');
}, 10000); // 10 seconds, adjust as needed
```

### Salon Information
Modify the built-in knowledge in `agent/agent_simulator.js` (SALON_KNOWLEDGE) and prompt in `agent/agent.js`.

## 🐛 Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongosh` (should connect)
- Verify .env file exists with correct MONGODB_URI

**Agent won't connect:**
- Verify LiveKit credentials in .env.local
- Check LIVEKIT_URL format: `wss://your-project.livekit.cloud`
- Ensure OpenAI/Deepgram API keys are valid

**Frontend can't connect to backend:**
- Check backend is running on port 5000
- Update API_URL in App.jsx if backend port changed
- Enable CORS (already configured)

**Help requests not appearing:**
- Check browser console for errors
- Verify backend API is accessible
- Test endpoint directly: `curl http://localhost:5000/api/help-requests`

## 🎥 Video Demo Script

1. **Show the architecture** (draw.io diagram or whiteboard)
2. **Start all services** (3 terminals side-by-side)
3. **Test the flow:**
   - Create help request via API or agent call
   - Show it appearing in supervisor UI
   - Submit an answer
   - Show console logs (customer notification)
   - Verify knowledge base update
4. **Explain design decisions:**
   - Database schema choices
   - API structure
   - Timeout handling
   - Scalability approach
5. **Discuss improvements:**
   - Add webhook integrations (Twilio)
   - Implement vector search for KB
   - Add analytics dashboard
   - Deploy to production (Railway/Vercel)

## 🚧 Future Improvements (Phase 2)

1. **Live call transfer**: 
   - Check supervisor availability
   - Offer to transfer or leave message
   - WebRTC connection handling

2. **Enhanced knowledge base**:
   - Vector embeddings for semantic search
   - Confidence scores for answers
   - Auto-categorization

3. **Analytics dashboard**:
   - Response time metrics
   - Resolution rate tracking
   - Common questions analysis

4. **Production features**:
   - Real SMS integration (Twilio)
   - Email notifications
   - Multi-supervisor routing
   - Priority queuing

## 📝 Design Decisions

### 1. Database Choice: MongoDB
**Why?** Flexible schema for evolving requirements, easy to scale, native JSON support matches API responses.

### 2. Request Lifecycle: 3 States
**Why?** Simple but complete: pending (actionable), resolved (success), timeout (automatic cleanup).

### 3. 30-Minute Timeout
**Why?** Balances customer expectations with supervisor availability. Configurable for different scenarios.

### 4. Knowledge Base Auto-Update
**Why?** Self-improving system. Each resolution makes the AI smarter, reducing future escalations.

### 5. Console Log Simulation
**Why?** Faster development. Easy to replace with real webhooks/SMS without changing architecture.

### 6. Simple UI Design
**Why?** Internal tool focus. Prioritized functionality over aesthetics, but still professional.

## 📦 Deployment Ready

Backend: Railway/Render/Heroku
Frontend: Vercel/Netlify
Database: MongoDB Atlas
Agent: Any Node-compatible host (simulator) or Python env (LiveKit agents)

## 📄 License

MIT License - Free to use and modify

## 🤝 Contact

For questions about this implementation, reach out during the interview process.

---

**Total Implementation Time**: ~12-15 hours
**Lines of Code**: ~800 (excluding dependencies)
**Test Coverage**: Manual testing (automated tests can be added)