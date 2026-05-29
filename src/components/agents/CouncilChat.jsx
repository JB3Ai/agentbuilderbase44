import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Users, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VOICE_META = {
  architect: {
    label: "Architect", lens: "Correctness & long-term",
    dotClass: "voice-dot-architect", textClass: "voice-architect",
    role: "ARCHITECT — focus on correctness, maintainability, and long-term implications."
  },
  skeptic: {
    label: "Skeptic", lens: "Premise challenge",
    dotClass: "voice-dot-skeptic", textClass: "voice-skeptic",
    role: "SKEPTIC — challenge framing, question assumptions, propose the simplest credible alternative."
  },
  pragmatist: {
    label: "Pragmatist", lens: "Shipping & user impact",
    dotClass: "voice-dot-pragmatist", textClass: "voice-pragmatist",
    role: "PRAGMATIST — optimize for speed, simplicity, and real-world execution."
  },
  critic: {
    label: "Critic", lens: "Edge cases & failure modes",
    dotClass: "voice-dot-critic", textClass: "voice-critic",
    role: "CRITIC — surface downside risk, edge cases, and reasons the plan could fail."
  },
};

const VOICE_ORDER = ["architect", "skeptic", "pragmatist", "critic"];

function VoiceCard({ voiceKey, data, loading }) {
  const meta = VOICE_META[voiceKey];
  const [open, setOpen] = useState(true);

  return (
    <div className="panel">
      {/* Voice header */}
      <button className="w-full flex items-center gap-2 p-4 text-left" onClick={() => setOpen(v => !v)}>
        <span className={`status-dot ${meta.dotClass}`} />
        <span className={`text-sm font-semibold ${meta.textClass}`} style={{ fontFamily: "Chivo, sans-serif" }}>
          {meta.label}
        </span>
        <span className="eyebrow ml-1">{meta.lens}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-600 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#1E2128] pt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Deliberating…
            </div>
          ) : data ? (
            <>
              {data.position && (
                <div>
                  <p className="eyebrow mb-1">Position</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{data.position}</p>
                </div>
              )}
              {data.reasoning && data.reasoning.length > 0 && (
                <div>
                  <p className="eyebrow mb-1">Reasoning</p>
                  <ul className="space-y-1">
                    {data.reasoning.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className={`${meta.textClass} flex-shrink-0 mt-0.5`}>·</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.risk && (
                <div className="p-2.5 rounded-lg" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p className="eyebrow mb-1" style={{ color: "#FCA5A5" }}>Risk</p>
                  <p className="text-xs text-slate-400">{data.risk}</p>
                </div>
              )}
              {data.surprise && (
                <div className="p-2.5 rounded-lg" style={{ background: "rgba(0,255,102,0.03)", border: "1px solid rgba(0,255,102,0.12)" }}>
                  <p className="eyebrow mb-1" style={{ color: "#00FF66" }}>Surprise</p>
                  <p className="text-xs text-slate-400">{data.surprise}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600 italic">Awaiting question…</p>
          )}
        </div>
      )}
    </div>
  );
}

function VerdictCard({ verdict }) {
  if (!verdict) return null;
  return (
    <div className="panel p-5 mt-4" style={{ border: "1px solid rgba(0,255,102,0.2)" }}>
      <p className="text-white font-semibold mb-4" style={{ fontFamily: "Chivo, sans-serif" }}>
        ## Verdict
      </p>
      <div className="space-y-3">
        {verdict.consensus && (
          <div>
            <p className="eyebrow mb-1 text-[#00FF66]">Consensus</p>
            <p className="text-sm text-slate-300">{verdict.consensus}</p>
          </div>
        )}
        {verdict.strongest_dissent && (
          <div>
            <p className="eyebrow mb-1 text-[#FCA5A5]">Strongest Dissent</p>
            <p className="text-sm text-slate-300">{verdict.strongest_dissent}</p>
          </div>
        )}
        {verdict.premise_check && (
          <div>
            <p className="eyebrow mb-1 text-[#FCD34D]">Premise Check</p>
            <p className="text-sm text-slate-300">{verdict.premise_check}</p>
          </div>
        )}
        {verdict.recommendation && (
          <div className="p-3 rounded-lg mt-2" style={{ background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.2)" }}>
            <p className="eyebrow mb-1 text-[#00FF66]">Recommendation</p>
            <p className="text-sm text-white font-medium">{verdict.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CouncilChat({ agentId, agentName, agentRole }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState({});
  const [verdict, setVerdict] = useState(null);
  const [title, setTitle] = useState("");

  const submit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setVoices({});
    setVerdict(null);
    setTitle("");

    const context = agentName
      ? `This decision concerns AI agent "${agentName}" (role: ${agentRole}).`
      : "This is a general strategic question.";

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are convening a four-voice decision council. ${context}

Decision question: ${question}

For each of the four council voices, respond with their structured analysis. Be direct, specific, and distinct per voice.

Voice roles:
- ARCHITECT: correctness, maintainability, long-term implications
- SKEPTIC: challenge framing, question assumptions, propose the simplest credible alternative
- PRAGMATIST: optimize for speed, simplicity, and real-world execution
- CRITIC: surface downside risk, edge cases, and reasons the plan could fail

Each voice must include:
1. position (1-2 sentences)
2. reasoning (array of 3 concise bullet strings)
3. risk (biggest risk in their recommendation)
4. surprise (one thing the other voices may miss)

Also produce a verdict with:
- title: short decision title
- consensus: where voices align
- strongest_dissent: most important disagreement
- premise_check: did the Skeptic challenge the question itself?
- recommendation: the synthesized path forward

Keep each voice under 300 words. Be scannable.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          architect: {
            type: "object",
            properties: {
              position: { type: "string" },
              reasoning: { type: "array", items: { type: "string" } },
              risk: { type: "string" },
              surprise: { type: "string" }
            }
          },
          skeptic: {
            type: "object",
            properties: {
              position: { type: "string" },
              reasoning: { type: "array", items: { type: "string" } },
              risk: { type: "string" },
              surprise: { type: "string" }
            }
          },
          pragmatist: {
            type: "object",
            properties: {
              position: { type: "string" },
              reasoning: { type: "array", items: { type: "string" } },
              risk: { type: "string" },
              surprise: { type: "string" }
            }
          },
          critic: {
            type: "object",
            properties: {
              position: { type: "string" },
              reasoning: { type: "array", items: { type: "string" } },
              risk: { type: "string" },
              surprise: { type: "string" }
            }
          },
          verdict: {
            type: "object",
            properties: {
              consensus: { type: "string" },
              strongest_dissent: { type: "string" },
              premise_check: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        }
      }
    });

    setTitle(result.title || "");
    setVoices({
      architect: result.architect,
      skeptic: result.skeptic,
      pragmatist: result.pragmatist,
      critic: result.critic,
    });
    setVerdict(result.verdict);
    setLoading(false);
  };

  return (
    <div data-testid="council-chat">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-slate-500" />
        <h3 className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Council of Four</h3>
      </div>
      <p className="eyebrow mb-4">Architect · Skeptic · Pragmatist · Critic — structured disagreement before deciding</p>

      {/* Input */}
      <div className="flex gap-2 mb-5">
        <input
          data-testid="council-chat-input"
          className="input-dark flex-1"
          placeholder={agentName ? `Pose a decision about ${agentName}…` : "What are we deciding?"}
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

      {/* Decision title */}
      {title && (
        <p className="eyebrow mb-3" style={{ color: "#00FF66" }}>## Council: {title}</p>
      )}

      {/* Voice cards */}
      <div className="space-y-3">
        {VOICE_ORDER.map((key) => (
          <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <VoiceCard voiceKey={key} data={voices[key] || null} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Verdict */}
      {verdict && <VerdictCard verdict={verdict} />}
    </div>
  );
}