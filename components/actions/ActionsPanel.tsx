"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { PriorityLevel } from "@/lib/types";
import {
  Plus, Trash2, CheckSquare, Square, Tag, ChevronDown, ChevronRight,
  Pencil, Check, X, GripVertical, AlignLeft,
} from "lucide-react";
import clsx from "clsx";

interface Props {
  resultId: string;
}

export function ActionsPanel({ resultId }: Props) {
  const { results, addAction, deleteAction, toggleActionComplete, updateAction, reorderActions, setFocusPriority, getTodayFocus3 } =
    useRPMStore();
  const result = results.find((r) => r.id === resultId);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState("");

  // Drag state per area (keyed by areaId)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingAreaId, setDraggingAreaId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayFocus = getTodayFocus3();

  if (!result) return null;

  const sorted = [...result.areas].sort((a, b) => a.order - b.order);
  const selectedArea = selectedAreaId ? sorted.find((a) => a.id === selectedAreaId) : sorted[0];

  const activeFocusSlots = (["A", "B", "C"] as PriorityLevel[]).flatMap((p) => {
    const ref = todayFocus[p];
    if (!ref || ref.resultId !== resultId) return [];
    const area = sorted.find((a) => a.id === ref.areaId);
    const action = area?.actions.find((ac) => ac.id === ref.actionId);
    if (!action) return [];
    return [{ priority: p, action, area }];
  });

  const toggleExpand = (id: string) => {
    // Individual toggle: track per-area overrides relative to the global state
    if (allExpanded) {
      // If globally expanded, toggling an area collapses it individually
      setCollapsedAreas((prev) => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
    } else {
      setExpandedAreas((prev) => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
    }
  };

  const expandAll = () => {
    setAllExpanded(true);
    setCollapsedAreas(new Set());
  };

  const collapseAll = () => {
    setAllExpanded(false);
    setExpandedAreas(new Set());
    setCollapsedAreas(new Set());
  };

  const isAreaExpanded = (id: string, isFirst: boolean) => {
    if (allExpanded) return !collapsedAreas.has(id);
    return expandedAreas.has(id) || isFirst;
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
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
    if (editDraft.trim()) updateAction(resultId, areaId, actionId, { title: editDraft.trim() });
    setEditingActionId(null);
  };

  const startEditDesc = (actionId: string, currentDesc: string) => {
    setEditingDescId(actionId);
    setDescDraft(currentDesc);
    setExpandedDescriptions((prev) => new Set(prev).add(actionId));
  };

  const saveDesc = (areaId: string, actionId: string) => {
    updateAction(resultId, areaId, actionId, { description: descDraft });
    setEditingDescId(null);
  };

  const assignFocus = (actionId: string, areaId: string, priority: PriorityLevel | null) => {
    // Always clear any slot this action currently holds
    (["A", "B", "C"] as PriorityLevel[]).forEach((p) => {
      if (todayFocus[p]?.actionId === actionId) setFocusPriority(today, p, null);
    });
    // Then set the new priority (if not just clearing)
    if (priority) {
      setFocusPriority(today, priority, { actionId, areaId, resultId });
    }
  };

  const getActionPriority = (actionId: string): PriorityLevel | null => {
    for (const p of ["A", "B", "C"] as PriorityLevel[]) {
      if (todayFocus[p]?.actionId === actionId) return p;
    }
    return null;
  };

  const handleDrop = (areaId: string, toIndex: number, sortedActions: typeof result.areas[0]["actions"]) => {
    if (dragIndex === null || dragIndex === toIndex || draggingAreaId !== areaId) return;
    const reordered = [...sortedActions];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reorderActions(resultId, areaId, reordered.map((a) => a.id));
    setDragIndex(null);
    setDragOverIndex(null);
    setDraggingAreaId(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="p-6 rounded-xl text-sm text-center"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
        Add Focus Areas first, then define the actions that will move each area forward.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Focus 3 banner */}
      {activeFocusSlots.length > 0 && (
        <div className="p-3 rounded-xl border space-y-2"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
            In today&apos;s Focus 3
          </p>
          {activeFocusSlots.map(({ priority, action, area }) => {
            const colors: Record<PriorityLevel, string> = { A: "var(--A)", B: "var(--B)", C: "var(--C)" };
            return (
              <div key={priority} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ background: colors[priority] }}>{priority}</span>
                <span className="text-sm flex-1 truncate"
                  style={{ color: action.completed ? "var(--text-dim)" : "var(--text)", textDecoration: action.completed ? "line-through" : "none" }}>
                  {action.title}
                </span>
                <span className="text-xs shrink-0" style={{ color: "var(--text-dim)" }}>{area?.title}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
            What actions could move this forward?
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Brain dump first — capture everything. Then categorize. Then select your Focus 3.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={expandAll}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: allExpanded ? "var(--accent)" : "var(--border)",
              color: allExpanded ? "var(--accent)" : "var(--text-dim)",
              background: allExpanded ? "var(--accent-glow)" : "transparent",
            }}
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-dim)",
              background: "transparent",
            }}
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Area selector */}
      <div className="flex gap-2 flex-wrap">
        {sorted.map((area) => (
          <button key={area.id} onClick={() => setSelectedAreaId(area.id)}
            className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              selectedArea?.id === area.id
                ? "text-white border-transparent"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]")}
            style={selectedArea?.id === area.id ? { background: result.color ?? "var(--accent)" } : {}}>
            {area.status === "completed" ? "✓ " : "▶ "}{area.title}
          </button>
        ))}
      </div>

      {/* Add action */}
      {selectedArea && (
        <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
            Add action to: {selectedArea.title}
          </p>
          <div className="flex gap-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category"
              className="w-28 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-2 text-xs outline-none focus:border-[var(--accent)] shrink-0"
              style={{ color: "var(--text)" }} />
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Review supplier contract"
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              style={{ color: "var(--text)" }} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Actions per area */}
      {sorted.map((area) => {
        const sortedActions = [...area.actions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const isExpanded = isAreaExpanded(area.id, area.id === sorted[0]?.id);
        const totalDone = area.actions.filter((a) => a.completed).length;

        return (
          <div key={area.id}>
            <button onClick={() => toggleExpand(area.id)}
              className="flex items-center gap-2 w-full text-left mb-2">
              {isExpanded
                ? <ChevronDown size={14} style={{ color: "var(--text-dim)" }} />
                : <ChevronRight size={14} style={{ color: "var(--text-dim)" }} />}
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{area.title}</span>
              {area.status === "completed" && <Badge label="Done" variant="success" />}
              {area.actions.length > 0 && (
                <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
                  {totalDone}/{area.actions.length}
                </span>
              )}
            </button>

            {isExpanded && sortedActions.length > 0 && (
              <div className="space-y-1.5 ml-5">
                {sortedActions.map((action, i) => {
                  const priority = getActionPriority(action.id);
                  const isEditing = editingActionId === action.id;
                  const descExpanded = expandedDescriptions.has(action.id);
                  const isEditingDesc = editingDescId === action.id;
                  const isDragging = draggingAreaId === area.id && dragIndex === i;
                  const isOver = draggingAreaId === area.id && dragOverIndex === i && dragIndex !== i;

                  return (
                    <div key={action.id}
                      draggable
                      onDragStart={() => { setDragIndex(i); setDraggingAreaId(area.id); }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                      onDrop={() => handleDrop(area.id, i, sortedActions)}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); setDraggingAreaId(null); }}
                      className={clsx("rounded-lg transition-all", isDragging && "opacity-30 scale-[0.98]", isOver && "translate-y-[-2px]")}
                      style={{
                        background: isOver ? "var(--accent-glow)" : "var(--surface-2)",
                        border: `1px solid ${isOver ? "rgba(99,102,241,0.4)" : "var(--border-subtle)"}`,
                      }}>

                      {/* Main row */}
                      <div className={clsx("flex items-center gap-2.5 p-2.5 group", action.completed ? "opacity-50" : "")}>
                        {/* Drag handle */}
                        <div className="cursor-grab shrink-0 opacity-25 hover:opacity-100 transition-opacity"
                          style={{ color: "var(--text-dim)" }}>
                          <GripVertical size={13} />
                        </div>

                        {/* Complete toggle */}
                        <button onClick={() => toggleActionComplete(resultId, area.id, action.id)}>
                          {action.completed
                            ? <CheckSquare size={15} className="text-emerald-400" />
                            : <Square size={15} style={{ color: "var(--text-dim)" }} />}
                        </button>

                        {/* Title */}
                        {isEditing ? (
                          <input autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(area.id, action.id); if (e.key === "Escape") setEditingActionId(null); }}
                            className="flex-1 bg-transparent border-b outline-none text-sm py-0.5"
                            style={{ borderColor: "var(--accent)", color: "var(--text)" }} />
                        ) : (
                          <span className="flex-1 text-sm"
                            style={{ color: "var(--text)", textDecoration: action.completed ? "line-through" : "none" }}>
                            {action.title}
                          </span>
                        )}

                        {/* Hover-only actions */}
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => saveEdit(area.id, action.id)}><Check size={13} className="text-emerald-400" /></button>
                            <button onClick={() => setEditingActionId(null)}><X size={13} style={{ color: "var(--text-dim)" }} /></button>
                          </div>
                        ) : (
                          <>
                            {/* A/B/C priority buttons — always visible */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              {(["A", "B", "C"] as PriorityLevel[]).map((p) => {
                                const isActive = priority === p;
                                const taken = todayFocus[p] && todayFocus[p]?.actionId !== action.id;
                                const colors: Record<PriorityLevel, string> = {
                                  A: "var(--A)", B: "var(--B)", C: "var(--C)",
                                };
                                return (
                                  <button
                                    key={p}
                                    disabled={!!taken}
                                    onClick={() => isActive ? assignFocus(action.id, area.id, null) : assignFocus(action.id, area.id, p)}
                                    className={clsx(
                                      "w-5 h-5 rounded text-xs font-bold transition-all",
                                      taken ? "opacity-15 cursor-not-allowed" : "hover:opacity-100",
                                      !isActive && !taken && "opacity-25"
                                    )}
                                    style={isActive
                                      ? { background: colors[p], color: "#fff" }
                                      : { background: "var(--surface-3)", color: colors[p] }
                                    }
                                    title={isActive ? `Remove ${p} priority` : `Set as ${p} priority`}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Always-visible secondary actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleDescription(action.id)}
                                title="Description"
                                className="opacity-30 hover:opacity-100 transition-opacity"
                              >
                                <AlignLeft size={13} style={{ color: descExpanded ? "var(--accent)" : "var(--text-dim)" }} />
                              </button>
                              <button
                                onClick={() => startEdit(action.id, action.title)}
                                title="Edit"
                                className="opacity-30 hover:opacity-100 transition-opacity"
                              >
                                <Pencil size={13} style={{ color: "var(--text-dim)" }} />
                              </button>
                              <button
                                onClick={() => deleteAction(resultId, area.id, action.id)}
                                title="Delete"
                                className="opacity-30 hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Description section */}
                      {descExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                          {isEditingDesc ? (
                            <div className="mt-2">
                              <textarea
                                autoFocus
                                value={descDraft}
                                onChange={(e) => setDescDraft(e.target.value)}
                                placeholder="Add context, notes, or details..."
                                rows={3}
                                className="w-full bg-transparent border rounded-lg px-2 py-1.5 text-xs outline-none resize-none"
                                style={{ borderColor: "var(--accent)", color: "var(--text)" }}
                              />
                              <div className="flex gap-2 mt-1.5">
                                <button onClick={() => saveDesc(area.id, action.id)}
                                  className="text-xs px-2 py-1 rounded" style={{ background: "var(--accent)", color: "#fff" }}>
                                  Save
                                </button>
                                <button onClick={() => setEditingDescId(null)}
                                  className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-dim)" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 flex items-start gap-2 group/desc">
                              {action.description ? (
                                <p className="text-xs flex-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                  {action.description}
                                </p>
                              ) : (
                                <p className="text-xs flex-1 italic" style={{ color: "var(--text-dim)" }}>
                                  No description yet
                                </p>
                              )}
                              <button onClick={() => startEditDesc(action.id, action.description ?? "")}
                                className="opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0">
                                <Pencil size={10} style={{ color: "var(--text-dim)" }} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Category labels on top of actions if categories exist */}
            {isExpanded && sortedActions.length === 0 && (
              <p className="ml-5 text-xs" style={{ color: "var(--text-dim)" }}>No actions yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
