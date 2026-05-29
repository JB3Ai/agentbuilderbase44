import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Brain, Shield, Settings, BookOpen } from "lucide-react";

const statusColors = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };
const riskColors = { low: "risk-low", medium: "risk-medium", high: "risk-high" };

function FieldRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1.5 border-b border-[#1E2128]">
      <span className="eyebrow w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-300 leading-snug">{value}</span>
    </div>
  );
}

function TagList({ label, items, color = "text-slate-300" }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="eyebrow mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`px-3 py-1 rounded-full text-xs font-mono ${color}`}
            style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AgentDiagramCard({ agent, onOpen }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="agent-card panel cursor-pointer"
      style={{ overflow: "hidden" }}
    >
      {/* Compact header — always visible */}
      <div className="p-5" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start gap-4">
          {/* Avatar + status */}
          <div className="relative flex-shrink-0">
            <img src={agent.avatar_url} alt={agent.name}
              className="w-14 h-14 rounded-xl object-cover"
              style={{ border: "2px solid #20242C" }} />
            <span className="status-dot absolute -bottom-0.5 -right-0.5"
              style={{ background: statusColors[agent.status] || "#00FF66", border: "2px solid #15171C" }} />
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-white font-semibold leading-tight truncate"
                  style={{ fontFamily: "Chivo, sans-serif" }}>{agent.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{agent.role}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={riskColors[agent.risk_level] || "risk-low"}>{agent.risk_level || "low"}</span>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
            </div>

            {/* Current task */}
            {agent.current_task && (
              <div className="mt-2 flex items-start gap-1.5">
                <Zap className="w-3 h-3 text-[#00FF66] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400 leading-snug">{agent.current_task}</p>
              </div>
            )}
          </div>
        </div>

        {/* Skill chips preview (collapsed) */}
        {!expanded && agent.skills && agent.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {agent.skills.slice(0, 3).map((s, i) => (
              <span key={i} className="px-2 py-0.5 text-xs font-mono text-slate-500 rounded"
                style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>{s}</span>
            ))}
            {agent.skills.length > 3 && (
              <span className="text-xs text-slate-600 self-center">+{agent.skills.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ borderTop: "1px solid #1E2128" }}
          >
            <div className="px-5 py-4 space-y-4">
              {/* Diagram row — key fields */}
              <div className="space-y-0">
                {agent.personality && <FieldRow label="Personality" value={agent.personality} />}
                {agent.age && <FieldRow label="Age" value={agent.age} />}
                {agent.gender && <FieldRow label="Gender" value={agent.gender} />}
                {agent.dress_code && <FieldRow label="Dress Code" value={agent.dress_code} />}
                {agent.last_activity && <FieldRow label="Last Active" value={agent.last_activity} />}
              </div>

              {/* Skills */}
              {agent.skills && agent.skills.length > 0 && (
                <TagList label="Skills" items={agent.skills} color="text-[#93C5FD]" />
              )}

              {/* Operating Principles */}
              {agent.operating_principles && agent.operating_principles.length > 0 && (
                <div className="mt-3">
                  <p className="eyebrow mb-2">Operating Principles</p>
                  <div className="space-y-1.5">
                    {agent.operating_principles.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-[#00FF66] flex-shrink-0 mt-0.5">→</span>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automation + Memory */}
              <div className="grid grid-cols-1 gap-3 mt-3">
                {agent.automation && (
                  <div className="p-3 rounded-lg" style={{ background: "#101319", border: "1px solid #1E2128" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Settings className="w-3 h-3 text-slate-600" />
                      <span className="eyebrow">Automation</span>
                    </div>
                    <p className="text-xs text-slate-400">{agent.automation}</p>
                  </div>
                )}
                {agent.memory && (
                  <div className="p-3 rounded-lg" style={{ background: "#101319", border: "1px solid #1E2128" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain className="w-3 h-3 text-slate-600" />
                      <span className="eyebrow">Memory</span>
                    </div>
                    <p className="text-xs text-slate-400">{agent.memory}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpen(agent); }}
                  className="cta-primary flex-1 py-2 rounded-lg text-sm font-medium"
                >
                  Open Full Profile
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                  style={{ border: "1px solid #20242C" }}
                >
                  Collapse
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}