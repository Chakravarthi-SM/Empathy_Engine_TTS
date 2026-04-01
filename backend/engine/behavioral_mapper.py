"""
Behavioral State Mapper
Maps raw emotions to business-relevant behavioral states.
Supports adaptive behavior based on conversation memory.
"""

import logging

logger = logging.getLogger(__name__)

EMOTION_TO_STATE = {
    "anger":    "Frustrated",
    "disgust":  "Frustrated",
    "sadness":  "Disappointed",
    "fear":     "Concerned",
    "joy":      "Excited",
    "surprise": "Curious",
    "neutral":  "Neutral",
}

VALID_STATES = {"Frustrated", "Disappointed", "Concerned", "Excited", "Curious", "Neutral"}


def map_to_behavioral_state(emotion: str, emotion_history: list = None) -> dict:
    """
    Map a raw emotion label to a behavioral state.

    History should influence escalation/tone, not override the meaning
    of the current input.
    """
    state = EMOTION_TO_STATE.get(emotion, "Neutral")

    result = {
        "state": state,
        "adapted": False,
        "escalation_level": 0,
        "adaptation_note": ""
    }

    if not emotion_history:
        return result

    recent = [s for s in emotion_history[-5:] if s in VALID_STATES]
    if len(recent) < 2:
        return result

    frustration_count = sum(1 for s in recent if s in ("Frustrated", "Disappointed"))
    excitement_count = sum(1 for s in recent if s == "Excited")
    unique_states = set(recent)

    # Repeated frustration in history -> increase escalation only
    if frustration_count >= 3:
        result["escalation_level"] = 3
        result["adapted"] = True
        result["adaptation_note"] = "Sustained frustration trend detected. Use maximum empathy."
        logger.warning(
            f"Escalation level 3 detected — {frustration_count} frustrated/disappointed states in last 5."
        )

    elif frustration_count >= 2:
        result["escalation_level"] = 2
        result["adapted"] = True
        result["adaptation_note"] = "Rising frustration trend detected. Increase empathy."

    elif frustration_count == 1 and state == "Frustrated":
        result["escalation_level"] = 1
        result["adapted"] = True
        result["adaptation_note"] = "Repeated frustration detected. Apply gentle empathy."

    # Sustained excitement
    elif excitement_count >= 3 and state == "Excited":
        result["adapted"] = True
        result["adaptation_note"] = "Sustained excitement detected. Maintain energetic delivery."

    # Mixed emotions
    elif len(unique_states) >= 4:
        result["adapted"] = True
        result["adaptation_note"] = "Mixed recent emotional signals. Keep delivery balanced."

    return result