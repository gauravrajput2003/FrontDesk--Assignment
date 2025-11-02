import axios from 'axios';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

// Salon Knowledge Base
const SALON_KNOWLEDGE = {
  'hours': 'We are open Tuesday through Saturday, 9 AM to 7 PM. We are closed on Sunday and Monday.',
  'location': 'We are located at 123 Beauty Lane, Downtown.',
  'phone': 'You can reach us at (555) 123-4567.',
  'services': 'We offer haircuts, coloring, styling, treatments, and extensions.',
  'price haircut women': "Women's haircuts are $65.",
  'price haircut men': "Men's haircuts are $45.",
  'price color': 'Color services start at $120.',
  'price highlights': 'Highlights start at $150.',
  'price treatment': 'Deep conditioning treatments are $50.',
  'staff': 'Our staff includes Sarah (Senior Stylist specializing in color), Mike (Master Barber), Emma (Extension Specialist), and Lisa (Junior Stylist).',
  'cancellation': 'We have a 24-hour cancellation policy.',
  'discount': 'First-time clients receive 15% off their service.',
  'payment': 'We accept cash, cards, and digital payments.'
};

class AIReceptionist {
  constructor() {
    this.knowledgeBase = SALON_KNOWLEDGE;
    this.learnedAnswers = [];
    this.conversationHistory = [];
    this.loadLearnedAnswers();
  }

  async loadLearnedAnswers() {
    try {
      const response = await axios.get(`${BACKEND_API_URL}/knowledge-base`);
      if (response.data.success) {
        this.learnedAnswers = response.data.knowledge;
        console.log(`📚 Loaded ${this.learnedAnswers.length} learned answers from knowledge base\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not load learned answers (backend might be down)\n');
    }
  }

  findAnswer(question) {
    const lowerQuestion = question.toLowerCase();

    // First check learned answers (from supervisor responses)
    for (const item of this.learnedAnswers) {
      if (lowerQuestion.includes(item.question.toLowerCase()) || 
          item.question.toLowerCase().includes(lowerQuestion)) {
        console.log('✨ Using learned answer from knowledge base');
        return item.answer;
      }
    }

    // Then check built-in knowledge
    for (const [key, answer] of Object.entries(this.knowledgeBase)) {
      if (lowerQuestion.includes(key)) {
        return answer;
      }
    }

    return null;
  }

  async createHelpRequest(question, callerPhone = '+1555000000') {
    try {
      console.log('\n🆘 AI Agent: "Let me check with my supervisor and get back to you."\n');
      
      const response = await axios.post(`${BACKEND_API_URL}/help-requests`, {
        question,
        callerPhone
      });

      if (response.data.success) {
        console.log(`✅ Help request created successfully`);
        console.log(`📋 Request ID: ${response.data.requestId}`);
        console.log(`📱 Customer will receive callback at: ${callerPhone}`);
        console.log(`\n👉 Open http://localhost:3000 to respond as supervisor\n`);
        return response.data.requestId;
      }
    } catch (error) {
      console.error('❌ Failed to create help request:', error.message);
      return null;
    }
  }

  async handleQuestion(question, callerPhone = '+1555000000') {
    console.log(`\n👤 Customer: "${question}"\n`);
    
    // Try to find answer in knowledge base
    const answer = this.findAnswer(question);

    if (answer) {
      console.log(`🤖 AI Agent: "${answer}"\n`);
      return { answered: true, answer };
    } else {
      // Need to escalate
      const requestId = await this.createHelpRequest(question, callerPhone);
      return { answered: false, requestId };
    }
  }
}

// Interactive CLI
async function runInteractiveMode() {
  const agent = new AIReceptionist();
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎙️  Frontdesk AI Voice Agent Simulator                   ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  This simulator demonstrates the AI agent's ability to:    ║
║  • Answer questions from its knowledge base                ║
║  • Escalate unknown questions to supervisors              ║
║  • Learn from supervisor responses                        ║
║                                                            ║
║  Commands:                                                 ║
║  - Type your question and press Enter                      ║
║  - Type 'reload' to refresh learned answers                ║
║  - Type 'exit' to quit                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  console.log('💡 Try asking:');
  console.log('   • "What are your hours?"');
  console.log('   • "How much is a haircut?"');
  console.log('   • "Do you offer bridal packages?" (will escalate)');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '👤 Customer: '
  });

  rl.prompt();

  rl.on('line', async (input) => {
    const question = input.trim();

    if (!question) {
      rl.prompt();
      return;
    }

    if (question.toLowerCase() === 'exit') {
      console.log('\n👋 Thank you for calling Glamour Studio!\n');
      process.exit(0);
    }

    if (question.toLowerCase() === 'reload') {
      console.log('\n🔄 Reloading learned answers...');
      await agent.loadLearnedAnswers();
      rl.prompt();
      return;
    }

    await agent.handleQuestion(question);
    
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  });
}

// Automated test mode
async function runTestMode() {
  const agent = new AIReceptionist();
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🧪 Running Automated Tests                                ║
╚════════════════════════════════════════════════════════════╝
  `);

  const testQuestions = [
    { question: "What are your hours?", shouldKnow: true },
    { question: "How much is a women's haircut?", shouldKnow: true },
    { question: "Do you offer Sunday appointments?", shouldKnow: false },
    { question: "Where are you located?", shouldKnow: true },
    { question: "Do you have bridal packages?", shouldKnow: false },
    { question: "What's your cancellation policy?", shouldKnow: true }
  ];

  let knownCount = 0;
  let escalatedCount = 0;

  for (const test of testQuestions) {
    const result = await agent.handleQuestion(test.question, `+155500${escalatedCount}`);
    
    if (result.answered) {
      knownCount++;
    } else {
      escalatedCount++;
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  📊 Test Summary                                           ║
╠════════════════════════════════════════════════════════════╣
║  Total Questions: ${testQuestions.length}                                          ║
║  Answered by AI: ${knownCount}                                           ║
║  Escalated to Supervisor: ${escalatedCount}                                  ║
╚════════════════════════════════════════════════════════════╝

👉 Open http://localhost:3000 to respond as supervisor
👉 After responding, run this script again to see AI use learned answers
  `);
}

// Main entry point
const mode = process.argv[2] || 'interactive';

if (mode === 'test') {
  runTestMode().catch(console.error);
} else {
  runInteractiveMode().catch(console.error);
}

export { AIReceptionist };