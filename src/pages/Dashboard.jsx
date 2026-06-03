import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import Header from "@/components/agents/Header";
import SettingsPanel from "@/components/agents/SettingsPanel";
import AgentDiagramCard from "@/components/agents/AgentDiagramCard";
import AgentProfile from "@/components/agents/AgentProfile";
import AgentCreator from "@/components/agents/AgentCreator";
import WeeklyReviewPanel from "@/components/agents/WeeklyReviewPanel";
import DependencyGraph from "@/components/agents/DependencyGraph";
import BulkActionBar from "@/components/agents/BulkActionBar";
import TemplateLibrary from "@/components/agents/TemplateLibrary";

const SEED_AGENTS = [
  {
    name: "Adam Boss",
    role: "Chief Executive Agent",
    status: "online",
    current_task: "Reviewing Q2 strategy briefing",
    risk_level: "low",
    last_activity: "2 min ago",
    personality: "Decisive, visionary, high-trust communicator. Focuses on outcomes, not noise.",
    skills: ["Strategic Planning", "Executive Decision-Making", "Risk Governance", "Stakeholder Alignment"],
    operating_principles: ["Clarity over complexity", "Outcomes before optics", "Accountability at every level"],
    age: "42", gender: "Male", dress_code: "Executive formal",
    automation: "Daily briefing at 07:00 SAST. Escalation threshold: risk level HIGH.",
    memory: "Onboarded 2025-11-01. Briefed on all Phase 1 modules.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/5be6bafde2710ced8810a2a4965cb491c85b9642be86c34ad6bacdf6adca6223.png"
  },
  {
    name: "Vera Designer",
    role: "Creative Intelligence Lead",
    status: "busy",
    current_task: "Generating brand motion assets",
    risk_level: "low",
    last_activity: "5 min ago",
    personality: "Meticulous, aesthetic-forward, systems thinker. Translates brief into visual language.",
    skills: ["Brand Identity", "UI/UX Systems", "Motion Design", "Creative Direction"],
    operating_principles: ["Design is decision-making", "Consistency builds trust", "Every pixel has intent"],
    age: "34", gender: "Female", dress_code: "Creative professional",
    automation: "Asset generation queue monitored every 30 min.",
    memory: "Specialises in OS³ brand language. Certified in Figma & After Effects pipelines.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/c5d615aaca10307edf96651ae64088716187f4188f4a0901e186696d59d52464.png"
  },
  {
    name: "Bobby Tech",
    role: "Systems Architecture Agent",
    status: "online",
    current_task: "Auditing API gateway latency",
    risk_level: "medium",
    last_activity: "1 min ago",
    personality: "Analytical, detail-obsessed, zero-tolerance for technical debt.",
    skills: ["Backend Architecture", "API Design", "DevOps", "Security Hardening"],
    operating_principles: ["Build for scale, not for now", "Document everything", "Fail safely"],
    age: "38", gender: "Male", dress_code: "Smart casual",
    automation: "System health checks every 5 min. Alert on error rate > 0.5%.",
    memory: "Oversees all infrastructure decisions. Key contact for Supabase + Kestra integrations.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/34c635964af34e17464ae950de4cd2e31fda5bcd874de430b56f350cbec03546.png"
  },
  {
    name: "Dana Ops",
    role: "Operations Intelligence Agent",
    status: "online",
    current_task: "Coordinating cross-module sync",
    risk_level: "low",
    last_activity: "8 min ago",
    personality: "Process-oriented, calm under pressure, master of execution.",
    skills: ["Process Optimization", "Project Coordination", "KPI Monitoring", "Workflow Automation"],
    operating_principles: ["Execution is strategy", "No bottleneck survives accountability", "Measure before managing"],
    age: "36", gender: "Female", dress_code: "Professional",
    automation: "Daily ops digest at 08:00. Escalate blockers > 24h stale.",
    memory: "Controls operational cadence across all modules. Integrated with Kestra flows.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/dad9a9777e1b9c7b3b2cb9ea9b4b86c8f09ed38ab9ef010cfa747a4c40a704b8.png"
  },
  {
    name: "Jane Sales",
    role: "Revenue Intelligence Agent",
    status: "busy",
    current_task: "Qualifying 3 inbound leads",
    risk_level: "medium",
    last_activity: "12 min ago",
    personality: "Persuasive, relationship-first, data-driven. Converts intent into revenue.",
    skills: ["CRM Management", "Lead Qualification", "Pipeline Forecasting", "Client Communication"],
    operating_principles: ["Listen first, pitch second", "Pipeline hygiene is non-negotiable", "Revenue is a team sport"],
    age: "31", gender: "Female", dress_code: "Business casual",
    automation: "CRM sync every 15 min. Lead scoring threshold: 70+.",
    memory: "Manages hub_marketing_leads. Tracks conversion from cold to close.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/e3e34775a349ea3069b4472505729174d060cf8e9fd01d278efbe8749e7088a0.png"
  },
  {
    name: "MindCare AI",
    role: "Human Wellbeing Agent",
    status: "online",
    current_task: "Monitoring team sentiment indicators",
    risk_level: "low",
    last_activity: "15 min ago",
    personality: "Empathetic, non-judgmental, grounded. Prioritises human wellbeing in all decisions.",
    skills: ["Wellbeing Monitoring", "Sentiment Analysis", "Ethical Oversight", "Support Protocols"],
    operating_principles: ["People before process", "No decision without human context", "Trust is the foundation"],
    age: "N/A", gender: "Non-binary", dress_code: "N/A",
    automation: "Wellbeing checks every hour. Escalate distress signals immediately.",
    memory: "Integrated with MindCare AI module. Tracks team health metrics.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/a9cd4b508eba2962befc06f6445dbe7afe951f6877d8c28eeecfa0a8d8bdf01e.png"
  }
];

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadAgents = async () => {
    const data = await base44.entities.Agent.list("-created_date", 50);
    return data;
  };

  const seedIfEmpty = async () => {
    const existing = await loadAgents();
    setAgents(existing);
    setLoading(false);
  };

  useEffect(() => { seedIfEmpty(); }, []);

  const refresh = async () => {
    const data = await loadAgents();
    setAgents(data);
  };

  const onlineCount = agents.filter(a => a.status === "online").length;
  const busyCount = agents.filter(a => a.status === "busy").length;

  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleBulkDone = async () => {
    setSelectedIds([]);
    await refresh();
  };

  return (
    <div className="min-h-screen">
      <Header onQuickCommand={() => setShowCreator(true)} onOpenSettings={() => setShowSettings(true)} />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Hero banner */}
        <div className="mb-10 p-8 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0D1117 0%, #111827 50%, #0D1117 100%)", border: "1px solid #1E2128" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(600px 300px at 80% 50%, rgba(0,255,102,0.04), transparent)" }} />
          <div className="relative flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="eyebrow mb-2">JB³Ai — OS³ Nexus</p>
              <h1 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "Chivo, sans-serif" }}>
                Agent Registry
              </h1>
              <p className="text-slate-500 mt-2 max-w-lg text-sm">
                Your deployed AI workforce. Click any card to expand the full agent diagram — personality, skills, principles, automation, memory and more.
              </p>
              <div className="flex items-center gap-5 mt-4">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-online" />
                  <span className="text-xs font-mono text-slate-400">{onlineCount} Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-busy" />
                  <span className="text-xs font-mono text-slate-400">{busyCount} Busy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600">{agents.length} Total</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                style={{ border: "1px solid #2A2F3A", background: "#15171C" }}
              >
                📋 Templates
              </button>
              <button
                data-testid="create-agent-btn"
                onClick={() => setShowCreator(true)}
                className="cta-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                + Deploy New Agent
              </button>
            </div>
          </div>
        </div>

        {/* Agent Diagram Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="panel p-5 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {agents.map((agent) => (
              <AgentDiagramCard
                key={agent.id}
                agent={agent}
                onOpen={setSelected}
                selected={selectedIds.includes(agent.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {/* Dependency Graph */}
        {!loading && agents.length > 0 && (
          <div className="mb-10">
            <DependencyGraph agents={agents} />
          </div>
        )}

        {/* Weekly Review Reminders */}
        <div className="mb-8">
          <WeeklyReviewPanel agents={agents} />
        </div>
      </main>

      {/* Agent Profile Overlay */}
      <AnimatePresence>
        {selected && (
          <AgentProfile
            agent={selected}
            onClose={() => setSelected(null)}
            onSave={async (updated) => {
              await base44.entities.Agent.update(selected.id, updated);
              await refresh();
              const refreshed = await base44.entities.Agent.filter({ id: selected.id });
              setSelected(refreshed[0] || null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Agent Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <AgentCreator
            onClose={() => setShowCreator(false)}
            onCreate={async (newAgent) => {
              await base44.entities.Agent.create(newAgent);
              await refresh();
              setShowCreator(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Template Library */}
      <AnimatePresence>
        {showTemplates && (
          <TemplateLibrary
            onClose={() => setShowTemplates(false)}
            onDeploy={async (template) => {
              await base44.entities.Agent.create(template);
              await refresh();
              setShowTemplates(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        agents={agents}
        onClear={() => setSelectedIds([])}
        onDone={handleBulkDone}
      />
    </div>
  );
}