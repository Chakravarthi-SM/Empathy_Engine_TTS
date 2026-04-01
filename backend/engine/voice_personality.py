"""
Voice Personality Engine
Generates dynamic voice parameters based on behavioral state, intensity, and mode.
Implements human-like response strategy — e.g., calming voice for frustrated users.
"""

import logging

logger = logging.getLogger(__name__)


STATE_PROFILES = {
    "Frustrated": {
        "stability": 0.80,
        "similarity_boost": 0.75,
        "style": 0.25,
        "speed": 0.85,
        "use_speaker_boost": True,
    },
    "Disappointed": {
        "stability": 0.75,
        "similarity_boost": 0.70,
        "style": 0.30,
        "speed": 0.88,
        "use_speaker_boost": True,
    },
    "Concerned": {
        "stability": 0.65,
        "similarity_boost": 0.72,
        "style": 0.35,
        "speed": 0.92,
        "use_speaker_boost": True,
    },
    "Excited": {
        "stability": 0.45,
        "similarity_boost": 0.65,
        "style": 0.65,
        "speed": 1.10,
        "use_speaker_boost": True,
    },
    "Curious": {
        "stability": 0.55,
        "similarity_boost": 0.68,
        "style": 0.50,
        "speed": 1.00,
        "use_speaker_boost": True,
    },
    "Neutral": {
        "stability": 0.60,
        "similarity_boost": 0.70,
        "style": 0.35,
        "speed": 1.00,
        "use_speaker_boost": False,
    },
}

MODE_MODIFIERS = {
    "support": {
        "stability_delta": 0.10,
        "style_delta": -0.10,
        "speed_delta": -0.05,
        "similarity_delta": 0.05,
    },
    "sales": {
        "stability_delta": -0.08,
        "style_delta": 0.15,
        "speed_delta": 0.05,
        "similarity_delta": 0.00,
    },
}

INTENSITY_MODIFIERS = {
    "high": {
        "stability_delta": -0.10,
        "style_delta": 0.15,
        "speed_delta": 0.02,
    },
    "medium": {
        "stability_delta": -0.03,
        "style_delta": 0.05,
        "speed_delta": 0.00,
    },
    "low": {
        "stability_delta": 0.05,
        "style_delta": -0.08,
        "speed_delta": -0.01,
    },
}

ESCALATION_OVERRIDES = {
    1: {"stability_delta": 0.05, "speed_delta": -0.03, "style_delta": -0.05},
    2: {"stability_delta": 0.10, "speed_delta": -0.06, "style_delta": -0.10},
    3: {"stability_delta": 0.15, "speed_delta": -0.10, "style_delta": -0.15},
}


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return round(max(low, min(high, value)), 3)


def generate_voice_params(
    state: str,
    intensity: str = "medium",
    mode: str = "support",
    escalation_level: int = 0
) -> dict:
    """
    Generate dynamic voice parameters for ElevenLabs TTS.

    Args:
        state: behavioral state (Frustrated, Excited, etc.)
        intensity: low / medium / high
        mode: sales / support
        escalation_level: 0-3 from conversation memory

    Returns:
        {
            "stability": float,
            "similarity_boost": float,
            "style": float,
            "speed": float,
            "use_speaker_boost": bool,
            "voice_description": str
        }
    """
    profile = STATE_PROFILES.get(state, STATE_PROFILES["Neutral"]).copy()

    mode_mod = MODE_MODIFIERS.get(mode, MODE_MODIFIERS["support"])
    profile["stability"] += mode_mod["stability_delta"]
    profile["style"] += mode_mod["style_delta"]
    profile["speed"] += mode_mod["speed_delta"]
    profile["similarity_boost"] += mode_mod.get("similarity_delta", 0)

    int_mod = INTENSITY_MODIFIERS.get(intensity, INTENSITY_MODIFIERS["medium"])
    profile["stability"] += int_mod["stability_delta"]

    if state in ("Excited", "Curious"):
        profile["style"] += int_mod["style_delta"]
    else:
        profile["style"] += int_mod["style_delta"] * 0.5

    profile["speed"] += int_mod["speed_delta"]

    if escalation_level > 0 and state in ("Frustrated", "Disappointed", "Concerned"):
        esc_mod = ESCALATION_OVERRIDES.get(min(escalation_level, 3), {})
        profile["stability"] += esc_mod.get("stability_delta", 0)
        profile["speed"] += esc_mod.get("speed_delta", 0)
        profile["style"] += esc_mod.get("style_delta", 0)

    result = {
        "stability": _clamp(profile["stability"]),
        "similarity_boost": _clamp(profile["similarity_boost"]),
        "style": _clamp(profile["style"]),
        "speed": _clamp(profile["speed"], 0.7, 1.3),
        "use_speaker_boost": profile.get("use_speaker_boost", False),
    }

    result["voice_description"] = _describe_voice(state, intensity, mode, escalation_level)

    logger.info(
        f"Voice params for {state}/{intensity}/{mode} (esc={escalation_level}): "
        f"stab={result['stability']}, style={result['style']}, speed={result['speed']}"
    )

    return result


def _describe_voice(state: str, intensity: str, mode: str, escalation: int) -> str:
    """Generate a human-readable voice strategy description."""
    descriptions = {
        "Frustrated": "Calm and reassuring tone to de-escalate",
        "Disappointed": "Warm, empathetic delivery with understanding",
        "Concerned": "Clear, confident tone with gentle reassurance",
        "Excited": "Energetic, engaging delivery to match enthusiasm",
        "Curious": "Friendly, light tone encouraging exploration",
        "Neutral": "Professional, balanced conversational delivery",
    }

    base = descriptions.get(state, descriptions["Neutral"])

    if intensity == "high":
        base += " with strong emotional emphasis"
    elif intensity == "low":
        base += " with controlled, steady tone"

    if escalation >= 2:
        base += " — escalation detected, maximum empathy applied"

    if mode == "sales":
        base += " (sales: persuasive energy)"
    elif mode == "support":
        base += " (support: empathetic care)"

    return base