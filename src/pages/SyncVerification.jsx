import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertTriangle, XCircle, RefreshCcw, ShieldCheck, ChevronDown, ChevronUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  ok: { icon: CheckCircle, color: "#00FF66", bg: "rgba(0,255,102,0.08)", border: "rgba(0,255,102,0.25)", label: "OK" },
  warning: { icon: AlertTriangle, color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", label: "Warning" },
  error: { icon: XCircle, color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "Error" },
};

const SEVERITY_COLORS = {
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#64748B",
};

function AgentVerifyRow({ agent }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.ok;
  const Icon = cfg.icon;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-110 transition-all"
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
        <span className="text-white font-semibold text-sm flex-1" style={{ fontFamily: "Chivo, sans-serif" }}>
          {agent.name}
        </span>
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <span>{agent.completeness}% complete</span>
          {agent.soul_truncated && <span className="text-amber-400">truncated</span>}
          {agent.name_has_whitespace && <span className="text-amber-400">⚠ name whitespace</span>}
          <span style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: `1px solid ${cfg.border}` }}>

              {/* Issues */}
              {agent.issues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="eyebrow mb-2">Issues</p>
                  {agent.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEVERITY_COLORS[issue.severity] }} />
                      <span style={{ color: SEVERITY_COLORS[issue.severity] }}>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Field grid */}
              <div>
                <p className="eyebrow mb-2">Local Fields</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {agent.missing_fields?.length === 0 ? (
                    <span className="col-span-3 text-xs text-[#00FF66]">All fields populated ✓</span>
                  ) : (
                    <>
                      <span className="col-span-3 text-xs text-slate-400">
                        Missing: <span className="text-amber-400">{agent.missing_fields?.join(", ")}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Remote status */}
              <div>
                <p className="eyebrow mb-2">Remote (Superagent)</p>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <span className={agent.remote_status === "found" ? "text-[#00FF66]" : "text-red-400"}>
                      {agent.remote_status}
                    </span>
                  </div>
                  {agent.superagent_id && (
                    <div className="flex items-center gap-2">
                      <span>ID:</span>
                      <span className="font-mono text-[10px] text-slate-500">{agent.superagent_id}</span>
                    </div>
                  )}
                  {agent.remote_status === "found" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span>Has description:</span>
                        <span className={agent.remote_has_description ? "text-[#00FF66]" : "text-red-400"}>
                          {agent.remote_has_description ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Description in sync:</span>
                        <span className={agent.description_in_sync ? "text-[#00FF66]" : "text-amber-400"}>
                          {agent.description_in_sync ? "Yes ✓" : "Out of sync"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Soul length:</span>
                        <span className="font-mono text-slate-500">{agent.soul_length} chars</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SyncVerification() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const runVerification = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke("verifyAgentSync", {});
      setResults(res.data);
    } catch (e) {
      setResults({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = results?.agents?.filter(a => {
    if (filter === "all") return true;
    return a.status === filter;
  }) || [];

  const summary = results?.summary;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-2">OS³ Nexus</p>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "Chivo, sans-serif" }}>
            Sync Verification
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Deep field-by-field check — verifies every agent's data is correctly pushed to Superagent.
          </p>
        </div>

        {/* Run button */}
        <button
          onClick={runVerification}
          disabled={loading}
          className="cta-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mb-8 disabled:opacity-60"
        >
          {loading
            ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Running verification…</>
            : <><ShieldCheck className="w-4 h-4" /> Run Full Verification</>
          }
        </button>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Agents", value: summary.total, color: "#F8FAFC" },
              { label: "Passing", value: summary.ok, color: "#00FF66" },
              { label: "Warnings", value: summary.warnings, color: "#F59E0B" },
              { label: "Errors", value: summary.errors, color: "#EF4444" },
            ].map(({ label, value, color }) => (
              <div key={label} className="panel p-4 text-center">
                <p className="text-2xl font-black" style={{ color, fontFamily: "Chivo, sans-serif" }}>{value}</p>
                <p className="eyebrow mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Secondary stats */}
        {summary && (
          <div className="flex flex-wrap gap-4 mb-6 text-xs font-mono text-slate-500">
            {summary.not_linked > 0 && <span className="text-red-400">⚠ {summary.not_linked} not linked to Superagent</span>}
            {summary.stale_ids > 0 && <span className="text-red-400">⚠ {summary.stale_ids} stale IDs (404)</span>}
            {summary.name_whitespace > 0 && <span className="text-amber-400">⚠ {summary.name_whitespace} agents have name whitespace</span>}
            {summary.soul_truncated > 0 && <span className="text-amber-400">⚠ {summary.soul_truncated} souls truncated</span>}
            {summary.errors === 0 && summary.warnings === 0 && (
              <span className="text-[#00FF66]">✓ All agents verified — no issues found</span>
            )}
          </div>
        )}

        {/* Filter tabs */}
        {results?.agents && (
          <div className="flex items-center gap-2 mb-5">
            {["all", "ok", "warning", "error"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors capitalize ${filter === f ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
                style={filter === f ? { background: "#20242C", border: "1px solid #3A3F4A" } : { background: "transparent", border: "1px solid transparent" }}
              >
                {f === "all" ? `All (${results.agents.length})` : `${f} (${results.agents.filter(a => a.status === f).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Agent results */}
        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(agent => (
              <AgentVerifyRow key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Error state */}
        {results?.error && (
          <div className="panel p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 text-sm font-mono">{results.error}</p>
          </div>
        )}

        {/* Empty state */}
        {!results && !loading && (
          <div className="panel p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Click "Run Full Verification" to audit all agents</p>
            <p className="text-slate-600 text-xs mt-2">Checks fields, soul compilation, Superagent linkage and description sync</p>
          </div>
        )}

        {loading && (
          <div className="panel p-12 text-center">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-[#00FF66] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Checking all agents against Superagent…</p>
            <p className="text-slate-600 text-xs mt-1">This may take 20–40 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
}