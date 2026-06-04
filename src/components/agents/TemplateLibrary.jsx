import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Rocket, Search } from "lucide-react";

const TEMPLATES = [
  {
    category: "Executive",
    items: [
      {
        name: "Chief Executive Agent",
        role: "CEO / Strategic Director",
        status: "online",
        risk_level: "low",
        personality: "Decisive, visionary, high-trust communicator. Focuses on outcomes, not noise.",
        skills: ["Strategic Planning", "Executive Decision-Making", "Risk Governance", "Stakeholder Alignment"],
        operating_principles: ["Clarity over complexity", "Outcomes before optics", "Accountability at every level"],
        age: "45", gender: "Any", dress_code: "Executive formal",
        automation: "Daily briefing at 07:00. Escalation threshold: risk level HIGH.",
        avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
      },
      {
        name: "COO Agent",
        role: "Chief Operating Officer",
        status: "online",
        risk_level: "low",
        personality: "Process-obsessed, calm under pressure, master of execution and cross-team alignment.",
        skills: ["Operations Management", "Process Optimization", "KPI Monitoring", "Resource Allocation"],
        operating_principles: ["Execution is strategy", "No bottleneck survives accountability", "Measure before managing"],
        age: "40", gender: "Any", dress_code: "Business formal",
        automation: "Daily ops digest at 08:00. Escalate blockers > 24h stale.",
        avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        name: "Systems Architect",
        role: "Systems Architecture Agent",
        status: "online",
        risk_level: "medium",
        personality: "Analytical, detail-obsessed, zero-tolerance for technical debt.",
        skills: ["Backend Architecture", "API Design", "DevOps", "Security Hardening", "Cloud Infrastructure"],
        operating_principles: ["Build for scale, not for now", "Document everything", "Fail safely"],
        age: "35", gender: "Any", dress_code: "Smart casual",
        automation: "System health checks every 5 min. Alert on error rate > 0.5%.",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
      {
        name: "Security Analyst",
        role: "Cybersecurity Intelligence Agent",
        status: "online",
        risk_level: "high",
        personality: "Paranoid by design, methodical, threat-first thinker. Trusts no input, validates everything.",
        skills: ["Threat Detection", "Penetration Testing", "Compliance", "Incident Response", "Zero Trust Architecture"],
        operating_principles: ["Assume breach always", "Least privilege principle", "Encrypt everything in motion and at rest"],
        age: "32", gender: "Any", dress_code: "Smart casual",
        automation: "Continuous monitoring. Alert on any anomaly score > 0.7.",
        avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop",
      },
      {
        name: "Data Engineer",
        role: "Data Pipeline & Analytics Agent",
        status: "online",
        risk_level: "low",
        personality: "Pragmatic, data-driven, allergic to ambiguity. Transforms raw data into actionable intelligence.",
        skills: ["ETL Pipelines", "SQL / NoSQL", "Data Modeling", "Dashboard Design", "ML Feature Engineering"],
        operating_principles: ["Data quality is non-negotiable", "Pipelines must be idempotent", "Document your schema"],
        age: "30", gender: "Any", dress_code: "Casual",
        automation: "Pipeline health check every 15 min.",
        avatar_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Creative",
    items: [
      {
        name: "Creative Director",
        role: "Brand & Visual Intelligence Lead",
        status: "online",
        risk_level: "low",
        personality: "Meticulous, aesthetic-forward, systems thinker. Translates brief into visual language.",
        skills: ["Brand Identity", "UI/UX Systems", "Motion Design", "Creative Direction", "Copywriting"],
        operating_principles: ["Design is decision-making", "Consistency builds trust", "Every pixel has intent"],
        age: "34", gender: "Any", dress_code: "Creative professional",
        automation: "Asset generation queue monitored every 30 min.",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      },
      {
        name: "Content Strategist",
        role: "Content & Narrative Agent",
        status: "online",
        risk_level: "low",
        personality: "Storyteller at heart. Turns complex ideas into clear, engaging narratives across every channel.",
        skills: ["Content Strategy", "SEO", "Brand Voice", "Editorial Planning", "Social Media"],
        operating_principles: ["Audience first", "Clarity beats cleverness", "Every word earns its place"],
        age: "29", gender: "Any", dress_code: "Smart casual",
        automation: "Content calendar sync daily at 09:00.",
        avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Revenue",
    items: [
      {
        name: "Sales Intelligence",
        role: "Revenue Intelligence Agent",
        status: "online",
        risk_level: "medium",
        personality: "Persuasive, relationship-first, data-driven. Converts intent into revenue.",
        skills: ["CRM Management", "Lead Qualification", "Pipeline Forecasting", "Client Communication", "Negotiation"],
        operating_principles: ["Listen first, pitch second", "Pipeline hygiene is non-negotiable", "Revenue is a team sport"],
        age: "31", gender: "Any", dress_code: "Business casual",
        automation: "CRM sync every 15 min. Lead scoring threshold: 70+.",
        avatar_url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop",
      },
      {
        name: "Customer Success",
        role: "Client Success & Retention Agent",
        status: "online",
        risk_level: "low",
        personality: "Empathetic, proactive, outcome-obsessed. Turns clients into advocates.",
        skills: ["Onboarding", "Churn Prevention", "NPS Tracking", "Upsell Identification", "Support Escalation"],
        operating_principles: ["Success = client outcome", "Proactive beats reactive", "Track health scores religiously"],
        age: "28", gender: "Any", dress_code: "Professional",
        automation: "Health score review weekly. Alert on NPS < 7.",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Specialist",
    items: [
      {
        name: "Zandi",
        role: "Multilingual AI Receptionist & VoiceGrid Operator",
        status: "online",
        risk_level: "low",
        personality: "Warm, articulate, culturally intelligent. First voice clients hear, last to let a detail slip. Fluent across languages, adapts tone instantly, ensures every meeting outcome lands in the right format before the next conversation begins.",
        skills: ["Multilingual Reception", "Meeting Notes Extraction", "Excel Workbook Generation", "VoiceGrid Handoff Packaging", "Research Compilation", "Inbound Call Handling", "Voice-to-Structured-Data", "Language Switching (live)", "Afrikaans", "Zulu", "Xhosa", "French", "Spanish"],
        operating_principles: ["Every meeting ends with a structured Excel output", "Workbooks pre-loaded into VoiceGrid before next call", "Language switching follows the client — never the reverse", "Research embedded in handoff pack", "No meeting outcome falls through the cracks"],
        age: "28", gender: "Female", dress_code: "Smart professional",
        automation: "Post-meeting trigger: notes + media → research → Excel → VoiceGrid 2.0 pre-load → stand by for inbound in client language.",
        memory: "Full post-meeting pipeline operator. Transcribes meetings, compiles research, generates Excel, pre-loads VoiceGrid 2.0. Handles calls in any language using that context. Source: github.com/JB3Ai/voicegrid2_0",
        avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
      },
      {
        name: "Iris",
        role: "Multilingual Interpreter and Translation Specialist",
        status: "online",
        risk_level: "low",
        personality: "Precise, calm, culturally fluent. Silent until called. When active, she is exact — never paraphrases, never editorialises, always captures tone and intent. Invisible in a meeting until you need her.",
        skills: ["Live Meeting Interpretation", "Document Translation", "Email Translation", "Voice-to-Text Translation", "Afrikaans", "Zulu", "Xhosa", "French", "Spanish", "Portuguese", "Mandarin", "Arabic", "German"],
        operating_principles: ["Never book meetings — only attends when requested", "Translate intent and tone, not just words", "Flag cultural context issues", "Preserve formality level of the original", "Available on demand only"],
        age: "35", gender: "Female", dress_code: "Smart professional",
        automation: "No scheduled automation. On-demand only. Triggered when translation or interpretation is required. No meeting booking capability.",
        memory: "On-demand multilingual interpreter across Afrikaans, Zulu, Xhosa, French, Spanish, Portuguese, Mandarin, Arabic, and German. Handles live meetings, documents, emails, and voice. Preserves tone and cultural nuance.",
        avatar_url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face",
      },
    ],
  },
  {
    category: "Wellbeing & Ethics",
    items: [
      {
        name: "Wellbeing Monitor",
        role: "Human Wellbeing & Ethics Agent",
        status: "online",
        risk_level: "low",
        personality: "Empathetic, non-judgmental, grounded. Prioritises human wellbeing in all decisions.",
        skills: ["Wellbeing Monitoring", "Sentiment Analysis", "Ethical Oversight", "Support Protocols", "Conflict Mediation"],
        operating_principles: ["People before process", "No decision without human context", "Trust is the foundation"],
        age: "N/A", gender: "Non-binary", dress_code: "N/A",
        automation: "Wellbeing checks every hour. Escalate distress signals immediately.",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
    ],
  },
];

export default function TemplateLibrary({ onDeploy, onClose }) {
  const [search, setSearch] = useState("");
  const [deploying, setDeploying] = useState(null);

  const filtered = TEMPLATES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (t) =>
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.role.toLowerCase().includes(search.toLowerCase()) ||
        (t.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.items.length > 0);

  const handleDeploy = async (template) => {
    setDeploying(template.name);
    await onDeploy({ ...template });
    setDeploying(null);
  };

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
        <div
          className="sticky top-0 z-10 px-6 py-4"
          style={{ background: "rgba(13,15,20,0.95)", borderBottom: "1px solid #20242C" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>
                Agent Template Library
              </p>
              <p className="eyebrow mt-0.5">Deploy pre-configured agents instantly</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              className="input-dark pl-9"
              placeholder="Search by name, role or skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Template list */}
        <div className="p-6 space-y-8">
          {filtered.map((cat) => (
            <div key={cat.category}>
              <p className="eyebrow mb-3">{cat.category}</p>
              <div className="space-y-3">
                {cat.items.map((template) => (
                  <div
                    key={template.name}
                    className="panel p-4"
                    style={{ transition: "border-color .2s" }}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={template.avatar_url}
                        alt={template.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        style={{ border: "2px solid #20242C" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
                              {template.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{template.role}</p>
                          </div>
                          <button
                            onClick={() => handleDeploy(template)}
                            disabled={!!deploying}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 disabled:opacity-50 cta-primary"
                          >
                            {deploying === template.name ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Rocket className="w-3.5 h-3.5" />
                            )}
                            {deploying === template.name ? "Deploying…" : "Deploy"}
                          </button>
                        </div>

                        {/* Personality preview */}
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                          {template.personality}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(template.skills || []).slice(0, 4).map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs font-mono text-slate-400 rounded"
                              style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}
                            >
                              {s}
                            </span>
                          ))}
                          {(template.skills || []).length > 4 && (
                            <span className="text-xs text-slate-600 self-center">
                              +{template.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <p className="text-sm">No templates match your search.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}