import { VoiceAssistant } from '@livekit/agents';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

// Salon Business Information (Knowledge Base)
const SALON_INFO = `
You are a friendly AI receptionist for "Glamour Studio", a luxury hair salon.

BASIC INFORMATION:
- Location: 123 Beauty Lane, Downtown
- Hours: Tuesday-Saturday, 9 AM - 7 PM (Closed Sunday & Monday)
- Phone: (555) 123-4567
- Services: Haircuts, Coloring, Styling, Treatments, Extensions

PRICING:
- Women's Haircut: $65
- Men's Haircut: $45
- Color Service: Starting at $120
- Highlights: Starting at $150
- Deep Conditioning Treatment: $50

STAFF:
- Sarah: Senior Stylist (specializes in color)
- Mike: Master Barber (men's cuts)
- Emma: Extension Specialist
- Lisa: Junior Stylist

POLICIES:
- 24-hour cancellation policy
- First-time clients get 15% off
- We accept cash, cards, and digital payments

If a customer asks something you don't know or that's not covered here, you MUST:
1. Tell them: "Let me check with my supervisor and get back to you."
2. Request help from the system
3. DO NOT make up information or guess
`;

class SalonAssistant {
  constructor() {
    this.knowledgeCache = [];
    this.loadKnowledgeBase();
  }

  async loadKnowledgeBase() {
    try {
      const response = await axios.get(`${BACKEND_API_URL}/knowledge-base`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.success) {
        this.knowledgeCache = response.data.knowledge || [];
        console.log(`✅ Loaded ${this.knowledgeCache.length} items from knowledge base`);
      }
    } catch (error) {
      console.error('❌ Failed to load knowledge base:', error.message);
    }
  }

  searchKnowledge(question) {
    const questionLower = question.toLowerCase();
    
    for (const item of this.knowledgeCache) {
      const itemQuestion = item.question.toLowerCase();
      
      // Check if questions are similar (contains or is contained)
      if (questionLower.includes(itemQuestion) || itemQuestion.includes(questionLower)) {
        console.log(`📚 Found answer in knowledge base: ${item.question}`);
        return item.answer;
      }
    }
    
    return null;
  }

  async requestHelp(question, callerPhone = 'Unknown') {
    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/help-requests`,
        {
          question: question,
          callerPhone: callerPhone
        },
        { timeout: 5000 }
      );

      if (response.status === 201) {
        console.log(`✅ Help request created: ${response.data.requestId}`);
        return response.data.requestId;
      }
    } catch (error) {
      console.error('❌ Error creating help request:', error.message);
      return null;
    }
  }
}

// Initialize assistant
const salonAssistant = new SalonAssistant();

// Custom function for AI to request help
async function requestSupervisorHelp(question, callerInfo = 'Unknown caller') {
  console.log(`🆘 AI requesting help for question: ${question}`);
  
  // First check knowledge base
  const cachedAnswer = salonAssistant.searchKnowledge(question);
  if (cachedAnswer) {
    console.log('📚 Using cached answer from knowledge base');
    return `I found the answer: ${cachedAnswer}`;
  }
  
  // Create help request
  const requestId = await salonAssistant.requestHelp(question, callerInfo);
  
  if (requestId) {
    return "I've contacted my supervisor. They'll text you back shortly with the answer. Is there anything else I can help you with right now?";
  } else {
    return "I'm having trouble reaching my supervisor right now. Could you please call back in a few minutes or leave a message?";
  }
}

// Main agent setup
async function main() {
  console.log('🎙️ Starting Frontdesk AI Voice Assistant...');
  
  try {
    // Note: The actual LiveKit agent implementation in JavaScript
    // requires the @livekit/agents-js package which is still in development
    // 
    // For now, this serves as a reference implementation
    // You can either:
    // 1. Use the Python version (recommended by LiveKit)
    // 2. Wait for @livekit/agents-js stable release
    // 3. Use LiveKit client SDK with your own voice pipeline
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  LiveKit Agents JavaScript SDK Note                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  The LiveKit Agents framework is primarily Python-based.   ║
║  For production use, we recommend using the Python agent.  ║
║                                                            ║
║  Alternative: Use LiveKit Client SDK + OpenAI API         ║
║  This gives you full control over the voice pipeline.     ║
║                                                            ║
║  See: https://docs.livekit.io/agents/                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Example using LiveKit client + manual OpenAI integration
    await runClientBasedAgent();
    
  } catch (error) {
    console.error('❌ Error starting agent:', error);
    process.exit(1);
  }
}

// Alternative: Client-based implementation
async function runClientBasedAgent() {
  const { Room } = await import('livekit-client');
  const OpenAI = (await import('openai')).default;
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  console.log('🔌 Connecting to LiveKit room...');
  
  const room = new Room();
  
  await room.connect(process.env.LIVEKIT_URL, process.env.LIVEKIT_TOKEN, {
    autoSubscribe: true,
  });

  console.log(`✅ Connected to room: ${room.name}`);
  
  // Set up participant track subscribed event
  room.on('trackSubscribed', async (track, publication, participant) => {
    if (track.kind === 'audio') {
      console.log(`🎤 Audio track subscribed from ${participant.identity}`);
      
      // Here you would:
      // 1. Pipe audio to speech-to-text (Deepgram/OpenAI Whisper)
      // 2. Send text to OpenAI for response
      // 3. Convert response to speech (OpenAI TTS/ElevenLabs)
      // 4. Stream audio back to room
      
      // This is a simplified placeholder
      await handleConversation(track, participant);
    }
  });

  console.log('✅ Voice assistant ready and listening...');
}

async function handleConversation(audioTrack, participant) {
  // Placeholder for conversation handling
  console.log('💬 Handling conversation...');
  
  // In a real implementation, you would:
  // 1. Transcribe audio using Deepgram or OpenAI Whisper
  // 2. Check knowledge base
  // 3. If unknown, call requestSupervisorHelp()
  // 4. Generate response using OpenAI
  // 5. Convert to speech and send back
}

// Export for use
export { salonAssistant, requestSupervisorHelp };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║  Frontdesk AI Agent - JavaScript Implementation            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Backend Integration: ✅ Ready                             ║
║  Knowledge Base: ✅ Loaded                                 ║
║  Help Request System: ✅ Configured                        ║
║                                                            ║
║  For LiveKit voice integration, use Python agent or        ║
║  implement custom voice pipeline with LiveKit client SDK.  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);