import { X, Cpu, Layers, Code2, Lightbulb, Rocket } from "lucide-react";

export default function RepoAnalysis({ analysis, onClose }) {
  if (!analysis) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#00FF66]" />
          <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Chivo, sans-serif" }}>
            AI Repository Analysis
          </h2>
        </div>
        <button onClick={onClose}
          className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="panel p-5">
        <p className="eyebrow mb-2">Project Summary</p>
        <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Tech Stack */}
      {analysis.tech_stack?.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-slate-500" />
            <p className="eyebrow">Tech Stack</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.tech_stack.map((t, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-mono text-slate-300"
                style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Architecture */}
      {analysis.architecture && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-slate-500" />
            <p className="eyebrow">Architecture</p>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{analysis.architecture}</p>
        </div>
      )}

      {/* Code Quality */}
      {analysis.code_quality && (
        <div className="panel p-5">
          <p className="eyebrow mb-2">Code Quality</p>
          <p className="text-slate-300 text-sm leading-relaxed">{analysis.code_quality}</p>
        </div>
      )}

      {/* Key Insights */}
      {analysis.key_insights?.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
            <p className="eyebrow">Key Insights</p>
          </div>
          <ul className="space-y-2">
            {analysis.key_insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-[#00FF66] mt-0.5 flex-shrink-0">→</span>
                {ins}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-[#93C5FD]" />
            <p className="eyebrow">Recommendations</p>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-[#93C5FD] mt-0.5 flex-shrink-0 font-mono text-xs">{i + 1}.</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}