import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPERAGENT_BASE = "https://app.base44.com/api/agents";

// Same compiler as syncAgentToSuperagent — keeps verification honest
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

// Check which local fields are populated
function auditLocalFields(agent) {
  const checks = {
    name: { value: !!agent.name, data: agent.name },
    role: { value: !!agent.role, data: agent.role },
    personality: { value: !!agent.personality, data: agent.personality ? agent.personality.slice(0, 80) + '…' : null },
    skills: { value: !!(agent.skills && agent.skills.length > 0), data: agent.skills || [] },
    operating_principles: { value: !!(agent.operating_principles && agent.operating_principles.length > 0), data: agent.operating_principles || [] },
    automation: { value: !!agent.automation, data: agent.automation ? agent.automation.slice(0, 80) + '…' : null },
    memory: { value: !!agent.memory, data: agent.memory ? agent.memory.slice(0, 80) + '…' : null },
    avatar_url: { value: !!agent.avatar_url, data: agent.avatar_url },
    department: { value: !!agent.department, data: agent.department },
    current_task: { value: !!agent.current_task, data: agent.current_task ? agent.current_task.slice(0, 80) + '…' : null },
    superagent_id: { value: !!agent.superagent_id, data: agent.superagent_id },
    name_trimmed: { value: agent.name === (agent.name || '').trim(), data: agent.name !== (agent.name || '').trim() ? `WARNING: name has whitespace: "${agent.name}"` : 'ok' },
  };
  const missingFields = Object.entries(checks).filter(([k, v]) => !v.value).map(([k]) => k);
  const completeness = Math.round((Object.values(checks).filter(v => v.value).length / Object.keys(checks).length) * 100);
  return { checks, missingFields, completeness };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { agentId } = await req.json();
    const apiKey = Deno.env.get("SUPERAGENT_API_KEY");

    if (!apiKey) return Response.json({ error: "SUPERAGENT_API_KEY not set" }, { status: 500 });

    // ── Single agent verify ──
    if (agentId) {
      const [agent] = await base44.entities.Agent.filter({ id: agentId });
      if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

      const localAudit = auditLocalFields(agent);
      const compiledSoul = compileSoul(agent);
      const soulLength = compiledSoul.length;
      const soulTruncated = soulLength >= 1950;

      const result = {
        name: agent.name,
        id: agent.id,
        superagent_id: agent.superagent_id || null,
        local: { ...localAudit, soul_length: soulLength, soul_truncated: soulTruncated },
        remote: null,
        field_diff: [],
        status: "unknown",
        issues: [],
      };

      // Check name whitespace
      if (agent.name !== (agent.name || '').trim()) {
        result.issues.push({ severity: "warning", field: "name", message: `Name has leading/trailing whitespace: "${agent.name}"` });
      }

      // Check local completeness
      if (localAudit.missingFields.length > 0) {
        result.issues.push({ severity: "info", field: "local_fields", message: `Missing fields: ${localAudit.missingFields.join(', ')}` });
      }

      if (soulTruncated) {
        result.issues.push({ severity: "warning", field: "compiled_soul", message: "Compiled soul was truncated at 1950 chars — some data may be cut off" });
      }

      if (!agent.superagent_id) {
        result.status = "not_linked";
        result.issues.push({ severity: "error", field: "superagent_id", message: "Agent has no Superagent ID — not yet synced" });
        return Response.json(result);
      }

      // Fetch remote
      const remoteRes = await fetch(`${SUPERAGENT_BASE}/${agent.superagent_id}`, {
        headers: { api_key: apiKey },
      });

      if (!remoteRes.ok) {
        result.status = "remote_missing";
        result.issues.push({ severity: "error", field: "superagent_id", message: `Remote agent not found (${remoteRes.status}) — superagent_id is stale` });
        return Response.json(result);
      }

      const remote = await remoteRes.json();
      result.remote = {
        name: remote.name,
        description_length: (remote.description || '').length,
        description_preview: (remote.description || '').slice(0, 200),
        has_description: !!(remote.description && remote.description.trim().length > 10),
      };

      // Field diffs
      const expectedName = (agent.name || '').trim();
      if (remote.name !== expectedName) {
        result.field_diff.push({ field: "name", local: expectedName, remote: remote.name });
        result.issues.push({ severity: "warning", field: "name", message: `Name mismatch — local: "${expectedName}", remote: "${remote.name}"` });
      }

      const expectedSoul = compiledSoul;
      const remoteSoul = remote.description || '';
      if (expectedSoul !== remoteSoul) {
        result.field_diff.push({ field: "description", local_length: expectedSoul.length, remote_length: remoteSoul.length, in_sync: false });
        result.issues.push({ severity: "warning", field: "description", message: `Description out of sync — local: ${expectedSoul.length} chars, remote: ${remoteSoul.length} chars` });
      } else {
        result.field_diff.push({ field: "description", in_sync: true, length: expectedSoul.length });
      }

      if (!result.remote.has_description) {
        result.issues.push({ severity: "error", field: "description", message: "Remote agent has no description — soul not pushed correctly" });
      }

      result.status = result.issues.filter(i => i.severity === "error").length > 0 ? "error"
        : result.issues.filter(i => i.severity === "warning").length > 0 ? "warning"
        : "ok";

      return Response.json(result);
    }

    // ── Full audit of all agents ──
    const allAgents = await base44.entities.Agent.list("-updated_date", 100);
    const auditResults = [];

    for (const agent of allAgents) {
      const localAudit = auditLocalFields(agent);
      const compiledSoul = compileSoul(agent);
      const soulLength = compiledSoul.length;

      const entry = {
        name: agent.name,
        id: agent.id,
        superagent_id: agent.superagent_id || null,
        completeness: localAudit.completeness,
        missing_fields: localAudit.missingFields,
        soul_length: soulLength,
        soul_truncated: soulLength >= 1950,
        name_has_whitespace: agent.name !== (agent.name || '').trim(),
        remote_status: "not_checked",
        remote_has_description: null,
        description_in_sync: null,
        issues: [],
        status: "ok",
      };

      if (agent.name !== (agent.name || '').trim()) {
        entry.issues.push({ severity: "warning", message: `Name whitespace: "${agent.name}"` });
      }
      if (soulLength >= 1950) {
        entry.issues.push({ severity: "warning", message: "Soul truncated at 1950 chars" });
      }
      if (localAudit.missingFields.length > 0) {
        entry.issues.push({ severity: "info", message: `Missing: ${localAudit.missingFields.join(', ')}` });
      }

      if (!agent.superagent_id) {
        entry.remote_status = "not_linked";
        entry.issues.push({ severity: "error", message: "No superagent_id — not synced" });
        entry.status = "error";
        auditResults.push(entry);
        continue;
      }

      // Fetch remote agent
      try {
        const remoteRes = await fetch(`${SUPERAGENT_BASE}/${agent.superagent_id}`, {
          headers: { api_key: apiKey },
        });

        if (!remoteRes.ok) {
          entry.remote_status = "missing";
          entry.issues.push({ severity: "error", message: `Stale superagent_id — remote 404` });
          entry.status = "error";
          auditResults.push(entry);
          continue;
        }

        const remote = await remoteRes.json();
        entry.remote_status = "found";
        entry.remote_has_description = !!(remote.description && remote.description.trim().length > 10);
        entry.description_in_sync = (remote.description || '') === compiledSoul;
        entry.remote_name = remote.name;
        entry.name_in_sync = remote.name === (agent.name || '').trim();

        if (!entry.remote_has_description) {
          entry.issues.push({ severity: "error", message: "Remote has no description" });
        }
        if (!entry.description_in_sync) {
          entry.issues.push({ severity: "warning", message: "Description out of sync" });
        }
        if (!entry.name_in_sync) {
          entry.issues.push({ severity: "warning", message: `Name mismatch: local="${(agent.name||'').trim()}" remote="${remote.name}"` });
        }

        entry.status = entry.issues.filter(i => i.severity === "error").length > 0 ? "error"
          : entry.issues.filter(i => i.severity === "warning").length > 0 ? "warning"
          : "ok";

      } catch (e) {
        entry.remote_status = "fetch_error";
        entry.issues.push({ severity: "error", message: `Fetch error: ${e.message}` });
        entry.status = "error";
      }

      auditResults.push(entry);
    }

    const summary = {
      total: auditResults.length,
      ok: auditResults.filter(a => a.status === "ok").length,
      warnings: auditResults.filter(a => a.status === "warning").length,
      errors: auditResults.filter(a => a.status === "error").length,
      not_linked: auditResults.filter(a => a.remote_status === "not_linked").length,
      stale_ids: auditResults.filter(a => a.remote_status === "missing").length,
      name_whitespace: auditResults.filter(a => a.name_has_whitespace).length,
      soul_truncated: auditResults.filter(a => a.soul_truncated).length,
    };

    return Response.json({ summary, agents: auditResults });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});