import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Zap, ZapOff, ArrowRight, Check, X, AlertTriangle, Clock, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentAvatar from "@/components/agents/AgentAvatar";

const STATUS_CONFIG = {
  pending_approval: { label: "Pending Approval", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", icon: Clock },
  in_progress: { label: "In Progress", color: "#3B82F6", bg: "rgba(59,130,246,0.08)", icon: Zap },
  in_review: { label: "In Review", color: "#A78BFA", bg: "rgba(167,139,250,0.08)", icon: Filter },
  complete: { label: "Complete", color: "#00FF66", bg: "rgba(0,255,102,0.08)", icon: Check },
  stalled: { label: "Stalled", color: "#EF4444", bg: "rgba(239,68,68,0.08)", icon: AlertTriangle },
};

const TIER_COLORS = {
  automatic: { fg: "#64748B", label: "Automatic", icon: ZapOff },
  premium: { fg: "#F59E0B", label: "Premium", icon: Zap },
};

export default function TaskPipeline({ agents, onOpenAgent }) {
  const [tasks, setTasks] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [filterAgent, setFilterAgent] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const data = await base44.entities.Task.list("-created_date", 50);
      setTasks(data);
    } catch (err) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const filtered = useMemo(() => {
    if (filterAgent === "all") return tasks;
    return tasks.filter(t => t.owner_agent === filterAgent || t.approver_agent === filterAgent);
  }, [tasks, filterAgent]);

  const grouped = useMemo(() => {
    const map = {};
    for (const t of filtered) {
      const s = t.status || "pending_approval";
      if (!map[s]) map[s] = [];
      map[s].push(t);
    }
    return map;
  }, [filtered]);

  const agentNames = useMemo(() => [...new Set(agents.map(a => a.name))].sort(), [agents]);

  const totalPremium = tasks.filter(t => t.model_tier === "premium").length;
  const totalAutomatic = tasks.filter(t => t.model_tier === "automatic").length;

  return (
    <div className="mb-10 panel overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1A1D24] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-[#00FF66]" />
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
              Task Pipeline
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {tasks.length} tasks · {totalPremium} premium · {totalAutomatic} automatic
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{expanded ? "Collapse" : "Expand"}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Filters */}
            <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid #20242C" }}>
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="input-dark text-xs w-auto min-w-[140px]"
              >
                <option value="all">All Agents</option>
                {agentNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {tasks.length > 0 && (
                <div className="flex-1" />
              )}
              {tasks.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#F59E0B]">
                    <Zap className="w-3 h-3" /> {totalPremium} Premium
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <ZapOff className="w-3 h-3" /> {totalAutomatic} Automatic
                  </span>
                </div>
              )}
            </div>

            {/* Board */}
            <div style={{ borderTop: "1px solid #20242C" }}>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00FF66] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500">Loading task pipeline…</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-12 text-center">
                  <Layers className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No tasks yet</p>
                  <p className="text-slate-600 text-xs mt-1">Tasks will appear here when created by agents</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const Icon = config.icon;
                    const statusTasks = grouped[status] || [];
                    return (
                      <div key={status} className="flex flex-col gap-2">
                        {/* Column header */}
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: config.bg }}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: config.color }} />
                          <span className="text-[11px] font-semibold font-mono uppercase tracking-wider" style={{ color: config.color }}>
                            {config.label}
                          </span>
                          <span className="ml-auto text-[10px] font-mono" style={{ color: config.color, opacity: 0.6 }}>
                            {statusTasks.length}
                          </span>
                        </div>

                        {/* Tasks */}
                        {statusTasks.map(task => (
                          <div
                            key={task.id}
                            className="p-3 rounded-lg transition-colors cursor-pointer"
                            style={{ background: "#101319", border: "1px solid #1E2128" }}
                            onClick={() => {
                              const agent = agents.find(a => a.name === task.owner_agent);
                              if (agent && onOpenAgent) onOpenAgent(agent);
                            }}
                          >
                            <p className="text-white text-xs font-medium truncate" style={{ fontFamily: "Chivo, sans-serif" }}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">{task.description}</p>
                            )}

                            {/* Agent routing */}
                            <div className="flex items-center gap-2 mt-2">
                              {task.owner_agent && (
                                <div className="flex items-center gap-1.5">
                                  <AgentAvatar name={task.owner_agent} size="sm" />
                                  <span className="text-[10px] text-slate-400">{task.owner_agent}</span>
                                </div>
                              )}
                              {task.approver_agent && task.approver_agent !== task.owner_agent && (
                                <>
                                  <ArrowRight className="w-3 h-3 text-slate-600" />
                                  <div className="flex items-center gap-1.5">
                                    <AgentAvatar name={task.approver_agent} size="sm" />
                                    <span className="text-[10px] text-slate-400">{task.approver_agent}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Tier + Priority footer */}
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                                style={{ color: TIER_COLORS[task.model_tier || "automatic"].fg, background: `${TIER_COLORS[task.model_tier || "automatic"].fg}11` }}
                              >
                                {TIER_COLORS[task.model_tier || "automatic"].label}
                              </span>
                              {task.priority > 0 && (
                                <span className="text-[9px] font-mono text-slate-600">P{task.priority}</span>
                              )}
                            </div>
                          </div>
                        ))}

                        {statusTasks.length === 0 && (
                          <div className="p-4 rounded-lg text-center" style={{ background: "#0D0F14", border: "1px dashed #1E2128" }}>
                            <span className="text-[10px] text-slate-700">—</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}