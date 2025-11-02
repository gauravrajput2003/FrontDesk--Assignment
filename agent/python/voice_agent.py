# Minimal LiveKit voice agent integrated with your backend
# Requirements: see requirements.txt in this folder
# Env: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPENAI_API_KEY, BACKEND_API_URL

import os
import asyncio
import logging
import aiohttp

# LiveKit Agents (Python)
# Docs: https://docs.livekit.io/agents/
try:
    from livekit.agents import cli, WorkerOptions
    from livekit.agents.voice_assistant import VoiceAssistant
    from livekit.agents.llm import ChatContext
    from livekit.plugins import openai as lk_openai
    from livekit.plugins import silero
    from livekit.plugins import deepgram
except Exception as e:
    raise RuntimeError(
        "Missing livekit-agents or plugins. Install from requirements.txt"
    ) from e

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000/api")

logger = logging.getLogger("voice_agent")
logging.basicConfig(level=logging.INFO)


async def kb_search(session: aiohttp.ClientSession, question: str):
    url = f"{BACKEND_API_URL}/knowledge-base/search"
    try:
        async with session.get(url, params={"question": question}, timeout=8) as resp:
            data = await resp.json()
            if data.get("success") and data.get("results"):
                top = data["results"][0]
                return top.get("answer")
    except Exception as e:
        logger.warning(f"KB search failed: {e}")
    return None


async def create_help_request(session: aiohttp.ClientSession, question: str, caller_phone: str = "+1555000000"):
    url = f"{BACKEND_API_URL}/help-requests"
    payload = {"question": question, "callerPhone": caller_phone}
    try:
        async with session.post(url, json=payload, timeout=8) as resp:
            data = await resp.json()
            if data.get("success"):
                return data.get("requestId")
    except Exception as e:
        logger.warning(f"Create help request failed: {e}")
    return None


async def entrypoint(ctx):
    """
    LiveKit Agents entrypoint. Joins a room and runs a voice assistant that:
    - Listens to the caller
    - Searches your backend KB
    - Answers if known
    - Otherwise escalates and informs the caller
    """
    # VAD
    vad = silero.VAD.load()

    # STT (Deepgram highly reliable; you can switch to OpenAI Whisper if desired)
    dg_api_key = os.getenv("DEEPGRAM_API_KEY")
    stt = deepgram.STT(api_key=dg_api_key) if dg_api_key else lk_openai.STT()

    # TTS (OpenAI)
    tts = lk_openai.TTS(
        model="gpt-4o-mini-tts",
        voice="alloy",
    )

    # LLM (we'll use it for natural phrasing, but business logic is ours)
    llm = lk_openai.LLM(model="gpt-4o-mini")

    # System prompt: salon info and rules
    system_prompt = (
        "You are a friendly AI receptionist for 'Glamour Studio'.\n"
        "- Answer only if you are confident.\n"
        "- If unsure, say: 'Let me check with my supervisor and get back to you.'\n"
        "- Keep responses concise and professional.\n"
    )

    assistant = VoiceAssistant(
        ctx=ctx,
        vad=vad,
        stt=stt,
        tts=tts,
        llm=llm,
        chat_ctx=ChatContext(system=system_prompt),
    )

    async with aiohttp.ClientSession() as session:
        @assistant.on_user_message
        async def on_user_message(message: str):
            question = message.strip()
            if not question:
                return "Could you please repeat that?"

            # 1) Try KB
            answer = await kb_search(session, question)
            if answer:
                return answer

            # 2) Escalate
            await assistant.say("Let me check with my supervisor and get back to you.")
            await create_help_request(session, question, caller_phone=ctx.participant.identity or "+1555000000")
            return "Is there anything else I can help you with today?"

        await assistant.run()


if __name__ == "__main__":
    # LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET must be set in env
    cli.run(entrypoint, WorkerOptions(debug=True))
