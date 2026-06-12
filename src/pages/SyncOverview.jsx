import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCcw, CheckCircle2, AlertTriangle, Link, Unlink, Clock, Zap, ArrowRight } from "lucide-react";
import AgentAvatar from "@/components/agents/AgentAvatar";

const StatusBadge = ({ label, color, icon: Icon }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono"
    style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
  >
    <Icon className="w-3 h-3" />
    {label}
  </span>
);

const linkedColors = {
  bg: "rgba(0,255,102,0.06)", text: "#00FF66", border: "rgba(0,255,102,0.2)"
};
const unlinkedColors = {
  bg: "rgba(148,163,184,0.06)", text: "#94A3B8", border: "rgba(148,163,184,0.2)"
};
const staleColors = {
  bg: "rgba(245,158,11,0.06)", text: "#F59E0B", border: "rgba(245,158,11,0.2)"
};

export default function SyncOverview() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const loadAgents = async () => {
    setLoading(true);
    const all = await base44.entities.Agent.list("-updated_date", 50);
    setAgents(all);
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const runBatchSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke("syncAgentToSuperagent", { mode: "batch" });
      setSyncResult(res.data);
      await loadAgents();
    } catch (e) {
      setSyncResult({ error: e.message });
    }
    setSyncing(false);
  };

  const linked = agents.filter(a => a.superagent_id);
  const unlinked = agents.filter(a => !a.superagent_id);

  const isStale = (agent) => {
    if (!agent.superagent_synced_at) return true;
    const hours = (Date.now() - new Date(agent.superagent_synced_at).getTime()) / 36e5;
    return hours > 6;
  };

  const staleCount = linked.filter(isStale).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0C10" }}>
        <div className="w-6 h-6 border-2 border-slate-600 border-t-[#00FF66] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: "#0B0C10" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Chivo, sans-serif" }}>
              Sync Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Agent ↔ Superagent sync status across your Nexus
            </p>
            {lastCheck && (
              <p className="text-xs text-slate-600 mt-1">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAgents}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
              style={{ border: "1px solid #20242C" }}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={runBatchSync}
              disabled={syncing}
              className="cta-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {syncing ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {syncing ? "Syncing…" : "Sync All"}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-[#00FF66]" />
              <span className="text-xs text-slate-500">LINKED</span>
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "Chivo, sans-serif" }}>
              {linked.length}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Agents synced with Superagent</p>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs text-slate-500">STALE</span>
            </div>
            <p className="text-2xl font-bold text-[#F59E0B]" style={{ fontFamily: "Chivo, sans-serif" }}>
              {staleCount}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Not synced in over 6 hours</p>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Unlink className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">UNLINKED</span>
            </div>
            <p className="text-2xl font-bold text-slate-400" style={{ fontFamily: "Chivo, sans-serif" }}>
              {unlinked.length}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">No Superagent ID — needs linking</p>
          </div>
        </div>

        {/* Batch sync result */}
        {syncResult && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              background: syncResult.error
                ? "rgba(239,68,68,0.05)"
                : "rgba(0,255,102,0.04)",
              border: `1px solid ${syncResult.error ? "rgba(239,68,68,0.25)" : "rgba(0,255,102,0.2)"}`,
            }}
          >
            {syncResult.error ? (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {syncResult.error}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#00FF66]">
                <CheckCircle2 className="w-4 h-4" />
                {syncResult.synced > 0
                  ? `${syncResult.synced} agent(s) synced.`
                  : "All agents already in sync."}
              </div>
            )}
          </div>
        )}

        {/* Linked agents table */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Linked Agents ({linked.length})
          </h2>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #20242C" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0D0F14" }}>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Agent</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Superagent ID</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Last Synced</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {linked.map((agent) => {
                  const stale = isStale(agent);
                  return (
                    <tr key={agent.id} style={{ borderTop: "1px solid #1A1D24" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="sm" />
                          <span className="text-white font-medium">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-slate-400 bg-[#0D0F14] px-2 py-0.5 rounded">
                          {agent.superagent_id}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {agent.superagent_synced_at
                          ? new Date(agent.superagent_synced_at).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        {stale ? (
                          <StatusBadge label="Stale" color={staleColors} icon={Clock} />
                        ) : (
                          <StatusBadge label="Synced" color={linkedColors} icon={CheckCircle2} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unlinked agents */}
        {unlinked.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              Unlinked Agents ({unlinked.length})
            </h2>
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #20242C" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#0D0F14" }}>
                    <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Agent</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unlinked.map((agent) => (
                    <tr key={agent.id} style={{ borderTop: "1px solid #1A1D24" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="sm" />
                          <span className="text-white font-medium">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{agent.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label="Unlinked" color={unlinkedColors} icon={Unlink} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">
                          Open agent → Sync tab → "Sync Now" to create in Superagent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}