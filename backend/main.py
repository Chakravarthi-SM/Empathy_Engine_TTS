"""
Empathy Engine — Main FastAPI Application
Emotion-aware conversational TTS system for customer interactions.

Endpoints:
  POST /generate-audio     — Full pipeline: emotion → voice → TTS → audio
  GET  /health             — Health check
  WS   /ws/{session_id}    — WebSocket for real-time processing updates
  GET  /audio/{filename}   — Serve generated audio files
"""

import os
import time
import uuid
import json
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger("empathy_engine")

# Import engine modules
from engine.emotion_detector import detect_emotion
from engine.confidence_handler import handle_confidence
from engine.behavioral_mapper import map_to_behavioral_state
from engine.context_analyzer import analyze_context
from engine.intensity_detector import detect_intensity
from engine.voice_personality import generate_voice_params
from engine.tts_engine import generate_speech, init_sarvam
from engine.conversation_memory import (
    init_redis, add_interaction, get_emotion_history,
    get_emotion_trend, get_cached_response, cache_response
)

# Audio output directory
AUDIO_DIR = Path(__file__).parent / "audio_output"
AUDIO_DIR.mkdir(exist_ok=True)


# ─── Lifespan ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Empathy Engine starting up...")

    # Initialize Redis
    redis_url = os.getenv("REDIS_URL")
    init_redis(redis_url)

    # Initialize Sarvam AI
    api_key = os.getenv("SARVAM_API_KEY")
    init_sarvam(api_key)
    
    # Pre-load emotion model in background
    logger.info("Pre-loading emotion detection model...")
    try:
        detect_emotion("warmup")
        logger.info("✅ Emotion model loaded.")
    except Exception as e:
        logger.error(f"⚠️ Model pre-load failed (will retry on first request): {e}")

    logger.info("✅ Empathy Engine ready!")
    yield
    logger.info("👋 Empathy Engine shutting down.")


# ─── FastAPI App ───────────────────────────────────────────────────

app = FastAPI(
    title="Empathy Engine",
    description="Emotion-aware conversational TTS system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve audio files
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


# ─── Models ────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    mode: str = Field(default="support", pattern="^(sales|support)$")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class GenerateResponse(BaseModel):
    audio_url: str | None
    state: str
    intensity: str
    confidence: float
    response_time: float
    emotion_trend: str
    voice_description: str
    voice_params: dict
    escalation_level: int
    context_signals: list
    fallback_applied: bool
    cached: bool



# ─── WebSocket Manager ────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[session_id] = websocket

    def disconnect(self, session_id: str):
        self.connections.pop(session_id, None)

    async def send_update(self, session_id: str, stage: str, data: dict = None):
        ws = self.connections.get(session_id)
        if ws:
            try:
                msg = {"stage": stage, "data": data or {}}
                await ws.send_json(msg)
            except Exception:
                pass


manager = ConnectionManager()


# ─── WebSocket Endpoint ───────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"stage": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(session_id)


# ─── Main Pipeline Endpoint ───────────────────────────────────────

@app.post("/generate-audio", response_model=GenerateResponse)
async def generate_audio(request: GenerateRequest):
    """
    Full emotion-aware TTS pipeline.

    Flow:
    1. Check cache → return instantly if hit
    2. Analyze context
    3. Detect emotion
    4. Handle confidence (with context refinement)
    5. Map to behavioral state (with adaptive history)
    6. Detect intensity
    7. Generate voice parameters
    8. Generate speech (ElevenLabs)
    9. Store interaction in memory
    10. Cache and return response
    """
    start_time = time.time()
    session_id = request.session_id
    text = request.text.strip()
    mode = request.mode

    # Validate input
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # ─── Step 0: Check cache ────────────────────────────────────
    await manager.send_update(session_id, "checking_cache")

    cached = get_cached_response(text, mode, session_id)
    if cached:
        cached["cached"] = True
        cached["response_time"] = round(time.time() - start_time, 3)
        cached["emotion_trend"] = get_emotion_trend(session_id)
        await manager.send_update(session_id, "cache_hit", cached)
        return GenerateResponse(**cached)

    # ─── Step 1: Context Analysis ────────────────────────────────
    await manager.send_update(session_id, "analyzing_context")
    context = await asyncio.to_thread(analyze_context, text)
    await asyncio.sleep(0.1)  # Small delay for UX stage visibility

    # ─── Step 2: Emotion Detection ───────────────────────────────
    await manager.send_update(session_id, "detecting_emotion")
    emotion_result = await asyncio.to_thread(detect_emotion, text)
    await asyncio.sleep(0.1)

    # ─── Step 3: Confidence Handling ─────────────────────────────
    await manager.send_update(session_id, "evaluating_confidence")
    emotion_result = handle_confidence(emotion_result, context)

    # ─── Step 4: Behavioral State Mapping ────────────────────────
    await manager.send_update(session_id, "mapping_behavior")
    emotion_history = get_emotion_history(session_id)
    behavior = map_to_behavioral_state(emotion_result["emotion"], emotion_history)
    state = behavior["state"]
    escalation_level = behavior["escalation_level"]

    # ─── Step 5: Intensity Detection ─────────────────────────────
    await manager.send_update(session_id, "detecting_intensity")
    intensity_result = detect_intensity(text, emotion_result["emotion"])
    intensity = intensity_result["level"]

    # ─── Step 6: Voice Parameter Generation ──────────────────────
    await manager.send_update(session_id, "generating_voice_params")
    voice_params = generate_voice_params(
        state=state,
        intensity=intensity,
        mode=mode,
        escalation_level=escalation_level
    )

    # ─── Step 7: TTS Generation ──────────────────────────────────
    await manager.send_update(session_id, "generating_speech")
    tts_input_params = {
    **voice_params,
    "mode": mode,
    "state": state
    }

    tts_result = await asyncio.to_thread(
        generate_speech, text, tts_input_params
    )
    if not tts_result["success"]:
        # TTS failed — return text response with retry option
        await manager.send_update(session_id, "tts_failed", {
            "error": tts_result["error"]
        })
        response_time = round(time.time() - start_time, 3)
        return GenerateResponse(
            audio_url=None,
            state=state,
            intensity=intensity,
            confidence=emotion_result["confidence"],
            response_time=response_time,
            emotion_trend=get_emotion_trend(session_id),
            voice_description=voice_params["voice_description"],
            escalation_level=escalation_level,
            context_signals=context.get("signals", []),
            fallback_applied=emotion_result.get("fallback_applied", False),
            cached=False
        )

    # ─── Step 8: Store in memory ─────────────────────────────────
    await manager.send_update(session_id, "storing_memory")
    add_interaction(session_id, {
        "text": text,
        "mode": mode,
        "state": state,
        "intensity": intensity,
        "confidence": emotion_result["confidence"],
        "escalation_level": escalation_level,
    })

    # ─── Step 9: Build response ──────────────────────────────────
    response_time = round(time.time() - start_time, 3)
    emotion_trend = get_emotion_trend(session_id)

    response_data = {
        "audio_url": tts_result["audio_url"],
        "state": state,
        "intensity": intensity,
        "confidence": emotion_result["confidence"],
        "response_time": response_time,
        "emotion_trend": emotion_trend,
        "voice_description": voice_params["voice_description"],
        "voice_params": {
            "speed": voice_params.get("speed"),
            "stability": voice_params.get("stability"),
            "style": voice_params.get("style"),
        },
        "escalation_level": escalation_level,
        "context_signals": context.get("signals", []),
        "fallback_applied": emotion_result.get("fallback_applied", False),
        "cached": False
    }

    # Cache the response (without audio_url since that changes per request)
    cache_response(text, mode, session_id, {**response_data, "audio_url": tts_result["audio_url"]})

    await manager.send_update(session_id, "complete", response_data)

    logger.info(
        f"✅ Pipeline complete: state={state}, intensity={intensity}, "
        f"confidence={emotion_result['confidence']:.2f}, time={response_time}s, trend={emotion_trend}"
    )

    return GenerateResponse(**response_data)


# ─── Health Check ──────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Empathy Engine",
        "version": "1.0.0"
    }


# ─── Run ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
