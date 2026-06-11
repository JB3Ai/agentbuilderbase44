import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPERAGENT_BASE = "https://app.base44.com/api/agents";

// Fields shared between Nexus Agent entity and Superagent platform
const SHARED_FIELDS = ["name", "role", "personality"];

function pickFields(obj, fields) {
  const result = {};
  for (const f of fields) {
    result[f] = obj[f] || "";
  }
  return result;
}

function hash(obj) {
  return JSON.stringify(pickFields(obj, SHARED_FIELDS));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, apiKey } = await req.json();

    if (!agentId) {
      return Response.json({ error: "agentId is required" }, { status: 400 });
    }

    // ── Fetch local agent ──
    const [localAgent] = await base44.entities.Agent.filter({ id: agentId });
    if (!localAgent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!localAgent.superagent_id) {
      return Response.json({
        status: "no_superagent",
        message: "This agent has no Superagent ID linked. Add one in the Profile tab.",
      });
    }

    if (!apiKey) {
      return Response.json({
        status: "no_api_key",
        message: "Superagent API key is required. Enter it below.",
      });
    }

    // ── Fetch remote agent from Superagent ──
    const remoteRes = await fetch(
      `${SUPERAGENT_BASE}/${localAgent.superagent_id}`,
      { headers: { api_key: apiKey } }
    );

    if (!remoteRes.ok) {
      const errText = await remoteRes.text();
      return Response.json(
        { error: `Superagent fetch failed (${remoteRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const remoteAgent = await remoteRes.json();

    // ── Compare ──
    const localHash = hash(localAgent);
    const remoteHash = hash(remoteAgent);

    if (localHash === remoteHash) {
      // Already in sync — just update the timestamp
      await base44.entities.Agent.update(localAgent.id, {
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });
      return Response.json({
        status: "in_sync",
        message: "Already in sync. No changes needed.",
        local: pickFields(localAgent, SHARED_FIELDS),
        remote: pickFields(remoteAgent, SHARED_FIELDS),
      });
    }

    // ── Determine direction by timestamps ──
    const localUpdated = new Date(localAgent.updated_date).getTime();
    const remoteUpdated = new Date(remoteAgent.updated_date || 0).getTime();

    const direction = localUpdated >= remoteUpdated ? "push" : "pull";

    // ── Diff ──
    const diff = [];
    for (const f of SHARED_FIELDS) {
      const lv = localAgent[f] || "";
      const rv = remoteAgent[f] || "";
      if (lv !== rv) {
        diff.push({ field: f, local: lv, remote: rv });
      }
    }

    if (direction === "push") {
      // ── Push local → Superagent ──
      const patchRes = await fetch(
        `${SUPERAGENT_BASE}/${localAgent.superagent_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            api_key: apiKey,
          },
          body: JSON.stringify(pickFields(localAgent, SHARED_FIELDS)),
        }
      );

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        return Response.json(
          { error: `Superagent update failed (${patchRes.status}): ${errText}` },
          { status: 502 }
        );
      }

      await base44.entities.Agent.update(localAgent.id, {
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "pushed",
        direction: "push",
        message: `Pushed "${localAgent.name}" to Superagent.`,
        diff,
        local: pickFields(localAgent, SHARED_FIELDS),
        remote: pickFields(localAgent, SHARED_FIELDS), // now matching
      });
    } else {
      // ── Pull Superagent → local ──
      const merged = { ...localAgent };
      for (const f of SHARED_FIELDS) {
        merged[f] = remoteAgent[f] || localAgent[f] || "";
      }

      await base44.entities.Agent.update(localAgent.id, {
        ...merged,
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "pulled",
        direction: "pull",
        message: `Pulled "${localAgent.name}" from Superagent.`,
        diff,
        local: pickFields(remoteAgent, SHARED_FIELDS), // now matching
        remote: pickFields(remoteAgent, SHARED_FIELDS),
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});