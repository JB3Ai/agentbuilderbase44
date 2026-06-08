import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Zap, ToggleLeft, ToggleRight, X, Save, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };
const NODE_W = 140;
const NODE_H = 70;

function getNodePositions(agents, width) {
  const cols = Math.max(1, Math.floor(width / 200));
  return agents.map((a, i) => ({
    id: a.id,
    x: (i % cols) * 200 + 100,
    y: Math.floor(i / cols) * 140 + 80,
    agent: a,
  }));
}

function midpoint(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

function TriggerForm({ agents, trigger, onSave, onCancel }) {
  const [form, setForm] = useState(trigger || {
    source_agent: agents[0]?.name || "",
    source_task: "",
    target_agent: agents[1]?.name || "",
    target_task: "",
    label: "",
    trigger_condition: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.source_agent || !form.target_agent || !form.source_task || !form.target_task) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="p-5 rounded-xl space-y-4" style={{ background: "#101319", border: "1px solid #20242C" }}>
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
          {trigger ? "Edit Workflow Trigger" : "New Workflow Trigger"}
        </p>
        <button onClick={onCancel} className="text-slate-600 hover:text-slate-300"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1">Source Agent</label>
          <select className="input-dark" value={form.source_agent} onChange={e => setForm(f => ({ ...f, source_agent: e.target.value }))}>
            {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-1">Target Agent</label>
          <select className="input-dark" value={form.target_agent} onChange={e => setForm(f => ({ ...f, target_agent: e.target.value }))}>
            {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-1">Source Task (when done)</label>
          <input className="input-dark" placeholder="e.g. Brand brief approved" value={form.source_task}
            onChange={e => setForm(f => ({ ...f, source_task: e.target.value }))} />
        </div>
        <div>
          <label className="eyebrow block mb-1">Target Task (triggered)</label>
          <input className="input-dark" placeholder="e.g. Start motion assets" value={form.target_task}
            onChange={e => setForm(f => ({ ...f, target_task: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="eyebrow block mb-1">Edge Label (optional)</label>
          <input className="input-dark" placeholder="e.g. → hands off brief" value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="eyebrow block mb-1">Trigger Condition (optional)</label>
          <input className="input-dark" placeholder="e.g. only if risk_level = low" value={form.trigger_condition}
            onChange={e => setForm(f => ({ ...f, trigger_condition: e.target.value }))} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition-colors"
          style={{ border: "1px solid #20242C" }}>Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.source_task || !form.target_task}
          className="cta-primary flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Trigger"}
        </button>
      </div>
    </div>
  );
}

export default function DependencyGraph({ agents }) {
  const svgRef = useRef(null);
  const [triggers, setTriggers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 400 });

  const loadTriggers = async () => {
    const data = await base44.entities.WorkflowTrigger.list("-created_date", 100);
    setTriggers(data);
  };

  useEffect(() => { loadTriggers(); }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setSvgSize({ w, h: Math.max(400, Math.ceil(agents.length / Math.max(1, Math.floor(w / 200))) * 140 + 120) });
    });
    obs.observe(svgRef.current);
    return () => obs.disconnect();
  }, [agents.length]);

  useEffect(() => {
    setNodes(getNodePositions(agents, svgSize.w));
  }, [agents, svgSize.w]);

  const getNode = (agentName) => nodes.find(n => n.agent.name === agentName);

  // Drag
  const onMouseDown = useCallback((e, nodeId) => {
    e.preventDefault();
    setDragging(nodeId);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodes(ns => ns.map(n => n.id === dragging ? { ...n, x, y } : n));
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  const handleSaveTrigger = async (form) => {
    if (editingTrigger) {
      await base44.entities.WorkflowTrigger.update(editingTrigger.id, form);
    } else {
      await base44.entities.WorkflowTrigger.create(form);
    }
    await loadTriggers();
    setShowForm(false);
    setEditingTrigger(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.WorkflowTrigger.delete(id);
    setTriggers(ts => ts.filter(t => t.id !== id));
    setSelectedTrigger(null);
  };

  const handleToggle = async (trigger) => {
    await base44.entities.WorkflowTrigger.update(trigger.id, { active: !trigger.active });
    setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, active: !t.active } : t));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Agent Dependency Graph</h3>
          <p className="eyebrow mt-0.5">Drag nodes to rearrange · Click edges to inspect triggers</p>
        </div>
        <button
          onClick={() => { setEditingTrigger(null); setShowForm(v => !v); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#00FF66]"
          style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Trigger
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {(showForm || editingTrigger) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TriggerForm
              agents={agents}
              trigger={editingTrigger}
              onSave={handleSaveTrigger}
              onCancel={() => { setShowForm(false); setEditingTrigger(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Graph */}
      <div className="panel overflow-hidden" style={{ background: "#0B0D12" }}>
        <svg
          ref={svgRef}
          width="100%"
          height={svgSize.h}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ display: "block", cursor: dragging ? "grabbing" : "default" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#00FF66" />
            </marker>
            <marker id="arrowhead-inactive" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#334155" />
            </marker>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges — with multi-edge offset for same-pair triggers */}
          {(() => {
            // Group triggers by source-target pair
            const groups = {};
            triggers.forEach((trigger) => {
              const key = `${trigger.source_agent}|||${trigger.target_agent}`;
              if (!groups[key]) groups[key] = [];
              groups[key].push(trigger);
            });

            return Object.values(groups).flatMap((group) => {
              const count = group.length;
              return group.map((trigger, idx) => {
                const src = getNode(trigger.source_agent);
                const tgt = getNode(trigger.target_agent);
                if (!src || !tgt) return null;

                // Offset for multi-edge: spread edges apart
                const offset = count > 1 ? (idx - (count - 1) / 2) * 18 : 0;

                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const perpX = -dy / len;
                const perpY = dx / len;

                const nx = dx / len;
                const ny = dy / len;
                const x1 = src.x + nx * (NODE_W / 2) + perpX * offset;
                const y1 = src.y + ny * (NODE_H / 2) + perpY * offset;
                const x2 = tgt.x - nx * (NODE_W / 2 + 8) + perpX * offset;
                const y2 = tgt.y - ny * (NODE_H / 2 + 8) + perpY * offset;

                const mid = midpoint(x1, y1, x2, y2);
                const isSelected = selectedTrigger?.id === trigger.id;
                const color = trigger.active ? "#00FF66" : "#334155";

                return (
                  <g key={trigger.id} onClick={() => setSelectedTrigger(isSelected ? null : trigger)} style={{ cursor: "pointer" }}>
                    {/* Wider invisible hit area */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} />
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1.5}
                      strokeDasharray={trigger.active ? "none" : "5,4"}
                      markerEnd={trigger.active ? "url(#arrowhead)" : "url(#arrowhead-inactive)"}
                      opacity={trigger.active ? 0.8 : 0.4}
                    />
                    {/* Edge label */}
                    {(trigger.label || trigger.source_task) && (
                      <g>
                        <rect x={mid.x - 48} y={mid.y - 10 + offset * 0.5} width={96} height={20} rx={4}
                          fill="#0B0D12" stroke={color} strokeWidth={0.5} opacity={0.9} />
                        <text x={mid.x} y={mid.y + 4 + offset * 0.5} textAnchor="middle"
                          fill={color} fontSize={9} fontFamily="JetBrains Mono, monospace">
                          {(trigger.label || trigger.source_task).slice(0, 18)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            });
          })()}

          {/* Nodes */}
          {nodes.map((node) => {
            const statusColor = STATUS_COLORS[node.agent.status] || "#64748B";
            const isDragging = dragging === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x - NODE_W / 2}, ${node.y - NODE_H / 2})`}
                onMouseDown={(e) => onMouseDown(e, node.id)}
                style={{ cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
              >
                {/* Node card */}
                <rect
                  width={NODE_W} height={NODE_H} rx={10}
                  fill="#15171C"
                  stroke={isDragging ? "#00FF66" : "#20242C"}
                  strokeWidth={isDragging ? 1.5 : 1}
                  filter={isDragging ? "url(#node-glow)" : "none"}
                />
                {/* Status bar */}
                <rect x={0} y={0} width={3} height={NODE_H} rx={2} fill={statusColor} opacity={0.8} />

                {/* Avatar */}
                <clipPath id={`clip-${node.id}`}>
                  <circle cx={24} cy={NODE_H / 2} r={18} />
                </clipPath>
                <image
                  href={node.agent.avatar_url}
                  x={6} y={NODE_H / 2 - 18}
                  width={36} height={36}
                  clipPath={`url(#clip-${node.id})`}
                  preserveAspectRatio="xMidYMid slice"
                />

                {/* Name + role */}
                <text x={48} y={NODE_H / 2 - 6} fill="#F8FAFC" fontSize={11}
                  fontFamily="Chivo, sans-serif" fontWeight={600}>{node.agent.name.split(" ")[0]}</text>
                <text x={48} y={NODE_H / 2 + 8} fill="#64748B" fontSize={9}
                  fontFamily="JetBrains Mono, monospace">
                  {node.agent.role.split(" ").slice(0, 3).join(" ")}
                </text>

                {/* Status dot */}
                <circle cx={NODE_W - 12} cy={12} r={4} fill={statusColor}
                  style={{ filter: node.agent.status === "online" ? `drop-shadow(0 0 4px ${statusColor})` : "none" }} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected trigger detail */}
      <AnimatePresence>
        {selectedTrigger && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-xl"
            style={{ background: "#101319", border: "1px solid rgba(0,255,102,0.2)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00FF66]" />
                <p className="text-white font-semibold text-sm" style={{ fontFamily: "Chivo, sans-serif" }}>
                  Workflow Trigger
                </p>
              </div>
              <button onClick={() => setSelectedTrigger(null)} className="text-slate-600 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <p className="eyebrow mb-1">Source Agent</p>
                <p className="text-slate-200">{selectedTrigger.source_agent}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Target Agent</p>
                <p className="text-slate-200">{selectedTrigger.target_agent}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">When task completes</p>
                <p className="text-[#00FF66]">{selectedTrigger.source_task}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Triggers task</p>
                <p className="text-[#93C5FD]">{selectedTrigger.target_task}</p>
              </div>
              {selectedTrigger.trigger_condition && (
                <div className="col-span-2">
                  <p className="eyebrow mb-1">Condition</p>
                  <p className="text-slate-400 font-mono">{selectedTrigger.trigger_condition}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleToggle(selectedTrigger)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                style={{ border: "1px solid #20242C", background: "#1A1D24" }}>
                {selectedTrigger.active
                  ? <><ToggleRight className="w-4 h-4 text-[#00FF66]" /> Active</>
                  : <><ToggleLeft className="w-4 h-4 text-slate-500" /> Inactive</>
                }
              </button>
              <button onClick={() => { setEditingTrigger(selectedTrigger); setSelectedTrigger(null); setShowForm(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                style={{ border: "1px solid #20242C", background: "#1A1D24" }}>
                Edit
              </button>
              <button onClick={() => handleDelete(selectedTrigger.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 transition-colors ml-auto"
                style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger list */}
      {triggers.length > 0 && (
        <div className="panel p-4">
          <p className="eyebrow mb-3">All Workflow Triggers ({triggers.length})</p>
          <div className="space-y-2">
            {triggers.map(t => (
              <button key={t.id} onClick={() => setSelectedTrigger(selectedTrigger?.id === t.id ? null : t)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-[#1A1D24]"
                style={{ border: "1px solid #1E2128", background: selectedTrigger?.id === t.id ? "#1A1D24" : "transparent" }}>
                <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: t.active ? "#00FF66" : "#475569" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-300 font-medium">{t.source_agent}</span>
                  <span className="text-xs text-slate-600 mx-1.5">→</span>
                  <span className="text-xs text-slate-300 font-medium">{t.target_agent}</span>
                  <span className="text-xs text-slate-600 block truncate">{t.source_task} → {t.target_task}</span>
                </div>
                {!t.active && <span className="text-xs font-mono text-slate-600">inactive</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}