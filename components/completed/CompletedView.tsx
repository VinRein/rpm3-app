"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { CheckSquare, ChevronDown, ChevronRight, Calendar, StickyNote, Check, RotateCcw, Trash2 } from "lucide-react";

interface CompletedAction {
  id: string;
  title: string;
  description?: string;
  completedAt: string; // YYYY-MM-DD
  resultTitle: string;
  areaTitle: string;
  resultId: string;
  areaId: string;
}

export function CompletedView() {
  const { results, focus3History, setFocusReflection, toggleActionComplete, deleteAction } = useRPMStore();
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingReflection, setEditingReflection] = useState<string | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState("");

  // Collect all completed actions with date context
  const completedActions: CompletedAction[] = [];
  for (const result of results) {
    for (const area of result.areas) {
      for (const action of area.actions) {
        if (action.completed && action.completedAt) {
          completedActions.push({
            id: action.id,
            title: action.title,
            description: action.description,
            completedAt: action.completedAt,
            resultTitle: result.title,
            areaTitle: area.title,
            resultId: result.id,
            areaId: area.id,
          });
        }
      }
    }
  }

  // Group by date descending
  const byDate = completedActions.reduce<Record<string, CompletedAction[]>>((acc, a) => {
    if (!acc[a.completedAt]) acc[a.completedAt] = [];
    acc[a.completedAt].push(a);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  // Auto-expand today and yesterday
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const isExpanded = (date: string) => {
    if (expandedDates.has(date)) return true;
    if (!expandedDates.has(`closed:${date}`) && (date === today || date === yesterday)) return true;
    return false;
  };

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (isExpanded(date)) {
        next.add(`closed:${date}`);
        next.delete(date);
      } else {
        next.add(date);
        next.delete(`closed:${date}`);
      }
      return next;
    });
  };

  const formatDateLabel = (date: string) => {
    if (date === today) return "Today";
    if (date === yesterday) return "Yesterday";
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  const getFocusEntry = (date: string) => focus3History.find((f) => f.date === date);

  const startReflection = (date: string) => {
    const entry = getFocusEntry(date);
    setReflectionDraft(entry?.reflection ?? "");
    setEditingReflection(date);
  };

  const saveReflection = (date: string) => {
    setFocusReflection(date, reflectionDraft.trim());
    setEditingReflection(null);
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Completed Tasks</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {completedActions.length === 0
            ? "No tasks completed yet — start checking things off!"
            : `${completedActions.length} task${completedActions.length > 1 ? "s" : ""} completed across ${sortedDates.length} day${sortedDates.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {completedActions.length === 0 && (
        <div className="text-center py-16">
          <CheckSquare size={40} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Mark actions complete in Massive Actions or Focus 3 and they&apos;ll appear here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sortedDates.map((date) => {
          const actions = byDate[date];
          const focusEntry = getFocusEntry(date);
          const expanded = isExpanded(date);

          return (
            <div key={date} className="rounded-xl border overflow-hidden"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

              {/* Date header */}
              <button
                onClick={() => toggleDate(date)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={14} style={{ color: "var(--accent)" }} />
                  <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {formatDateLabel(date)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                    {actions.length} task{actions.length > 1 ? "s" : ""}
                  </span>
                  {date === today && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--accent)/30" }}>
                      Today
                    </span>
                  )}
                </div>
                {expanded
                  ? <ChevronDown size={14} style={{ color: "var(--text-dim)" }} />
                  : <ChevronRight size={14} style={{ color: "var(--text-dim)" }} />
                }
              </button>

              {expanded && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  {/* Task list */}
                  <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {actions.map((action) => (
                      <div key={action.id} className="px-4 py-3 flex items-start gap-3 group">
                        <div className="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center"
                          style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}>
                          <Check size={10} style={{ color: "var(--accent)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
                            {action.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                            {action.resultTitle} → {action.areaTitle}
                          </p>
                          {action.description && (
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                              {action.description}
                            </p>
                          )}
                        </div>
                        {/* Uncheck + Delete — visible on hover */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleActionComplete(action.resultId, action.areaId, action.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            title="Mark as not completed"
                            style={{ color: "var(--text-dim)" }}
                          >
                            <RotateCcw size={12} />
                          </button>
                          <button
                            onClick={() => deleteAction(action.resultId, action.areaId, action.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            title="Delete task"
                            style={{ color: "var(--text-dim)" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily reflection */}
                  <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote size={12} style={{ color: "var(--text-dim)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                        Daily Reflection
                      </span>
                    </div>

                    {editingReflection === date ? (
                      <div>
                        <textarea
                          autoFocus
                          value={reflectionDraft}
                          onChange={(e) => setReflectionDraft(e.target.value)}
                          placeholder="What did you learn today? What would you do differently? What are you proud of?"
                          rows={3}
                          className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--accent)",
                            color: "var(--text)",
                          }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveReflection(date)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: "var(--accent)", color: "#fff" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingReflection(null)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : focusEntry?.reflection ? (
                      <div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {focusEntry.reflection}
                        </p>
                        <button
                          onClick={() => startReflection(date)}
                          className="text-xs mt-2"
                          style={{ color: "var(--accent)" }}
                        >
                          Edit reflection
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startReflection(date)}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-lg border border-dashed transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]"
                        style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
                      >
                        Add a reflection for this day...
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
