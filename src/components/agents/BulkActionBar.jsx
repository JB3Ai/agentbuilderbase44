import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, X, Zap, Radio, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUSES = [
  { value: "online", label: "Set Online", color: "#00FF66" },
  { value: "busy", label: "Set Busy", color: "#F59E0B" },
  { value: "offline", label: "Set Offline", color: "#64748B" },
];

export default function BulkActionBar({ selectedIds, agents, onClear, onDone }) {
  const [loading, setLoading] = useState(false);
  const [triggerTask, setTriggerTask] = useState("");
  const [showTrigger, setShowTrigger] = useState(false);

  const selectedAgents = agents.filter((a) => selectedIds.includes(a.id));
  const count = selectedAgents.length;

  const handleStatusUpdate = async (status) => {
    setLoading(true);
    await Promise.all(
      selectedAgents.map((a) => base44.entities.Agent.update(a.id, { status }))
    );
    setLoading(false);
    onDone();
  };

  const handleTriggerWorkflow = async () => {
    if (!triggerTask.trim()) return;
    setLoading(true);
    await Promise.all(
      selectedAgents.map((a) =>
        base44.entities.Agent.update(a.id, {
          status: "busy",
          current_task: triggerTask.trim(),
          last_activity: "just now",
        })
      )
    );
    setLoading(false);
    setTriggerTask("");
    setShowTrigger(false);
    onDone();
  };

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 z-40"
        style={{ transform: "translateX(-50%)" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{
            background: "#15171C",
            border: "1px solid #2A2F3A",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,102,0.08)",
            minWidth: 420,
          }}
        >
          {/* Count badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <CheckSquare className="w-4 h-4 text-[#00FF66]" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "Chivo, sans-serif" }}>
              {count} selected
            </span>
            <div className="divider-vert h-5 mx-1" />
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusUpdate(s.value)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                style={{ color: s.color, border: `1px solid ${s.color}30`, background: `${s.color}08` }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="divider-vert h-5 mx-1" />

          {/* Trigger workflow */}
          <div className="flex items-center gap-2">
            {!showTrigger ? (
              <button
                onClick={() => setShowTrigger(true)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#93C5FD] disabled:opacity-40"
                style={{ border: "1px solid rgba(147,197,253,0.25)", background: "rgba(147,197,253,0.05)" }}
              >
                <Zap className="w-3.5 h-3.5" />
                Trigger Task
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="input-dark text-xs py-1.5"
                  style={{ width: 180, fontSize: 12 }}
                  placeholder="Task to assign…"
                  value={triggerTask}
                  onChange={(e) => setTriggerTask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTriggerWorkflow(); if (e.key === "Escape") setShowTrigger(false); }}
                />
                <button
                  onClick={handleTriggerWorkflow}
                  disabled={loading || !triggerTask.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#93C5FD] disabled:opacity-40"
                  style={{ border: "1px solid rgba(147,197,253,0.25)", background: "rgba(147,197,253,0.08)" }}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                  Go
                </button>
              </div>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={onClear}
            className="ml-1 p-1.5 rounded-lg text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}