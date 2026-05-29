import { Loader2, FileCode } from "lucide-react";

function getLanguage(path) {
  const ext = path.split(".").pop()?.toLowerCase();
  const map = {
    js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
    py: "python", go: "go", rs: "rust", java: "java",
    json: "json", md: "markdown", css: "css", html: "html",
    yml: "yaml", yaml: "yaml", sh: "bash", env: "env",
  };
  return map[ext] || "text";
}

function syntaxColor(line, lang) {
  // Very lightweight keyword highlighting
  const keywords = {
    javascript: /\b(import|export|const|let|var|function|return|if|else|for|while|class|async|await|new|this|from|default)\b/g,
    python: /\b(import|from|def|class|return|if|elif|else|for|while|async|await|with|as|in|not|and|or)\b/g,
    typescript: /\b(import|export|const|let|var|function|return|if|else|for|while|class|async|await|type|interface|extends)\b/g,
  };
  return line;
}

export default function FileViewer({ path, content, loading }) {
  const lang = getLanguage(path);
  const lines = content?.split("\n") || [];

  return (
    <div className="h-full flex flex-col">
      {/* File header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#20242C] flex-shrink-0"
        style={{ background: "#0D0F14" }}>
        <FileCode className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-mono text-slate-300">{path}</span>
        <span className="eyebrow ml-auto">{lang}</span>
        {content && <span className="eyebrow">{lines.length} lines</span>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs font-mono" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-slate-900 group">
                  <td className="select-none text-right pr-4 pl-4 text-slate-700 w-12 group-hover:text-slate-500"
                    style={{ userSelect: "none", minWidth: "48px" }}>
                    {i + 1}
                  </td>
                  <td className="pr-6 py-0.5 text-slate-300 whitespace-pre">
                    {line || " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}