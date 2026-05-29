import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Github, ChevronRight, RefreshCcw, ArrowLeft } from "lucide-react";
import RepoList from "@/components/github/RepoList";
import RepoTree from "@/components/github/RepoTree";
import FileViewer from "@/components/github/FileViewer";
import RepoAnalysis from "@/components/github/RepoAnalysis";

const invoke = (action, params) =>
  base44.functions.invoke("githubAnalyzer", { action, ...params }).then((r) => r.data);

export default function RepoExplorer() {
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [tree, setTree] = useState([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [openFile, setOpenFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    invoke("list_repos", {}).then(({ repos }) => {
      setRepos(repos || []);
      setLoadingRepos(false);
    });
  }, []);

  const selectRepo = async (repo) => {
    setSelectedRepo(repo);
    setTree([]);
    setOpenFile(null);
    setFileContent(null);
    setAnalysis(null);
    setLoadingTree(true);
    const { tree: t } = await invoke("get_tree", { owner: repo.owner.login, repo: repo.name });
    setTree(t || []);
    setLoadingTree(false);
  };

  const openFileHandler = async (node) => {
    if (node.type !== "blob") return;
    setOpenFile(node);
    setFileContent(null);
    setLoadingFile(true);
    const { content } = await invoke("get_file", {
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      path: node.path,
    });
    setFileContent(content);
    setLoadingFile(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    // Pick up to 12 key files (prefer source files)
    const keyExts = [".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".java", ".rs", ".md", ".json"];
    const blobs = tree.filter((n) => n.type === "blob" && keyExts.some((e) => n.path.endsWith(e))).slice(0, 12);
    const files = await Promise.all(
      blobs.map(async (n) => {
        const { content } = await invoke("get_file", {
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          path: n.path,
        });
        return { path: n.path, content };
      })
    );
    const { analysis: a } = await invoke("analyze", {
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      repoName: selectedRepo.full_name,
      files,
    });
    setAnalysis(a);
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0B0C10" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-4 px-6 py-3"
        style={{ background: "rgba(11,12,16,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid #20242C" }}>
        <a href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </a>
        <div className="w-px h-4 bg-slate-800" />
        <Github className="w-5 h-5 text-[#00FF66]" />
        <span className="text-white font-bold" style={{ fontFamily: "Chivo, sans-serif" }}>
          Repo Explorer
        </span>
        {selectedRepo && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-300 text-sm font-mono">{selectedRepo.full_name}</span>
          </>
        )}
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar: repo list */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-[#20242C]"
          style={{ background: "#0D0F14" }}>
          <RepoList
            repos={repos}
            loading={loadingRepos}
            selected={selectedRepo}
            onSelect={selectRepo}
          />
        </div>

        {/* Main panel */}
        {!selectedRepo ? (
          <div className="flex-1 flex items-center justify-center text-slate-600">
            <div className="text-center">
              <Github className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">Select a repository</p>
              <p className="text-sm mt-1">Choose from the list to explore its code</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-w-0">
            {/* File tree */}
            <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-[#20242C]"
              style={{ background: "#0F1116" }}>
              <RepoTree
                tree={tree}
                loading={loadingTree}
                onOpenFile={openFileHandler}
                openPath={openFile?.path}
                repoData={selectedRepo}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
              />
            </div>

            {/* File viewer / analysis */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {analysis ? (
                  <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RepoAnalysis analysis={analysis} onClose={() => setAnalysis(null)} />
                  </motion.div>
                ) : openFile ? (
                  <motion.div key={openFile.path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FileViewer path={openFile.path} content={fileContent} loading={loadingFile} />
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-full text-slate-600">
                    <div className="text-center">
                      <p className="text-sm">Select a file to view its contents</p>
                      <p className="text-xs mt-1 text-slate-700">or click "AI Analyze" to analyze the whole repo</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}