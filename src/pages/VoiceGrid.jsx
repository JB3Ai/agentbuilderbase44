import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, PhoneIncoming, PhoneOutgoing, FileSpreadsheet, Mic, Globe, ArrowLeft, Zap, Lock } from "lucide-react";

const PIPELINE_STEPS = [
  {
    icon: Mic,
    label: "Meeting / Call",
    desc: "Live meeting or inbound call is recorded and transcribed in real time.",
    color: "#00FF66",
  },
  {
    icon: FileSpreadsheet,
    label: "Notes + Media → Excel",
    desc: "Zandi extracts structured notes, action items, and media references into a formatted Excel workbook.",
    color: "#93C5FD",
  },
  {
    icon: Zap,
    label: "Research Embed",
    desc: "Relevant research, company data, and context is compiled and embedded directly into the workbook.",
    color: "#F59E0B",
  },
  {
    icon: Phone,
    label: "VoiceGrid 2.0 Pre-load",
    desc: "The Excel pack is automatically loaded into VoiceGrid 2.0 as a live briefing context before the next call.",
    color: "#A78BFA",
  },
  {
    icon: Globe,
    label: "Zandi Takes Over",
    desc: "Zandi handles inbound or outbound calls in the client's language, fully briefed and ready.",
    color: "#00FF66",
  },
];

const LANGUAGES = [
  "English", "Afrikaans", "Zulu", "Xhosa",
  "French", "Spanish", "Portuguese", "Mandarin", "Arabic", "German",
];

export default function VoiceGrid() {
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(11,12,16,0.95)", borderBottom: "1px solid #1E2128", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="divider-vert h-5" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,255,102,0.1)", border: "1px solid rgba(0,255,102,0.25)" }}>
              <Phone className="w-4 h-4 text-[#00FF66]" />
            </div>
            <span className="text-white font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>VoiceGrid 2.0</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot status-online" />
          <span className="text-xs font-mono text-slate-400">System Ready</span>
          <div className="ml-3 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
            <Lock className="w-3 h-3" />
            Premium Add-on
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-12 p-8 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0D1117 0%, #111827 50%, #0D1117 100%)", border: "1px solid #1E2128" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(500px 300px at 90% 50%, rgba(0,255,102,0.05), transparent)" }} />
          <div className="relative">
            <p className="eyebrow mb-2">JB³Ai — VoiceGrid 2.0</p>
            <h1 className="text-4xl font-black text-white leading-tight mb-3" style={{ fontFamily: "Chivo, sans-serif" }}>
              Multilingual AI<br />Telephone System
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Every meeting generates a structured Excel briefing pack, pre-loaded into VoiceGrid 2.0 before the next call.
              Zandi then handles reception in any language — fully briefed, seamless, and always on.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {LANGUAGES.map((lang) => (
                <span key={lang} className="px-3 py-1 rounded-full text-xs font-mono text-slate-300"
                  style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="mb-12">
          <p className="eyebrow mb-6">Automated Pipeline</p>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <div
                  key={i}
                  onClick={() => setActiveStep(isActive ? null : i)}
                  className="panel p-5 cursor-pointer transition-all"
                  style={{ borderColor: isActive ? step.color + "66" : undefined }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: step.color + "15", border: `1px solid ${step.color}33` }}>
                      <Icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-600 w-5">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>{step.label}</p>
                      </div>
                      {isActive && (
                        <p className="text-sm text-slate-400 mt-2 ml-8 leading-relaxed">{step.desc}</p>
                      )}
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: step.color, boxShadow: `0 0 8px ${step.color}88` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zandi + Iris cards */}
        <div className="mb-12">
          <p className="eyebrow mb-4">Assigned Agents</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel p-5">
              <div className="flex items-center gap-4 mb-3">
                <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face"
                  alt="Zandi" className="w-12 h-12 rounded-xl object-cover" style={{ border: "2px solid #20242C" }} />
                <div>
                  <p className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Zandi</p>
                  <p className="text-xs text-slate-500">Primary Operator · VoiceGrid 2.0</p>
                </div>
                <span className="ml-auto status-dot status-online" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Handles all inbound and outbound calls. Manages the full post-meeting pipeline from transcription to Excel to call handoff.
              </p>
            </div>
            <div className="panel p-5">
              <div className="flex items-center gap-4 mb-3">
                <img src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face"
                  alt="Iris" className="w-12 h-12 rounded-xl object-cover" style={{ border: "2px solid #20242C" }} />
                <div>
                  <p className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Iris</p>
                  <p className="text-xs text-slate-500">Translation Depth Layer · On Demand</p>
                </div>
                <span className="ml-auto status-dot status-online" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Called by Zandi when nuanced translation or cultural context is required. Preserves tone, formality, and intent across all languages.
              </p>
            </div>
          </div>
        </div>

        {/* Source */}
        <div className="panel p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
            <Phone className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>VoiceGrid 2.0 Repository</p>
            <a href="https://github.com/JB3Ai/voicegrid2_0" target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono text-[#00FF66] hover:underline">
              github.com/JB3Ai/voicegrid2_0
            </a>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
            <Lock className="w-3 h-3" />
            Premium
          </div>
        </div>

      </main>
    </div>
  );
}