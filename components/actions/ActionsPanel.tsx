"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { PriorityLevel } from "@/lib/types";
import { Plus, Trash2, CheckSquare, Square, Tag, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import clsx from "clsx";

interface Props {
  resultId: string;
}

export function ActionsPanel({ resultId }: Props) {
  const { results, addAction, deleteAction, toggleActionComplete, updateAction, setFocusPriority, getTodayFocus3 } =
    useRPMStore();
  const result = results.find((r) => r.id === resultId);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const todayFocus = getTodayFocus3();

  if (!result) return null;

  const sorted = [...result.areas].sort((a, b) => a.order - b.order);
  const selectedArea = selectedAreaId
    ? sorted.find((a) => a.id === selectedAreaId)
    : sorted[0];

  // Which actions from this result are currently in A/B/C focus today
  const activeFocusSlots = (["A", "B", "C"] as PriorityLevel[]).flatMap((p) => {
    const ref = todayFocus[p];
    if (!ref || ref.resultId !== resultId) return [];
    const area = sorted.find((a) => a.id === ref.areaId);
    const action = area?.actions.find((ac) => ac.id === ref.actionId);
    if (!action) return [];
    return [{ priority: p, action, area }];
  });

  const toggleExpand = (id: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !selectedArea) return;
    addAction(resultId, selectedArea.id, newTitle.trim(), newCategory.trim() || undefined);
    setNewTitle("");
    setNewCategory("");
  };

  const startEdit = (actionId: string, currentTitle: string) => {
    setEditingActionId(actionId);
    setEditDraft(currentTitle);
  };

  const saveEdit = (areaId: string, actionId: string) => {
    if (editDraft.trim()) {
      updateAction(resultId, areaId, actionId, { title: editDraft.trim() });
    }
    setEditingActionId(null);
    setEditDraft("");
  };

  const cancelEdit = () => {
    setEditingActionId(null);
    setEditDraft("");
  };

  const assignFocus = (actionId: string, areaId: string, priority: PriorityLevel | null) => {
    if (priority) {
      setFocusPriority(today, priority, { actionId, areaId, resultId });
    } else {
      (["A", "B", "C"] as PriorityLevel[]).forEach((p) => {
        if (todayFocus[p]?.actionId === actionId) setFocusPriority(today, p, null);
      });
    }
  };

  const getActionPriority = (actionId: string): PriorityLevel | null => {
    for (const p of ["A", "B", "C"] as PriorityLevel[]) {
      if (todayFocus[p]?.actionId === actionId) return p;
    }
    return null;
  };

  const groupByCategory = (actions: typeof result.areas[0]["actions"]) => {
    const groups: Record<string, typeof actions> = {};
    for (const a of actions) {
      const cat = a.category ?? "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    }
    return groups;
  };

  if (sorted.length === 0) {
    return (
      <div
        className="p-6 rounded-xl text-sm text-center"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
      >
        Add Focus Areas first, then define the actions that will move each area forward.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Focus 3 banner for this result */}
      {activeFocusSlots.length > 0 && (
        <div
          className="p-3 rounded-xl border space-y-2"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
            In today&apos;s Focus 3
          </p>
          {activeFocusSlots.map(({ priority, action, area }) => {
            const colors: Record<PriorityLevel, string> = {
              A: "var(--A)", B: "var(--B)", C: "var(--C)",
            };
            return (
              <div key={priority} className="flex items-center gap-2.5">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ background: colors[priority] }}
                >
                  {priority}
                </span>
                <span className="text-sm flex-1 truncate" style={{ color: action.completed ? "var(--text-dim)" : "var(--text)", textDecoration: action.completed ? "line-through" : "none" }}>
                  {action.title}
                </span>
                <span className="text-xs shrink-0" style={{ color: "var(--text-dim)" }}>
                  {area?.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          What actions could move this forward?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Brain dump first — capture everything. Then categorize. Then select your Focus 3.
        </p>
      </div>

      {/* Area selector */}
      <div className="flex gap-2 flex-wrap">
        {sorted.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedAreaId(area.id)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              selectedArea?.id === area.id
                ? "text-white border-transparent"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
            style={selectedArea?.id === area.id ? { background: result.color ?? "var(--accent)" } : {}}
          >
            {area.status === "completed" ? "✓ " : "▶ "}
            {area.title}
          </button>
        ))}
      </div>

      {/* Add action */}
      {selectedArea && (
        <div
          className="p-4 rounded-xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
            Add action to: {selectedArea.title}
          </p>
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category"
              className="w-28 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-2 text-xs outline-none focus:border-[var(--accent)] shrink-0"
              style={{ color: "var(--text)" }}
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Review supplier contract"
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              style={{ color: "var(--text)" }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Actions per area */}
      {sorted.map((area) => {
        const groups = groupByCategory(area.actions);
        const isExpanded = expandedAreas.has(area.id) || area.id === sorted[0]?.id;
        const totalDone = area.actions.filter((a) => a.completed).length;

        return (
          <div key={area.id}>
            <button
              onClick={() => toggleExpand(area.id)}
              className="flex items-center gap-2 w-full text-left mb-2"
            >
              {isExpanded ? (
                <ChevronDown size={14} style={{ color: "var(--text-dim)" }} />
              ) : (
                <ChevronRight size={14} style={{ color: "var(--text-dim)" }} />
              )}
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {area.title}
              </span>
              {area.status === "completed" && <Badge label="Done" variant="success" />}
              {area.actions.length > 0 && (
                <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
                  {totalDone}/{area.actions.length}
                </span>
              )}
            </button>

            {isExpanded && area.actions.length > 0 && (
              <div className="space-y-3 ml-5">
                {Object.entries(groups).map(([cat, actions]) => (
                  <div key={cat}>
                    {cat !== "Uncategorized" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Tag size={11} style={{ color: "var(--text-dim)" }} />
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                          {cat}
                        </span>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {actions.map((action) => {
                        const priority = getActionPriority(action.id);
                        const isEditing = editingActionId === action.id;

                        return (
                          <div
                            key={action.id}
                            className={clsx(
                              "flex items-center gap-2.5 p-2.5 rounded-lg group transition-all",
                              action.completed ? "opacity-50" : ""
                            )}
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}
                          >
                            <button onClick={() => toggleActionComplete(resultId, area.id, action.id)}>
                              {action.completed ? (
                                <CheckSquare size={15} className="text-emerald-400" />
                              ) : (
                                <Square size={15} style={{ color: "var(--text-dim)" }} />
                              )}
                            </button>

                            {isEditing ? (
                              <input
                                autoFocus
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(area.id, action.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="flex-1 bg-transparent border-b outline-none text-sm py-0.5"
                                style={{ borderColor: "var(--accent)", color: "var(--text)" }}
                              />
                            ) : (
                              <span
                                className="flex-1 text-sm"
                                style={{
                                  color: "var(--text)",
                                  textDecoration: action.completed ? "line-through" : "none",
                                }}
                              >
                                {action.title}
                              </span>
                            )}

                            {priority && !isEditing && <Badge label={priority} variant={priority} />}

                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => saveEdit(area.id, action.id)}>
                                  <Check size={13} className="text-emerald-400" />
                                </button>
                                <button onClick={cancelEdit}>
                                  <X size={13} style={{ color: "var(--text-dim)" }} />
                                </button>
                              </div>
                            ) : (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button onClick={() => startEdit(action.id, action.title)}>
                                  <Pencil size={11} style={{ color: "var(--text-dim)" }} />
                                </button>
                                {(["A", "B", "C"] as PriorityLevel[]).map((p) => {
                                  const taken = todayFocus[p] && todayFocus[p]?.actionId !== action.id;
                                  return (
                                    <button
                                      key={p}
                                      disabled={!!taken}
                                      onClick={() =>
                                        priority === p
                                          ? assignFocus(action.id, area.id, null)
                                          : assignFocus(action.id, area.id, p)
                                      }
                                      className={clsx(
                                        "w-5 h-5 rounded text-xs font-bold transition-all",
                                        priority === p && `priority-${p}`,
                                        taken && "opacity-20 cursor-not-allowed"
                                      )}
                                      style={priority !== p ? { background: "var(--surface-3)", color: "var(--text-dim)" } : {}}
                                      title={`Set as ${p} priority`}
                                    >
                                      {p}
                                    </button>
                                  );
                                })}
                                <button onClick={() => deleteAction(resultId, area.id, action.id)} className="ml-1">
                                  <Trash2 size={12} style={{ color: "var(--text-dim)" }} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && area.actions.length === 0 && (
              <p className="ml-5 text-xs" style={{ color: "var(--text-dim)" }}>
                No actions yet.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
