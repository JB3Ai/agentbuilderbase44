import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Globe, Lightbulb, FileCode, Bot } from "lucide-react";

const QUICK_PROMPTS = [
  { icon: Globe, label: "Browse agentskills.io", action: "browse_skills" },
  { icon: Lightbulb, label: "Suggest skills for this agent", action: "suggest_skills" },
  { icon: FileCode, label: "Draft operating principles", action: "draft_principles" },
];

export default function PanelAssistant({ agent }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your agent design assistant. I can help you draft skills, operating principles, and browse resources like agentskills.io for ideas. What would you like to work on for **${agent.name}**?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    const next = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setLoading(true);

    // Determine if we need web context
    const needsWeb = /agentskills|website|browse|search|ideas from|look up/i.test(userMsg);

    const systemContext = `You are an expert AI agent designer assistant helping configure an agent with the following profile:
Name: ${agent.name}
Role: ${agent.role}
Current Skills: ${(agent.skills || []).join(", ") || "none yet"}
Current Principles: ${(agent.operating_principles || []).join("; ") || "none yet"}
Personality: ${agent.personality || "not set"}

You help users:
- Draft and refine agent skills, operating principles, and personality descriptions
- Suggest improvements based on the agent's role
- Browse and summarise ideas from agentskills.io and similar resources
- Generate ready-to-use skill arrays and principle lists in JSON format when asked
- Provide code snippets for agent configuration files

When browsing agentskills.io, summarise relevant agent skill categories and examples.
Always be practical and specific. When suggesting skills, format them as a bullet list.
When asked for JSON/code output, wrap it in \`\`\`json or \`\`\`js blocks.`;

    const history = next.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemContext}\n\n---\nConversation so far:\n${history}\n\nAssistant:`,
      add_context_from_internet: needsWeb,
      model: needsWeb ? "gemini_3_flash" : undefined,
    });

    setMessages([...next, { role: "assistant", content: typeof result === "string" ? result : JSON.stringify(result) }]);
    setLoading(false);
  };

  const handleQuick = (action) => {
    const prompts = {
      browse_skills: `Browse agentskills.io and summarise the most relevant skill categories and example skills for a ${agent.role}`,
      suggest_skills: `Suggest 8 highly relevant skills for an agent named ${agent.name} with role: ${agent.role}. Format as a JSON array I can copy.`,
      draft_principles: `Draft 5 strong operating principles for ${agent.name} (${agent.role}). Make them specific, actionable, and distinct.`,
    };
    send(prompts[action]);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Quick actions */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {QUICK_PROMPTS.map(({ icon: IconComp, label, action }) => (
          <button key={action} onClick={() => handleQuick(action)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-40"
            style={{ border: "1px solid #20242C", background: "#15171C" }}>
            <IconComp className="w-3 h-3 text-[#00FF66]" />
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 mt-1">
                {msg.role === "assistant" ? (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,255,102,0.1)", border: "1px solid rgba(0,255,102,0.3)" }}>
                    <Bot className="w-3.5 h-3.5 text-[#00FF66]" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-xs text-slate-300">You</span>
                  </div>
                )}
              </div>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" ? "text-black font-medium" : "text-slate-200"
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

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,255,102,0.1)", border: "1px solid rgba(0,255,102,0.3)" }}>
              <Bot className="w-3.5 h-3.5 text-[#00FF66]" />
            </div>
            <div className="px-4 py-3 rounded-xl flex items-center gap-1.5"
              style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                  style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[#20242C] mt-2">
        <input
          className="input-dark flex-1"
          placeholder="Ask for ideas, drafts, code snippets…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="cta-primary px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-40 flex-shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}