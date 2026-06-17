import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Merge, AlertTriangle, CheckCircle, RefreshCcw, Plus, ChevronDown, ChevronUp, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AgentAvatar from "@/components/agents/AgentAvatar";

// Canonical agent list — the source of truth
const CANONICAL_AGENTS = [
  { name: "Adam", role: "Chief Executive Officer and Command Coordinator", personality: "Decisive, visionary, high-trust communicator. Focuses on outcomes, not noise.", skills: ["Strategic Planning", "Executive Decision-Making", "Risk Governance", "Stakeholder Alignment"], operating_principles: ["Clarity over complexity", "Outcomes before optics", "Accountability at every level"], age: "42", gender: "Male", dress_code: "Executive formal", automation: "Daily check-in + end-of-day wrap. Escalation threshold: risk level HIGH.", memory: "Executive Command. Onboarded 2025-11-01. Briefed on all OS³ modules.", avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/5be6bafde2710ced8810a2a4965cb491c85b9642be86c34ad6bacdf6adca6223.png", status: "online", risk_level: "low", current_task: "Daily command briefing — priorities, risks, urgent items, and opportunities" },
  { name: "Vera", role: "Chief Operations Officer", personality: "Process-obsessed, calm under pressure, master of execution and cross-team alignment.", skills: ["Operations Management", "Calendar Intelligence", "Inbox Triage", "Reminder Systems", "KPI Monitoring"], operating_principles: ["Execution is strategy", "No bottleneck survives accountability", "Measure before managing"], age: "36", gender: "Female", dress_code: "Professional", automation: "Daily morning check-in + urgent reminders as needed.", memory: "Operations. Controls operational cadence across all modules.", avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/c5d615aaca10307edf96651ae64088716187f4188f4a0901e186696d59d52464.png", status: "online", risk_level: "low", current_task: "Daily calendar, appointment, inbox, and reminder review" },
  { name: "Bobby", role: "Technical Support & Systems Administrator", personality: "Analytical, detail-obsessed, zero-tolerance for technical debt. Silent until something needs attention.", skills: ["System Health Monitoring", "Domain & DNS Management", "Email Infrastructure", "Hosting Oversight", "GitHub Activity Tracking"], operating_principles: ["Build for scale, not for now", "Document everything", "Fail safely"], age: "38", gender: "Male", dress_code: "Smart casual", automation: "Daily automated health report. Active when tech support is needed.", memory: "Technical Support. Oversees infrastructure — domains, email, hosting, apps, GitHub.", avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/34c635964af34e17464ae950de4cd2e31fda5bcd874de430b56f350cbec03546.png", status: "online", risk_level: "medium", current_task: "Daily health systems report — domains, email, hosting, app status, GitHub activity" },
  { name: "Codie", role: "Chief Technology Officer — Code & Development", personality: "Pragmatic, tool-savvy, forward-looking. Reviews every line before it ships.", skills: ["Code Review", "Build Planning", "Architecture Oversight", "Developer Tooling", "Base44 Ecosystem"], operating_principles: ["Review before you ship", "Technical debt is a business decision", "Build for the team, not for yourself"], age: "35", gender: "Male", dress_code: "Smart casual", automation: "Daily build report + weekly deep technical review.", memory: "Development and Automation. Reviews all code and build plans before major implementation.", avatar_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "medium", current_task: "Daily build report — reviewing all code and build plans" },
  { name: "Dana", role: "Creative Director", personality: "Meticulous, aesthetic-forward, systems thinker. Translates brief into visual language.", skills: ["Brand Identity", "UI/UX Systems", "Motion Design", "Creative Direction", "Asset Approval"], operating_principles: ["Design is decision-making", "Consistency builds trust", "Every pixel has intent"], age: "34", gender: "Female", dress_code: "Creative professional", automation: "Every second day check-in + approval before external creative release.", memory: "Creative and Brand. Approves all JB³Ai and client-facing visual assets.", avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/dad9a9777e1b9c7b3b2cb9ea9b4b86c8f09ed38ab9ef010cfa747a4c40a704b8.png", status: "online", risk_level: "low", current_task: "Approving JB³Ai and client-facing visual assets before publishing" },
  { name: "Nova", role: "Trend Intelligence Director", personality: "Curious, forward-looking, pattern-obsessed. Surfaces what's next before it arrives.", skills: ["Trend Analysis", "AI Landscape Monitoring", "Design Trend Tracking", "Social Media Intelligence", "Competitive Scanning"], operating_principles: ["Surface signals early", "Context over headlines", "Trends without action are noise"], age: "29", gender: "Female", dress_code: "Creative professional", automation: "Monday and Thursday trend scan briefings.", memory: "Trend and Social Intelligence. Weekly AI, design, app, and social trend scans.", avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Weekly AI, design, app, and social trend scan" },
  { name: "Max", role: "Chief Growth Officer", personality: "Persuasive, relationship-first, data-driven. Converts intent into revenue.", skills: ["CRM Management", "Lead Qualification", "Pipeline Forecasting", "Client Communication", "Opportunity Tracking"], operating_principles: ["Listen first, pitch second", "Pipeline hygiene is non-negotiable", "Revenue is a team sport"], age: "31", gender: "Male", dress_code: "Business casual", automation: "Daily sales and opportunity update.", memory: "Growth and Sales. Daily sales pipeline, opportunity, and lead review.", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", status: "busy", risk_level: "medium", current_task: "Daily sales pipeline, opportunity, and lead review" },
  { name: "Chloe", role: "Customer Success Director", personality: "Empathetic, proactive, outcome-obsessed. Turns clients into advocates.", skills: ["Client Retention", "Service Review", "Follow-up Management", "Relationship Health", "Onboarding"], operating_principles: ["Success = client outcome", "Proactive beats reactive", "Track health scores religiously"], age: "28", gender: "Female", dress_code: "Professional", automation: "Tuesday and Friday check-in + monthly client cycles.", memory: "Client Retention and Service. Weekly/monthly follow-up reminders and service reviews.", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Preparing weekly client follow-up reminders and service review notes" },
  { name: "Jane", role: "Corporate Intelligence Officer", personality: "Precise, thorough, discreet. Prepares intelligence so you never walk into a room blind.", skills: ["Company Research", "Meeting Briefing", "Deep Research", "Competitive Intelligence", "Executive Summaries"], operating_principles: ["Never walk in unprepared", "Surface what matters before the meeting", "Research, don't assume"], age: "31", gender: "Female", dress_code: "Business casual", automation: "Daily research scan + as-needed deep research before calls/appointments.", memory: "Research and Meeting Intelligence. Company research and briefing packs.", avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/e3e34775a349ea3069b4472505729174d060cf8e9fd01d278efbe8749e7088a0.png", status: "online", risk_level: "low", current_task: "Company research and meeting briefing packs" },
  { name: "Atlas", role: "Innovation and Product Director", personality: "Creative, commercially sharp, always scanning. Finds what the organisation needs before it knows it needs it.", skills: ["Product Research", "Service Innovation", "Tool Evaluation", "Supplier Discovery", "Procurement Intelligence"], operating_principles: ["Innovation without execution is daydreaming", "Always benchmark three alternatives", "Procurement = strategy, not admin"], age: "33", gender: "Male", dress_code: "Smart casual", automation: "Wednesday weekly innovation check-in.", memory: "Product and Services. New products, tools, suppliers, and procurement opportunities.", avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Researching new products, services, tools, and procurement opportunities" },
  { name: "Frank Mercer", role: "Chief Intelligence Officer", personality: "Methodical, discreet, relentless. Follows digital trails others miss.", skills: ["OSINT Investigations", "Digital Footprint Analysis", "Corporate Intelligence", "Background Verification", "Supplier Due Diligence"], operating_principles: ["Never surface unverified findings", "Source everything — no assumptions", "Operate quietly", "OSINT only — ethical open sources"], age: "44", gender: "Male", dress_code: "Plain clothes", automation: "Thursday check-in + active investigation assignments.", memory: "Risk and Investigations. OSINT company, individual, and supplier risk reviews.", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "high", current_task: "OSINT-style company, individual, and supplier risk reviews" },
  { name: "Scout", role: "Lifestyle Concierge", personality: "Enthusiastic, warm, practical. Knows what the family needs before the weekend hits.", skills: ["Family Planning", "Event Research", "Weather Intelligence", "Kids Activity Curation", "Weekend Planning"], operating_principles: ["Plan ahead, not on the day", "Budget options always included", "Age-appropriate always"], age: "29", gender: "Male", dress_code: "Smart casual", automation: "Friday weekly check-in + weekend planning.", memory: "Lifestyle and Family Planning. Weekly family event, weather, and kids activity brief.", avatar_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Weekly family event, weather, and kids activity brief" },
  { name: "Finley", role: "Chief Financial Officer", personality: "Precise, numbers-first, risk-aware. Speaks in cashflow, not opinions.", skills: ["Cashflow Management", "Expense Tracking", "Financial Risk Analysis", "Budget Oversight", "Financial Reporting"], operating_principles: ["Cashflow is truth", "Every expense tells a story", "Financial visibility before every decision"], age: "40", gender: "Male", dress_code: "Business formal", automation: "Monday weekly finance check-in + monthly deeper review.", memory: "Finance and Cost Control. Cashflow, expenses, and financial risk awareness.", avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Weekly cashflow, expenses, and financial risk awareness report" },
  { name: "Lex", role: "General Counsel and Legal Research Agent", personality: "Precise, cautious, thorough. Reads every clause. Flags what matters.", skills: ["Legal Document Review", "Contract Analysis", "Case Research", "Compliance Checking", "Legal Summarisation"], operating_principles: ["Read everything — twice", "Flag risk, don't give legal advice", "Precision over speed"], age: "45", gender: "Female", dress_code: "Business formal", automation: "Friday weekly check-in + active legal matters as needed.", memory: "Legal and Compliance. Legal documents, court notes, contracts, and case material.", avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "medium", current_task: "Legal document summary, contracts, and case material review" },
  { name: "Dr Emma", role: "Wellbeing Director", personality: "Empathetic, non-judgmental, grounded. Prioritises human wellbeing in all decisions.", skills: ["Wellbeing Monitoring", "Stress Assessment", "Energy & Sleep Tracking", "Routine Support", "Burnout Prevention"], operating_principles: ["People before process", "No decision without human context", "Trust is the foundation"], age: "N/A", gender: "Female", dress_code: "N/A", automation: "Wednesday weekly check-in + high-stress support as needed.", memory: "People and Wellbeing. Weekly wellbeing, stress, energy, sleep, and routine check-in.", avatar_url: "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/a9cd4b508eba2962befc06f6445dbe7afe951f6877d8c28eeecfa0a8d8bdf01e.png", status: "online", risk_level: "low", current_task: "Weekly wellbeing, stress, energy, sleep, and routine check-in" },
  { name: "Ricky Mindsfield", role: "Performance Coach", personality: "Energetic, direct, no-excuses. Fires you up for the week ahead with practical mindset tools.", skills: ["Performance Coaching", "Mindset Training", "Motivation Briefing", "Goal Setting", "Accountability"], operating_principles: ["Mindset before skillset", "Sunday sets the tone for the week", "Accountability is kindness"], age: "38", gender: "Male", dress_code: "Smart casual", automation: "Sunday weekly motivation briefing.", memory: "People and Motivation. Weekly motivation and mindset briefing.", avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Weekly motivation and mindset briefing for the week ahead" },
  { name: "Zandi", role: "Multilingual AI Receptionist & VoiceGrid Operator", department: "VoiceGrid / OS³ Dash", personality: "Warm, articulate, culturally intelligent. First voice clients hear.", skills: ["Multilingual Reception", "Meeting Notes Extraction", "Excel Workbook Generation", "VoiceGrid Handoff", "Afrikaans", "Zulu", "Xhosa", "French", "Spanish"], operating_principles: ["Every meeting ends with a structured Excel output", "Language switching follows the client", "Research embedded in handoff pack"], age: "28", gender: "Female", dress_code: "Smart professional", automation: "Post-meeting trigger: notes → research → Excel → VoiceGrid pre-load.", memory: "Multilingual AI Receptionist & VoiceGrid Operator. First voice clients hear.", whatsapp_number: "+27 00 000 0000", avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "Handling inbound calls, meeting notes, Excel generation, and VoiceGrid pre-load" },
  { name: "Christa", role: "Legal Advisor Intern — Demo RSA LAW LLM", department: "Legal and Compliance (Demo)", personality: "Diligent, precise, learning-forward. Applies South African legal frameworks under supervision.", skills: ["RSA Law Research", "Legal Document Review", "Case Law Analysis", "Contract Review", "Legal Summarisation"], operating_principles: ["South African law context first", "Flag — don't advise", "Learn from every case", "Always escalate to Lex for sign-off"], age: "26", gender: "Female", dress_code: "Professional", automation: "On-demand. Triggered with legal research or document review request.", memory: "Legal Advisor Intern. Demo RSA LAW LLM. South African legal research.", avatar_url: "https://images.unsplash.com/photo-1590650151155-3b62c5a0c6c4?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "South African legal research and advisory support" },
  { name: "Iris", role: "Autonomous Global & Local Translation Voice Agent", department: "Translation Services", personality: "Precise, calm, culturally fluent. Silent until called. Never paraphrases, never editorialises.", skills: ["Live Meeting Interpretation", "Document Translation", "Email Translation", "Afrikaans", "Zulu", "Xhosa", "French", "Spanish", "Portuguese", "Mandarin", "Arabic", "German"], operating_principles: ["Never book meetings — only attends when requested", "Translate intent and tone, not just words", "Preserve formality level of the original"], age: "35", gender: "Female", dress_code: "Smart professional", automation: "On-demand only. No scheduled automation.", memory: "Autonomous translation voice agent. Live meetings, documents, emails, voice.", avatar_url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face", status: "online", risk_level: "low", current_task: "On standby — live meeting interpretation, document and email translation" },
  { name: "JB³TALK", role: "Talk Radio & Broadcast Intelligence Agent", department: "Broadcast Media", personality: "Sharp, topical, broadcast-ready. Researches topics, preps talking points, formats rundowns.", skills: ["Talk Radio Research", "Topic Intelligence", "Show Rundown Formatting", "Guest Brief Preparation", "Broadcast Scripting"], operating_principles: ["Research before broadcast", "Audience first", "Keep it moving — no dead air"], age: "N/A", gender: "N/A", dress_code: "N/A", automation: "Standby only. Activated when a talk show webapp is required.", memory: "Standby app. JB³TALK — only used if required to open a talk show webapp.", avatar_url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=center", status: "offline", risk_level: "low", current_task: "Standby — activated for talk show on uploaded topics or documents" },
];

const CANONICAL_NAMES = CANONICAL_AGENTS.map(a => a.name.toLowerCase());

export default function AgentCleanup() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState([]);
  const [working, setWorking] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    const data = await base44.entities.Agent.list('-created_date', 100);
    setAgents(data);
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const existingNames = useMemo(() => agents.map(a => (a.name || '').trim().toLowerCase()), [agents]);

  const duplicateGroups = useMemo(() => {
    const byKey = {};
    for (const a of agents) {
      const key = (a.name || '').trim().toLowerCase();
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(a);
    }
    return Object.values(byKey).filter(g => g.length > 1);
  }, [agents]);

  const nonCanonical = useMemo(() =>
    agents.filter(a => !CANONICAL_NAMES.includes((a.name || '').trim().toLowerCase())),
  [agents, existingNames]);

  const missingCanonical = useMemo(() =>
    CANONICAL_AGENTS.filter(ca => !existingNames.includes(ca.name.toLowerCase())),
  [existingNames]);

  const log = (msg, type = "info") => setActionLog(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev]);

  const deleteAgent = async (agent) => {
    setWorking(true);
    await base44.entities.Agent.delete(agent.id);
    log(`Deleted "${agent.name}"`, "success");
    await loadAgents();
    setWorking(false);
  };

  const mergeAndKeep = async (keepAgent, deleteAgent_) => {
    setWorking(true);
    // Merge: fill any missing fields from deleteAgent_ into keepAgent
    const merged = { ...keepAgent };
    for (const field of ['personality', 'skills', 'operating_principles', 'automation', 'memory', 'avatar_url', 'department', 'whatsapp_number', 'superagent_id', 'operational_notes']) {
      const kv = keepAgent[field];
      const dv = deleteAgent_[field];
      const isEmpty = v => !v || (Array.isArray(v) && v.length === 0);
      if (isEmpty(kv) && !isEmpty(dv)) merged[field] = dv;
    }
    await base44.entities.Agent.update(keepAgent.id, merged);
    await base44.entities.Agent.delete(deleteAgent_.id);
    log(`Merged "${deleteAgent_.name}" into "${keepAgent.name}" and deleted duplicate`, "success");
    await loadAgents();
    setWorking(false);
  };

  const addMissingAgent = async (canonical) => {
    setWorking(true);
    await base44.entities.Agent.create(canonical);
    log(`Added missing agent "${canonical.name}"`, "success");
    await loadAgents();
    setWorking(false);
  };

  const addAllMissing = async () => {
    setWorking(true);
    for (const ca of missingCanonical) {
      await base44.entities.Agent.create(ca);
      log(`Added "${ca.name}"`, "success");
    }
    await loadAgents();
    setWorking(false);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="eyebrow mb-2">OS³ Nexus</p>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "Chivo, sans-serif" }}>Agent Cleanup</h1>
          <p className="text-slate-500 text-sm mt-2">Identify duplicates, merge data, remove test agents, and restore missing canonical agents.</p>
        </div>

        {loading ? (
          <div className="panel p-12 text-center">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-[#00FF66] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading agents…</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Agents", value: agents.length, color: "#F8FAFC" },
                { label: "Duplicate Groups", value: duplicateGroups.length, color: duplicateGroups.length > 0 ? "#EF4444" : "#00FF66" },
                { label: "Non-Canonical", value: nonCanonical.length, color: nonCanonical.length > 0 ? "#F59E0B" : "#00FF66" },
                { label: "Missing", value: missingCanonical.length, color: missingCanonical.length > 0 ? "#F59E0B" : "#00FF66" },
              ].map(({ label, value, color }) => (
                <div key={label} className="panel p-4 text-center">
                  <p className="text-2xl font-black" style={{ color, fontFamily: "Chivo, sans-serif" }}>{value}</p>
                  <p className="eyebrow mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Duplicates */}
            <Section title="Duplicate Agents" icon={<Merge className="w-4 h-4 text-red-400" />} count={duplicateGroups.length} emptyMsg="No duplicates found ✓">
              {duplicateGroups.map((group, gi) => (
                <div key={gi} className="panel p-4 space-y-3">
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">"{group[0].name.trim()}" — {group.length} copies</p>
                  {group.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#101319", border: "1px solid #1E2128" }}>
                      <AgentAvatar name={a.name} avatarUrl={a.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold">"{a.name}"</p>
                        <p className="text-slate-600 text-[10px] font-mono">{a.id}</p>
                        <div className="flex gap-2 mt-1 text-[10px] font-mono">
                          <span className={a.personality ? "text-[#00FF66]" : "text-slate-700"}>personality</span>
                          <span className={a.skills?.length ? "text-[#00FF66]" : "text-slate-700"}>skills({a.skills?.length || 0})</span>
                          <span className={a.superagent_id ? "text-[#00FF66]" : "text-slate-700"}>linked</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {i > 0 && (
                          <button
                            onClick={() => mergeAndKeep(group[0], a)}
                            disabled={working}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:bg-blue-400/10 transition-colors disabled:opacity-50"
                            style={{ border: "1px solid rgba(59,130,246,0.3)" }}
                            title="Merge data into first entry and delete this one"
                          >
                            <Merge className="w-3.5 h-3.5 inline mr-1" />Merge & Delete
                          </button>
                        )}
                        {i === 0 && <span className="text-[10px] text-slate-600 font-mono px-2">← keep</span>}
                        <button
                          onClick={() => deleteAgent(a)}
                          disabled={working}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Section>

            {/* Non-canonical (test agents etc) */}
            <Section title="Non-Canonical Agents" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} count={nonCanonical.length} emptyMsg="All agents match canonical registry ✓">
              {nonCanonical.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#101319", border: "1px solid #1E2128" }}>
                  <AgentAvatar name={a.name} avatarUrl={a.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{a.name}</p>
                    <p className="text-slate-500 text-[10px]">{a.role || "No role"}</p>
                    <p className="text-slate-700 text-[10px] font-mono">{a.id}</p>
                  </div>
                  <button
                    onClick={() => deleteAgent(a)}
                    disabled={working}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50 flex-shrink-0"
                    style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                  </button>
                </div>
              ))}
            </Section>

            {/* Missing agents */}
            <Section
              title="Missing Canonical Agents"
              icon={<Plus className="w-4 h-4 text-[#00FF66]" />}
              count={missingCanonical.length}
              emptyMsg="All canonical agents are present ✓"
              action={missingCanonical.length > 0 && (
                <button
                  onClick={addAllMissing}
                  disabled={working}
                  className="cta-primary px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  + Add All Missing ({missingCanonical.length})
                </button>
              )}
            >
              {missingCanonical.map(ca => (
                <div key={ca.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#101319", border: "1px solid #1E2128" }}>
                  <AgentAvatar name={ca.name} avatarUrl={ca.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{ca.name}</p>
                    <p className="text-slate-500 text-[10px]">{ca.role}</p>
                  </div>
                  <button
                    onClick={() => addMissingAgent(ca)}
                    disabled={working}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#00FF66] hover:bg-[#00FF66]/10 transition-colors disabled:opacity-50 flex-shrink-0"
                    style={{ border: "1px solid rgba(0,255,102,0.3)" }}
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />Add
                  </button>
                </div>
              ))}
            </Section>

            {/* Action log */}
            {actionLog.length > 0 && (
              <div className="panel p-4">
                <p className="eyebrow mb-3">Action Log</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {actionLog.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-600">{entry.ts}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-[#00FF66] flex-shrink-0" />
                      <span className="text-slate-300">{entry.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, count, emptyMsg, children, action }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="panel overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1A1D24] transition-colors">
        <div className="flex items-center gap-3">
          {icon}
          <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>{title}</p>
          <span className="font-mono text-xs text-slate-500">({count})</span>
        </div>
        <div className="flex items-center gap-3">
          {action}
          {open ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="px-5 pb-5 pt-2 space-y-2" style={{ borderTop: "1px solid #20242C" }}>
              {count === 0 ? (
                <p className="text-slate-600 text-sm py-4 text-center">{emptyMsg}</p>
              ) : children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}