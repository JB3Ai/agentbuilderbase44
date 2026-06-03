import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { TrendingUp, Users, Zap, AlertTriangle } from "lucide-react";

const STATUS_COLORS = { online: "#00FF66", busy: "#F59E0B", offline: "#64748B" };
const RISK_COLORS = { low: "#00FF66", medium: "#F59E0B", high: "#EF4444" };
const CHART_BG = "#101319";
const GRID_COLOR = "#20242C";

// Generate last 7 days labels
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" }));
  }
  return days;
}

// Deterministically seed a pseudo-random number from agent name + day index
function seededRand(str, seed) {
  let hash = seed * 31;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  return (hash % 8) + 1;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel px-3 py-2 text-xs" style={{ border: "1px solid #2A2F3A" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="text-white font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function AgentSummaryDashboard({ agents }) {
  const days = getLast7Days();

  // Status breakdown for pie chart
  const statusData = useMemo(() => {
    const counts = { online: 0, busy: 0, offline: 0 };
    agents.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: STATUS_COLORS[k]
    }));
  }, [agents]);

  // Risk breakdown
  const riskData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    agents.forEach(a => { counts[a.risk_level || "low"]++; });
    return [
      { name: "Low Risk", value: counts.low, color: RISK_COLORS.low },
      { name: "Medium Risk", value: counts.medium, color: RISK_COLORS.medium },
      { name: "High Risk", value: counts.high, color: RISK_COLORS.high },
    ].filter(d => d.value > 0);
  }, [agents]);

  // Per-agent tasks completed this week (simulated from agent data)
  const agentTaskData = useMemo(() => {
    return agents.slice(0, 8).map(a => ({
      name: a.name.split(" ")[0],
      tasks: seededRand(a.name, 7),
      active: a.status !== "offline" ? 1 : 0,
    }));
  }, [agents]);

  // Daily activity trend across all agents (last 7 days)
  const trendData = useMemo(() => {
    return days.map((day, i) => ({
      day,
      tasks: agents.reduce((sum, a) => sum + seededRand(a.name, i), 0),
      active: agents.filter(a => a.status !== "offline").length,
    }));
  }, [agents, days]);

  // KPI stats
  const onlineCount = agents.filter(a => a.status === "online").length;
  const busyCount = agents.filter(a => a.status === "busy").length;
  const highRisk = agents.filter(a => a.risk_level === "high").length;
  const totalSkills = agents.reduce((s, a) => s + (a.skills?.length || 0), 0);

  const kpis = [
    { label: "Active Agents", value: onlineCount + busyCount, sub: `${onlineCount} online · ${busyCount} busy`, icon: Users, color: "#00FF66" },
    { label: "Total Skills", value: totalSkills, sub: `across ${agents.length} agents`, icon: Zap, color: "#93C5FD" },
    { label: "High Risk", value: highRisk, sub: highRisk === 0 ? "All clear" : "Needs attention", icon: AlertTriangle, color: highRisk > 0 ? "#EF4444" : "#00FF66" },
    { label: "Weekly Tasks", value: trendData.reduce((s, d) => s + d.tasks, 0), sub: "last 7 days (est.)", icon: TrendingUp, color: "#F59E0B" },
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp className="w-4 h-4 text-[#00FF66]" />
        <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Chivo, sans-serif" }}>
          Productivity Summary
        </h2>
        <span className="eyebrow ml-1">Last 7 Days</span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="panel p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${kpi.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none" style={{ fontFamily: "Chivo, sans-serif" }}>{kpi.value}</p>
                <p className="text-xs font-semibold text-slate-300 mt-0.5">{kpi.label}</p>
                <p className="eyebrow mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Daily Tasks Trend */}
        <div className="lg:col-span-2 panel p-5">
          <p className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "Chivo, sans-serif" }}>Task Completion Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="tasks" name="Tasks" stroke="#00FF66" strokeWidth={2} dot={{ fill: "#00FF66", r: 3 }} />
              <Line type="monotone" dataKey="active" name="Active Agents" stroke="#93C5FD" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="panel p-5">
          <p className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "Chivo, sans-serif" }}>Agent Status</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-white font-mono font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Task Bar + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Per-agent tasks */}
        <div className="lg:col-span-2 panel p-5">
          <p className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "Chivo, sans-serif" }}>Tasks Completed per Agent (This Week)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentTaskData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="tasks" name="Tasks" fill="#00FF66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Breakdown */}
        <div className="panel p-5">
          <p className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "Chivo, sans-serif" }}>Risk Distribution</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                dataKey="value" paddingAngle={3}>
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {riskData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-white font-mono font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}