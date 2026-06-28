"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Plus, CheckCircle2, Circle, Trash2, GripVertical, LayoutGrid, Pencil, Check, X,
} from "lucide-react";
import clsx from "clsx";

interface Props {
  resultId: string;
}

export function AreasPanel({ resultId }: Props) {
  const { results, addArea, updateArea, deleteArea, completeArea, reorderAreas } = useRPMStore();
  const result = results.find((r) => r.id === resultId);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!result) return null;

  const sorted = [...result.areas].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    if (!title.trim()) return;
    addArea(resultId, title.trim(), description.trim() || undefined);
    setTitle("");
    setDescription("");
    setAdding(false);
  };

  const startEdit = (areaId: string) => {
    const area = result.areas.find((a) => a.id === areaId);
    if (!area) return;
    setEditTitle(area.title);
    setEditDesc(area.description ?? "");
    setEditingId(areaId);
  };

  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    updateArea(resultId, editingId, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
    });
    setEditingId(null);
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reorderAreas(resultId, reordered.map((a) => a.id));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          What are the key Focus Areas?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Break your Result into the major areas of work — think of the most important ones as <strong style={{ color: "var(--text)", fontWeight: 500 }}>Pillars</strong>. Each area is independent: they can run in parallel, in any order, at any pace.
        </p>
      </div>

      {/* Example hint */}
      {sorted.length === 0 && !adding && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <p className="font-medium mb-1" style={{ color: "var(--text)" }}>
            <LayoutGrid size={13} className="inline mr-1.5 mb-0.5" />
            Example: Launching a gym
          </p>
          <p className="text-xs leading-relaxed">
            Location · Financing · Equipment · Partnerships · Marketing · Legal & Permits
          </p>
          <p className="text-xs mt-2 opacity-70">
            These run simultaneously — securing equipment doesn&apos;t depend on finding a location first.
          </p>
        </div>
      )}

      {/* Areas list */}
      <div className="space-y-2">
        {sorted.map((area, i) => {
          const isDragging = dragIndex === i;
          const isOver = dragOverIndex === i && dragIndex !== i;
          const isEditing = editingId === area.id;
          const completedActions = area.actions.filter((a) => a.completed).length;
          const totalActions = area.actions.length;
          const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

          return (
            <div
              key={area.id}
              draggable={!isEditing}
              onDragStart={() => !isEditing && setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={clsx(
                "flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 group",
                area.status === "completed" && !isEditing ? "opacity-55" : "",
                isDragging && "opacity-30 scale-[0.98]",
                isOver && "border-[var(--accent)]/50 translate-y-[-2px]"
              )}
              style={{
                background: isOver ? "var(--accent-glow)" : "var(--surface)",
                borderColor: isOver ? undefined : area.status === "completed" ? "var(--border-subtle)" : "var(--border)",
                cursor: isEditing ? "default" : "grab",
              }}
            >
              {/* Drag handle */}
              {!isEditing && (
                <div
                  className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                  style={{ color: "var(--text-dim)" }}
                >
                  <GripVertical size={14} />
                </div>
              )}

              {/* Status icon */}
              {!isEditing && (
                <button
                  onClick={() => completeArea(resultId, area.id)}
                  className="mt-0.5 shrink-0"
                  title={area.status === "completed" ? "Mark active" : "Mark completed"}
                >
                  {area.status === "completed" ? (
                    <CheckCircle2 size={17} className="text-emerald-400" />
                  ) : (
                    <Circle size={17} style={{ color: result.color ?? "var(--accent)" }} />
                  )}
                </button>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                      className="w-full font-medium text-sm bg-transparent border-b outline-none pb-0.5"
                      style={{ borderColor: "var(--accent)", color: "var(--text)" }}
                      placeholder="Focus area name"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-transparent border rounded-lg px-2 py-1.5 outline-none resize-none"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                        background: "var(--surface-2)",
                      }}
                      placeholder="Description (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="font-medium text-sm"
                        style={{
                          color: area.status === "completed" ? "var(--text-dim)" : "var(--text)",
                          textDecoration: area.status === "completed" ? "line-through" : "none",
                        }}
                      >
                        {area.title}
                      </span>
                      {area.status === "completed" && (
                        <Badge label="Done" variant="success" />
                      )}
                    </div>

                    {area.description && (
                      <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                        {area.description}
                      </p>
                    )}

                    {/* Progress */}
                    {totalActions > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-dim)" }}>
                          <span>{completedActions}/{totalActions} actions</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, background: result.color ?? "var(--accent)" }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Edit + Delete — visible on hover, hidden when editing */}
              {!isEditing && (
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                  <button onClick={() => startEdit(area.id)} title="Edit">
                    <Pencil size={13} style={{ color: "var(--text-dim)" }} />
                  </button>
                  <button onClick={() => deleteArea(resultId, area.id)} title="Delete" className="ml-1">
                    <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                  </button>
                </div>
              )}

              {/* X button when editing */}
              {isEditing && (
                <button onClick={() => setEditingId(null)} className="shrink-0 mt-0.5" style={{ color: "var(--text-dim)" }}>
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Area */}
      {adding ? (
        <div
          className="p-4 rounded-xl border"
          style={{ background: "var(--surface)", borderColor: "var(--accent)" }}
        >
          <div className="space-y-3">
            <Input
              label="Focus Area name"
              placeholder="e.g. Location · Financing · Equipment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              label="Description (optional)"
              placeholder="What does this area cover?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!title.trim()}>
              Add Focus Area
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setTitle(""); setDescription(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} />
          Add Focus Area
        </Button>
      )}
    </div>
  );
}
