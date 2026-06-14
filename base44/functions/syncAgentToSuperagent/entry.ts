import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPERAGENT_BASE = "https://app.base44.com/api/agents";

// ── Compiler: compact Markdown for Superagent "description" field (max 2000 chars) ──
// GLOBAL_SOUL is set separately as the Superagent system prompt — not repeated per agent.
function compileSoul(agent) {
  const skills = (agent.skills || []).slice(0, 6).map(s => `- ${s}`).join('\n');
  const principles = (agent.operating_principles || []).slice(0, 4).map(p => `- ${p}`).join('\n');

  const lines = [
    `**${agent.name}** — ${agent.role || 'Agent'}`,
    agent.department ? `*${agent.department}*` : '',
    '',
    agent.personality ? `${agent.personality}` : '',
    '',
    skills ? `**Skills:**\n${skills}` : '',
    '',
    principles ? `**Principles:**\n${principles}` : '',
    '',
    agent.current_task ? `**Task:** ${agent.current_task}` : '',
    agent.automation ? `**Workflow:** ${agent.automation}` : '',
    agent.memory ? `\n**Context:** ${agent.memory}` : '',
  ].filter(Boolean);

  let md = lines.join('\n');
  if (md.length > 1950) md = md.slice(0, 1950) + '…';
  return md;
}

// Fields used for hash comparison (name + compiled soul)
function hash(agent) {
  return JSON.stringify({ name: (agent.name || "").trim(), soul: compileSoul(agent) });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, apiKey, mode } = await req.json();

    const resolvedApiKey = apiKey || Deno.env.get("SUPERAGENT_API_KEY");
    
    if (!resolvedApiKey) {
      return Response.json({
        status: "no_api_key",
        message: "Superagent API key is required.",
      });
    }

    // ── Batch mode: sync all agents ──
    if (mode === "batch" || (!agentId && mode !== "single")) {
      const allAgents = await base44.entities.Agent.list("-updated_date", 100);
      const linked = allAgents.filter(a => a.superagent_id);
      const unlinked = allAgents.filter(a => !a.superagent_id);
      
      const results = { pulled: [], pushed: [], created: [], skipped: [], failed: [], inSync: 0 };
      
      // ── Create unlinked agents in Superagent with compiled soul ──
      for (const localAgent of unlinked) {
        try {
          const createRes = await fetch(SUPERAGENT_BASE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              api_key: resolvedApiKey,
            },
            body: JSON.stringify({
              name: (localAgent.name || "").trim(),
              description: compileSoul(localAgent),
            }),
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
      
      // ── Sync linked agents: compare compiled soul hash ──
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
          // Remote hash: compare name + description (which holds the compiled soul)
          const remoteHash = JSON.stringify({ name: (remoteAgent.name || "").trim(), soul: remoteAgent.description || "" });
          
          if (localHash === remoteHash) {
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
            await base44.entities.Agent.update(localAgent.id, {
              is_syncing: true,
              superagent_synced_at: new Date().toISOString(),
            });
            results.pulled.push({ name: localAgent.name });
          } else {
            // Push: Nexus is newer — update Superagent
            const updateRes = await fetch(
              `${SUPERAGENT_BASE}/${localAgent.superagent_id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  api_key: resolvedApiKey,
                },
                body: JSON.stringify({
                  name: (localAgent.name || "").trim(),
                  description: compileSoul(localAgent),
                }),
              }
            );
            
            if (updateRes.ok) {
              await base44.entities.Agent.update(localAgent.id, {
                is_syncing: true,
                superagent_synced_at: new Date().toISOString(),
              });
              results.pushed.push({ name: localAgent.name });
            } else {
              // PATCH may not be supported — fall back to recreate
              try {
                await fetch(`${SUPERAGENT_BASE}/${localAgent.superagent_id}`, {
                  method: "DELETE",
                  headers: { api_key: resolvedApiKey },
                });
                const recreateRes = await fetch(SUPERAGENT_BASE, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    api_key: resolvedApiKey,
                  },
                  body: JSON.stringify({
                    name: (localAgent.name || "").trim(),
                    description: compileSoul(localAgent),
                  }),
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

    const compiledSoul = compileSoul(localAgent);

    if (!localAgent.superagent_id) {
      // ── Create new agent in Superagent with full compiled soul ──
      const createRes = await fetch(SUPERAGENT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: resolvedApiKey,
        },
        body: JSON.stringify({
          name: (localAgent.name || "").trim(),
          description: compiledSoul,
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

      await base44.entities.Agent.update(localAgent.id, {
        superagent_id: created.id,
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "created",
        direction: "push",
        message: `Created "${localAgent.name}" in Superagent with compiled soul and linked.`,
        superagent_id: created.id,
        compiled_soul: compiledSoul,
      });
    }

    // ── Agent already linked — fetch remote and compare ──
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
    const remoteHash = JSON.stringify({ name: remoteAgent.name, soul: remoteAgent.description || "" });

    if (localHash === remoteHash) {
      await base44.entities.Agent.update(localAgent.id, {
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });
      return Response.json({
        status: "in_sync",
        message: "Already in sync. No changes needed.",
        remote_description: remoteAgent.description || "",
      });
    }

    const localUpdated = new Date(localAgent.updated_date).getTime();
    const remoteUpdated = new Date(remoteAgent.updated_date || 0).getTime();
    const direction = localUpdated >= remoteUpdated ? "push" : "pull";

    if (direction === "push") {
      // Try PATCH first, fall back to recreate
      const patchRes = await fetch(
        `${SUPERAGENT_BASE}/${localAgent.superagent_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            api_key: resolvedApiKey,
          },
          body: JSON.stringify({
            name: (localAgent.name || "").trim(),
            description: compiledSoul,
          }),
        }
      );

      if (patchRes.ok) {
        await base44.entities.Agent.update(localAgent.id, {
          is_syncing: true,
          superagent_synced_at: new Date().toISOString(),
        });
        return Response.json({
          status: "pushed",
          direction: "push",
          message: `Pushed "${localAgent.name}" compiled soul to Superagent.`,
          compiled_soul: compiledSoul,
        });
      }

      // Fallback: delete + recreate
      await fetch(`${SUPERAGENT_BASE}/${localAgent.superagent_id}`, {
        method: "DELETE",
        headers: { api_key: resolvedApiKey },
      });

      const recreateRes = await fetch(SUPERAGENT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: resolvedApiKey,
        },
        body: JSON.stringify({
          name: (localAgent.name || "").trim(),
          description: compiledSoul,
        }),
      });

      if (!recreateRes.ok) {
        return Response.json({
          status: "push_failed",
          message: `Failed to push "${localAgent.name}". Recreate returned ${recreateRes.status}.`,
        });
      }

      const recreated = await recreateRes.json();
      await base44.entities.Agent.update(localAgent.id, {
        superagent_id: recreated.id,
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "pushed_recreated",
        direction: "push",
        message: `Pushed "${localAgent.name}" via recreate. New Superagent ID: ${recreated.id}`,
        superagent_id: recreated.id,
        compiled_soul: compiledSoul,
      });
    } else {
      // Pull: remote is newer — update Nexus with remote data
      await base44.entities.Agent.update(localAgent.id, {
        is_syncing: true,
        superagent_synced_at: new Date().toISOString(),
      });

      return Response.json({
        status: "pulled",
        direction: "pull",
        message: `Pulled "${localAgent.name}" from Superagent.`,
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});