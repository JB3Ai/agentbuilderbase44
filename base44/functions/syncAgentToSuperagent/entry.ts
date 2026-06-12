import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPERAGENT_BASE = "https://app.base44.com/api/agents";

// Fields shared between Nexus Agent entity and Superagent platform
// Superagent only accepts name and description (no role/personality as separate fields)
const SHARED_FIELDS = ["name"];

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

    const { agentId, apiKey, mode } = await req.json();

    // Use provided apiKey or fall back to the server-side secret
    const resolvedApiKey = apiKey || Deno.env.get("SUPERAGENT_API_KEY");
    
    if (!resolvedApiKey) {
      return Response.json({
        status: "no_api_key",
        message: "Superagent API key is required.",
      });
    }

    // ── Batch mode: sync all agents (linked + unlinked) ──
    if (mode === "batch" || (!agentId && mode !== "single")) {
      const allAgents = await base44.entities.Agent.list("-updated_date", 100);
      const linked = allAgents.filter(a => a.superagent_id);
      const unlinked = allAgents.filter(a => !a.superagent_id);
      
      const results = { pulled: [], pushed: [], created: [], skipped: [], failed: [], inSync: 0 };
      
      // ── Create unlinked agents in Superagent ──
      for (const localAgent of unlinked) {
        try {
          const createRes = await fetch(SUPERAGENT_BASE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              api_key: resolvedApiKey,
            },
            body: JSON.stringify({ name: localAgent.name }),
          });
          
          if (!createRes.ok) {
            results.failed.push({ name: localAgent.name, reason: `Create failed (${createRes.status})` });
            continue;
          }
          
          const created = await createRes.json();
          await base44.entities.Agent.update(localAgent.id, {
            superagent_id: created.id,
            is_syncing: true,
            superagent_synced_at: new Date().toISOString(),
          });
          results.created.push({ name: localAgent.name, superagent_id: created.id });
        } catch (e) {
          results.failed.push({ name: localAgent.name, reason: e.message });
        }
      }
      
      // ── Sync linked agents ──
      for (const localAgent of linked) {
        try {
          const remoteRes = await fetch(
            `${SUPERAGENT_BASE}/${localAgent.superagent_id}`,
            { headers: { api_key: resolvedApiKey } }
          );
          
          if (!remoteRes.ok) {
            results.failed.push({ name: localAgent.name, reason: `Remote fetch failed (${remoteRes.status})` });
            continue;
          }
          
          const remoteAgent = await remoteRes.json();
          const localHash = hash(localAgent);
          const remoteHash = hash(remoteAgent);
          
          if (localHash === remoteHash) {
            // Touch sync timestamp even when in sync
            await base44.entities.Agent.update(localAgent.id, {
              is_syncing: true,
              superagent_synced_at: new Date().toISOString(),
            });
            results.inSync++;
            continue;
          }
          
          const localUpdated = new Date(localAgent.updated_date).getTime();
          const remoteUpdated = new Date(remoteAgent.updated_date || 0).getTime();
          
          if (remoteUpdated > localUpdated) {
            // Pull: Superagent is newer
            const merged = { ...localAgent };
            for (const f of SHARED_FIELDS) {
              merged[f] = remoteAgent[f] || localAgent[f] || "";
            }
            await base44.entities.Agent.update(localAgent.id, {
              ...merged,
              is_syncing: true,
              superagent_synced_at: new Date().toISOString(),
            });
            results.pulled.push({ name: localAgent.name });
          } else {
            // Push: Nexus is newer — recreate in Superagent to push changes
            try {
              // Delete existing Superagent agent
              await fetch(`${SUPERAGENT_BASE}/${localAgent.superagent_id}`, {
                method: "DELETE",
                headers: { api_key: resolvedApiKey },
              });
              // Recreate with current data
              const recreateRes = await fetch(SUPERAGENT_BASE, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  api_key: resolvedApiKey,
                },
                body: JSON.stringify({ name: localAgent.name }),
              });
              if (recreateRes.ok) {
                const recreated = await recreateRes.json();
                await base44.entities.Agent.update(localAgent.id, {
                  superagent_id: recreated.id,
                  is_syncing: true,
                  superagent_synced_at: new Date().toISOString(),
                });
                results.pushed.push({ name: localAgent.name, new_id: recreated.id });
              } else {
                results.skipped.push({ name: localAgent.name, reason: `Recreate failed (${recreateRes.status})` });
              }
            } catch {
              results.skipped.push({ name: localAgent.name, reason: "Push recreate failed" });
            }
          }
        } catch {
          results.failed.push({ name: localAgent.name, reason: "Unexpected error" });
        }
      }
      
      const total = results.pulled.length + results.pushed.length + results.created.length;
      return Response.json({
        status: "batch_done",
        synced: total,
        inSync: results.inSync,
        pulled: results.pulled,
        pushed: results.pushed,
        created: results.created,
        skipped: results.skipped,
        failed: results.failed,
      });
    }

    // ── Single-agent mode ──
    if (!agentId) {
      return Response.json({ error: "agentId is required" }, { status: 400 });
    }

    const [localAgent] = await base44.entities.Agent.filter({ id: agentId });
    if (!localAgent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!localAgent.superagent_id) {
      // ── Create agent in Superagent ──
      const createRes = await fetch(SUPERAGENT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: resolvedApiKey,
        },
        body: JSON.stringify({
          name: localAgent.name,
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        return Response.json(
          { error: `Failed to create agent in Superagent (${createRes.status}): ${errText}` },
          { status: 502 }
        );
      }

      const created = await createRes.json();

      // Save the superagent_id back to Nexus
      await base44.entities.Agent.update(localAgent.id, {
        superagent_id: created.id,
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "created",
        direction: "push",
        message: `Created "${localAgent.name}" in Superagent and linked. Ready to sync.`,
        superagent_id: created.id,
      });
    }

    const remoteRes = await fetch(
      `${SUPERAGENT_BASE}/${localAgent.superagent_id}`,
      { headers: { api_key: resolvedApiKey } }
    );

    if (!remoteRes.ok) {
      const errText = await remoteRes.text();
      return Response.json(
        { error: `Superagent fetch failed (${remoteRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const remoteAgent = await remoteRes.json();
    const localHash = hash(localAgent);
    const remoteHash = hash(remoteAgent);

    if (localHash === remoteHash) {
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

    const localUpdated = new Date(localAgent.updated_date).getTime();
    const remoteUpdated = new Date(remoteAgent.updated_date || 0).getTime();
    const direction = localUpdated >= remoteUpdated ? "push" : "pull";

    const diff = [];
    for (const f of SHARED_FIELDS) {
      const lv = localAgent[f] || "";
      const rv = remoteAgent[f] || "";
      if (lv !== rv) {
        diff.push({ field: f, local: lv, remote: rv });
      }
    }

    if (direction === "push") {
      // Superagent API doesn't support updates — report diff without pushing
      await base44.entities.Agent.update(localAgent.id, {
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "push_skipped",
        direction: "push",
        message: `"${localAgent.name}" is newer in Nexus. Superagent updates are not supported — recreate to sync.`,
        diff,
        local: pickFields(localAgent, SHARED_FIELDS),
        remote: pickFields(remoteAgent, SHARED_FIELDS),
      });
    } else {
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
        local: pickFields(remoteAgent, SHARED_FIELDS),
        remote: pickFields(remoteAgent, SHARED_FIELDS),
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});