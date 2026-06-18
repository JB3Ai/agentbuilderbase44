import { useState } from "react";
import JSZip from "jszip";
import { Download, CheckCircle, Package, FileText } from "lucide-react";

// ── File generators ──────────────────────────────────────────────────────────

function buildMemory(agent) {
  const now = new Date().toISOString().split("T")[0];
  const entries = [];
  if (agent.memory) {
    entries.push(`### 1. Core Memory\n**Date:** ${now}\n\n${agent.memory}`);
  }
  if (agent.operational_notes) {
    entries.push(`### 2. Operational Notes\n**Date:** ${now}\n\n${agent.operational_notes}`);
  }
  return `# Memory

Your long-term memory. Each entry has a numbered ID and a date.

## Format

### [ID]. Title
**Date:** YYYY-MM-DD

Content here.

---

## Rules

- Increment the ID for each new entry (1, 2, 3, ...)
- Always include the date when adding or updating an entry
- Update existing entries in place when information changes (update the date too)
- Delete entries that are no longer relevant
- Keep entries concise — a few sentences, not paragraphs

---

## Entries

${entries.length ? entries.join("\n\n---\n\n") : "(no entries yet)"}
`;
}

function buildIdentity(agent) {
  return `# IDENTITY

## Profile

- **Name:** ${agent.name || ""}
- **Role:** ${agent.role || ""}
- **Department:** ${agent.department || ""}
- **Age:** ${agent.age || ""}
- **Gender:** ${agent.gender || ""}
- **Dress Code:** ${agent.dress_code || ""}
- **Creature:** AI Agent
- **Vibe:** ${agent.personality ? agent.personality.split(".")[0] : ""}

## Personality

${agent.personality || "(not defined)"}

## Check-in Schedule

${agent.check_in || agent.automation || "(not defined)"}
`;
}

function buildRules(agent) {
  const principles = (agent.operating_principles || []).map((p, i) => `${i + 1}. ${p}`).join("\n");
  return `# Rules

These are the behavioral rules and operating principles that govern this agent at all times.

## Core Principles

${principles || "(no principles defined)"}

## Behavioral Directives

- Always act in accordance with the agent's defined role: **${agent.role || ""}**
- Risk tolerance: **${agent.risk_level || "low"}**
- Status default: **${agent.status || "online"}**
${agent.operational_notes ? `\n## Additional Directives\n\n${agent.operational_notes}` : ""}
`;
}

function buildSkills(agent) {
  const skills = agent.skills || [];
  const skillBlocks = skills.map((skill, i) => {
    return `### ${i + 1}. ${skill}

**Category:** Professional
**Proficiency:** Expert
**Description:** ${skill} — applied in the context of ${agent.role || "this agent's role"}.
`;
  }).join("\n---\n\n");

  return `# Skills

This file defines the real, actionable skills this agent possesses and deploys.

## Agent: ${agent.name || ""}
## Role: ${agent.role || ""}

---

${skillBlocks || "(no skills defined)"}

## Capability Summary

Total skills: ${skills.length}
Primary domain: ${skills[0] || "General"}
`;
}

function buildCron(agent) {
  const automation = agent.automation || "";

  // Parse simple schedule hints from automation text
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

  return `# Cron

Scheduled automation tasks for this agent.

## Agent: ${agent.name || ""}
## Source: ${automation || "(no automation defined)"}

---

${cronEntries.length ? cronEntries.join("\n\n---\n\n") : "# No scheduled tasks defined\n# Add entries in format:\n# schedule: \"0 9 * * 1\"  (cron expression)\n# task: \"Task description\"\n# agent: \"Agent name\""}
`;
}

function buildHooks(agent) {
  const hooks = [];

  if (agent.current_task) {
    hooks.push(`## on_task_assigned\n\n**Trigger:** When a new task is assigned\n**Current Task:** ${agent.current_task}\n**Status:** ${agent.task_status || "in_progress"}\n**Progress:** ${agent.task_progress || 0}%`);
  }

  if (agent.status) {
    hooks.push(`## on_status_change\n\n**Trigger:** When agent status changes\n**Current Status:** ${agent.status}\n**Risk Level:** ${agent.risk_level || "low"}`);
  }

  hooks.push(`## on_check_in\n\n**Trigger:** Scheduled check-in\n**Schedule:** ${agent.check_in || agent.automation || "See .cron file"}\n**Primary Outcome:** ${agent.primary_outcome || agent.current_task || "Deliver scheduled briefing"}`);

  if (agent.risk_level === "high") {
    hooks.push(`## on_risk_escalation\n\n**Trigger:** Risk level elevated to HIGH\n**Action:** Escalate to command coordinator immediately\n**Agent:** ${agent.name || ""}`);
  }

  return `# Hooks

Event hooks and triggers for this agent. These define how the agent reacts to system events.

## Agent: ${agent.name || ""}
## Role: ${agent.role || ""}

---

${hooks.join("\n\n---\n\n")}
`;
}

function buildUser(agent) {
  return `# USER

Learn about the person this agent serves. Update as you go.

## Profile

- **Agent Name:** ${agent.name || ""}
- **Role:** ${agent.role || ""}
- **Department:** ${agent.department || ""}
- **Timezone:** Africa/Johannesburg
- **Notes:** ${agent.operational_notes ? agent.operational_notes.split("\n")[0] : ""}

## Context

${agent.personality || "(build this over time)"}
`;
}

// ── FILE MANIFEST ─────────────────────────────────────────────────────────────

const FILE_MANIFEST = [
  { key: "memory",   label: ".memory",    build: buildMemory,   color: "#00FF66" },
  { key: "identity", label: "IDENTITY.md",build: buildIdentity, color: "#60A5FA" },
  { key: "rules",    label: "rules",      build: buildRules,    color: "#F59E0B" },
  { key: "skills",   label: "skills",     build: buildSkills,   color: "#A78BFA" },
  { key: "cron",     label: ".cron",      build: buildCron,     color: "#34D399" },
  { key: "hooks",    label: "hooks",      build: buildHooks,    color: "#F472B6" },
  { key: "user",     label: "USER.md",    build: buildUser,     color: "#94A3B8" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentFilePackExporter({ agent }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState(null); // { label, content }

  const safeName = (agent.name || "agent").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

  const exportZip = async () => {
    setExporting(true);
    const zip = new JSZip();
    const folder = zip.folder(`.agents/${safeName}`);
    FILE_MANIFEST.forEach(({ key, label, build }) => {
      folder.file(label, build(agent));
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_base44_pack.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
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

  return (
    <div className="panel p-5 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-4 h-4 text-[#00FF66]" />
          <p className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>
            Base44 File Pack
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Export all agent config files in Base44 Superagent format. Drop the unzipped folder into the <code className="text-slate-400 bg-[#0D0F14] px-1 rounded">.agents/{safeName}/</code> directory in Base44's file configurator.
        </p>
      </div>

      {/* File list preview */}
      <div className="grid grid-cols-2 gap-2">
        {FILE_MANIFEST.map((manifest) => (
          <div
            key={manifest.key}
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: "#0D0F14", border: "1px solid #1E2128" }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: manifest.color }} />
              <span className="text-xs font-mono" style={{ color: manifest.color }}>{manifest.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreview({ label: manifest.label, content: manifest.build(agent) })}
                className="text-xs text-slate-600 hover:text-slate-300 transition-colors px-1"
                title="Preview"
              >
                👁
              </button>
              <button
                onClick={() => downloadSingle(manifest)}
                className="text-xs text-slate-600 hover:text-[#00FF66] transition-colors px-1"
                title={`Download ${manifest.label}`}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export ZIP button */}
      <button
        onClick={exportZip}
        disabled={exporting}
        className="cta-primary w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {done ? (
          <><CheckCircle className="w-4 h-4" /> Downloaded!</>
        ) : exporting ? (
          <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" /> Building pack…</>
        ) : (
          <><Download className="w-4 h-4" /> Export .zip — {safeName}_base44_pack.zip</>
        )}
      </button>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-2xl mx-4 rounded-xl overflow-hidden"
            style={{ background: "#0D0F14", border: "1px solid #20242C", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #20242C" }}>
              <span className="text-white font-mono text-sm">{preview.label}</span>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
            </div>
            <pre className="p-5 text-xs text-slate-300 overflow-auto font-mono leading-relaxed" style={{ maxHeight: "calc(80vh - 52px)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {preview.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}