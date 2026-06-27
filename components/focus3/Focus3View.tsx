"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PriorityLevel } from "@/lib/types";
import { Zap, CheckCircle2, Circle, Target, Lightbulb, ChevronDown } from "lucide-react";
import clsx from "clsx";

const PRIORITY_CONFIG = {
  A: {
    label: "A Priority",
    sublabel: "Most Important",
    color: "var(--A)",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
  },
  B: {
    label: "B Priority",
    sublabel: "Second Priority",
    color: "var(--B)",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.25)",
  },
  C: {
    label: "C Priority",
    sublabel: "Third Priority",
    color: "var(--C)",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
  },
};

export function Focus3View() {
  const { results, focus3History, getTodayFocus3, setFocusPriority, setFocusReflection, toggleActionComplete } =
    useRPMStore();
  const [pickerOpen, setPickerOpen] = useState<PriorityLevel | null>(null);
  const [reflection, setReflection] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const focus = getTodayFocus3();

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Collect all pending actions across all results/areas
  const allActions = results.flatMap((r) =>
    r.areas.flatMap((area) =>
      area.actions
        .filter((a) => !a.completed)
        .map((a) => ({
          ...a,
          areaTitle: area.title,
          resultTitle: r.title,
          resultColor: r.color,
          areaId: area.id,
          resultId: r.id,
        }))
    )
  );

  // Actions already assigned to a Focus slot today
  const assignedActionIds = new Set(
    (["A", "B", "C"] as PriorityLevel[]).map((p) => focus[p]?.actionId).filter(Boolean)
  );

  const getSlotAction = (p: PriorityLevel) => {
    const ref = focus[p];
    if (!ref) return null;
    const result = results.find((r) => r.id === ref.resultId);
    const area = result?.areas.find((a) => a.id === ref.areaId);
    const action = area?.actions.find((a) => a.id === ref.actionId);
    return action
      ? {
          ...action,
          areaTitle: area?.title,
          resultTitle: result?.title,
          resultColor: result?.color,
          areaId: ref.areaId,
          resultId: ref.resultId,
        }
      : null;
  };

  const handleComplete = (p: PriorityLevel) => {
    const ref = focus[p];
    if (!ref) return;
    toggleActionComplete(ref.resultId, ref.areaId, ref.actionId);
  };

  const handleSaveReflection = () => {
    setFocusReflection(today, reflection);
    setReflection("");
  };

  const allDone =
    (["A", "B", "C"] as PriorityLevel[]).every((p) => {
      const ref = focus[p];
      if (!ref) return true;
      const result = results.find((r) => r.id === ref.resultId);
      const area = result?.areas.find((a) => a.id === ref.areaId);
      const action = area?.actions.find((a) => a.id === ref.actionId);
      return action?.completed ?? false;
    }) && (focus.A || focus.B || focus.C);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={18} style={{ color: "var(--A)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Focus 3
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {todayStr} — three things, that&apos;s it.
        </p>
      </div>

      {/* All done banner */}
      {allDone && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Focus 3 complete!</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              You executed your most important work today. That&apos;s a win.
            </p>
          </div>
        </div>
      )}

      {/* Priority slots */}
      <div className="space-y-4 mb-8">
        {(["A", "B", "C"] as PriorityLevel[]).map((p) => {
          const config = PRIORITY_CONFIG[p];
          const slot = getSlotAction(p);
          const isOpen = pickerOpen === p;

          return (
            <div key={p}>
              <div
                className="p-5 rounded-xl border transition-all"
                style={{ background: config.bg, borderColor: config.border }}
              >
                <div className="flex items-start gap-4">
                  {/* Priority indicator */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: config.color, color: "#fff" }}
                  >
                    {p}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                        {config.sublabel}
                      </span>
                    </div>

                    {slot ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleComplete(p)} className="shrink-0">
                            {slot.completed ? (
                              <CheckCircle2 size={18} className="text-emerald-400" />
                            ) : (
                              <Circle size={18} style={{ color: config.color }} />
                            )}
                          </button>
                          <span
                            className={clsx(
                              "font-medium text-sm",
                              slot.completed && "line-through opacity-50"
                            )}
                            style={{ color: "var(--text)" }}
                          >
                            {slot.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 ml-7">
                          <Target size={11} style={{ color: slot.resultColor ?? "var(--accent)" }} />
                          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                            {slot.resultTitle} → {slot.areaTitle}
                          </span>
                          <button
                            onClick={() => setFocusPriority(today, p, null)}
                            className="text-xs ml-1 hover:text-red-400 transition-colors"
                            style={{ color: "var(--text-dim)" }}
                          >
                            change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPickerOpen(isOpen ? null : p)}
                        className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>Select {p} priority action</span>
                        <ChevronDown
                          size={14}
                          className={clsx("transition-transform", isOpen && "rotate-180")}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Action picker dropdown */}
                {isOpen && !slot && (
                  <div
                    className="mt-4 rounded-lg overflow-hidden border"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {allActions.length === 0 ? (
                      <p className="p-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        No pending actions found. Add actions to your Focus Areas first.
                      </p>
                    ) : (
                      <div className="max-h-52 overflow-y-auto">
                        {allActions
                          .filter((a) => !assignedActionIds.has(a.id))
                          .map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                setFocusPriority(today, p, {
                                  actionId: action.id,
                                  areaId: action.areaId,
                                  resultId: action.resultId,
                                });
                                setPickerOpen(null);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--surface-2)] transition-colors border-b last:border-b-0"
                              style={{ borderColor: "var(--border-subtle)" }}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: action.resultColor ?? "var(--accent)" }}
                              />
                              <div>
                                <p className="text-sm" style={{ color: "var(--text)" }}>
                                  {action.title}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                                  {action.resultTitle} → {action.areaTitle}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reflection */}
      <div
        className="p-5 rounded-xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} style={{ color: "var(--A)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Daily Reflection
          </span>
        </div>
        {focus.reflection ? (
          <div>
            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
              &ldquo;{focus.reflection}&rdquo;
            </p>
            <button
              className="text-xs mt-2 hover:text-[var(--accent)] transition-colors"
              style={{ color: "var(--text-dim)" }}
              onClick={() => setReflection(focus.reflection ?? "")}
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What's the key insight from today?"
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              style={{ color: "var(--text)" }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveReflection()}
            />
            <Button variant="ghost" size="sm" onClick={handleSaveReflection} disabled={!reflection.trim()}>
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Past Focus 3 */}
      {focus3History.filter((f) => f.date !== today).length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            Recent Days
          </h3>
          <div className="space-y-2">
            {focus3History
              .filter((f) => f.date !== today)
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}
                >
                  <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-dim)" }}>
                    {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <div className="flex gap-2">
                    {(["A", "B", "C"] as PriorityLevel[]).map((p) => {
                      const ref = entry[p];
                      if (!ref) return <Badge key={p} label={p} />;
                      const result = results.find((r) => r.id === ref.resultId);
                      const area = result?.areas.find((a) => a.id === ref.areaId);
                      const action = area?.actions.find((a) => a.id === ref.actionId);
                      return (
                        <div key={p} className="flex items-center gap-1.5">
                          <Badge label={p} variant={p} />
                          <span className="text-xs" style={{ color: action?.completed ? "var(--text-dim)" : "var(--text-muted)" }}>
                            {action ? (
                              <span style={{ textDecoration: action.completed ? "line-through" : "none" }}>
                                {action.title}
                              </span>
                            ) : (
                              "—"
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
