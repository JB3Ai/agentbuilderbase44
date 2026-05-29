import { useState } from "react";
import { motion } from "framer-motion";
import { X, Wand2, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DEFAULT = {
  name: "", role: "", status: "online", current_task: "",
  risk_level: "low", last_activity: "Just now",
  personality: "", skills: [], operating_principles: [],
  age: "", gender: "", dress_code: "", automation: "", memory: "",
  avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/5be6bafde2710ced8810a2a4965cb491c85b9642be86c34ad6bacdf6adca6223.png",
};

export default function AgentCreator({ onClose, onCreate }) {
  const [form, setForm] = useState({ ...DEFAULT });
  const [creating, setCreating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [generatingHeadshot, setGeneratingHeadshot] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSuggest = async () => {
    if (!form.name || !form.role) return;
    setSuggesting(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a detailed agent profile for an AI agent named "${form.name}" with the role "${form.role}".
      Return JSON with these exact fields:
      - personality (2-3 sentence description)
      - skills (array of 4-6 skill strings)
      - operating_principles (array of 3 principle strings)
      - current_task (what they might be doing right now, 1 sentence)
      - automation (automation settings, 1-2 sentences)
      - memory (background notes, 1-2 sentences)
      - dress_code (professional attire description)`,
      response_json_schema: {
        type: "object",
        properties: {
          personality: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          operating_principles: { type: "array", items: { type: "string" } },
          current_task: { type: "string" },
          automation: { type: "string" },
          memory: { type: "string" },
          dress_code: { type: "string" }
        }
      }
    });
    setForm((f) => ({ ...f, ...result }));
    setSuggesting(false);
  };

  const handleGenerateHeadshot = async () => {
    setGeneratingHeadshot(true);
    const prompt = `Professional corporate headshot portrait of a ${form.age || "35"} year old ${form.gender || "person"}, ${form.role || "executive"}, ${form.dress_code || "business formal"} attire. Dramatic cinematic lighting, dark slate background, corporate realism, sharp focus, photorealistic.`;
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    setForm((f) => ({ ...f, avatar_url: result.url }));
    setGeneratingHeadshot(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.role) return;
    setCreating(true);
    await onCreate(form);
    setCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "#0D0F14", border: "1px solid #20242C" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(13,15,20,0.95)", borderBottom: "1px solid #20242C" }}>
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Chivo, sans-serif" }}>Deploy New Agent</h2>
            <p className="eyebrow mt-0.5">Configure identity & capabilities</p>
          </div>
          <button onClick={onClose} data-testid="close-creator-btn"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <img src={form.avatar_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              style={{ border: "2px solid #20242C" }} />
            <div>
              <p className="text-white font-medium">{form.name || "Agent Name"}</p>
              <p className="eyebrow">{form.role || "Role"}</p>
              <button onClick={handleGenerateHeadshot} disabled={generatingHeadshot}
                data-testid="generate-headshot-creator-btn"
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#00FF66] disabled:opacity-50">
                {generatingHeadshot ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingHeadshot ? "Generating…" : "Generate headshot"}
              </button>
            </div>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="eyebrow block mb-1.5">Agent Name *</label>
              <input className="input-dark" placeholder="e.g. Alex Analytics" value={form.name}
                onChange={(e) => set("name")(e.target.value)} data-testid="agent-name-input" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="eyebrow block mb-1.5">Role *</label>
              <input className="input-dark" placeholder="e.g. Data Intelligence Lead" value={form.role}
                onChange={(e) => set("role")(e.target.value)} data-testid="agent-role-input" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Status</label>
              <select className="input-dark" value={form.status} onChange={(e) => set("status")(e.target.value)}>
                <option value="online">Online</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Risk Level</label>
              <select className="input-dark" value={form.risk_level} onChange={(e) => set("risk_level")(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Age</label>
              <input className="input-dark" placeholder="e.g. 34" value={form.age}
                onChange={(e) => set("age")(e.target.value)} />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Gender</label>
              <input className="input-dark" placeholder="e.g. Female" value={form.gender}
                onChange={(e) => set("gender")(e.target.value)} />
            </div>
          </div>

          {/* AI Suggest button */}
          {(form.name && form.role) && (
            <button onClick={handleSuggest} disabled={suggesting} data-testid="suggest-fields-btn"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)", color: "#00FF66" }}>
              {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {suggesting ? "Generating profile…" : "AI Suggest Profile Fields"}
            </button>
          )}

          {/* Personality */}
          <div>
            <label className="eyebrow block mb-1.5">Personality</label>
            <textarea className="input-dark resize-none" rows={3} value={form.personality}
              placeholder="Describe the agent's personality and communication style..."
              onChange={(e) => set("personality")(e.target.value)} />
          </div>

          {/* Current Task */}
          <div>
            <label className="eyebrow block mb-1.5">Current Task</label>
            <input className="input-dark" value={form.current_task} placeholder="What is this agent doing right now?"
              onChange={(e) => set("current_task")(e.target.value)} />
          </div>

          {/* Skills */}
          <div>
            <label className="eyebrow block mb-2">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.skills || []).map((s, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-mono text-slate-300 flex items-center gap-1"
                  style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
                  {s}
                  <button onClick={() => set("skills")(form.skills.filter((_, j) => j !== i))}
                    className="text-slate-600 hover:text-red-400 ml-1">×</button>
                </span>
              ))}
            </div>
            <input className="input-dark" placeholder="Add skill, press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  set("skills")([...(form.skills || []), e.target.value.trim()]);
                  e.target.value = "";
                }
              }} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
              style={{ border: "1px solid #20242C", background: "transparent" }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating || !form.name || !form.role}
              data-testid="deploy-agent-btn"
              className="flex-1 cta-primary py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {creating ? "Deploying…" : "Deploy Agent"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}