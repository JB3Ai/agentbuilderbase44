import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VOICE_META = {
  architect: { label: "Architect", tone: "Correctness & long-term", dotClass: "voice-dot-architect", textClass: "voice-architect" },
  skeptic: { label: "Skeptic", tone: "Premise challenge", dotClass: "voice-dot-skeptic", textClass: "voice-skeptic" },
  pragmatist: { label: "Pragmatist", tone: "Shipping & user impact", dotClass: "voice-dot-pragmatist", textClass: "voice-pragmatist" },
  critic: { label: "Critic", tone: "Edge cases & failure modes", dotClass: "voice-dot-critic", textClass: "voice-critic" },
};

const VOICE_ORDER = ["architect", "skeptic", "pragmatist", "critic"];

function VoiceCard({ voiceKey, reply, loading }) {
  const meta = VOICE_META[voiceKey];
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`status-dot ${meta.dotClass}`} />
        <span className={`text-sm font-semibold ${meta.textClass}`} style={{ fontFamily: "Chivo, sans-serif" }}>
          {meta.label}
        </span>
        <span className="eyebrow ml-auto">{meta.tone}</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Thinking…
        </div>
      ) : reply ? (
        <p className="text-sm text-slate-300 leading-relaxed">{reply}</p>
      ) : (
        <p className="text-sm text-slate-600 italic">No response yet.</p>
      )}
    </div>
  );
}

export default function CouncilChat({ agentId, agentName, agentRole }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState({});

  const submit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setReplies({});

    const context = agentName
      ? `This decision concerns agent "${agentName}" (${agentRole}).`
      : "This is a general strategic question.";

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Council of Four advisors. A question has been posed${agentName ? ` about the AI agent "${agentName}" (role: ${agentRole})` : ""}.

Question: ${question}

Respond as each of the four council voices. Be direct, insightful, and distinct in each voice's perspective:
1. ARCHITECT: Focus on correctness, system design, and long-term consequences.
2. SKEPTIC: Challenge assumptions and premises. What are we missing?
3. PRAGMATIST: Focus on shipping, user impact, and what actually matters now.
4. CRITIC: Identify edge cases, failure modes, and risks.

Each response should be 2-4 sentences.`,
      response_json_schema: {
        type: "object",
        properties: {
          architect: { type: "string" },
          skeptic: { type: "string" },
          pragmatist: { type: "string" },
          critic: { type: "string" }
        }
      }
    });

    setReplies(result);
    setLoading(false);
  };

  return (
    <div data-testid="council-chat">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-slate-500" />
        <h3 className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Council of Four</h3>
        <span className="eyebrow ml-2">Architect · Skeptic · Pragmatist · Critic</span>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-6">
        <input
          data-testid="council-chat-input"
          className="input-dark flex-1"
          placeholder={agentName ? `Ask the council about ${agentName}…` : "Pose a decision to the council…"}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && submit()}
        />
        <button
          data-testid="council-chat-submit"
          onClick={submit}
          disabled={loading || !question.trim()}
          className="cta-primary px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Voice cards */}
      <div className="grid grid-cols-1 gap-3">
        {VOICE_ORDER.map((key) => (
          <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <VoiceCard
              voiceKey={key}
              reply={replies[key] || null}
              loading={loading}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}