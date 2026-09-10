import { Eye } from "lucide-react";
import { isDemoMode, exitDemoMode } from "@/lib/demo-mode";

export default function DemoBanner() {
  if (!isDemoMode()) return null;
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
        <b className="text-[#F59E0B]">DEMO MODE</b> — you're exploring a live preview. Nothing you click, edit, or create will be saved. Contact{" "}
        <a href="mailto:hi@jb3ai.com" className="text-[#F59E0B] hover:text-white transition-colors underline underline-offset-2">hi@jb3ai.com</a> for more details.
      </span>
      <button
        onClick={exitDemoMode}
        className="text-xs font-medium text-[#F59E0B] hover:text-white transition-colors flex-shrink-0"
        style={{ border: "1px solid rgba(245,158,11,0.35)", borderRadius: 6, padding: "3px 12px" }}
      >
        Exit Demo
      </button>
    </div>
  );
}