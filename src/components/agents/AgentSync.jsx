import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCcw, Upload, Download, CheckCircle, AlertCircle, ExternalLink, Copy } from "lucide-react";

export default function AgentSync({ agent, onImport }) {
  const [apiKey, setApiKey] = useState("");
  const [appId, setAppId] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.base44.com");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }
  const [remoteAgents, setRemoteAgents] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(null);

  const pushToBase44 = async () => {
    if (!apiKey || !appId) return setResult({ ok: false, message: "Please enter your Base44 App ID and API key." });
    setSyncing(true);
    setResult(null);
    try {
      const payload = {
        name: agent.name,
        role: agent.role,
        personality: agent.personality,
        skills: agent.skills,
        operating_principles: agent.operating_principles,
        status: agent.status,
        current_task: agent.current_task,
      };

      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/apps/${appId}/entities/Agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API responded ${res.status}`);
      setResult({ ok: true, message: `Agent "${agent.name}" pushed to Base44 app ${appId} successfully.` });
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const pullFromBase44 = async () => {
    if (!apiKey || !appId) return setResult({ ok: false, message: "Please enter your Base44 App ID and API key." });
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/apps/${appId}/entities/Agent?limit=50`, {
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const data = await res.json();
      setRemoteAgents(data || []);
      setResult({ ok: true, message: `Fetched ${(data || []).length} agents from Base44.` });
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const exportFile = (type) => {
    setExporting(true);
    const data = {
      schema_version: "1.0",
      exported_at: new Date().toISOString(),
      agent: {
        name: agent.name,
        role: agent.role,
        status: agent.status,
        risk_level: agent.risk_level,
        personality: agent.personality,
        current_task: agent.current_task,
        skills: agent.skills || [],
        operating_principles: agent.operating_principles || [],
        age: agent.age,
        gender: agent.gender,
        dress_code: agent.dress_code,
        automation: agent.automation,
        memory: agent.memory,
        avatar_url: agent.avatar_url,
      }
    };

    let content, filename, mime;
    if (type === "skills") {
      content = JSON.stringify(data, null, 2);
      filename = `${agent.name.replace(/\s+/g, "_")}.skills`;
      mime = "application/json";
    } else {
      // .sol — Solidity-style agent definition comment block + JSON
      content = `// SPDX-License-Identifier: MIT
// Agent Definition File — ${agent.name}
// Generated: ${new Date().toISOString()}
// Format: .sol (Agent Solidity Definition)
// Compatible with: JB³Ai Nexus, agentskills.io

/**
 * @agent ${agent.name}
 * @role ${agent.role}
 * @status ${agent.status}
 * @risk ${agent.risk_level}
 */

const AGENT_DEF = ${JSON.stringify(data.agent, null, 2)};

module.exports = AGENT_DEF;
`;
      filename = `${agent.name.replace(/\s+/g, "_")}.sol`;
      mime = "text/plain";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(filename);
    setExporting(false);
    setTimeout(() => setExportDone(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Export section */}
      <div className="panel p-5">
        <p className="text-white font-semibold mb-1" style={{ fontFamily: "Chivo, sans-serif" }}>Export Agent Definition</p>
        <p className="text-xs text-slate-500 mb-4">Download this agent as a portable file for use on any platform.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => exportFile("skills")} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00FF66] disabled:opacity-50"
            style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}>
            <Download className="w-4 h-4" />
            Export .skills
          </button>
          <button onClick={() => exportFile("sol")} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-400 disabled:opacity-50"
            style={{ border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.05)" }}>
            <Download className="w-4 h-4" />
            Export .sol
          </button>
        </div>
        {exportDone && (
          <div className="flex items-center gap-2 mt-3 text-sm text-[#00FF66]">
            <CheckCircle className="w-4 h-4" />
            Downloaded {exportDone}
          </div>
        )}
      </div>

      {/* Base44 API Sync */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Base44 API Sync</p>
          <a href="https://app.base44.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
            Open Base44 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-slate-500 mb-4">Push this agent to another Base44 app, or pull agents from it.</p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="eyebrow block mb-1.5">Base URL</label>
            <input className="input-dark font-mono text-sm" placeholder="https://api.base44.com" value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Base44 App ID</label>
            <input className="input-dark" placeholder="e.g. abc123xyz" value={appId}
              onChange={(e) => setAppId(e.target.value)} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">API Key</label>
            <input className="input-dark" type="password" placeholder="Your Base44 API key" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={pushToBase44} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#00FF66] disabled:opacity-50"
            style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}>
            {syncing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Push Agent
          </button>
          <button onClick={pullFromBase44} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 disabled:opacity-50"
            style={{ border: "1px solid #2A2F3A", background: "#1A1D24" }}>
            {syncing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Pull Agents
          </button>
        </div>

        {result && (
          <div className={`flex items-start gap-2 mt-4 p-3 rounded-lg text-sm ${
            result.ok ? "text-[#00FF66]" : "text-red-400"
          }`} style={{ background: result.ok ? "rgba(0,255,102,0.05)" : "rgba(239,68,68,0.05)",
            border: `1px solid ${result.ok ? "rgba(0,255,102,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            {result.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {result.message}
          </div>
        )}
      </div>

      {/* Remote agents list */}
      {remoteAgents.length > 0 && (
        <div className="panel p-5">
          <p className="eyebrow mb-3">Remote Agents ({remoteAgents.length})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {remoteAgents.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
                <div>
                  <p className="text-sm text-white font-medium">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.role}</p>
                </div>
                <button onClick={() => onImport && onImport(a)}
                  className="text-xs text-[#00FF66] hover:underline">Import</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}