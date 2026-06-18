import { useState } from "react";
import JSZip from "jszip";
import { Download, CheckCircle, Package, FileText, Copy, Github, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// ── File generators ──────────────────────────────────────────────────────────

function buildMemory(agent) {
  const now = new Date().toISOString().split("T")[0];
  const entries = [];
  if (agent.memory) entries.push(`### 1. Core Memory\n**Date:** ${now}\n\n${agent.memory}`);
  if (agent.operational_notes) entries.push(`### 2. Operational Notes\n**Date:** ${now}\n\n${agent.operational_notes}`);
  return `# Memory\n\nYour long-term memory. Each entry has a numbered ID and a date.\n\n## Format\n\n### [ID]. Title\n**Date:** YYYY-MM-DD\n\nContent here.\n\n---\n\n## Rules\n\n- Increment the ID for each new entry (1, 2, 3, ...)\n- Always include the date when adding or updating an entry\n- Update existing entries in place when information changes (update the date too)\n- Delete entries that are no longer relevant\n- Keep entries concise — a few sentences, not paragraphs\n\n---\n\n## Entries\n\n${entries.length ? entries.join("\n\n---\n\n") : "(no entries yet)"}\n`;
}

function buildIdentity(agent) {
  return `# IDENTITY\n\n## Profile\n\n- **Name:** ${agent.name || ""}\n- **Role:** ${agent.role || ""}\n- **Department:** ${agent.department || ""}\n- **Age:** ${agent.age || ""}\n- **Gender:** ${agent.gender || ""}\n- **Dress Code:** ${agent.dress_code || ""}\n- **Creature:** AI Agent\n- **Vibe:** ${agent.personality ? agent.personality.split(".")[0] : ""}\n\n## Personality\n\n${agent.personality || "(not defined)"}\n\n## Check-in Schedule\n\n${agent.check_in || agent.automation || "(not defined)"}\n`;
}

function buildRules(agent) {
  const principles = (agent.operating_principles || []).map((p, i) => `${i + 1}. ${p}`).join("\n");
  return `# Rules\n\nThese are the behavioral rules and operating principles that govern this agent at all times.\n\n## Core Principles\n\n${principles || "(no principles defined)"}\n\n## Behavioral Directives\n\n- Always act in accordance with the agent's defined role: **${agent.role || ""}**\n- Risk tolerance: **${agent.risk_level || "low"}**\n- Status default: **${agent.status || "online"}**\n${agent.operational_notes ? `\n## Additional Directives\n\n${agent.operational_notes}` : ""}\n`;
}

function buildSkills(agent) {
  const skills = agent.skills || [];
  const skillBlocks = skills.map((skill, i) => `### ${i + 1}. ${skill}\n\n**Category:** Professional\n**Proficiency:** Expert\n**Description:** ${skill} — applied in the context of ${agent.role || "this agent's role"}.\n`).join("\n---\n\n");
  return `# Skills\n\nThis file defines the real, actionable skills this agent possesses and deploys.\n\n## Agent: ${agent.name || ""}\n## Role: ${agent.role || ""}\n\n---\n\n${skillBlocks || "(no skills defined)"}\n\n## Capability Summary\n\nTotal skills: ${skills.length}\nPrimary domain: ${skills[0] || "General"}\n`;
}

function buildCron(agent) {
  const automation = agent.automation || "";
  const lines = automation.split(/[.\n,]+/).map(s => s.trim()).filter(Boolean);
  const cronEntries = lines.map((line, i) => {
    let schedule = "# TODO: define cron expression";
    const l = line.toLowerCase();
    if (l.includes("daily") || l.includes("every day")) schedule = "0 9 * * *";
    else if (l.includes("monday") && l.includes("thursday")) schedule = "0 9 * * 1,4";
    else if (l.includes("monday") && l.includes("friday")) schedule = "0 9 * * 1,5";
    else if (l.includes("tuesday") && l.includes("friday")) schedule = "0 9 * * 2,5";
    else if (l.includes("monday")) schedule = "0 9 * * 1";
    else if (l.includes("tuesday")) schedule = "0 9 * * 2";
    else if (l.includes("wednesday")) schedule = "0 9 * * 3";
    else if (l.includes("thursday")) schedule = "0 9 * * 4";
    else if (l.includes("friday")) schedule = "0 9 * * 5";
    else if (l.includes("sunday")) schedule = "0 8 * * 0";
    else if (l.includes("weekly")) schedule = "0 9 * * 1";
    else if (l.includes("monthly")) schedule = "0 9 1 * *";
    return `# Task ${i + 1}: ${line}\nschedule: "${schedule}"\ntask: "${line}"\nagent: "${agent.name || ""}"`;
  });
  return `# Cron\n\nScheduled automation tasks for this agent.\n\n## Agent: ${agent.name || ""}\n## Source: ${automation || "(no automation defined)"}\n\n---\n\n${cronEntries.length ? cronEntries.join("\n\n---\n\n") : '# No scheduled tasks defined\n# Add entries in format:\n# schedule: "0 9 * * 1"  (cron expression)\n# task: "Task description"\n# agent: "Agent name"'}\n`;
}

function buildHooks(agent) {
  const hooks = [];
  if (agent.current_task) hooks.push(`## on_task_assigned\n\n**Trigger:** When a new task is assigned\n**Current Task:** ${agent.current_task}\n**Status:** ${agent.task_status || "in_progress"}\n**Progress:** ${agent.task_progress || 0}%`);
  if (agent.status) hooks.push(`## on_status_change\n\n**Trigger:** When agent status changes\n**Current Status:** ${agent.status}\n**Risk Level:** ${agent.risk_level || "low"}`);
  hooks.push(`## on_check_in\n\n**Trigger:** Scheduled check-in\n**Schedule:** ${agent.check_in || agent.automation || "See .cron file"}\n**Primary Outcome:** ${agent.primary_outcome || agent.current_task || "Deliver scheduled briefing"}`);
  if (agent.risk_level === "high") hooks.push(`## on_risk_escalation\n\n**Trigger:** Risk level elevated to HIGH\n**Action:** Escalate to command coordinator immediately\n**Agent:** ${agent.name || ""}`);
  return `# Hooks\n\nEvent hooks and triggers for this agent.\n\n## Agent: ${agent.name || ""}\n## Role: ${agent.role || ""}\n\n---\n\n${hooks.join("\n\n---\n\n")}\n`;
}

function buildUser(agent) {
  return `# USER\n\nLearn about the person this agent serves. Update as you go.\n\n## Profile\n\n- **Agent Name:** ${agent.name || ""}\n- **Role:** ${agent.role || ""}\n- **Department:** ${agent.department || ""}\n- **Timezone:** Africa/Johannesburg\n- **Notes:** ${agent.operational_notes ? agent.operational_notes.split("\n")[0] : ""}\n\n## Context\n\n${agent.personality || "(build this over time)"}\n`;
}

const FILE_MANIFEST = [
  { key: "memory",   label: ".memory",     build: buildMemory,   color: "#00FF66" },
  { key: "identity", label: "IDENTITY.md", build: buildIdentity, color: "#60A5FA" },
  { key: "rules",    label: "rules",       build: buildRules,    color: "#F59E0B" },
  { key: "skills",   label: "skills",      build: buildSkills,   color: "#A78BFA" },
  { key: "cron",     label: ".cron",       build: buildCron,     color: "#34D399" },
  { key: "hooks",    label: "hooks",       build: buildHooks,    color: "#F472B6" },
  { key: "user",     label: "USER.md",     build: buildUser,     color: "#94A3B8" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentFilePackExporter({ agent }) {
  const [exporting, setExporting] = useState(false);
  const [zipDone, setZipDone] = useState(false);
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null); // key of last copied file
  const [showGithub, setShowGithub] = useState(false);
  const [ghRepo, setGhRepo] = useState("");
  const [ghBranch, setGhBranch] = useState("main");
  const [ghPushing, setGhPushing] = useState(false);
  const [ghResult, setGhResult] = useState(null);

  const safeName = (agent.name || "agent").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

  const copyToClipboard = async (manifest) => {
    const content = manifest.build(agent);
    await navigator.clipboard.writeText(content);
    setCopied(manifest.key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadSingle = (manifest) => {
    const content = manifest.build(agent);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = manifest.label;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportZip = async () => {
    setExporting(true);
    const zip = new JSZip();
    const folder = zip.folder(`.agents/${safeName}`);
    FILE_MANIFEST.forEach(({ label, build }) => folder.file(label, build(agent)));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_base44_pack.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setZipDone(true);
    setTimeout(() => setZipDone(false), 3000);
  };

  const pushToGithub = async () => {
    if (!ghRepo.includes("/")) return;
    setGhPushing(true);
    setGhResult(null);
    const files = FILE_MANIFEST.map(({ label, build }) => ({ path: label, content: build(agent) }));
    const res = await base44.functions.invoke("pushAgentFilesToGithub", {
      repo: ghRepo,
      branch: ghBranch || "main",
      basePath: `.agents/${safeName}`,
      files,
    });
    setGhResult(res.data);
    setGhPushing(false);
  };

  return (
    <div className="panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-[#00FF66]" />
        <p className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Base44 File Pack</p>
      </div>
      <p className="text-xs text-slate-500 -mt-2">
        Export, copy, or push all 7 config files for this agent directly into Base44's agent file structure.
      </p>

      {/* File rows */}
      <div className="space-y-1.5">
        {FILE_MANIFEST.map((manifest) => (
          <div
            key={manifest.key}
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: "#0D0F14", border: "1px solid #1E2128" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: manifest.color }} />
              <span className="text-xs font-mono truncate" style={{ color: manifest.color }}>{manifest.label}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {/* Preview */}
              <button
                onClick={() => setPreview({ label: manifest.label, content: manifest.build(agent) })}
                className="px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Preview"
              >
                👁
              </button>
              {/* Copy */}
              <button
                onClick={() => copyToClipboard(manifest)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                style={copied === manifest.key
                  ? { color: "#00FF66", background: "rgba(0,255,102,0.08)" }
                  : { color: "#64748B" }}
                title="Copy to clipboard"
              >
                {copied === manifest.key
                  ? <><CheckCircle className="w-3 h-3" /> Copied</>
                  : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
              {/* Download */}
              <button
                onClick={() => downloadSingle(manifest)}
                className="px-2 py-1 rounded text-xs text-slate-500 hover:text-[#00FF66] hover:bg-slate-800 transition-colors"
                title="Download file"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ZIP export */}
      <button
        onClick={exportZip}
        disabled={exporting}
        className="cta-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {zipDone ? (
          <><CheckCircle className="w-4 h-4" /> Downloaded!</>
        ) : exporting ? (
          <><span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" /> Building…</>
        ) : (
          <><Download className="w-4 h-4" /> Export .zip</>
        )}
      </button>

      {/* GitHub push section */}
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1E2128" }}>
        <button
          onClick={() => setShowGithub(!showGithub)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
          style={{ background: "#0D0F14" }}
        >
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span className="font-medium">Push to GitHub</span>
            <span className="text-xs text-slate-600 font-mono">.agents/{safeName}/</span>
          </div>
          {showGithub ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showGithub && (
          <div className="p-4 space-y-3" style={{ background: "#0B0D11", borderTop: "1px solid #1E2128" }}>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="eyebrow block mb-1">Repo</label>
                <input
                  className="input-dark text-sm"
                  placeholder="owner/repo-name"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                />
              </div>
              <div>
                <label className="eyebrow block mb-1">Branch</label>
                <input
                  className="input-dark text-sm"
                  placeholder="main"
                  value={ghBranch}
                  onChange={(e) => setGhBranch(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Files will be written to <code className="text-slate-400">{ghRepo || "owner/repo"}/.agents/{safeName}/</code>
            </p>

            <button
              onClick={pushToGithub}
              disabled={ghPushing || !ghRepo.includes("/")}
              className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              style={{ background: "#161B22", border: "1px solid #30363D", color: "#F0F6FF" }}
            >
              {ghPushing ? (
                <><span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block" /> Pushing {FILE_MANIFEST.length} files…</>
              ) : (
                <><Github className="w-4 h-4" /> Push {FILE_MANIFEST.length} files to GitHub</>
              )}
            </button>

            {/* Result */}
            {ghResult && (
              <div
                className="rounded-lg p-3 text-xs space-y-1.5"
                style={{
                  background: ghResult.success ? "rgba(0,255,102,0.05)" : "rgba(239,68,68,0.05)",
                  border: `1px solid ${ghResult.success ? "rgba(0,255,102,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <div className="flex items-center gap-2 font-medium" style={{ color: ghResult.success ? "#00FF66" : "#EF4444" }}>
                  {ghResult.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {ghResult.summary}
                </div>
                {(ghResult.results || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-500 pl-1">
                    <span style={{ color: r.status === "failed" ? "#EF4444" : "#475569" }}>
                      {r.status === "created" ? "+" : r.status === "updated" ? "↻" : "✗"}
                    </span>
                    <span className="font-mono truncate">{r.path}</span>
                    {r.error && <span className="text-red-400 truncate">— {r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-2xl mx-4 rounded-xl overflow-hidden"
            style={{ background: "#0D0F14", border: "1px solid #20242C", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #20242C" }}>
              <span className="text-white font-mono text-sm">{preview.label}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(preview.content);
                    setCopied("preview");
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors"
                  style={copied === "preview"
                    ? { color: "#00FF66", background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.3)" }
                    : { color: "#94A3B8", background: "#1A1D24", border: "1px solid #20242C" }}
                >
                  {copied === "preview" ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy all</>}
                </button>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-white text-xl leading-none px-1">×</button>
              </div>
            </div>
            <pre
              className="p-5 text-xs text-slate-300 overflow-auto font-mono leading-relaxed"
              style={{ maxHeight: "calc(80vh - 52px)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {preview.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}