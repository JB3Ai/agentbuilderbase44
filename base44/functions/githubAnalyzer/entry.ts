import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    const body = await req.json();
    const { action, owner, repo, path = "", sha } = body;

    const gh = (endpoint) =>
      fetch(`https://api.github.com${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }).then((r) => r.json());

    // List authenticated user's repos
    if (action === "list_repos") {
      const repos = await gh("/user/repos?sort=updated&per_page=50&type=all");
      return Response.json({ repos });
    }

    // Get repo tree (full file tree)
    if (action === "get_tree") {
      const repoData = await gh(`/repos/${owner}/${repo}`);
      const branch = repoData.default_branch || "main";
      const tree = await gh(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
      return Response.json({ tree: tree.tree || [], branch, repo: repoData });
    }

    // Get file content
    if (action === "get_file") {
      const file = await gh(`/repos/${owner}/${repo}/contents/${path}`);
      if (file.content) {
        const content = atob(file.content.replace(/\n/g, ""));
        return Response.json({ content, sha: file.sha, size: file.size });
      }
      return Response.json({ content: "", sha: "" });
    }

    // Search across repos
    if (action === "search") {
      const { query } = body;
      const results = await gh(`/search/code?q=${encodeURIComponent(query + (owner ? ` user:${owner}` : ""))}&per_page=20`);
      return Response.json({ results: results.items || [] });
    }

    // Get commits
    if (action === "get_commits") {
      const commits = await gh(`/repos/${owner}/${repo}/commits?per_page=20`);
      return Response.json({ commits });
    }

    // AI analyze repo
    if (action === "analyze") {
      const { files, repoName } = body;
      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a senior software architect analyzing a GitHub repository called "${repoName}".

Here are the key files from the repository:
${files.map((f) => `\n--- ${f.path} ---\n${f.content?.slice(0, 2000) || "(binary or too large)"}`).join("\n")}

Provide a comprehensive analysis:
1. **Project Summary**: What does this project do?
2. **Tech Stack**: Languages, frameworks, key dependencies
3. **Architecture**: How is the code structured?
4. **Code Quality**: Patterns used, strengths, and areas to improve
5. **Key Insights**: 3-5 standout observations
6. **Recommendations**: 3-5 actionable improvements`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            tech_stack: { type: "array", items: { type: "string" } },
            architecture: { type: "string" },
            code_quality: { type: "string" },
            key_insights: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
      });
      return Response.json({ analysis });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});