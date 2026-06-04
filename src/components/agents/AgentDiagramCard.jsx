import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Brain, Settings, CheckSquare, Square } from "lucide-react";
import AgentAvatar from "@/components/agents/AgentAvatar";

const statusColors = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };
const riskColors = { low: "risk-low", medium: "risk-medium", high: "risk-high" };

// Parse last_activity strings like "2 min ago", "3 days ago", "1 week ago" into days
function parseDaysIdle(lastActivity) {
  if (!lastActivity) return 99;
  const s = lastActivity.toLowerCase();
  const num = parseInt(s);
  if (isNaN(num)) return 0;
  if (s.includes("day")) return num;
  if (s.includes("week")) return num * 7;
  if (s.includes("month")) return num * 30;
  return 0; // minutes/hours = active
}

function WorkloadIndicator({ agent }) {
  const daysIdle = parseDaysIdle(agent.last_activity);
  const hasTask = !!agent.current_task;
  const idleWarning = daysIdle >= 3;

  // Determine workload level
  let level, label, color, pulse;
  if (agent.status === "busy" || (hasTask && daysIdle < 1)) {
    level = "high"; label = "High"; color = "#F59E0B"; pulse = false;
  } else if (hasTask && daysIdle < 3) {
    level = "moderate"; label = "Active"; color = "#00FF66"; pulse = false;
  } else if (idleWarning) {
    level = "idle"; label = `Idle ${daysIdle}d`; color = "#EF4444"; pulse = true;
  } else {
    level = "low"; label = "Low"; color = "#475569"; pulse = false;
  }

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <div className="relative flex-shrink-0">
        <div
          className={pulse ? "animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" : ""}
          style={{ background: pulse ? color : "transparent" }}
        />
        <div className="relative rounded-full"
          style={{
            width: 7, height: 7,
            background: color,
            boxShadow: pulse ? `0 0 8px ${color}` : level !== "low" ? `0 0 6px ${color}55` : "none"
          }} />
      </div>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color, letterSpacing: "0.08em" }}>
        {label}
      </span>
      {pulse && (
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#EF4444", opacity: 0.7 }}>
          · no task {daysIdle >= 3 && daysIdle < 5 ? "3–5d" : `${daysIdle}d`}
        </span>
      )}
    </div>
  );
}

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

export default function AgentDiagramCard({ agent, onOpen, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="agent-card panel cursor-pointer"
      style={{ overflow: "hidden", borderColor: selected ? "rgba(0,255,102,0.5)" : undefined }}
    >
      {/* Compact header — always visible */}
      <div className="p-5" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start gap-4">
          {/* Avatar + status */}
          <div className="relative flex-shrink-0">
            <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="md" />
            <span className="status-dot absolute -bottom-0.5 -right-0.5"
              style={{ background: statusColors[agent.status] || "#00FF66", border: "2px solid #15171C" }} />
          </div>

          {/* Checkbox */}
          {onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(agent.id); }}
              className="flex-shrink-0 text-slate-600 hover:text-[#00FF66] transition-colors mt-0.5"
            >
              {selected ? <CheckSquare className="w-4 h-4 text-[#00FF66]" /> : <Square className="w-4 h-4" />}
            </button>
          )}

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-white font-semibold leading-tight truncate"
                  style={{ fontFamily: "Chivo, sans-serif" }}>{agent.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{agent.role}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className={riskColors[agent.risk_level] || "risk-low"}>{agent.risk_level || "low"}</span>
                  {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                </div>
                <WorkloadIndicator agent={agent} />
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