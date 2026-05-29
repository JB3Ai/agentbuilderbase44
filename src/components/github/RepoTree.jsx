import { useState } from "react";
import { ChevronRight, ChevronDown, FileCode, FolderOpen, Folder, Sparkles, Loader2 } from "lucide-react";

function buildTree(flat) {
  const root = {};
  for (const node of flat) {
    const parts = node.path.split("/");
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!cur[part]) {
        cur[part] = { _meta: { ...node, name: part, isDir: i < parts.length - 1 || node.type === "tree" }, _children: {} };
      }
      cur = cur[part]._children;
    }
  }
  return root;
}

function TreeNode({ name, node, onOpenFile, openPath, depth = 0 }) {
  const isDir = node._meta.type === "tree" || Object.keys(node._children).length > 0;
  const [open, setOpen] = useState(depth < 2);
  const isActive = openPath === node._meta.path;

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 w-full text-left px-3 py-1 hover:bg-slate-800 transition-colors text-sm text-slate-400 hover:text-slate-200"
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          {open ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          {open ? <FolderOpen className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />}
          <span className="truncate">{name}</span>
        </button>
        {open && (
          <div>
            {Object.entries(node._children)
              .sort(([, a], [, b]) => {
                const aDir = a._meta.type === "tree";
                const bDir = b._meta.type === "tree";
                if (aDir && !bDir) return -1;
                if (!aDir && bDir) return 1;
                return a._meta.name?.localeCompare(b._meta.name);
              })
              .map(([childName, childNode]) => (
                <TreeNode key={childName} name={childName} node={childNode} onOpenFile={onOpenFile} openPath={openPath} depth={depth + 1} />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpenFile(node._meta)}
      className="flex items-center gap-1.5 w-full text-left px-3 py-1 transition-colors text-sm truncate"
      style={{
        paddingLeft: `${12 + depth * 14}px`,
        background: isActive ? "rgba(0,255,102,0.08)" : "transparent",
        color: isActive ? "#00FF66" : "#94A3B8",
      }}
    >
      <FileCode className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? "#00FF66" : "#475569" }} />
      <span className="truncate">{name}</span>
    </button>
  );
}

export default function RepoTree({ tree, loading, onOpenFile, openPath, repoData, onAnalyze, analyzing }) {
  const treeMap = buildTree(tree);

  return (
    <div className="py-3">
      {/* Repo info + analyze btn */}
      <div className="px-3 pb-3 border-b border-[#20242C] mb-2">
        <p className="eyebrow mb-2">Files</p>
        <button
          onClick={onAnalyze}
          disabled={analyzing || loading || tree.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.2)", color: "#00FF66" }}
        >
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {analyzing ? "Analyzing…" : "AI Analyze Repo"}
        </button>
      </div>

      {loading ? (
        <div className="px-4 space-y-2 pt-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ background: "#1A1D24", width: `${50 + Math.random() * 40}%` }} />
          ))}
        </div>
      ) : (
        <div>
          {Object.entries(treeMap)
            .sort(([, a], [, b]) => {
              const aDir = a._meta.type === "tree";
              const bDir = b._meta.type === "tree";
              if (aDir && !bDir) return -1;
              if (!aDir && bDir) return 1;
              return a._meta.name?.localeCompare(b._meta.name);
            })
            .map(([name, node]) => (
              <TreeNode key={name} name={name} node={node} onOpenFile={onOpenFile} openPath={openPath} depth={0} />
            ))}
        </div>
      )}
    </div>
  );
}