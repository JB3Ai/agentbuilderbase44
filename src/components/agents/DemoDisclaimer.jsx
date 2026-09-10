import { useEffect, useState } from "react";
import { Eye, X, Mail } from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

const DISMISS_KEY = "jb3ai_disclaimer_dismissed";

export default function DemoDisclaimer() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === "true"); } catch { setDismissed(false); }
  }, []);

  // The demo-mode banner already shows when demo mode is active — avoid stacking
  if (isDemoMode() || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "true"); } catch { /* ignore */ }
  };

  return (
    <div
      className="sticky top-0 z-[70] w-full flex items-center justify-center gap-3 px-4 py-2"
      style={{
        background: "linear-gradient(90deg, #0D1117, #1A1D24, #0D1117)",
        borderBottom: "1px solid rgba(245,158,11,0.4)",
      }}
    >
      <Eye className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
      <span className="text-xs text-slate-300 text-center">
        <b className="text-[#F59E0B]">DEMO</b> — you're viewing a live demo build. Contact{" "}
        <a href="mailto:hi@jb3ai.com" className="text-[#F59E0B] hover:text-white transition-colors underline underline-offset-2">
          hi@jb3ai.com
        </a>{" "}
        for more details.
      </span>
      <button
        onClick={dismiss}
        title="Dismiss"
        className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}