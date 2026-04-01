"""
Context Analyzer Module
Analyzes text for contextual signals: complaints, urgency, questions, requests.
Used to refine emotion detection and voice strategy.
"""

import re
import logging

logger = logging.getLogger(__name__)

COMPLAINT_KEYWORDS = [
    "delayed", "broken", "wrong", "terrible", "awful", "worst", "unacceptable",
    "disappointed", "frustrat", "ridiculous", "waste", "refund", "cancel",
    "never received", "not working", "doesn't work", "still waiting",
    "poor quality", "bad experience", "horrible", "disgusting", "pathetic",
    "incompetent", "scam", "rip off", "overcharged", "missing"
]

URGENCY_KEYWORDS = [
    "urgent", "asap", "immediately", "right now", "emergency", "critical",
    "hurry", "deadline", "time sensitive", "can't wait", "need help now",
    "please help", "desperate", "important"
]

REQUEST_KEYWORDS = [
    "please", "could you", "can you", "would you", "help me", "i need",
    "i want", "i'd like", "assist", "resolve", "fix", "update"
]

QUESTION_PATTERNS = [
    r"\?{1,}",
    r"^\s*(who|what|when|where|why|how|is|are|can|could|would|do|does|did|will)\b",
]


def _normalize_text(text: str) -> str:
    """Normalize whitespace and casing."""
    return re.sub(r"\s+", " ", text.strip().lower())


def _count_keyword_hits(text: str, keywords: list[str]) -> int:
    """
    Count keyword/phrase matches.
    Uses substring matching for multi-word phrases and stems like 'frustrat',
    regex word boundaries for simple single words.
    """
    hits = 0
    for kw in keywords:
        if " " in kw or kw.endswith("at"):  # phrase/stem-style keyword
            if kw in text:
                hits += 1
        else:
            if re.search(rf"\b{re.escape(kw)}\b", text):
                hits += 1
    return hits


def analyze_context(text: str) -> dict:
    """
    Analyze text for contextual signals.

    Returns:
        {
            "has_complaint": bool,
            "has_urgency": bool,
            "has_question": bool,
            "has_request": bool,
            "urgency": "low" | "medium" | "high",
            "complaint_score": float,
            "signals": list[str]
        }
    """
    if not text or not text.strip():
        return {
            "has_complaint": False,
            "has_urgency": False,
            "has_question": False,
            "has_request": False,
            "urgency": "low",
            "complaint_score": 0.0,
            "signals": []
        }

    normalized = _normalize_text(text)
    signals = []

    # --- Complaint detection ---
    complaint_hits = _count_keyword_hits(normalized, COMPLAINT_KEYWORDS)
    has_complaint = complaint_hits > 0
    complaint_score = min(complaint_hits / 3.0, 1.0)
    if has_complaint:
        signals.append(f"complaint_detected({complaint_hits} keywords)")

    # --- Urgency detection ---
    urgency_hits = _count_keyword_hits(normalized, URGENCY_KEYWORDS)
    exclamation_count = text.count("!")
    question_mark_count = text.count("?")
    caps_ratio = sum(1 for c in text if c.isupper()) / max(sum(1 for c in text if c.isalpha()), 1)

    urgency_score = (
        urgency_hits * 0.45 +
        min(exclamation_count, 5) * 0.12 +
        min(question_mark_count, 5) * 0.06 +
        (0.2 if caps_ratio > 0.5 else 0.0)
    )

    if urgency_score >= 0.75:
        urgency = "high"
    elif urgency_score >= 0.3:
        urgency = "medium"
    else:
        urgency = "low"

    has_urgency = urgency in ("medium", "high")
    if has_urgency:
        signals.append(f"urgency_{urgency}")

    # --- Question detection ---
    has_question = any(
        re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        for pattern in QUESTION_PATTERNS
    )
    if has_question:
        signals.append("question_detected")

    # --- Request detection ---
    request_hits = _count_keyword_hits(normalized, REQUEST_KEYWORDS)
    has_request = request_hits > 0
    if has_request:
        signals.append("request_detected")

    return {
        "has_complaint": has_complaint,
        "has_urgency": has_urgency,
        "has_question": has_question,
        "has_request": has_request,
        "urgency": urgency,
        "complaint_score": round(complaint_score, 2),
        "signals": signals
    }