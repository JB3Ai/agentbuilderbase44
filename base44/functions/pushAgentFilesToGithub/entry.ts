import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { repo, branch, basePath, files } = await req.json();
    // files: [{ path: ".memory", content: "..." }, ...]
    // repo: "owner/repo-name"
    // branch: "main"
    // basePath: ".agents/AgentName" (no trailing slash)

    if (!repo || !files || !files.length) {
      return Response.json({ error: "repo and files are required" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };

    const targetBranch = branch || "main";
    const targetBase = basePath || ".agents/unnamed";

    const results = [];

    for (const file of files) {
      const filePath = `${targetBase}/${file.path}`;
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

      // Check if file already exists to get its SHA (needed for updates)
      let sha = null;
      const existingRes = await fetch(`${apiUrl}?ref=${targetBranch}`, { headers });
      if (existingRes.ok) {
        const existing = await existingRes.json();
        sha = existing.sha;
      }

      const body = {
        message: `chore: update ${file.path} for ${targetBase.split("/").pop()} agent`,
        content: btoa(unescape(encodeURIComponent(file.content))),
        branch: targetBranch,
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (putRes.ok) {
        results.push({ path: filePath, status: sha ? "updated" : "created" });
      } else {
        const err = await putRes.json();
        results.push({ path: filePath, status: "failed", error: err.message || putRes.status });
      }
    }

    const failed = results.filter(r => r.status === "failed");
    return Response.json({
      success: failed.length === 0,
      results,
      summary: `${results.length - failed.length}/${results.length} files synced to ${repo}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});