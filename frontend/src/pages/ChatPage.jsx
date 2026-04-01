import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SendHorizonal, Bot, Play, Square } from "lucide-react";
import Sidebar from "../components/Sidebar";

const getRateLabel = (speed) => {
  if (speed <= 0.9) return "Slow";
  if (speed >= 1.05) return "Fast";
  return "Balanced";
};

const getStrengthLabel = (value) => {
  if (value >= 0.75) return "High";
  if (value >= 0.5) return "Medium";
  return "Low";
};

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("support");
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(null);

  const audioRefs = useRef({});

  const stopAllAudio = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingIndex(null);
  };

  const handleNewChat = () => {
    stopAllAudio();
    setMessages([]);
    setInput("");
  };

  const handlePlay = async (index) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (playingIndex === index) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingIndex(null);
      return;
    }

    stopAllAudio();

    try {
      await audio.play();
      setPlayingIndex(index);
    } catch (error) {
      console.error("Audio play failed:", error);
      setPlayingIndex(null);
    }
  };

  useEffect(() => {
    if (autoPlayIndex === null) return;

    const audio = audioRefs.current[autoPlayIndex];
    if (!audio) return;

    stopAllAudio();

    const playLatest = async () => {
      try {
        await audio.play();
        setPlayingIndex(autoPlayIndex);
      } catch (err) {
        console.error("Autoplay failed:", err);
        setPlayingIndex(null);
      } finally {
        setAutoPlayIndex(null);
      }
    };

    const timer = setTimeout(playLatest, 120);
    return () => clearTimeout(timer);
  }, [autoPlayIndex]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const currentInput = input.trim();

    const userMsg = {
      role: "user",
      text: currentInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: currentInput,
          mode,
        }),
      });

      const data = await res.json();

      const aiMsg = {
        role: "ai",
        audio: data.audio_url,
        state: data.state,
        intensity: data.intensity,
        voiceDescription: data.voice_description,
        voiceParams: data.voice_params,
        contextSignals: data.context_signals || [],
        emotionTrend: data.emotion_trend,
      };

      setMessages((prev) => {
        const next = [...prev, aiMsg];
        setAutoPlayIndex(next.length - 1);
        return next;
      });

      setChats((prev) => [
        {
          id: Date.now(),
          title: currentInput.slice(0, 30),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-black text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-120px] top-16 h-72 w-72 rounded-full bg-sky-400/8 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-[-80px] h-80 w-80 rounded-full bg-cyan-300/6 blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.05),transparent_22%)]" />
      </div>

      <Sidebar chats={chats} onNewChat={handleNewChat} />

      <div className="relative z-10 flex flex-1 flex-col bg-black/70">
        {/* top */}
        <div className="border-b border-white/5 px-8 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Empathy Engine
          </h1>
          <p className="mt-1 text-sm text-white/35">
            Emotion-aware conversational voice assistant
          </p>
        </div>

        {/* chat */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-7">
            {messages.length === 0 && !loading && (
              <div className="mt-20 flex flex-col items-center justify-center text-center">
                <motion.div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/10 bg-sky-300/5"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(56,189,248,0.00)",
                      "0 0 40px rgba(56,189,248,0.12)",
                      "0 0 0 rgba(56,189,248,0.00)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Bot size={26} className="text-sky-200" />
                </motion.div>

                <h2 className="text-2xl font-medium text-white">
                  Start a conversation
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                  Type a message and hear a clean, emotionally-aware voice
                  response.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[520px] rounded-2xl border border-white/8 bg-white/80 px-5 py-4 text-[15px] text-black shadow-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full max-w-3xl rounded-3xl border border-sky-200/8 bg-white/[0.03] px-5 py-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-4">
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <motion.div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/12 bg-sky-300/8"
                              animate={
                                playingIndex === i
                                  ? {
                                      boxShadow: [
                                        "0 0 0 rgba(56,189,248,0)",
                                        "0 0 28px rgba(56,189,248,0.18)",
                                        "0 0 0 rgba(56,189,248,0)",
                                      ],
                                    }
                                  : {}
                              }
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <Bot size={20} className="text-sky-200" />
                            </motion.div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-sky-200/12 bg-sky-300/8 px-3 py-1 text-xs text-sky-100">
                                Emotion: {msg.state}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                                Intensity: {msg.intensity}
                              </span>
                              {msg.emotionTrend && (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
                                  Trend: {msg.emotionTrend}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {playingIndex === i && (
                              <div className="flex h-10 items-end gap-[4px]">
                                {[16, 28, 20, 34, 18, 30, 14].map((h, idx) => (
                                  <motion.span
                                    key={idx}
                                    className="w-[4px] rounded-full bg-sky-300"
                                    animate={{
                                      height: [h * 0.4, h * 0.9, h * 0.6, h],
                                      opacity: [0.45, 1, 0.65, 0.95],
                                    }}
                                    transition={{
                                      duration: 1.2,
                                      repeat: Infinity,
                                      delay: idx * 0.08,
                                      ease: "easeInOut",
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {msg.audio && (
                              <button
                                onClick={() => handlePlay(i)}
                                className="flex items-center gap-2 rounded-full border border-sky-200/12 bg-sky-300/8 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-300/14"
                              >
                                {playingIndex === i ? (
                                  <>
                                    <Square size={14} />
                                    Stop
                                  </>
                                ) : (
                                  <>
                                    <Play size={14} />
                                    Play
                                  </>
                                )}
                              </button>
                            )}

                            {msg.audio && (
                              <audio
                                ref={(el) => {
                                  audioRefs.current[i] = el;
                                  if (el) {
                                    el.onended = () => setPlayingIndex(null);
                                  }
                                }}
                                src={msg.audio}
                                preload="auto"
                                className="hidden"
                              />
                            )}
                          </div>
                        </div>

                        {/* Mapping line */}
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Emotion to Voice Mapping
                          </div>
                          <div className="mt-2 text-sm leading-7 text-white/75">
                            {msg.voiceDescription}
                          </div>
                        </div>

                        {/* Vocal parameters */}
                        {msg.voiceParams && (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                                Rate
                              </div>
                              <div className="mt-2 text-sm text-white/80">
                                {getRateLabel(msg.voiceParams.speed)}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                                Stability
                              </div>
                              <div className="mt-2 text-sm text-white/80">
                                {getStrengthLabel(msg.voiceParams.stability)}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                              <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                                Expressiveness
                              </div>
                              <div className="mt-2 text-sm text-white/80">
                                {getStrengthLabel(msg.voiceParams.style)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Optional / bonus */}
                        {msg.contextSignals?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.contextSignals.map((signal, idx) => (
                              <span
                                key={idx}
                                className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-white/55"
                              >
                                {signal}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex w-full max-w-3xl items-center gap-4 rounded-3xl border border-sky-200/8 bg-white/[0.03] px-5 py-5 backdrop-blur-xl">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/12 bg-sky-300/8">
                    <Bot size={20} className="text-sky-200" />
                  </div>

                  <div className="flex items-end gap-[4px]">
                    {[12, 22, 16, 26, 18].map((h, idx) => (
                      <motion.span
                        key={idx}
                        className="w-[4px] rounded-full bg-sky-300"
                        animate={{
                          height: [h * 0.4, h, h * 0.6],
                          opacity: [0.45, 1, 0.55],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: idx * 0.1,
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-sm text-white/50">
                    Generating voice...
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="border-t border-white/5 px-8 py-5">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-sky-300/20 focus:bg-white/[0.05]"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none focus:border-sky-300/20"
            >
              <option value="support" className="bg-black">
                Support
              </option>
              <option value="sales" className="bg-black">
                Sales
              </option>
            </select>

            <button
              onClick={handleSend}
              disabled={loading}
              className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl border border-sky-200/12 bg-sky-300/10 text-sky-100 transition hover:bg-sky-300/14 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
