import { Github, Star, GitFork, Lock } from "lucide-react";

export default function RepoList({ repos, loading, selected, onSelect }) {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <p className="eyebrow px-2 py-3">Repositories</p>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-3">
      <p className="eyebrow px-2 py-3">{repos.length} Repositories</p>
      <div className="space-y-1">
        {repos.map((repo) => (
          <button
            key={repo.id}
            onClick={() => onSelect(repo)}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-colors group"
            style={{
              background: selected?.id === repo.id ? "rgba(0,255,102,0.08)" : "transparent",
              border: selected?.id === repo.id ? "1px solid rgba(0,255,102,0.2)" : "1px solid transparent",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {repo.private ? (
                <Lock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              ) : (
                <Github className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium truncate ${selected?.id === repo.id ? "text-[#00FF66]" : "text-slate-300 group-hover:text-white"}`}>
                {repo.name}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-5">
              {repo.language && (
                <span className="text-xs text-slate-600 font-mono">{repo.language}</span>
              )}
              {repo.stargazers_count > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-slate-600">
                  <Star className="w-2.5 h-2.5" />{repo.stargazers_count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}