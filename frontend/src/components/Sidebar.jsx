import { Plus, LogOut, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Sidebar({ chats = [], onNewChat, activeId }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <aside className="relative z-10 flex h-full w-72 flex-col border-r border-white/5 bg-black/80 backdrop-blur-xl">
      {/* top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-400/8 to-transparent" />

      {/* Logo */}
      <div className="relative border-b border-white/5 px-5 py-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/10 bg-sky-300/5"
            animate={{
              boxShadow: [
                "0 0 0 rgba(56,189,248,0.00)",
                "0 0 28px rgba(56,189,248,0.10)",
                "0 0 0 rgba(56,189,248,0.00)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Bot size={20} className="text-sky-200" />
          </motion.div>

          <div>
            <div className="text-sm font-medium tracking-wide text-white">
              Empathy Engine
            </div>
            <div className="mt-1 text-xs text-white/35">AI voice intelligence</div>
          </div>
        </div>
      </div>

      {/* New chat */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200/10 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-3 px-2 text-xs uppercase tracking-[0.18em] text-white/28">
          Recent
        </div>

        {chats.length === 0 && (
          <div className="px-2 text-xs text-white/28">No conversations yet</div>
        )}

        <div className="space-y-1">
          {chats.slice(0, 10).map((chat) => (
            <button
              key={chat.id}
              className={`w-full truncate rounded-xl px-3 py-3 text-left text-sm transition ${
                activeId === chat.id
                  ? "border border-sky-200/10 bg-white/[0.06] text-white"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              {chat.title || "New conversation"}
            </button>
          ))}
        </div>
      </div>

      {/* bottom */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200/10 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}