# LiveKit Voice Agent (Python)

This agent connects to your LiveKit room and speaks to you. It searches your backend Knowledge Base and escalates to a supervisor (creates a help request) when it doesn't know an answer.

## Prerequisites

- Python 3.10+
- LiveKit Cloud (or self-hosted) project
- Environment variables:
  - LIVEKIT_URL=wss://your-project.livekit.cloud
  - LIVEKIT_API_KEY=lk_api_xxx
  - LIVEKIT_API_SECRET=lk_secret_xxx
  - OPENAI_API_KEY=sk-...
  - Optional: DEEPGRAM_API_KEY if you prefer Deepgram STT (recommended)
  - BACKEND_API_URL=http://localhost:5000/api

## Install

```powershell
cd "d:\FrontDesk  Assignment\agent\python"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

There are two common ways to test:

1) Use LiveKit Playground to create/join a room (e.g., room: `frontdesk-demo`).
   Then run the agent to join the same room.

```powershell
# In the same terminal with the venv activated
$env:LIVEKIT_URL="wss://your-project.livekit.cloud"
$env:LIVEKIT_API_KEY="your_api_key"
$env:LIVEKIT_API_SECRET="your_api_secret"
$env:OPENAI_API_KEY="sk-your-openai-key"
$env:BACKEND_API_URL="http://localhost:5000/api"
python voice_agent.py
```

2) Use your own token flow (advanced). For quick demo, option (1) is fine.

## What to demo

- Speak: "What are your hours?" → Agent responds from KB (if present) or its prompt.
- Speak: "Do you offer bridal packages?" → Agent says it will check with a supervisor and creates a help request (visible in the supervisor UI).
- Submit an answer in the UI → Next time you ask, the agent answers from the Knowledge Base.

## Notes

- The agent uses OpenAI TTS to speak; Deepgram (if configured) for more robust STT.
- The decision to answer vs escalate is controlled in `on_user_message` using your backend endpoints.
