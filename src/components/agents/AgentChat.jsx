import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, AlertCircle, RefreshCcw } from "lucide-react";

export default function AgentChat({ agentName, agentAvatar }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const unsubRef = useRef(null);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const conv = await base44.agents.createConversation({ agent_name: agentName });
      setConversation(conv);
      setMessages(conv.messages || []);

      // Subscribe to real-time updates
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = base44.agents.subscribeToConversation(conv.id, (updated) => {
        setMessages([...(updated.messages || [])]);
      });
    } catch (e) {
      setError(`Could not connect to agent "${agentName}". Make sure this agent exists in your Base44 app.`);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    connect();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [agentName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
        <p className="text-sm text-slate-500">Connecting to {agentName}…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={connect}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00FF66]"
          style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}>
          <RefreshCcw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  // Render only user + assistant messages
  const visible = messages.filter((m) => m.role === "user" || m.role === "assistant");

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
        {visible.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Start a conversation with {agentName}</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {visible.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {msg.role === "assistant" ? (
                  <img src={agentAvatar} alt={agentName}
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: "1px solid #20242C" }} />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "text-black font-medium"
                  : "text-slate-200"
              }`} style={
                msg.role === "user"
                  ? { background: "linear-gradient(180deg,#00FF66,#00C950)" }
                  : { background: "#1A1D24", border: "1px solid #2A2F3A" }
              }>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3">
            <img src={agentAvatar} alt={agentName} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1"
              style={{ border: "1px solid #20242C" }} />
            <div className="px-4 py-3 rounded-xl flex items-center gap-1.5"
              style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                  style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[#20242C]">
        <input
          data-testid="agent-chat-input"
          className="input-dark flex-1"
          placeholder={`Message ${agentName}…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <button
          data-testid="agent-chat-send"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="cta-primary px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}