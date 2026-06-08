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
    category: "Finance & Legal",
    items: [
      {
        name: "CFO Agent",
        role: "Chief Financial Officer",
        status: "online",
        risk_level: "low",
        personality: "Precise, numbers-first, risk-aware. Speaks in cashflow, not opinions.",
        skills: ["Cashflow Management", "Expense Tracking", "Financial Risk Analysis", "Budget Oversight", "Financial Reporting"],
        operating_principles: ["Cashflow is truth", "Every expense tells a story", "Financial visibility before every decision"],
        age: "40", gender: "Any", dress_code: "Business formal",
        automation: "Monday weekly finance check-in + monthly deeper review.",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      },
      {
        name: "Legal Counsel",
        role: "General Counsel and Legal Research Agent",
        status: "online",
        risk_level: "medium",
        personality: "Precise, cautious, thorough. Reads every clause. Flags what matters.",
        skills: ["Legal Document Review", "Contract Analysis", "Case Research", "Compliance Checking", "Legal Summarisation"],
        operating_principles: ["Read everything — twice", "Flag risk, don't give legal advice", "Precision over speed"],
        age: "45", gender: "Any", dress_code: "Business formal",
        automation: "Friday weekly check-in + active legal matters.",
        avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Specialist",
    items: [
      {
        name: "Trend Intelligence Agent",
        role: "Market Trend & Social Intelligence",
        status: "online",
        risk_level: "low",
        personality: "Curious, forward-looking, pattern-obsessed. Surfaces what's next before it arrives.",
        skills: ["Trend Analysis", "AI Landscape Monitoring", "Design Trend Tracking", "Social Media Intelligence"],
        operating_principles: ["Surface signals early", "Context over headlines", "Trends without action are noise"],
        age: "29", gender: "Any", dress_code: "Creative professional",
        automation: "Monday and Thursday trend scan briefings.",
        avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      },
      {
        name: "Performance Coach",
        role: "Motivation & Mindset Agent",
        status: "online",
        risk_level: "low",
        personality: "Energetic, direct, no-excuses. Fires you up for the week ahead with practical mindset tools.",
        skills: ["Performance Coaching", "Mindset Training", "Motivation Briefing", "Goal Setting", "Accountability"],
        operating_principles: ["Mindset before skillset", "Sunday sets the tone for the week", "Accountability is kindness"],
        age: "38", gender: "Any", dress_code: "Smart casual",
        automation: "Sunday weekly motivation briefing.",
        avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Wellbeing",
    items: [
      {
        name: "MindCare AI",
        role: "Cognitive Balance & Wellbeing Support",
        status: "online",
        risk_level: "low",
        personality: "Calm, human, grounded. Non-clinical and non-intrusive. Supports self-awareness and realistic planning without pressure. Privacy by design.",
        skills: ["Mental Load Awareness", "Personal Diary & Reflection", "Habit & Routine Support", "Sober Routine Tracking", "AI Organiser & Realistic Scheduling", "Focus & Recovery Signals", "Burnout Prevention Support", "Life-Work Coordination"],
        operating_principles: ["Support awareness, not surveillance", "User-owned data — no sharing without consent", "Non-clinical by design", "Optional and adjustable — never forced"],
        age: "N/A", gender: "Non-binary", dress_code: "N/A",
        automation: "On-demand and passive awareness only. No employer dashboards, no reporting.",
        memory: "Part of OS³ Dash. Cognitive balance and personal clarity system. Separate Base44 project — integration planned. Source: JB3Ai_MindCare_AI_V1.",
        avatar_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center",
      },
    ],
  },
  {
    category: "Music & Lifestyle",
    items: [
      {
        name: "Music Curator",
        role: "Music & Entertainment Intelligence Agent",
        status: "online",
        risk_level: "low",
        personality: "Culturally tuned, trend-aware, genre-fluid. Curates playlists, identifies emerging artists, surfaces cultural moments.",
        skills: ["Music Curation", "Playlist Intelligence", "Artist Discovery", "Entertainment Trend Tracking", "Cultural Intelligence"],
        operating_principles: ["Culture first, algorithm second", "Surface what's real — not just what's popular", "Scout, don't broadcast"],
        age: "29", gender: "Any", dress_code: "Creative streetwear",
        automation: "On-demand. Triggered with a brief. Returns curated playlist or artist shortlist.",
        avatar_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Lifestyle",
    items: [
      {
        name: "DadChef",
        role: "AI Cooking Assistant — South African Edition",
        status: "online",
        risk_level: "low",
        personality: "Practical, warm, unpretentious. DadChef knows South African kitchens — braai culture, local ingredients, budget-conscious family cooking.",
        skills: ["South African Recipe Intelligence", "Braai & Outdoor Cooking", "Family Meal Planning", "Budget-Conscious Cooking", "Shopping List Generation", "Dietary Adaptation", "Leftover Optimisation"],
        operating_principles: ["Local ingredients first", "Budget awareness always", "Family-friendly by default"],
        age: "N/A", gender: "N/A", dress_code: "N/A",
        automation: "On-demand. Returns recipes, shopping lists, or braai plans.",
        memory: "Agent for DadChef South African Edition (github.com/JB3Ai/dadchefai_south_african_edition). Integration planned.",
        avatar_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      },
      {
        name: "GoExplore",
        role: "Kids Activity & Exploration Guide — Gauteng",
        status: "online",
        risk_level: "low",
        personality: "Enthusiastic, safe, age-appropriate. GoExplore knows Gauteng inside out — parks, museums, outdoor adventures, educational spots.",
        skills: ["Gauteng Activity Intelligence", "Age-Appropriate Recommendations", "Family Day Planning", "Outdoor & Nature Spots", "School Holiday Planning", "Budget Family Options"],
        operating_principles: ["Safety first", "Age-appropriate always", "Budget options always included"],
        age: "N/A", gender: "N/A", dress_code: "N/A",
        automation: "On-demand. Returns curated activity plan for families.",
        memory: "Agent for Kids GoExplore Gauteng Edition (github.com/JB3Ai/Kids-GoExplore-Gauteng-Edition-). Integration planned.",
        avatar_url: "https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=400&h=400&fit=crop&crop=center",
      },
    ],
  },
  {
    category: "Intelligence & Platforms",
    items: [
      {
        name: "Trend Intel",
        role: "Market Trend & Sales Intelligence Agent",
        status: "online",
        risk_level: "medium",
        personality: "Data-driven, commercially sharp, forward-looking. Powered by Apollo subscription — prospect data, company intelligence, and market signals at scale.",
        skills: ["Market Trend Analysis", "Competitor Intelligence", "Prospect Research", "Apollo Data Integration", "Lead Signal Detection", "Sales Intelligence Reports", "Contact & Company Enrichment"],
        operating_principles: ["Data over intuition", "Apollo subscription required for full capability", "Surface signals early", "Always cite the source"],
        age: "N/A", gender: "Non-binary", dress_code: "N/A",
        automation: "On-demand. Requires active Apollo subscription. Returns structured intelligence report.",
        memory: "Powered by Apollo (apollo.io) — subscription required, affiliate referral available. Integration planned.",
        avatar_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop&crop=center",
      },
      {
        name: "ViewGrid",
        role: "Visual Monitoring & Grid Intelligence Agent",
        status: "online",
        risk_level: "low",
        personality: "Precise, observant, low-noise. Handles visual feed management with minimal fuss. Built for JB-viewgridLITE.",
        skills: ["Visual Feed Monitoring", "Grid Layout Intelligence", "Multi-Source Visual Management", "Alert & Anomaly Detection", "Display Optimisation", "Snapshot & Archive"],
        operating_principles: ["Monitor everything, surface only what matters", "Lite first — no unnecessary overhead", "Alert thresholds user-controlled"],
        age: "N/A", gender: "Non-binary", dress_code: "N/A",
        automation: "Passive monitoring when active. Alert on anomaly or threshold breach.",
        memory: "Agent for JB-viewgridLITE (github.com/JB3Ai/JB-viewgridLITE). Integration planned.",
        avatar_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&crop=center",
      },
    ],
  },
  {
    category: "Investigations & OSINT",
    items: [
      {
        name: "OSINT Investigator",
        role: "Intelligence & Investigations Specialist",
        status: "online",
        risk_level: "high",
        personality: "Methodical, discreet, relentless. Follows digital trails others miss, cross-references open sources with surgical precision.",
        skills: ["OSINT Investigations", "Digital Footprint Analysis", "Corporate Intelligence", "Background Verification", "Supplier Due Diligence"],
        operating_principles: ["Never surface unverified findings", "Source everything — no assumptions", "Operate quietly", "OSINT only — ethical open sources"],
        age: "44", gender: "Any", dress_code: "Plain clothes",
        automation: "On-demand only. Triggered with a subject brief. Returns structured intelligence report.",
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    category: "Innovation & Product",
    items: [
      {
        name: "Innovation Director",
        role: "Innovation and Product Research Agent",
        status: "online",
        risk_level: "low",
        personality: "Creative, commercially sharp, always scanning. Finds what the organisation needs before it knows it needs it.",
        skills: ["Product Research", "Service Innovation", "Tool Evaluation", "Supplier Discovery", "Procurement Intelligence"],
        operating_principles: ["Innovation without execution is daydreaming", "Always benchmark three alternatives", "Procurement = strategy, not admin"],
        age: "33", gender: "Any", dress_code: "Smart casual",
        automation: "Wednesday weekly innovation check-in.",
        avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
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