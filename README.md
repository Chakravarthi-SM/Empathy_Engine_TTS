# 🧠 Empathy Engine — Emotion-Aware Voice AI

Empathy Engine is an intelligent **emotion-aware Text-to-Speech (TTS) system** that generates **context-aware, human-like voice responses**.

Unlike traditional TTS systems, this project:
- understands **user emotion**
- analyzes **context (complaint, urgency, question, etc.)**
- maps emotions into **behavioral states**
- dynamically adjusts **voice parameters**
- generates **adaptive and realistic speech output**

> 💡 The goal is to make AI responses sound **appropriate, natural, and emotionally aligned**.

---

## 🚀 Features

- 🎯 Emotion detection using transformer models  
- 🧠 Confidence-aware fallback logic  
- 🔍 Context analysis (complaint, urgency, question, request)  
- 🔄 Behavioral state mapping  
- 📊 Intensity detection (low / medium / high)  
- 🎙️ Dynamic voice parameter generation  
- 🔗 Emotion → Voice mapping logic  
- 🔊 Real-time TTS using **Sarvam AI**  
- 💬 Clean chat-style UI (voice-first design)  
- 🎵 Auto-play audio with waveform animation  
- 🧾 Conversation memory (Redis + fallback)

---

## 🎯 Project Objective

Traditional TTS systems:
- sound robotic ❌
- ignore emotion ❌
- use fixed voice settings ❌

Empathy Engine introduces an intelligent pipeline:

```
Meaning → Emotion → Behavior → Voice → Speech
```

---

## 🧠 System Architecture

```
User Input
   ↓
Context Analyzer
   ↓
Emotion Detector
   ↓
Confidence Handler
   ↓
Behavioral Mapper
   ↓
Intensity Detector
   ↓
Voice Personality Generator
   ↓
TTS Engine (Sarvam AI)
   ↓
Audio Output → Frontend
```

---

## 🖥️ Frontend Output

### Core Requirements
- Detected Emotion  
- Vocal Parameters (Rate, Stability, Expressiveness)  
- Emotion → Voice Mapping  
- Playable Audio  

### Bonus Features
- Granular emotions  
- Intensity  
- Context signals  
- Emotion trend  

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js (v18+)
- npm
- Git

---

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

```
SARVAM_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379
```

Run backend:

```bash
uvicorn main:app --reload
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 API Example

### POST `/generate-audio`

#### Request
```json
{
  "text": "Why is my order delayed???",
  "mode": "support"
}
```

#### Response
```json
{
  "audio_url": "/audio/file.wav",
  "state": "Frustrated",
  "intensity": "medium",
  "confidence": 0.82,
  "voice_description": "Calm and reassuring tone",
  "voice_params": {
    "speed": 0.9,
    "stability": 0.75,
    "style": 0.3
  },
  "context_signals": [
    "complaint_detected",
    "urgency_medium"
  ]
}
```

---

# 🧠 Design Choices & Logic

## 1. Multi-Stage Pipeline

Instead of direct TTS:

```
Understanding → Reasoning → Behavior → Voice → Output
```

- Improves accuracy  
- Prevents wrong emotional output  
- Makes system explainable  

---

## 2. Emotion Detection

Model:
```
j-hartmann/emotion-english-distilroberta-base
```

Outputs:
- emotion label  
- confidence  
- score distribution  

---

## 3. Confidence Handling

| Confidence | Action |
|----------|--------|
| High     | Trust model |
| Medium   | Refine with context |
| Low      | Fallback to neutral |

---

## 4. Context Analysis

Detects:
- complaints  
- urgency  
- questions  
- requests  

Example:
```
"Why is my order delayed???"
→ complaint + urgency + question
```

---

## 5. Behavioral Mapping

| Raw Emotion | Behavioral State |
|------------|----------------|
| anger      | Frustrated |
| sadness    | Disappointed |
| fear       | Concerned |
| joy        | Excited |
| surprise   | Curious |
| neutral    | Neutral |

---

## 6. Intensity Detection

Based on:
- punctuation  
- capitalization  
- keywords  
- sentence structure  

Output:
```
low / medium / high
```

---

## 7. Emotion → Voice Mapping

Depends on:
- behavioral state  
- intensity  
- mode  
- escalation  

### Example

**Frustrated**
- slow rate  
- high stability  
- low expressiveness  

**Excited**
- faster rate  
- higher expressiveness  

---

## 8. TTS Engine

Final choice:
👉 Sarvam AI

---

## 9. Frontend Design

- Minimal chat UI  
- Voice-first  
- Waveform animation  
- Black theme  

---

## ⚠️ Limitations

- Autoplay may be blocked  
- Redis optional  
- External API dependency  

---

## 🔮 Future Improvements

- storage  
- waveform sync  
- deployment  
- mobile  

---

## ✅ Summary

Empathy Engine combines:
- emotion understanding  
- adaptive voice  
- clean UI  

to create a **human-like conversational AI voice system**.

---

## 👨‍💻 Author

**Chakravarthi Eslavath**  
IIT Kharagpur | Aspiring Software Development Engineer  

Passionate about building intelligent systems that combine **AI, backend logic, and real-world product design**.
