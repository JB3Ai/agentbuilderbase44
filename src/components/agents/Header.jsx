import { useEffect, useState } from "react";
import { Command, Zap, Github, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header({ onQuickCommand, onOpenSettings }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <header
      data-testid="main-header"
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(11,12,16,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #20242C",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #00FF66, #00C950)", boxShadow: "0 0 16px rgba(0,255,102,0.4)" }}>
          <Zap className="w-4 h-4 text-black" />
        </div>
        <span className="text-white font-bold text-base" style={{ fontFamily: "Chivo, sans-serif" }}>
          JB³Ai <span className="text-slate-500 font-normal">Nexus</span>
        </span>
      </div>

      {/* System Status */}
      <div className="hidden md:flex items-center gap-2">
        <span className="status-dot status-online" />
        <span className="text-xs font-mono text-slate-400">SYSTEM ONLINE</span>
      </div>

      {/* Right: time + CTA */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
          style={{ border: "1px solid #20242C" }}>
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
        <Link to="/repos"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
          style={{ border: "1px solid #20242C" }}>
          <Github className="w-3.5 h-3.5" />
          Repos
        </Link>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-mono text-slate-300">{timeStr}</span>
          <span className="text-xs font-mono text-slate-600">{dateStr}</span>
        </div>
        <button
          data-testid="quick-command-btn"
          onClick={onQuickCommand}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-black"
          style={{ background: "linear-gradient(180deg, #00FF66 0%, #00C950 100%)", boxShadow: "0 4px 14px -4px rgba(0,255,102,0.5)" }}
        >
          <Command className="w-3.5 h-3.5" />
          New Agent
        </button>
      </div>
    </header>
  );
}