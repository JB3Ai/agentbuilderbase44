import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, X, Calendar, Clock, CheckCircle2, ChevronRight, Loader2, Sparkles, Trash2, CalendarPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, addDays, nextDay, parseISO, isToday, isPast } from "date-fns";

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_TOPICS = ["Usage & activity", "Jobs completed", "Improvements needed", "Skill gaps", "Risk assessment"];

const dayIndex = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function getNextOccurrence(dayName) {
  const today = new Date();
  const targetDay = dayIndex[dayName];
  const todayDay = today.getDay();
  let diff = targetDay - todayDay;
  if (diff <= 0) diff += 7;
  const next = addDays(today, diff);
  return format(next, "yyyy-MM-dd");
}

function statusBadge(status) {
  if (status === "completed") return <span className="risk-low">Completed</span>;
  if (status === "in_progress") return <span className="risk-medium">In Progress</span>;
  return <span style={{ color: "#93C5FD", background: "rgba(147,197,253,0.08)", border: "1px solid rgba(147,197,253,0.2)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>Upcoming</span>;
}

export default function WeeklyReviewPanel({ agents }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    title: "Weekly Agent Review",
    day_of_week: "Monday",
    time_of_day: "09:00",
    agents_to_review: [],
    topics: [...DEFAULT_TOPICS],
    status: "upcoming",
    notes: "",
  });

  const loadReviews = async () => {
    const data = await base44.entities.WeeklyReview.list("-review_date", 20);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    const review_date = getNextOccurrence(form.day_of_week);
    await base44.entities.WeeklyReview.create({ ...form, review_date });
    await loadReviews();
    setShowForm(false);
    setSaving(false);
    setForm({
      title: "Weekly Agent Review",
      day_of_week: "Monday",
      time_of_day: "09:00",
      agents_to_review: [],
      topics: [...DEFAULT_TOPICS],
      status: "upcoming",
      notes: "",
    });
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await base44.entities.WeeklyReview.delete(id);
    setReviews(r => r.filter(x => x.id !== id));
  };

  const handleMarkComplete = async (review, e) => {
    e.stopPropagation();
    await base44.entities.WeeklyReview.update(review.id, { status: "completed" });
    await loadReviews();
  };

  const handleAddToCalendar = async (review) => {
    setSyncing(review.id);
    try {
      const res = await base44.functions.invoke("createCalendarReview", { reviewId: review.id });
      if (res.data?.htmlLink) {
        window.open(res.data.htmlLink, "_blank");
      }
    } catch (e) {
      console.error("Calendar sync failed:", e);
    } finally {
      setSyncing(null);
    }
  };

  const handleGenerateBrief = async (review) => {
    setGenerating(review.id);
    const agentSummaries = (agents || [])
      .filter(a => !review.agents_to_review?.length || review.agents_to_review.includes(a.name))
      .map(a => `- ${a.name} (${a.role}): ${a.current_task || "no current task"}. Skills: ${(a.skills || []).join(", ")}. Memory: ${a.memory || "none"}.`)
      .join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the council facilitator for a weekly AI agent review session titled "${review.title}".
Date: ${review.review_date}
Topics: ${(review.topics || []).join(", ")}

Agent roster being reviewed:
${agentSummaries}

Generate a structured council discussion covering:
1. Usage & activity highlights per agent
2. Jobs/tasks completed this week  
3. Suggested improvements for each agent
4. Skill gaps identified
5. Risk flags
6. Recommended actions for next week

Be concise, direct, and actionable. Format as a compact briefing document.`,
    });

    await base44.entities.WeeklyReview.update(review.id, {
      council_verdict: result,
      status: "in_progress"
    });
    await loadReviews();
    setExpandedId(review.id);
    setGenerating(null);
  };

  const upcoming = reviews.filter(r => r.status !== "completed");
  const completed = reviews.filter(r => r.status === "completed");

  return (
    <div className="panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#00FF66]" />
          <h3 className="text-white font-semibold" style={{ fontFamily: "Chivo, sans-serif" }}>Weekly Agent Reviews</h3>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00FF66] transition-colors"
          style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Set Reminder
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 p-4 rounded-xl space-y-4 overflow-hidden"
            style={{ background: "#101319", border: "1px solid #20242C" }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="eyebrow block mb-1">Review Title</label>
                <input className="input-dark" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="eyebrow block mb-1">Day of Week</label>
                <select className="input-dark" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
                  {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1">Time</label>
                <input type="time" className="input-dark" value={form.time_of_day} onChange={e => setForm(f => ({ ...f, time_of_day: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="eyebrow block mb-1">Agents to Review</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(agents || []).map(a => (
                    <button key={a.id} onClick={() => {
                      const sel = form.agents_to_review;
                      setForm(f => ({
                        ...f,
                        agents_to_review: sel.includes(a.name) ? sel.filter(x => x !== a.name) : [...sel, a.name]
                      }));
                    }}
                      className="px-2.5 py-1 rounded-full text-xs font-mono transition-colors"
                      style={{
                        background: form.agents_to_review.includes(a.name) ? "rgba(0,255,102,0.12)" : "#1A1D24",
                        border: form.agents_to_review.includes(a.name) ? "1px solid rgba(0,255,102,0.4)" : "1px solid #2A2F3A",
                        color: form.agents_to_review.includes(a.name) ? "#00FF66" : "#94A3B8"
                      }}>
                      {a.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600">{form.agents_to_review.length === 0 ? "None selected = all agents reviewed" : `${form.agents_to_review.length} selected`}</p>
              </div>
              <div className="col-span-2">
                <label className="eyebrow block mb-1">Topics</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TOPICS.map(t => (
                    <button key={t} onClick={() => {
                      const sel = form.topics;
                      setForm(f => ({
                        ...f,
                        topics: sel.includes(t) ? sel.filter(x => x !== t) : [...sel, t]
                      }));
                    }}
                      className="px-2.5 py-1 rounded-full text-xs font-mono transition-colors"
                      style={{
                        background: form.topics.includes(t) ? "rgba(147,197,253,0.1)" : "#1A1D24",
                        border: form.topics.includes(t) ? "1px solid rgba(147,197,253,0.35)" : "1px solid #2A2F3A",
                        color: form.topics.includes(t) ? "#93C5FD" : "#94A3B8"
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                style={{ border: "1px solid #20242C" }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving || !form.title}
                className="cta-primary flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {saving ? "Scheduling…" : "Schedule Review"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-slate-800 animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No reviews scheduled yet.</p>
          <p className="text-xs text-slate-700 mt-1">Set a weekly reminder to keep your agents performing at their best.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...upcoming, ...completed].map(review => (
            <div key={review.id}>
              <button
                onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-[#1A1D24]"
                style={{ border: "1px solid #1E2128" }}
              >
                <Calendar className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{review.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-slate-500">
                      {review.day_of_week} · {review.time_of_day || "09:00"} · {review.review_date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusBadge(review.status)}
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${expandedId === review.id ? "rotate-90" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedId === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-b-lg space-y-3" style={{ background: "#101319", border: "1px solid #1E2128", borderTop: "none" }}>
                      {/* Topics */}
                      {review.topics?.length > 0 && (
                        <div>
                          <p className="eyebrow mb-1.5">Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {review.topics.map((t, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs font-mono text-slate-400 rounded"
                                style={{ background: "#1A1D24", border: "1px solid #2A2F3A" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Agents */}
                      {review.agents_to_review?.length > 0 && (
                        <div>
                          <p className="eyebrow mb-1.5">Agents</p>
                          <p className="text-xs text-slate-400">{review.agents_to_review.join(", ")}</p>
                        </div>
                      )}

                      {/* Council brief */}
                      {review.council_verdict && (
                        <div className="p-3 rounded-lg" style={{ background: "#0D0F14", border: "1px solid #20242C" }}>
                          <p className="eyebrow mb-2 text-[#00FF66]">Council Brief</p>
                          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{review.council_verdict}</p>
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="eyebrow block mb-1">Notes</label>
                        <textarea
                          className="input-dark resize-none text-xs"
                          rows={3}
                          defaultValue={review.notes || ""}
                          placeholder="Add notes from this review session…"
                          onBlur={async (e) => {
                            if (e.target.value !== review.notes) {
                              await base44.entities.WeeklyReview.update(review.id, { notes: e.target.value });
                            }
                          }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleAddToCalendar(review)}
                          disabled={syncing === review.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-400 transition-colors disabled:opacity-50"
                          style={{ border: "1px solid rgba(147,197,253,0.3)", background: "rgba(147,197,253,0.05)" }}
                        >
                          {syncing === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
                          {syncing === review.id ? "Adding…" : "Add to Calendar"}
                        </button>
                        <button
                          onClick={() => handleGenerateBrief(review)}
                          disabled={generating === review.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#00FF66] transition-colors disabled:opacity-50"
                          style={{ border: "1px solid rgba(0,255,102,0.3)", background: "rgba(0,255,102,0.05)" }}
                        >
                          {generating === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {generating === review.id ? "Generating…" : "Generate Council Brief"}
                        </button>
                        {review.status !== "completed" && (
                          <button onClick={(e) => handleMarkComplete(review, e)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
                            style={{ border: "1px solid #20242C" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Complete
                          </button>
                        )}
                        <button onClick={(e) => handleDelete(review.id, e)}
                          className="ml-auto flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-slate-700 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}