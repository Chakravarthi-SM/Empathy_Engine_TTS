"""
Intensity Detection Module
Multi-factor scoring to determine emotional intensity.
Factors: punctuation, capitalization, emotional keywords, sentence length, repetition.
"""

import re
import logging

logger = logging.getLogger(__name__)

INTENSITY_KEYWORDS = {
    "high": [
        "extremely", "absolutely", "incredibly", "unbelievable", "furious",
        "outraged", "thrilled", "ecstatic", "devastated", "desperate",
        "hate", "love", "amazing", "terrible", "worst", "best",
        "never", "always", "totally", "completely", "so much"
    ],
    "medium": [
        "really", "very", "quite", "pretty", "rather", "somewhat",
        "annoyed", "happy", "sad", "worried", "confused", "frustrated",
        "disappointed", "concerned", "pleased", "surprised"
    ]
}


def _count_keyword_hits(text: str, keywords: list[str]) -> int:
    hits = 0
    for kw in keywords:
        if " " in kw:
            if kw in text:
                hits += 1
        else:
            if re.search(rf"\b{re.escape(kw)}\b", text):
                hits += 1
    return hits


def detect_intensity(text: str, emotion: str = None) -> dict:
    """
    Detect the emotional intensity of text using multi-factor scoring.

    Returns:
        {
            "level": "low" | "medium" | "high",
            "score": float (0.0 - 1.0),
            "factors": dict
        }
    """
    if not text or not text.strip():
        return {"level": "low", "score": 0.0, "factors": {}}

    text_lower = text.lower().strip()
    factors = {}

    # Factor 1: Punctuation
    exclamation = text.count("!")
    question = text.count("?")
    repeated_punct = len(re.findall(r"[!?]{2,}", text))
    punct_score = min((exclamation * 0.12 + question * 0.08 + repeated_punct * 0.22), 1.0)
    factors["punctuation"] = round(punct_score, 2)

    # Factor 2: Capitalization
    alpha_chars = [c for c in text if c.isalpha()]
    if alpha_chars:
        caps_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
        caps_score = min(caps_ratio * 1.3, 1.0) if caps_ratio > 0.35 else caps_ratio * 0.4
    else:
        caps_score = 0.0
    factors["capitalization"] = round(caps_score, 2)

    # Factor 3: Emotional keywords
    high_hits = _count_keyword_hits(text_lower, INTENSITY_KEYWORDS["high"])
    medium_hits = _count_keyword_hits(text_lower, INTENSITY_KEYWORDS["medium"])
    keyword_score = min((high_hits * 0.28 + medium_hits * 0.14), 1.0)
    factors["keywords"] = round(keyword_score, 2)

    # Factor 4: Sentence length
    word_count = len(text.split())
    if word_count <= 3:
        length_score = 0.35
    elif word_count <= 8:
        length_score = 0.25
    elif word_count <= 20:
        length_score = 0.18
    else:
        length_score = 0.10
    factors["sentence_length"] = round(length_score, 2)

    # Factor 5: Repetition
    words = re.findall(r"\b\w+\b", text_lower)
    repetition = 0
    for i in range(1, len(words)):
        if words[i] == words[i - 1]:
            repetition += 1
    repetition_score = min(repetition * 0.2, 0.5)
    factors["repetition"] = round(repetition_score, 2)

    # Base weighted score
    final_score = (
        punct_score * 0.28 +
        caps_score * 0.18 +
        keyword_score * 0.28 +
        length_score * 0.14 +
        repetition_score * 0.12
    )

    # Emotion-aware adjustment
    if emotion in {"anger", "disgust", "joy"}:
        final_score += 0.05
    elif emotion == "neutral":
        final_score -= 0.05

    final_score = round(max(0.0, min(final_score, 1.0)), 3)

    # Level mapping
    if final_score >= 0.6:
        level = "high"
    elif final_score >= 0.32:
        level = "medium"
    else:
        level = "low"

    return {
        "level": level,
        "score": final_score,
        "factors": factors
    }