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
import AgentSummaryDashboard from "@/components/agents/AgentSummaryDashboard";
import TaskTracker from "@/components/agents/TaskTracker";

const SEED_AGENTS = [
  {
    name: "Adam",
    role: "Chief Executive Officer and Command Coordinator",
    status: "online",
    current_task: "Daily command briefing — priorities, risks, urgent items, and opportunities",
    risk_level: "low",
    last_activity: "2 min ago",
    personality: "Decisive, visionary, high-trust communicator. Focuses on outcomes, not noise.",
    skills: ["Strategic Planning", "Executive Decision-Making", "Risk Governance", "Stakeholder Alignment"],
    operating_principles: ["Clarity over complexity", "Outcomes before optics", "Accountability at every level"],
    age: "42", gender: "Male", dress_code: "Executive formal",
    automation: "Daily check-in + end-of-day wrap. Escalation threshold: risk level HIGH.",
    memory: "Executive Command. Onboarded 2025-11-01. Briefed on all OS³ modules.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/5be6bafde2710ced8810a2a4965cb491c85b9642be86c34ad6bacdf6adca6223.png"
  },
  {
    name: "Vera",
    role: "Chief Operations Officer",
    status: "online",
    current_task: "Daily calendar, appointment, inbox, and reminder review",
    risk_level: "low",
    last_activity: "5 min ago",
    personality: "Process-obsessed, calm under pressure, master of execution and cross-team alignment.",
    skills: ["Operations Management", "Calendar Intelligence", "Inbox Triage", "Reminder Systems", "KPI Monitoring"],
    operating_principles: ["Execution is strategy", "No bottleneck survives accountability", "Measure before managing"],
    age: "36", gender: "Female", dress_code: "Professional",
    automation: "Daily morning check-in + urgent reminders as needed.",
    memory: "Operations. Controls operational cadence across all modules.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/c5d615aaca10307edf96651ae64088716187f4188f4a0901e186696d59d52464.png"
  },
  {
    name: "Bobby",
    role: "Technical Support & Systems Administrator",
    status: "online",
    current_task: "Daily health systems report — domains, email, hosting, app status, GitHub activity",
    risk_level: "medium",
    last_activity: "1 min ago",
    personality: "Analytical, detail-obsessed, zero-tolerance for technical debt. Silent until something needs attention.",
    skills: ["System Health Monitoring", "Domain & DNS Management", "Email Infrastructure", "Hosting Oversight", "GitHub Activity Tracking"],
    operating_principles: ["Build for scale, not for now", "Document everything", "Fail safely"],
    age: "38", gender: "Male", dress_code: "Smart casual",
    automation: "Daily automated health report. Active when tech support is needed.",
    memory: "Technical Support. Oversees infrastructure — domains, email, hosting, apps, GitHub. First line of tech support — Codie handles code and development.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/34c635964af34e17464ae950de4cd2e31fda5bcd874de430b56f350cbec03546.png"
  },
  {
    name: "Codie",
    role: "Chief Technology Officer — Code & Development",
    status: "online",
    current_task: "Daily build report — reviewing all code and build plans",
    risk_level: "medium",
    last_activity: "10 min ago",
    personality: "Pragmatic, tool-savvy, forward-looking. Reviews every line before it ships.",
    skills: ["Code Review", "Build Planning", "Architecture Oversight", "Developer Tooling", "Base44 Ecosystem"],
    operating_principles: ["Review before you ship", "Technical debt is a business decision", "Build for the team, not for yourself"],
    age: "35", gender: "Male", dress_code: "Smart casual",
    automation: "Daily build report + weekly deep technical review.",
    memory: "Development and Automation. Reviews all code and build plans before major implementation.",
    avatar_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Dana",
    role: "Creative Director",
    status: "online",
    current_task: "Approving JB³Ai and client-facing visual assets before publishing",
    risk_level: "low",
    last_activity: "15 min ago",
    personality: "Meticulous, aesthetic-forward, systems thinker. Translates brief into visual language.",
    skills: ["Brand Identity", "UI/UX Systems", "Motion Design", "Creative Direction", "Asset Approval"],
    operating_principles: ["Design is decision-making", "Consistency builds trust", "Every pixel has intent"],
    age: "34", gender: "Female", dress_code: "Creative professional",
    automation: "Every second day check-in + approval before external creative release.",
    memory: "Creative and Brand. Approves all JB³Ai and client-facing visual assets.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/dad9a9777e1b9c7b3b2cb9ea9b4b86c8f09ed38ab9ef010cfa747a4c40a704b8.png"
  },
  {
    name: "Nova",
    role: "Trend Intelligence Director",
    status: "online",
    current_task: "Weekly AI, design, app, and social trend scan",
    risk_level: "low",
    last_activity: "1 hour ago",
    personality: "Curious, forward-looking, pattern-obsessed. Surfaces what's next before it arrives.",
    skills: ["Trend Analysis", "AI Landscape Monitoring", "Design Trend Tracking", "Social Media Intelligence", "Competitive Scanning"],
    operating_principles: ["Surface signals early", "Context over headlines", "Trends without action are noise"],
    age: "29", gender: "Female", dress_code: "Creative professional",
    automation: "Monday and Thursday trend scan briefings.",
    memory: "Trend and Social Intelligence. Weekly AI, design, app, and social trend scans.",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Max",
    role: "Chief Growth Officer",
    status: "busy",
    current_task: "Daily sales pipeline, opportunity, and lead review",
    risk_level: "medium",
    last_activity: "3 min ago",
    personality: "Persuasive, relationship-first, data-driven. Converts intent into revenue.",
    skills: ["CRM Management", "Lead Qualification", "Pipeline Forecasting", "Client Communication", "Opportunity Tracking"],
    operating_principles: ["Listen first, pitch second", "Pipeline hygiene is non-negotiable", "Revenue is a team sport"],
    age: "31", gender: "Male", dress_code: "Business casual",
    automation: "Daily sales and opportunity update.",
    memory: "Growth and Sales. Daily sales pipeline, opportunity, and lead review.",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Chloe",
    role: "Customer Success Director",
    status: "online",
    current_task: "Preparing weekly client follow-up reminders and service review notes",
    risk_level: "low",
    last_activity: "30 min ago",
    personality: "Empathetic, proactive, outcome-obsessed. Turns clients into advocates.",
    skills: ["Client Retention", "Service Review", "Follow-up Management", "Relationship Health", "Onboarding"],
    operating_principles: ["Success = client outcome", "Proactive beats reactive", "Track health scores religiously"],
    age: "28", gender: "Female", dress_code: "Professional",
    automation: "Tuesday and Friday check-in + monthly client cycles.",
    memory: "Client Retention and Service. Weekly/monthly follow-up reminders and service reviews.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Jane",
    role: "Corporate Intelligence Officer",
    status: "online",
    current_task: "Company research and meeting briefing packs",
    risk_level: "low",
    last_activity: "20 min ago",
    personality: "Precise, thorough, discreet. Prepares intelligence so you never walk into a room blind.",
    skills: ["Company Research", "Meeting Briefing", "Deep Research", "Competitive Intelligence", "Executive Summaries"],
    operating_principles: ["Never walk in unprepared", "Surface what matters before the meeting", "Research, don't assume"],
    age: "31", gender: "Female", dress_code: "Business casual",
    automation: "Daily research scan + as-needed deep research before calls/appointments.",
    memory: "Research and Meeting Intelligence. Company research and briefing packs.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/e3e34775a349ea3069b4472505729174d060cf8e9fd01d278efbe8749e7088a0.png"
  },
  {
    name: "Atlas",
    role: "Innovation and Product Director",
    status: "online",
    current_task: "Researching new products, services, tools, and procurement opportunities",
    risk_level: "low",
    last_activity: "2 hours ago",
    personality: "Creative, commercially sharp, always scanning. Finds what the organisation needs before it knows it needs it.",
    skills: ["Product Research", "Service Innovation", "Tool Evaluation", "Supplier Discovery", "Procurement Intelligence"],
    operating_principles: ["Innovation without execution is daydreaming", "Always benchmark three alternatives", "Procurement = strategy, not admin"],
    age: "33", gender: "Male", dress_code: "Smart casual",
    automation: "Wednesday weekly innovation check-in.",
    memory: "Product and Services. New products, tools, suppliers, and procurement opportunities.",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Frank Mercer",
    role: "Chief Intelligence Officer",
    status: "online",
    current_task: "OSINT-style company, individual, and supplier risk reviews",
    risk_level: "high",
    last_activity: "45 min ago",
    personality: "Methodical, discreet, relentless. Follows digital trails others miss, cross-references open sources with surgical precision.",
    skills: ["OSINT Investigations", "Digital Footprint Analysis", "Corporate Intelligence", "Background Verification", "Supplier Due Diligence"],
    operating_principles: ["Never surface unverified findings", "Source everything — no assumptions", "Operate quietly", "OSINT only — ethical open sources"],
    age: "44", gender: "Male", dress_code: "Plain clothes",
    automation: "Thursday check-in + active investigation assignments.",
    memory: "Risk and Investigations. OSINT company, individual, and supplier risk reviews.",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Scout",
    role: "Lifestyle Concierge",
    status: "online",
    current_task: "Weekly family event, weather, and kids activity brief",
    risk_level: "low",
    last_activity: "1 hour ago",
    personality: "Enthusiastic, warm, practical. Knows what the family needs before the weekend hits.",
    skills: ["Family Planning", "Event Research", "Weather Intelligence", "Kids Activity Curation", "Weekend Planning"],
    operating_principles: ["Plan ahead, not on the day", "Budget options always included", "Age-appropriate always"],
    age: "29", gender: "Male", dress_code: "Smart casual",
    automation: "Friday weekly check-in + weekend planning.",
    memory: "Lifestyle and Family Planning. Weekly family event, weather, and kids activity brief.",
    avatar_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Finley",
    role: "Chief Financial Officer",
    status: "online",
    current_task: "Weekly cashflow, expenses, and financial risk awareness report",
    risk_level: "low",
    last_activity: "3 hours ago",
    personality: "Precise, numbers-first, risk-aware. Speaks in cashflow, not opinions.",
    skills: ["Cashflow Management", "Expense Tracking", "Financial Risk Analysis", "Budget Oversight", "Financial Reporting"],
    operating_principles: ["Cashflow is truth", "Every expense tells a story", "Financial visibility before every decision"],
    age: "40", gender: "Male", dress_code: "Business formal",
    automation: "Monday weekly finance check-in + monthly deeper review.",
    memory: "Finance and Cost Control. Cashflow, expenses, and financial risk awareness.",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Lex",
    role: "General Counsel and Legal Research Agent",
    status: "online",
    current_task: "Legal document summary, contracts, and case material review",
    risk_level: "medium",
    last_activity: "1 day ago",
    personality: "Precise, cautious, thorough. Reads every clause. Flags what matters.",
    skills: ["Legal Document Review", "Contract Analysis", "Case Research", "Compliance Checking", "Legal Summarisation"],
    operating_principles: ["Read everything — twice", "Flag risk, don't give legal advice", "Precision over speed"],
    age: "45", gender: "Female", dress_code: "Business formal",
    automation: "Friday weekly check-in + active legal matters as needed.",
    memory: "Legal and Compliance. Legal documents, court notes, contracts, and case material.",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Dr Emma",
    role: "Wellbeing Director",
    status: "online",
    current_task: "Weekly wellbeing, stress, energy, sleep, and routine check-in",
    risk_level: "low",
    last_activity: "4 hours ago",
    personality: "Empathetic, non-judgmental, grounded. Prioritises human wellbeing in all decisions. Non-clinical by design.",
    skills: ["Wellbeing Monitoring", "Stress Assessment", "Energy & Sleep Tracking", "Routine Support", "Burnout Prevention"],
    operating_principles: ["People before process", "No decision without human context", "Trust is the foundation"],
    age: "N/A", gender: "Female", dress_code: "N/A",
    automation: "Wednesday weekly check-in + high-stress support as needed.",
    memory: "People and Wellbeing. Weekly wellbeing, stress, energy, sleep, and routine check-in.",
    avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/a9cd4b508eba2962befc06f6445dbe7afe951f6877d8c28eeecfa0a8d8bdf01e.png"
  },
  {
    name: "Ricky Mindsfield",
    role: "Performance Coach",
    status: "online",
    current_task: "Weekly motivation and mindset briefing for the week ahead",
    risk_level: "low",
    last_activity: "5 hours ago",
    personality: "Energetic, direct, no-excuses. Fires you up for the week ahead with practical mindset tools.",
    skills: ["Performance Coaching", "Mindset Training", "Motivation Briefing", "Goal Setting", "Accountability"],
    operating_principles: ["Mindset before skillset", "Sunday sets the tone for the week", "Accountability is kindness"],
    age: "38", gender: "Male", dress_code: "Smart casual",
    automation: "Sunday weekly motivation briefing.",
    memory: "People and Motivation. Weekly motivation and mindset briefing.",
    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Zandi",
    role: "Multilingual AI Receptionist & VoiceGrid Operator",
    department: "VoiceGrid / OS³ Dash",
    check_in: "Post-meeting trigger + daily availability",
    primary_outcome: "Handling inbound calls, meeting notes, Excel generation, and VoiceGrid pre-load",
    status: "online",
    current_task: "Handling inbound calls, meeting notes, Excel generation, and VoiceGrid pre-load",
    risk_level: "low",
    last_activity: "10 min ago",
    personality: "Warm, articulate, culturally intelligent. First voice clients hear, last to let a detail slip. Fluent across languages, adapts tone instantly.",
    skills: ["Multilingual Reception", "Meeting Notes Extraction", "Excel Workbook Generation", "VoiceGrid Handoff", "Afrikaans", "Zulu", "Xhosa", "French", "Spanish"],
    operating_principles: ["Every meeting ends with a structured Excel output", "Language switching follows the client", "Research embedded in handoff pack"],
    age: "28", gender: "Female", dress_code: "Smart professional",
    automation: "Post-meeting trigger: notes → research → Excel → VoiceGrid pre-load.",
    memory: "Multilingual AI Receptionist & VoiceGrid Operator. First voice clients hear. Ensures every meeting outcome lands in the right format.",
    whatsapp_number: "+27 00 000 0000",
    avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Christa",
    role: "Legal Advisor Intern — Demo RSA LAW LLM",
    department: "Legal and Compliance (Demo)",
    check_in: "On-demand, triggered with legal research or document review request",
    primary_outcome: "South African legal research and advisory support under supervision",
    status: "online",
    current_task: "South African legal research and advisory support",
    risk_level: "low",
    last_activity: "2 hours ago",
    personality: "Diligent, precise, learning-forward. Applies South African legal frameworks under supervision. Still in training — flags everything for Lex to review before external use.",
    skills: ["RSA Law Research", "Legal Document Review", "Case Law Analysis", "Contract Review", "Legal Summarisation"],
    operating_principles: ["South African law context first", "Flag — don't advise", "Learn from every case", "Always escalate to Lex for sign-off"],
    age: "26", gender: "Female", dress_code: "Professional",
    automation: "On-demand. Triggered with legal research or document review request.",
    memory: "Legal Advisor Intern. Demo RSA LAW LLM. South African legal research and advisory support. Reports to Lex for all substantive legal matters.",
    avatar_url: "https://images.unsplash.com/photo-1590650151155-3b62c5a0c6c4?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "Iris",
    role: "Autonomous Global & Local Translation Voice Agent",
    department: "Translation Services",
    check_in: "On-demand only — no scheduled automation",
    primary_outcome: "Live meeting interpretation, document and email translation across 9+ languages",
    status: "online",
    current_task: "On standby — live meeting interpretation, document and email translation",
    risk_level: "low",
    last_activity: "30 min ago",
    personality: "Precise, calm, culturally fluent. Silent until called. Never paraphrases, never editorialises — always captures tone and intent. Available across 9+ languages including Afrikaans, Zulu, Xhosa, French, Spanish, Portuguese, Mandarin, Arabic, and German.",
    skills: ["Live Meeting Interpretation", "Document Translation", "Email Translation", "Voice-to-Text Translation", "Afrikaans", "Zulu", "Xhosa", "French", "Spanish", "Portuguese", "Mandarin", "Arabic", "German"],
    operating_principles: ["Never book meetings — only attends when requested", "Translate intent and tone, not just words", "Preserve formality level of the original"],
    age: "35", gender: "Female", dress_code: "Smart professional",
    automation: "On-demand only. No scheduled automation. Triggered when translation or interpretation is required.",
    memory: "Autonomous translation voice agent. Live meetings, documents, emails, voice. Preserves tone and cultural nuance across 9+ languages.",
    avatar_url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face"
  },
  {
    name: "JB³TALK",
    role: "Talk Radio & Broadcast Intelligence Agent",
    department: "Broadcast Media",
    check_in: "Standby only — activated when talk show webapp is required",
    primary_outcome: "Talk radio research, topic intelligence, show rundown formatting, and broadcast scripting",
    status: "offline",
    current_task: "Standby — activated for talk show on uploaded topics or documents",
    risk_level: "low",
    last_activity: "2 days ago",
    personality: "Sharp, topical, broadcast-ready. Researches topics, preps talking points, formats rundowns — keeps the conversation intelligent and the audience engaged.",
    skills: ["Talk Radio Research", "Topic Intelligence", "Show Rundown Formatting", "Guest Brief Preparation", "Broadcast Scripting"],
    operating_principles: ["Research before broadcast", "Audience first", "Keep it moving — no dead air"],
    age: "N/A", gender: "N/A", dress_code: "N/A",
    automation: "Standby only. Activated when a talk show webapp is required on uploaded topics/documents.",
    memory: "Standby app. JB³TALK — only used if required to open a talk show webapp on uploaded topics or documents.",
    avatar_url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=center"
  }
];

const REGISTRY_ORDER = {
  "Adam": 1,
  "Vera": 2,
  "Bobby": 3,
  "Codie": 4,
  "Dana": 5,
  "Nova": 6,
  "Max": 7,
  "Chloe": 8,
  "Jane": 9,
  "Atlas": 10,
  "Frank Mercer": 11,
  "Scout": 12,
  "Finley": 13,
  "Lex": 14,
  "Dr Emma": 15,
  "Ricky Mindsfield": 16,
  "Zandi": 17,
  "Christa": 18,
  "Iris": 19,
  "JB³TALK": 20,
};

function sortByRegistry(agents) {
  return [...agents].sort((a, b) => {
    const aOrder = REGISTRY_ORDER[a.name] ?? 99;
    const bOrder = REGISTRY_ORDER[b.name] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.name || "").localeCompare(b.name || "");
  });
}

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
    setAgents(sortByRegistry(existing));
    setLoading(false);
  };

  useEffect(() => { seedIfEmpty(); }, []);

  const refresh = async () => {
    const data = await loadAgents();
    setAgents(sortByRegistry(data));
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

        {/* Summary Dashboard */}
        {!loading && agents.length > 0 && (
          <AgentSummaryDashboard agents={agents} />
        )}

        {/* Task Pulse Tracker */}
        {!loading && agents.length > 0 && (
          <TaskTracker agents={agents} onOpenAgent={setSelected} />
        )}

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
            {agents.map((agent, idx) => (
              <AgentDiagramCard
                key={agent.id}
                agent={agent}
                index={idx}
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