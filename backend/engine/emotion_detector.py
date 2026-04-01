
from transformers import pipeline
import logging
import re

logger = logging.getLogger(__name__)

_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        logger.info("Loading emotion detection model...")
        _classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None,
            device=-1
        )
        logger.info("Model loaded.")
    return _classifier


def _preprocess_text(text: str) -> str:
    """Clean and normalize text."""
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _compute_confidence(results):
    """Better confidence calculation."""
    sorted_scores = sorted(results, key=lambda x: x["score"], reverse=True)

    top = sorted_scores[0]
    second = sorted_scores[1] if len(sorted_scores) > 1 else {"score": 0}

    confidence = top["score"]

    # Boost confidence if gap is large
    if top["score"] - second["score"] > 0.2:
        confidence += 0.1

    return round(min(confidence, 1.0), 4)


def detect_emotion(text: str) -> dict:
    if not text or not text.strip():
        return {
            "emotion": "neutral",
            "confidence": 1.0,
            "all_scores": {"neutral": 1.0}
        }

    # Handle very short text
    if len(text.strip()) <= 3:
        return {
            "emotion": "neutral",
            "confidence": 0.9,
            "all_scores": {"neutral": 0.9}
        }

    try:
        classifier = _get_classifier()

        processed_text = _preprocess_text(text)
        truncated = processed_text[:512]

        results = classifier(truncated)

        if not results or not results[0]:
            return {
                "emotion": "neutral",
                "confidence": 1.0,
                "all_scores": {"neutral": 1.0}
            }

        scores = {r["label"]: round(r["score"], 4) for r in results[0]}

        # Compute improved confidence
        confidence = _compute_confidence(results[0])

        top_label = max(scores, key=scores.get)

        return {
            "emotion": top_label,
            "confidence": confidence,
            "all_scores": scores
        }

    except Exception as e:
        logger.error(f"Emotion detection failed: {e}")
        return {
            "emotion": "neutral",
            "confidence": 0.5,
            "all_scores": {"neutral": 0.5}
        }