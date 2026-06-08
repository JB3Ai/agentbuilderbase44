import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, RefreshCcw, Sparkles, Upload, Download } from "lucide-react";
import AgentAvatar from "@/components/agents/AgentAvatar";
import { base44 } from "@/api/base44Client";
import CouncilChat from "./CouncilChat";
import AgentChat from "./AgentChat";
import PanelAssistant from "./PanelAssistant";
import AgentSync from "./AgentSync";
import DependencyGraph from "./DependencyGraph";

const Field = ({ label, value, onChange, multiline }) => (
  <div>
    <label className="eyebrow block mb-1.5">{label}</label>
    {multiline ? (
      <textarea
        className="input-dark resize-none"
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        className="input-dark"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

export default function AgentProfile({ agent, onClose, onSave }) {
  const [form, setForm] = useState({ ...agent });
  const [saving, setSaving] = useState(false);
  const [generatingHeadshot, setGeneratingHeadshot] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleGenerateHeadshot = async () => {
    setGeneratingHeadshot(true);
    const prompt = `Professional corporate headshot portrait of a ${form.age || "35"} year old ${form.gender || "person"}, ${form.role}, ${form.dress_code || "business formal"} attire. Dramatic cinematic lighting, dark slate background, corporate realism, sharp focus, photorealistic, high-end executive photography.`;
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    setForm((f) => ({ ...f, avatar_url: result.url }));
    setGeneratingHeadshot(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, avatar_url: file_url }));
    setUploadingPhoto(false);
  };

  const statusColors = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-2xl overflow-y-auto"
        style={{ background: "#0D0F14", borderLeft: "1px solid #20242C" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(13,15,20,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #20242C" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <AgentAvatar name={form.name} avatarUrl={form.avatar_url} size="xl" />
              <span className="status-dot absolute bottom-0 right-0"
                style={{ background: statusColors[form.status] || "#00FF66", border: "2px solid #0D0F14" }} />
            </div>
            <div>
              <p className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>{form.name}</p>
              <p className="eyebrow">{form.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const data = { schema_version: "1.0", exported_at: new Date().toISOString(), agent: { name: form.name, role: form.role, status: form.status, risk_level: form.risk_level, personality: form.personality, current_task: form.current_task, task_status: form.task_status, task_progress: form.task_progress, skills: form.skills || [], operating_principles: form.operating_principles || [], age: form.age, gender: form.gender, dress_code: form.dress_code, automation: form.automation, memory: form.memory, operational_notes: form.operational_notes, avatar_url: form.avatar_url } };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${form.name.replace(/\s+/g, "_")}.skills`; a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              style={{ border: "1px solid #20242C" }}
              title="Download .skills file"
            >
              <Download className="w-3.5 h-3.5" />
              .skills
            </button>
            <button
              data-testid="save-agent-btn"
              onClick={handleSave}
              disabled={saving}
              className="cta-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onClose} data-testid="close-profile-btn"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#20242C] px-6">
          {[
            { key: "profile", label: "Profile" },
            { key: "notes", label: "Op Notes" },
            { key: "chat", label: "Live Chat" },
            { key: "assistant", label: "Assistant" },
            { key: "sync", label: "Sync / Export" },
            { key: "workflows", label: "Workflows" },
            { key: "council", label: "Council" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-[#00FF66] text-[#00FF66]"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="p-6 space-y-6">
            {/* Headshot section */}
            <div className="panel-steel p-5 flex items-center gap-6">
              {/* Clickable avatar upload zone */}
              <label className="relative group cursor-pointer flex-shrink-0" title="Click to upload headshot">
                <AgentAvatar name={form.name} avatarUrl={form.avatar_url} size="lg" />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  {uploadingPhoto
                    ? <RefreshCcw className="w-5 h-5 text-white animate-spin" />
                    : <Upload className="w-5 h-5 text-white" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1" style={{ fontFamily: "Chivo, sans-serif" }}>{form.name}</p>
                <p className="eyebrow mb-1">{form.role}</p>
                <p className="text-xs text-slate-600 mb-3">Click the avatar to upload a headshot</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {/* Inline file selector — most reliable cross-browser approach */}
                  <label
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 cursor-pointer transition-colors"
                    style={{ border: "1px solid #2A2F3A", background: "#1A1D24", opacity: uploadingPhoto || generatingHeadshot ? 0.5 : 1, pointerEvents: uploadingPhoto || generatingHeadshot ? "none" : "auto" }}
                  >
                    {uploadingPhoto ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingPhoto ? "Uploading…" : "📁 Choose File"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <button
                    data-testid="generate-headshot-btn"
                    onClick={handleGenerateHeadshot}
                    disabled={generatingHeadshot || uploadingPhoto}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00FF66] transition-colors disabled:opacity-50"
                    style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}
                  >
                    {generatingHeadshot ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {generatingHeadshot ? "Generating…" : "Generate with AI"}
                  </button>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <p className="eyebrow mb-3">Identity</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={form.name} onChange={set("name")} />
                <Field label="Role" value={form.role} onChange={set("role")} />
                <div className="col-span-2">
                  <Field label="Department" value={form.department} onChange={set("department")} />
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Status</label>
                  <select className="input-dark" value={form.status || "online"} onChange={(e) => set("status")(e.target.value)}>
                    <option value="online">Online</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Risk Level</label>
                  <select className="input-dark" value={form.risk_level || "low"} onChange={(e) => set("risk_level")(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <Field label="Age" value={form.age} onChange={set("age")} />
                <Field label="Gender" value={form.gender} onChange={set("gender")} />
                <div className="col-span-2">
                  <Field label="Dress Code" value={form.dress_code} onChange={set("dress_code")} />
                </div>
              </div>
            </div>

            {/* Operational */}
            <div>
              <p className="eyebrow mb-3">Operational</p>
              <div className="space-y-4">
                <Field label="Current Task" value={form.current_task} onChange={set("current_task")} />
                <div>
                  <label className="eyebrow block mb-1.5">Task Status</label>
                  <select className="input-dark" value={form.task_status || "in_progress"} onChange={(e) => set("task_status")(e.target.value)}>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="stalled">Stalled</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Task Progress ({form.task_progress || 0}%)</label>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={form.task_progress || 0}
                    onChange={(e) => set("task_progress")(Number(e.target.value))}
                    className="w-full accent-[#00FF66]"
                  />
                </div>
                <Field label="Last Activity" value={form.last_activity} onChange={set("last_activity")} />
                <Field label="Personality" value={form.personality} onChange={set("personality")} multiline />
                <Field label="Automation Settings" value={form.automation} onChange={set("automation")} multiline />
                <Field label="Memory / Notes" value={form.memory} onChange={set("memory")} multiline />
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="eyebrow mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {(form.skills || []).map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-mono text-slate-300"
                    style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
                    {skill}
                  </span>
                ))}
              </div>
              <input
                className="input-dark mt-3"
                placeholder="Add skill and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    set("skills")([...(form.skills || []), e.target.value.trim()]);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            {/* Operating Principles */}
            <div>
              <p className="eyebrow mb-3">Operating Principles</p>
              <div className="space-y-2">
                {(form.operating_principles || []).map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-[#00FF66] mt-0.5 flex-shrink-0">→</span>
                    {p}
                  </div>
                ))}
              </div>
              <input
                className="input-dark mt-3"
                placeholder="Add principle and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    set("operating_principles")([...(form.operating_principles || []), e.target.value.trim()]);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="p-6 space-y-4">
            <div>
              <p className="text-white font-bold mb-1" style={{ fontFamily: "Chivo, sans-serif" }}>Operational Notes</p>
              <p className="text-xs text-slate-500 mb-4">
                Record specific instructions, handling preferences, and behavioral directives for this agent. These notes persist with the agent record.
              </p>
              <textarea
                className="input-dark resize-none w-full"
                rows={16}
                placeholder={`e.g.\n— Always escalate risk level HIGH to Adam Boss before acting\n— Prioritise client-facing tasks over internal admin\n— Use formal tone in all outbound communications\n— Check CRM before initiating any outreach`}
                value={form.operational_notes || ""}
                onChange={(e) => set("operational_notes")(e.target.value)}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="cta-primary px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save Notes"}
            </button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="p-6">
            <AgentChat
              agentName={agent.name}
              agentAvatar={agent.avatar_url}
            />
          </div>
        )}

        {activeTab === "assistant" && (
          <div className="p-6">
            <PanelAssistant agent={agent} />
          </div>
        )}

        {activeTab === "sync" && (
          <div className="p-6">
            <AgentSync agent={agent} onImport={(imported) => setForm((f) => ({ ...f, ...imported }))} />
          </div>
        )}

        {activeTab === "workflows" && (
          <div className="p-6">
            <DependencyGraph agents={[agent]} singleAgent={agent} />
          </div>
        )}

        {activeTab === "council" && (
          <div className="p-6">
            <CouncilChat
              agentId={agent.id}
              agentName={agent.name}
              agentRole={agent.role}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}