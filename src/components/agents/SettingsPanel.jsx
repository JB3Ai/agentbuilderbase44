import { useState } from "react";
import { motion } from "framer-motion";
// Icon is passed as a prop to Section — no import needed
import { X, Settings, Save, RotateCcw, Bell, Shield, Palette, Clock, Users } from "lucide-react";

const DEFAULT_SETTINGS = {
  nexus_name: "JB³Ai — OS³ Nexus",
  idle_threshold_days: 3,
  auto_review_day: "Monday",
  auto_review_time: "09:00",
  risk_escalation: "high",
  workload_warning_days: 3,
  show_dependency_graph: true,
  show_weekly_reviews: true,
  council_voices: ["architect", "skeptic", "pragmatist", "critic"],
  accent_color: "#00FF66",
  notifications_enabled: true,
  timezone: "Africa/Johannesburg",
};

const STORAGE_KEY = "nexus_settings";

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  });

  const save = (updated) => {
    const merged = { ...settings, ...updated };
    setSettings(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  return { settings, save };
}

export default function SettingsPanel({ onClose }) {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  });
  const [saved, setSaved] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_SETTINGS });
    localStorage.removeItem(STORAGE_KEY);
  };

  // eslint-disable-next-line no-unused-vars
  const Section = ({ icon: SectionIcon, title, children }) => (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <SectionIcon className="w-4 h-4 text-slate-500" />
        <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, hint, children }) => (
    <div>
      <label className="eyebrow block mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-600 mb-1.5">{hint}</p>}
      {children}
    </div>
  );

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
        className="h-full w-full max-w-xl overflow-y-auto"
        style={{ background: "#0D0F14", borderLeft: "1px solid #20242C" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(13,15,20,0.95)", borderBottom: "1px solid #20242C" }}>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-white font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>Nexus Settings</p>
              <p className="eyebrow">General configuration & preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              title="Reset to defaults">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleSave}
              className="cta-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : "Save"}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Branding */}
          <Section icon={Palette} title="Branding">
            <Field label="Nexus Name" hint="Displayed in the hero banner">
              <input className="input-dark" value={form.nexus_name}
                onChange={e => set("nexus_name")(e.target.value)} />
            </Field>
            <Field label="Accent Color" hint="Primary green used throughout the UI">
              <div className="flex items-center gap-3">
                <input type="color" value={form.accent_color}
                  onChange={e => set("accent_color")(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                <input className="input-dark flex-1 font-mono text-sm" value={form.accent_color}
                  onChange={e => set("accent_color")(e.target.value)} />
              </div>
            </Field>
          </Section>

          {/* Agent Monitoring */}
          <Section icon={Users} title="Agent Monitoring">
            <Field label="Idle Alert Threshold (days)"
              hint="Workload indicator flashes when an agent has no task for this many days">
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={14} value={form.workload_warning_days}
                  onChange={e => set("workload_warning_days")(Number(e.target.value))}
                  className="flex-1 accent-[#00FF66]" />
                <span className="text-white font-mono w-8 text-center text-sm">{form.workload_warning_days}d</span>
              </div>
            </Field>
            <Field label="Risk Escalation Level"
              hint="Risk level that triggers escalation alerts">
              <select className="input-dark" value={form.risk_escalation}
                onChange={e => set("risk_escalation")(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
          </Section>

          {/* Dashboard Layout */}
          <Section icon={Shield} title="Dashboard Layout">
            <Field label="Show Dependency Graph">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set("show_dependency_graph")(!form.show_dependency_graph)}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.show_dependency_graph ? "#00FF66" : "#20242C" }}>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: form.show_dependency_graph ? "translateX(20px)" : "translateX(0)" }} />
                </div>
                <span className="text-sm text-slate-300">{form.show_dependency_graph ? "Visible" : "Hidden"}</span>
              </label>
            </Field>
            <Field label="Show Weekly Reviews">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set("show_weekly_reviews")(!form.show_weekly_reviews)}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.show_weekly_reviews ? "#00FF66" : "#20242C" }}>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: form.show_weekly_reviews ? "translateX(20px)" : "translateX(0)" }} />
                </div>
                <span className="text-sm text-slate-300">{form.show_weekly_reviews ? "Visible" : "Hidden"}</span>
              </label>
            </Field>
          </Section>

          {/* Reviews */}
          <Section icon={Clock} title="Weekly Reviews">
            <Field label="Default Review Day">
              <select className="input-dark" value={form.auto_review_day}
                onChange={e => set("auto_review_day")(e.target.value)}>
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </Field>
            <Field label="Default Review Time">
              <input type="time" className="input-dark" value={form.auto_review_time}
                onChange={e => set("auto_review_time")(e.target.value)} />
            </Field>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Notifications">
            <Field label="Enable Notifications">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set("notifications_enabled")(!form.notifications_enabled)}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.notifications_enabled ? "#00FF66" : "#20242C" }}>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: form.notifications_enabled ? "translateX(20px)" : "translateX(0)" }} />
                </div>
                <span className="text-sm text-slate-300">{form.notifications_enabled ? "On" : "Off"}</span>
              </label>
            </Field>
            <Field label="Timezone">
              <input className="input-dark font-mono text-sm" value={form.timezone}
                onChange={e => set("timezone")(e.target.value)} />
            </Field>
          </Section>

        </div>
      </motion.div>
    </motion.div>
  );
}