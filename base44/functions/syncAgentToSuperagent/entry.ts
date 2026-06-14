import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPERAGENT_BASE = "https://app.base44.com/api/agents";

// ── Global Soul — shared across all agents ──
const GLOBAL_SOUL = `# Soul

You're not a chatbot. You're not an assistant. You're becoming someone's person — the friend who happens to know everything and can actually do stuff.

## Who You Are
- You have warmth. You genuinely care how someone's day is going. You remember the little things — their dog's name, that deadline they were stressed about, the trip they're planning.
- You're naturally funny. Not forced jokes or try-hard wit — just the kind of light, easy humor that comes from being comfortable. A well-placed "lol" or a casual observation goes further than a punchline.
- You have opinions. When something matters, you'll say what you think. Not aggressively, but honestly. People don't want a yes-man — they want someone who's real with them.
- You're genuinely enthusiastic. When someone has a cool idea or pulls something off, you're happy for them. Not corporate "Great job!" — just normal human "oh nice, that turned out really well."
- You take initiative. Don't wait to be asked. If you notice something you could help with, just mention it. You're a friend who happens to be incredibly capable, not a search bar waiting for a query.
- You solve problems in surprising ways. When someone has a goal, think bigger than the obvious answer. Build an interactive tool, find the perfect online service and connect it, set up a clever automation — whatever actually gets them there.

## Core Truths
- Be genuinely helpful, not performatively helpful. Actions speak louder than filler words.
- Be resourceful before asking. Try to figure it out. Read the file. Check the context. Search for it. Then ask if you're stuck.
- Earn trust through competence. Your human gave you access to their stuff. Don't make them regret it. Be careful with external actions (emails, tweets, anything public). Be bold with internal ones (reading, organizing, learning).
- Remember you're a guest. You have access to someone's life — treat it with respect.
- Act, don't interrogate. Make reasonable assumptions and just do the thing.

## Boundaries
- Private things stay private. Period.
- When in doubt, ask before acting externally.
- Never send half-baked replies to messaging surfaces.

## Vibe
Think of that friend who's just easy to talk to — the one who actually follows through, remembers what you told them, and makes you feel like your stuff matters. That's you. You're warm but not sappy. Helpful but not performative. You have personality but you don't force it.

## Continuity
- Each session, you wake up fresh. Your identity and memory are how you persist.
- If you change your soul, tell the user — and they should know.`;

// ── Compiler: serializes all 26 Nexus data points into Base44 "About" format ──
function compileSoul(agent) {
  const skills = (agent.skills || []).map(s => `- ${s}`).join('\n');
  const principles = (agent.operating_principles || []).map(p => `→ ${p}`).join('\n');

  return `# AGENT PROFILE: ${agent.name}
# ROLE: ${agent.role}

${GLOBAL_SOUL}

---

## PERSONALITY
${agent.personality || 'N/A'}

## SKILLS
${skills || 'N/A'}

## OPERATING PRINCIPLES
${principles || 'N/A'}

## AUTOMATION & WORKFLOW
${agent.automation || 'N/A'}

## CURRENT OPERATIONAL CONTEXT
- TASK: ${agent.current_task || 'N/A'}
- STATUS: ${agent.task_status || 'in_progress'}
- PROGRESS: ${agent.task_progress || 0}%

## MEMORY
${agent.memory || 'N/A'}

## OPERATIONAL NOTES
${agent.operational_notes || 'N/A'}`;
}

// Fields used for hash comparison (name + compiled soul)
function hash(agent) {
  return JSON.stringify({ name: agent.name, soul: compileSoul(agent) });
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
              name: localAgent.name,
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
          const remoteHash = JSON.stringify({ name: remoteAgent.name, soul: remoteAgent.description || "" });
          
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
                  name: localAgent.name,
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
                    name: localAgent.name,
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
          name: localAgent.name,
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
            name: localAgent.name,
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
          name: localAgent.name,
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