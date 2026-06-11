import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, AlertCircle, RefreshCcw, Key, ArrowRight } from "lucide-react";

const SUPERAGENT_BASE = "https://app.base44.com/api/agents";
const LS_API_KEY = "base44_superagent_api_key";

export default function AgentChat({ agentName, agentAvatar, superagentId }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_API_KEY) || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const isSuperagent = !!superagentId;

  // ─── In-app agent: SDK-based ──────────────────────────────────────────
  const connectInApp = async () => {
    setConnecting(true);
    setError(null);
    try {
      const conv = await base44.agents.createConversation({ agent_name: agentName });
      setConversationId(conv.id);
      setMessages(conv.messages || []);
    } catch (e) {
      setError(`Agent "${agentName}" not found. If this is a Superagent, enter its ID in the agent profile's "Superagent ID" field.`);
    } finally {
      setConnecting(false);
    }
  };

  // ─── Superagent: REST API ─────────────────────────────────────────────
  const connectSuperagent = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      setConnecting(false);
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(`${SUPERAGENT_BASE}/${superagentId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api_key": apiKey },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const conv = await res.json();
      setConversationId(conv.id);
      setMessages(conv.messages || []);
    } catch (e) {
      setError(`Could not connect to superagent: ${e.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const connect = () => {
    if (isSuperagent) connectSuperagent();
    else connectInApp();
  };

  useEffect(() => {
    connect();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [agentName, superagentId]);

  // ─── Polling for superagent replies ───────────────────────────────────
  useEffect(() => {
    if (!isSuperagent || !conversationId || !apiKey) return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${SUPERAGENT_BASE}/${superagentId}/conversations/${conversationId}`, {
          headers: { "api_key": apiKey },
        });
        if (!res.ok) return;
        const conv = await res.json();
        setMessages(conv.messages || []);
      } catch { /* ignore polling errors */ }
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, [isSuperagent, superagentId, conversationId, apiKey]);

  // ─── Scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Send message ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    if (isSuperagent && conversationId && apiKey) {
      try {
        await fetch(`${SUPERAGENT_BASE}/${superagentId}/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "api_key": apiKey },
          body: JSON.stringify({ role: "user", content: text }),
        });
      } catch (e) {
        setError(`Send failed: ${e.message}`);
      }
    } else if (conversationId) {
      try {
        const conv = { id: conversationId, messages };
        await base44.agents.addMessage(conv, { role: "user", content: text });
      } catch (e) {
        setError(`Send failed: ${e.message}`);
      }
    }
    setSending(false);
  };

  // ─── Save API key ─────────────────────────────────────────────────────
  const saveApiKey = () => {
    localStorage.setItem(LS_API_KEY, apiKey);
    setShowApiKeyInput(false);
    connectSuperagent();
  };

  // ─── API Key input screen ─────────────────────────────────────────────
  if (showApiKeyInput) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
        <Key className="w-8 h-8 text-[#00FF66]" />
        <p className="text-sm text-slate-300 font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>
          Enter your Superagent API Key
        </p>
        <p className="text-xs text-slate-500">
          Find this in your Superagent → Customize → Developer → API docs
        </p>
        <div className="flex gap-2 w-full max-w-sm">
          <input
            className="input-dark flex-1 font-mono text-sm"
            type="password"
            placeholder="Paste API key…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
            autoFocus
          />
          <button onClick={saveApiKey} disabled={!apiKey.trim()}
            className="cta-primary px-3 py-2 rounded-lg flex items-center gap-1 disabled:opacity-40">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Connecting spinner ───────────────────────────────────────────────
  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#00FF66]" />
        <p className="text-sm text-slate-500">Connecting to {agentName}…</p>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-slate-400 max-w-md">{error}</p>
        <div className="flex gap-2">
          <button onClick={connect}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00FF66]"
            style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}>
            <RefreshCcw className="w-3.5 h-3.5" /> Retry
          </button>
          {isSuperagent && (
            <button onClick={() => { setShowApiKeyInput(true); setError(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300"
              style={{ border: "1px solid #2A2F3A", background: "#1A1D24" }}>
              <Key className="w-3.5 h-3.5" /> Change API Key
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Messages ─────────────────────────────────────────────────────────
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
        {isSuperagent && (
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="px-2 py-2 rounded-lg text-slate-500 hover:text-slate-300 flex-shrink-0"
            title="Change API key"
          >
            <Key className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}