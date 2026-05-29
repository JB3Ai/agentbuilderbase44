import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, RefreshCcw, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CouncilChat from "./CouncilChat";
import AgentChat from "./AgentChat";

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
              <img src={form.avatar_url} alt={form.name} className="w-10 h-10 rounded-full object-cover"
                style={{ border: "2px solid #20242C" }} />
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
            { key: "chat", label: "Live Chat" },
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
              <img src={form.avatar_url} alt={form.name}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                style={{ border: "2px solid #2F3F54" }} />
              <div className="flex-1">
                <p className="text-white font-semibold mb-1" style={{ fontFamily: "Chivo, sans-serif" }}>{form.name}</p>
                <p className="eyebrow mb-3">{form.role}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    data-testid="generate-headshot-btn"
                    onClick={handleGenerateHeadshot}
                    disabled={generatingHeadshot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00FF66] transition-colors disabled:opacity-50"
                    style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}
                  >
                    {generatingHeadshot ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {generatingHeadshot ? "Generating…" : "Generate Headshot"}
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

        {activeTab === "chat" && (
          <div className="p-6">
            <AgentChat
              agentName={agent.name}
              agentAvatar={agent.avatar_url}
            />
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