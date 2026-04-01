"""
TTS Engine Module
Sarvam AI REST TTS integration with pause-friendly preprocessing.
Handles audio generation, storage, and error recovery.
"""

import os
import re
import time
import base64
import logging
from pathlib import Path

from sarvamai import SarvamAI

logger = logging.getLogger(__name__)

AUDIO_DIR = Path(__file__).parent.parent / "audio_output"
AUDIO_DIR.mkdir(exist_ok=True)

_client = None
_api_available = False


def init_sarvam(api_key: str = None):
    """Initialize Sarvam AI client."""
    global _client, _api_available

    if not api_key:
        logger.warning("No Sarvam API key. TTS unavailable.")
        _api_available = False
        return

    try:
        _client = SarvamAI(api_subscription_key=api_key)
        _api_available = True
        logger.info("Sarvam AI initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Sarvam AI: {e}")
        _api_available = False


def _prepare_text(
    text: str,
    max_chars: int = 500,
    mode: str = "support",
    state: str = "Neutral"
) -> str:
    """
    Clean and format text for more natural TTS delivery.
    Adds pause-friendly punctuation so speech sounds less robotic.
    """
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return ""

    # Normalize repeated punctuation
    cleaned = re.sub(r"\.{2,}", "...", cleaned)
    cleaned = re.sub(r"!{2,}", "!", cleaned)
    cleaned = re.sub(r"\?{2,}", "?", cleaned)

    # Add pauses after commas
    cleaned = re.sub(r",\s*", "... ", cleaned)

    # Add pauses before conversational transitions
    cleaned = re.sub(
        r"\s+(but|however|so|therefore|meanwhile|still|also|and then)\s+",
        r"... \1 ",
        cleaned,
        flags=re.IGNORECASE,
    )

    # If text has no punctuation and is a longer sentence, split a little
    if not re.search(r"[.!?]", cleaned) and len(cleaned.split()) > 6:
        cleaned = re.sub(
            r"\s+(and|but|because|so|while|although)\s+",
            r"... \1 ",
            cleaned,
            flags=re.IGNORECASE,
        )

    # Ensure ending punctuation
    if cleaned[-1] not in ".!?":
        cleaned += "."

    # For support / calm states, slightly more pause-friendly
    if mode == "support" or state in ("Frustrated", "Concerned", "Disappointed"):
        cleaned = re.sub(r"\.\s+", "... ", cleaned)
        cleaned = re.sub(r"\?\s+", "? ... ", cleaned)
        cleaned = re.sub(r"!\s+", "! ... ", cleaned)

    return cleaned[:max_chars]


def _get_pace(voice_params: dict) -> float:
    """
    Map internal speed to Sarvam pace.
    Keep range conservative to avoid robotic delivery.
    """
    speed = voice_params.get("speed", 1.0)
    return max(0.85, min(1.08, round(speed, 2)))


def generate_speech(text: str, voice_params: dict, voice_id: str = None) -> dict:
    """
    Generate speech audio using Sarvam AI.

    Returns:
        {
            "success": bool,
            "audio_path": str | None,
            "audio_url": str | None,
            "error": str | None,
            "duration_ms": float,
            "mock": bool
        }
    """
    start_time = time.time()

    mode = voice_params.get("mode", "support")
    state = voice_params.get("state", "Neutral")

    prepared_text = _prepare_text(
        text=text,
        max_chars=500,
        mode=mode,
        state=state
    )

    if not prepared_text:
        return {
            "success": False,
            "audio_path": None,
            "audio_url": None,
            "error": "Empty text after preprocessing.",
            "duration_ms": round((time.time() - start_time) * 1000, 2),
            "mock": False,
        }

    if not _api_available:
        return {
            "success": False,
            "audio_path": None,
            "audio_url": None,
            "error": "Sarvam AI not initialized.",
            "duration_ms": round((time.time() - start_time) * 1000, 2),
            "mock": False,
        }

    try:
        pace = _get_pace(voice_params)

        response = _client.text_to_speech.convert(
            text=prepared_text,
            target_language_code="en-IN",
            speaker="manan",
            pace=pace,
            speech_sample_rate=22050,
            enable_preprocessing=True,
            model="bulbul:v3"
        )

        audio_base64 = None

        if isinstance(response, dict):
            if "audios" in response and response["audios"]:
                audio_base64 = response["audios"][0]
            elif "audio" in response:
                audio_base64 = response["audio"]
        else:
            if hasattr(response, "audios") and response.audios:
                audio_base64 = response.audios[0]
            elif hasattr(response, "audio"):
                audio_base64 = response.audio

        if not audio_base64:
            raise ValueError(f"Unexpected Sarvam response format: {response}")

        audio_bytes = base64.b64decode(audio_base64)

        filename = f"empathy_{int(time.time() * 1000)}.wav"
        filepath = AUDIO_DIR / filename

        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        duration = (time.time() - start_time) * 1000

        logger.info(
            f"Sarvam audio generated: {filename} "
            f"({len(audio_bytes)} bytes, {duration:.0f}ms, pace={pace})"
        )

        return {
            "success": True,
            "audio_path": str(filepath),
            "audio_url": f"/audio/{filename}",
            "error": None,
            "duration_ms": round(duration, 2),
            "mock": False,
        }

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Sarvam TTS generation failed: {e}")
        return {
            "success": False,
            "audio_path": None,
            "audio_url": None,
            "error": str(e),
            "duration_ms": round(duration, 2),
            "mock": False,
        }