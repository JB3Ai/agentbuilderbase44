import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ZapOff, Brain, Cpu, TrendingUp, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import AgentAvatar from "@/components/agents/AgentAvatar";

const STRATEGY_AGENTS = ["Adam", "Codie", "Lex", "Frank Mercer"];
const EXECUTION_AGENTS = ["Vera", "Bobby", "Max", "Chloe", "Scout"];

export default function CreditTierDashboard({ agents, tasks }) {
  const [expanded, setExpanded] = useState(true);

  const tierData = useMemo(() => {
    const agentTierMap = {};
    for (const agent of agents) {
      const isStrategy = STRATEGY_AGENTS.includes(agent.name);
      agentTierMap[agent.name] = {
        ...agent,
        tier: isStrategy ? "premium" : "automatic",
        tierLabel: isStrategy ? "Strategy — Premium" : "Execution — Automatic",
        taskCount: 0,
        premiumTasks: 0,
        autoTasks: 0,
        estCredits: 0,
        strategy: isStrategy,
      };
    }

    for (const task of tasks) {
      const owner = task.owner_agent;
      if (agentTierMap[owner]) {
        agentTierMap[owner].taskCount++;
        if (task.model_tier === "premium") {
          agentTierMap[owner].premiumTasks++;
          agentTierMap[owner].estCredits += 15;
        } else {
          agentTierMap[owner].autoTasks++;
          agentTierMap[owner].estCredits += 3;
        }
      }
    }

    const premiumAgents = Object.values(agentTierMap).filter(a => a.strategy);
    const autoAgents = Object.values(agentTierMap).filter(a => !a.strategy);

    const premiumCredits = premiumAgents.reduce((s, a) => s + a.estCredits, 0);
    const autoCredits = autoAgents.reduce((s, a) => s + a.estCredits, 0);
    const totalCredits = premiumCredits + autoCredits;

    return {
      premiumAgents,
      autoAgents,
      premiumCredits,
      autoCredits,
      totalCredits,
      premiumTaskTotal: premiumAgents.reduce((s, a) => s + a.taskCount, 0),
      autoTaskTotal: autoAgents.reduce((s, a) => s + a.taskCount, 0),
    };
  }, [agents, tasks]);

  if (tasks.length === 0) return null;

  const { premiumAgents, autoAgents, premiumCredits, autoCredits, totalCredits, premiumTaskTotal, autoTaskTotal } = tierData;
  const savingsPct = totalCredits > 0 ? `${Math.round((autoCredits / totalCredits) * 100)}%` : "—";

  return (
    <div className="mb-10 panel overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1A1D24] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4 text-[#F59E0B]" />
            <Cpu className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
              Credit Tier Tracker
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {premiumAgents.length} Strategy · {autoAgents.length} Execution · ≈{totalCredits} est. credits used
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
            <div style={{ borderTop: "1px solid #20242C" }}>
              {/* Summary bar */}
              <div className="grid grid-cols-4 gap-0" style={{ borderBottom: "1px solid #20242C" }}>
                <div className="px-4 py-3 text-center" style={{ borderRight: "1px solid #20242C" }}>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Total Credits</p>
                  <p className="text-white text-lg font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>≈{totalCredits}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">est. from {tasks.length} tasks</p>
                </div>
                <div className="px-4 py-3 text-center" style={{ borderRight: "1px solid #20242C" }}>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Premium</p>
                  <p className="text-[#F59E0B] text-lg font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>≈{premiumCredits}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{premiumTaskTotal} tasks · ~15cr each</p>
                </div>
                <div className="px-4 py-3 text-center" style={{ borderRight: "1px solid #20242C" }}>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Automatic</p>
                  <p className="text-slate-400 text-lg font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>≈{autoCredits}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{autoTaskTotal} tasks · ~3cr each</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Savings</p>
                  <p className="text-[#00FF66] text-lg font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>{savingsPct}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">on automatic tier</p>
                </div>
              </div>

              {/* Tier groups */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Premium Column */}
                <div className="p-4" style={{ borderRight: "1px solid #20242C" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-xs font-semibold text-[#F59E0B] font-mono uppercase tracking-wider">Strategy — Premium Tier</span>
                    <span className="ml-auto text-[10px] font-mono text-[#F59E0B]/60">≈{premiumCredits} credits</span>
                  </div>
                  <div className="space-y-2">
                    {premiumAgents.map(agent => (
                      <div
                        key={agent.name}
                        className="flex items-center gap-3 p-2.5 rounded-lg"
                        style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}
                      >
                        <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate" style={{ fontFamily: "Chivo, sans-serif" }}>{agent.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{agent.role}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[#F59E0B] text-xs font-bold font-mono">≈{agent.estCredits}cr</p>
                          <p className="text-[10px] text-slate-600">{agent.taskCount} tasks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automatic Column */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Execution — Automatic Tier</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-500">≈{autoCredits} credits</span>
                  </div>
                  <div className="space-y-2">
                    {autoAgents.map(agent => (
                      <div
                        key={agent.name}
                        className="flex items-center gap-3 p-2.5 rounded-lg"
                        style={{ background: "rgba(100,116,139,0.04)", border: "1px solid rgba(100,116,139,0.12)" }}
                      >
                        <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate" style={{ fontFamily: "Chivo, sans-serif" }}>{agent.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{agent.role}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-slate-400 text-xs font-bold font-mono">≈{agent.estCredits}cr</p>
                          <p className="text-[10px] text-slate-600">{agent.taskCount} tasks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="px-5 py-2.5 flex items-center gap-6 text-[10px] text-slate-600 font-mono" style={{ borderTop: "1px solid #20242C" }}>
                <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-[#F59E0B]" /> Premium ≈15cr/task</span>
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-slate-500" /> Automatic ≈3cr/task</span>
                <span>Estimates based on current task load</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}