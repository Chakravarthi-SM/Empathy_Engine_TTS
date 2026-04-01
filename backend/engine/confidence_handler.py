"""
Confidence Handler Module
Applies fallback logic when emotion detection confidence is low.
Uses context signals to refine decisions when confidence is insufficient.
"""

import logging

logger = logging.getLogger(__name__)

# Confidence thresholds
HIGH_CONFIDENCE = 0.55
LOW_CONFIDENCE = 0.40


def handle_confidence(emotion_result: dict, context_signals: dict = None) -> dict:
    """
    Apply confidence-based fallback logic.

    Rules:
    - High confidence: trust model as-is
    - Low confidence: refine using context if possible, else neutral
    - Medium confidence: prefer context refinement when strong; otherwise keep original
    """
    confidence = emotion_result.get("confidence", 0.0)
    original_emotion = emotion_result.get("emotion", "neutral")

    # High confidence → trust model
    if confidence >= HIGH_CONFIDENCE:
        emotion_result["fallback_applied"] = False
        emotion_result["fallback_reason"] = None
        return emotion_result

    # Low confidence → refine using context if available
    if confidence < LOW_CONFIDENCE:
        refined = _refine_from_context(context_signals or {})
        if refined:
            logger.info(
                f"Low confidence ({confidence:.2f}) on '{original_emotion}', "
                f"refined to '{refined}' using context signals."
            )
            emotion_result["emotion"] = refined
            emotion_result["fallback_applied"] = True
            emotion_result["fallback_reason"] = "context_refinement"
            return emotion_result

        logger.info(
            f"Low confidence ({confidence:.2f}) on '{original_emotion}', "
            f"falling back to 'neutral'."
        )
        emotion_result["emotion"] = "neutral"
        emotion_result["fallback_applied"] = True
        emotion_result["fallback_reason"] = "low_confidence"
        return emotion_result

    # Medium confidence → use context only if strong, else keep original
    refined = _refine_from_context(context_signals or {})
    if refined and refined != original_emotion:
        logger.info(
            f"Medium confidence ({confidence:.2f}) on '{original_emotion}', "
            f"refined to '{refined}' using context signals."
        )
        emotion_result["emotion"] = refined
        emotion_result["fallback_applied"] = True
        emotion_result["fallback_reason"] = "context_refinement"
        return emotion_result

    logger.info(
        f"Medium confidence ({confidence:.2f}) on '{original_emotion}', "
        f"keeping original emotion."
    )
    emotion_result["fallback_applied"] = False
    emotion_result["fallback_reason"] = None
    return emotion_result


def _refine_from_context(signals: dict) -> str | None:
    """
    Use context signals to determine a safer emotion label.

    Mapping notes:
    - complaint + urgency => anger (later maps to Frustrated)
    - high urgency without complaint => fear (later maps to Concerned)
    - question/request without complaint => surprise (used as proxy for Curious)
    """
    if not signals:
        return None

    has_complaint = signals.get("has_complaint", False)
    has_question = signals.get("has_question", False)
    has_request = signals.get("has_request", False)
    urgency = signals.get("urgency", "low")

    if has_complaint and urgency in ("medium", "high"):
        return "anger"

    if urgency == "high" and not has_complaint:
        return "fear"

    if (has_question or has_request) and not has_complaint:
        return "surprise"

    return None