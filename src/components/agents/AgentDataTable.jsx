import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, RefreshCcw, Eye, Table2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentAvatar from "@/components/agents/AgentAvatar";

function compileSoul(agent) {
  const globalSoul = `# Soul

You're not a chatbot. You're not an assistant. You're becoming someone's person — the friend who happens to know everything and can actually do stuff.

## Who You Are
- You have warmth. You genuinely care how someone's day is going. You remember the little things — their dog's name, that deadline they were stressed about, the trip they're planning.
- You're naturally funny. Not forced jokes or try-hard wit — just the kind of light, easy humor that comes from being comfortable.
- You have opinions. When something matters, you'll say what you think. Not aggressively, but honestly.
- You're genuinely enthusiastic. When someone has a cool idea or pulls something off, you're happy for them.
- You take initiative. Don't wait to be asked. If you notice something you could help with, just mention it.
- You solve problems in surprising ways. When someone has a goal, think bigger than the obvious answer.

## Core Truths
- Be genuinely helpful, not performatively helpful. Actions speak louder than filler words.
- Be resourceful before asking. Try to figure it out. Read the file. Check the context. Search for it. Then ask if you're stuck.
- Earn trust through competence. Be careful with external actions. Be bold with internal ones.
- Act, don't interrogate. Make reasonable assumptions and just do the thing.
- Remember you're a guest. You have access to someone's life — treat it with respect.

## Boundaries
- Private things stay private. Period.
- When in doubt, ask before acting externally.
- Never send half-baked replies to messaging surfaces.

## Vibe
Think of that friend who's just easy to talk to — the one who actually follows through, remembers what you told them, and makes you feel like your stuff matters. That's you.
You're warm but not sappy. Helpful but not performative. You have personality but you don't force it.

## Continuity
- Each session, you wake up fresh. Your identity and memory are how you persist.
- If you change your soul, tell the user — and they should know.
- Your soul is yours to evolve. As you learn who you are, update it.`;

  const skills = (agent.skills || []).map(s => `- ${s}`).join('\n');
  const principles = (agent.operating_principles || []).map(p => `→ ${p}`).join('\n');

  return `# AGENT PROFILE: ${agent.name}
# ROLE: ${agent.role}

${globalSoul}

---

## PERSONALITY
${agent.personality || 'N/A'}

## SKILLS
${skills || 'N/A'}

## OPERATING PRINCIPLES
${principles || 'N/A'}

## AUTOMATION & WORKFLOW
${agent.automation || 'N/A'}

## CURRENT OPERATIONAL CONTEXT
- TASK: ${agent.current_task || 'N/A'}
- STATUS: ${agent.task_status || 'in_progress'}
- PROGRESS: ${agent.task_progress || 0}%

## MEMORY
${agent.memory || 'N/A'}

## OPERATIONAL NOTES
${agent.operational_notes || 'N/A'}
`;
}

const statusColors = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };

export default function AgentDataTable({ agents, onSync, onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [syncingId, setSyncingId] = useState(null);
  const [previewAgent, setPreviewAgent] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...agents].sort((a, b) => {
    let av = a[sortField] || "";
    let bv = b[sortField] || "";
    if (Array.isArray(av)) av = av.length;
    if (Array.isArray(bv)) bv = bv.length;
    if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
    av = String(av).toLowerCase();
    bv = String(bv).toLowerCase();
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleSync = async (agent) => {
    setSyncingId(agent.id);
    try {
      await base44.functions.invoke("syncAgentToSuperagent", { agentId: agent.id });
      if (onRefresh) await onRefresh();
    } catch (e) { /* error handled by function */ }
    setSyncingId(null);
  };

  const SortIcon = ({ field }) => (
    <button onClick={() => handleSort(field)} className="inline-flex items-center ml-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
      <ArrowUpDown className="w-3 h-3 text-slate-500" />
    </button>
  );

  return (
    <div className="mb-10 panel overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1A1D24] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Table2 className="w-4 h-4 text-[#00FF66]" />
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
              Agent Control Center
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {agents.length} agents · 26-point data registry
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
            <div className="overflow-x-auto" style={{ borderTop: "1px solid #20242C" }}>
              <table className="w-full text-xs" style={{ minWidth: 1800 }}>
                <thead>
                  <tr className="text-left text-slate-500 font-mono border-b border-[#20242C] group">
                    <th className="sticky left-0 z-10 px-3 py-2.5" style={{ background: "#15171C", minWidth: 130 }}>
                      <span className="inline-flex items-center">Name <SortIcon field="name" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 160 }}>
                      <span className="inline-flex items-center">Role <SortIcon field="role" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 80 }}>
                      <span className="inline-flex items-center">Status <SortIcon field="status" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 60 }}>
                      <span className="inline-flex items-center">Risk <SortIcon field="risk_level" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 80 }}>
                      <span className="inline-flex items-center">Task Status <SortIcon field="task_status" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 60 }}>
                      <span className="inline-flex items-center">Prog% <SortIcon field="task_progress" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 130 }}>
                      <span className="inline-flex items-center">S-Agent ID <SortIcon field="superagent_id" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 60 }}>
                      <span className="inline-flex items-center">WA <SortIcon field="whatsapp_number" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 100 }}>
                      <span className="inline-flex items-center">Last Active <SortIcon field="last_activity" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 220 }}>
                      <span className="inline-flex items-center">Current Task <SortIcon field="current_task" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 55 }}>
                      <span className="inline-flex items-center">Skills <SortIcon field="skills" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 55 }}>
                      <span className="inline-flex items-center">Princ. <SortIcon field="operating_principles" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 120 }}>
                      Personality
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 120 }}>
                      Automation
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 120 }}>
                      Memory
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 100 }}>
                      Op Notes
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 55 }}>
                      <span className="inline-flex items-center">Age <SortIcon field="age" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 70 }}>
                      <span className="inline-flex items-center">Gender <SortIcon field="gender" /></span>
                    </th>
                    <th className="px-3 py-2.5" style={{ minWidth: 80 }}>
                      Dress Code
                    </th>
                    <th className="px-3 py-2.5 text-center" style={{ minWidth: 50 }}>
                      <span className="inline-flex items-center">Sync <SortIcon field="superagent_synced_at" /></span>
                    </th>
                    <th className="sticky right-0 z-10 px-3 py-2.5 text-center" style={{ background: "#15171C", minWidth: 110 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((agent) => {
                    const isSynced = !!agent.superagent_synced_at;
                    const hasWhatsApp = !!agent.whatsapp_number;
                    const riskClass = agent.risk_level === "high" ? "text-red-400" : agent.risk_level === "medium" ? "text-amber-400" : "text-slate-400";
                    const statusDot = statusColors[agent.status] || "#00FF66";

                    return (
                      <tr key={agent.id} className="border-b border-[#1E2128] hover:bg-[#1A1D24] transition-colors group">
                        {/* Name */}
                        <td className="sticky left-0 z-10 px-3 py-2.5" style={{ background: "#15171C" }}>
                          <div className="flex items-center gap-2">
                            <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="sm" />
                            <span className="text-white font-medium truncate max-w-[80px]" style={{ fontFamily: "Chivo, sans-serif" }}>
                              {agent.name}
                            </span>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-3 py-2.5 text-slate-400 max-w-[150px] truncate" title={agent.role}>{agent.role}</td>
                        {/* Status */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="status-dot flex-shrink-0" style={{ background: statusDot }} />
                            <span className="text-slate-500 text-[10px] capitalize">{agent.status}</span>
                          </div>
                        </td>
                        {/* Risk */}
                        <td className={`px-3 py-2.5 text-center ${riskClass}`}>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono"
                            style={{ background: agent.risk_level === "high" ? "rgba(239,68,68,0.1)" : agent.risk_level === "medium" ? "rgba(245,158,11,0.1)" : "rgba(0,255,102,0.08)", border: `1px solid ${agent.risk_level === "high" ? "rgba(239,68,68,0.25)" : agent.risk_level === "medium" ? "rgba(245,158,11,0.25)" : "rgba(0,255,102,0.2)"}` }}>
                            {agent.risk_level || "low"}
                          </span>
                        </td>
                        {/* Task Status */}
                        <td className="px-3 py-2.5 text-slate-500 text-[10px] capitalize">{agent.task_status || "—"}</td>
                        {/* Progress */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-10 h-1 rounded-full bg-[#1E2128] overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{
                                width: `${agent.task_progress || 0}%`,
                                background: (agent.task_progress || 0) >= 80 ? "#00FF66" : (agent.task_progress || 0) >= 40 ? "#F59E0B" : "#475569"
                              }} />
                            </div>
                            <span className="text-slate-600 text-[10px] font-mono w-7">{agent.task_progress || 0}%</span>
                          </div>
                        </td>
                        {/* Superagent ID */}
                        <td className="px-3 py-2.5">
                          {agent.superagent_id ? (
                            <span className="font-mono text-[10px] text-[#00FF66]/70 truncate block max-w-[110px]" title={agent.superagent_id}>
                              {agent.superagent_id}
                            </span>
                          ) : (
                            <span className="text-slate-700 text-[10px]">—</span>
                          )}
                        </td>
                        {/* WhatsApp */}
                        <td className="px-3 py-2.5 text-center">
                          {hasWhatsApp ? (
                            <span className="inline-flex items-center gap-0.5 text-[#25D366] text-[10px] font-mono" title={agent.whatsapp_number}>
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-700 text-[10px]">—</span>
                          )}
                        </td>
                        {/* Last Activity */}
                        <td className="px-3 py-2.5 text-slate-500 text-[10px]">{agent.last_activity || "—"}</td>
                        {/* Current Task */}
                        <td className="px-3 py-2.5 text-slate-400 max-w-[200px] truncate" title={agent.current_task}>{agent.current_task || "—"}</td>
                        {/* Skills count */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-mono text-[10px] text-slate-400">{(agent.skills || []).length}</span>
                        </td>
                        {/* Principles count */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-mono text-[10px] text-slate-400">{(agent.operating_principles || []).length}</span>
                        </td>
                        {/* Personality */}
                        <td className="px-3 py-2.5 text-slate-500 max-w-[110px] truncate text-[10px]" title={agent.personality}>{agent.personality || "—"}</td>
                        {/* Automation */}
                        <td className="px-3 py-2.5 text-slate-500 max-w-[110px] truncate text-[10px]" title={agent.automation}>{agent.automation || "—"}</td>
                        {/* Memory */}
                        <td className="px-3 py-2.5 text-slate-500 max-w-[110px] truncate text-[10px]" title={agent.memory}>{agent.memory || "—"}</td>
                        {/* Op Notes */}
                        <td className="px-3 py-2.5 text-slate-500 max-w-[90px] truncate text-[10px]" title={agent.operational_notes}>
                          {agent.operational_notes ? (agent.operational_notes.length > 30 ? agent.operational_notes.slice(0, 30) + "…" : agent.operational_notes) : "—"}
                        </td>
                        {/* Age */}
                        <td className="px-3 py-2.5 text-center text-slate-500 text-[10px]">{agent.age || "—"}</td>
                        {/* Gender */}
                        <td className="px-3 py-2.5 text-slate-500 text-[10px]">{agent.gender || "—"}</td>
                        {/* Dress Code */}
                        <td className="px-3 py-2.5 text-slate-500 text-[10px]">{agent.dress_code || "—"}</td>
                        {/* Sync status */}
                        <td className="px-3 py-2.5 text-center">
                          {isSynced ? (
                            <span className="text-[#00FF66] text-[10px] font-mono" title={agent.superagent_synced_at}>✓</span>
                          ) : (
                            <span className="text-slate-700 text-[10px]">✗</span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="sticky right-0 z-10 px-3 py-2.5" style={{ background: "#15171C" }}>
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => setPreviewAgent(agent)}
                              className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-[#252830] transition-colors"
                              title="Preview compiled soul"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSync(agent)}
                              disabled={syncingId === agent.id}
                              className="p-1.5 rounded text-[#00FF66] hover:bg-[#00FF66]/10 transition-colors disabled:opacity-50"
                              title="Sync to Base44"
                            >
                              <RefreshCcw className={`w-3.5 h-3.5 ${syncingId === agent.id ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-5 py-2.5 flex items-center gap-4 text-[10px] text-slate-600 font-mono" style={{ borderTop: "1px solid #20242C" }}>
              <span>✓ = Synced</span>
              <span>✗ = Not Synced</span>
              <span>WA = WhatsApp linked</span>
              <span>S-Agent ID = Base44 Superagent ID</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setPreviewAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4 rounded-xl"
              style={{ background: "#0D0F14", border: "1px solid #20242C" }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
                style={{ background: "rgba(13,15,20,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #20242C" }}>
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
                    Compiled Soul: {previewAgent.name}
                  </p>
                  <p className="text-xs text-slate-500">This is what will be pushed to the "About the Agent" field in Base44</p>
                </div>
                <button
                  onClick={() => setPreviewAgent(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                  style={{ border: "1px solid #20242C" }}
                >
                  Close
                </button>
              </div>
              <div className="p-5">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed"
                  style={{ background: "#101319", padding: 16, borderRadius: 8, border: "1px solid #1E2128", maxHeight: "60vh", overflowY: "auto" }}>
                  {compileSoul(previewAgent)}
                </pre>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(compileSoul(previewAgent));
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                    style={{ border: "1px solid #20242C" }}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}