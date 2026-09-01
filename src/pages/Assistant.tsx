import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.checkOllama()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const response = await api.aiChat(updated);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const suggestions = [
    "Comment réduire mes dépenses ce mois-ci ?",
    "Quelles aides sociales pourrais-je demander ?",
    "Aide-moi à créer un plan d'épargne",
    "Analyse mes habitudes de dépenses",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Connection warning */}
      {connected === false && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg mb-3">
          <AlertCircle size={16} />
          <span>
            Ollama n'est pas connecté. Vérifiez vos paramètres dans la page
            Paramètres.
          </span>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Bot size={32} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-fg mb-2">
              Assistant financier
            </h2>
            <p className="text-sm text-fg-2 max-w-md mb-6">
              Posez-moi des questions sur vos finances, demandez des conseils
              budgétaires ou analysez vos habitudes de dépenses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="text-left px-3 py-2.5 rounded-lg border border-edge bg-panel text-sm text-fg-2 hover:text-fg hover:border-accent/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
                  <Bot size={16} className="text-accent" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-panel border border-edge text-fg"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-fg/10 flex items-center justify-center mt-0.5">
                  <User size={16} className="text-fg-2" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bot size={16} className="text-accent" />
            </div>
            <div className="bg-panel border border-edge rounded-lg px-4 py-3 text-sm text-fg-2">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Réflexion en cours...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-edge pt-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur vos finances..."
            rows={1}
            className="flex-1 bg-panel border border-edge rounded-lg px-4 py-3 text-sm text-fg placeholder-fg-3 resize-none focus:outline-none focus:border-accent transition-colors"
            style={{ maxHeight: 120 }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[11px] text-fg-3 mt-2 text-center">
          Propulsé par Ollama en local — vos données restent sur votre machine
        </p>
      </div>
    </div>
  );
}
