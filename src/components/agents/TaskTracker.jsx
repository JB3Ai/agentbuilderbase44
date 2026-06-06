import { useState } from "react";
import { Zap, CheckCircle2, AlertTriangle, Clock, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import AgentAvatar from "@/components/agents/AgentAvatar";

const TASK_STATUS_CONFIG = {
  in_progress: { label: "In Progress", color: "#00FF66", bg: "rgba(0,255,102,0.08)", border: "rgba(0,255,102,0.25)", icon: Zap },
  review:      { label: "In Review",   color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)", icon: Clock },
  stalled:     { label: "Stalled",     color: "#EF4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  icon: AlertTriangle },
  complete:    { label: "Complete",    color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", icon: CheckCircle2 },
};

const STATUS_DOT = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 80 ? "#00FF66" : pct >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "#1E2128" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.4s ease", borderRadius: 999 }} />
      </div>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

function TaskRow({ agent, onOpen }) {
  const cfg = TASK_STATUS_CONFIG[agent.task_status] || TASK_STATUS_CONFIG.in_progress;
  const Icon = cfg.icon;
  const hasTask = !!agent.current_task;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors"
      style={{ background: "#15171C", border: "1px solid #20242C" }}
      onClick={() => onOpen(agent)}
    >
      {/* Avatar + status */}
      <div className="relative flex-shrink-0">
        <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="sm" />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full"
          style={{ width: 8, height: 8, background: STATUS_DOT[agent.status] || "#00FF66", border: "2px solid #15171C" }} />
      </div>

      {/* Name + role */}
      <div className="w-40 flex-shrink-0">
        <p className="text-white text-sm font-semibold leading-tight truncate" style={{ fontFamily: "Chivo, sans-serif" }}>{agent.name}</p>
        <p className="text-xs text-slate-600 truncate">{agent.role}</p>
      </div>

      {/* Task */}
      <div className="flex-1 min-w-0">
        {hasTask ? (
          <>
            <p className="text-xs text-slate-300 leading-snug truncate">{agent.current_task}</p>
            {agent.task_progress != null && <ProgressBar value={agent.task_progress} />}
          </>
        ) : (
          <p className="text-xs text-slate-600 italic">No active task</p>
        )}
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

export default function TaskTracker({ agents, onOpenAgent }) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState("all");

  const active = agents.filter((a) => a.status !== "offline" || a.current_task);

  const filtered = filter === "all"
    ? active
    : active.filter((a) => (a.task_status || "in_progress") === filter);

  const counts = {
    in_progress: active.filter((a) => (a.task_status || "in_progress") === "in_progress").length,
    review:      active.filter((a) => a.task_status === "review").length,
    stalled:     active.filter((a) => a.task_status === "stalled").length,
    complete:    active.filter((a) => a.task_status === "complete").length,
  };

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 text-white font-bold hover:text-[#00FF66] transition-colors"
            style={{ fontFamily: "Chivo, sans-serif", fontSize: 18 }}
          >
            {collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            Task Pulse
          </button>
          <span className="eyebrow">{active.length} active agents</span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {[["all", "All", "#94A3B8"], ...Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => [k, v.label, v.color])].map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1 rounded-full text-xs font-mono transition-colors"
              style={{
                color: filter === key ? color : "#475569",
                background: filter === key ? `${color}15` : "#15171C",
                border: `1px solid ${filter === key ? `${color}50` : "#20242C"}`,
              }}
            >
              {label}
              {key !== "all" && counts[key] > 0 && (
                <span className="ml-1 opacity-70">({counts[key]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">No agents match this filter.</div>
          ) : (
            filtered.map((agent) => (
              <TaskRow key={agent.id} agent={agent} onOpen={onOpenAgent} />
            ))
          )}
        </div>
      )}
    </div>
  );
}