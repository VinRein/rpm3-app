"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Target, Plus, ChevronRight, Zap, Archive, Trash2, Pencil, Check, X, GripVertical } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export function Dashboard() {
  const router = useRouter();
  const { results, focus3History, createResult, updateResult, archiveResult, deleteResult, reorderResults } = useRPMStore();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayFocus = focus3History.find((f) => f.date === today);
  const activeResults = results.filter((r) => !r.archived);

  const handleCreate = () => {
    if (!title.trim()) return;
    const r = createResult(title.trim(), description.trim());
    setTitle(""); setDescription(""); setCreating(false);
    router.push(`/result/${r.id}`);
  };

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id); setEditDraft(currentTitle);
  };
  const saveEdit = (id: string) => {
    if (editDraft.trim()) updateResult(id, { title: editDraft.trim() });
    setEditingId(null);
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return;
    const reordered = [...activeResults];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(toIndex, 0, moved);
    // Reorder full results array (preserving archived ones at the end)
    const archived = results.filter((r) => r.archived);
    reorderResults([...reordered, ...archived].map((r) => r.id));
    setDragIndex(null); setDragOverIndex(null);
  };

  const getAreaProgress = (resultId: string) => {
    const r = results.find((r) => r.id === resultId);
    if (!r) return { done: 0, total: 0 };
    const done = r.areas.filter((a) => a.status === "completed").length;
    return { done, total: r.areas.length };
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Your Outcomes</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {activeResults.length === 0
            ? "Define your first result. What specifically do you want?"
            : `${activeResults.length} active result${activeResults.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Today's Focus 3 callout */}
      {todayFocus && (todayFocus.A || todayFocus.B || todayFocus.C) && (
        <Link href="/">
          <div className="mb-6 p-4 rounded-xl border cursor-pointer group transition-all hover:border-[var(--accent)]/50"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: "var(--A)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Today&apos;s Focus 3
                </span>
              </div>
              <ChevronRight size={14} style={{ color: "var(--text-dim)" }} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="flex gap-3 flex-wrap">
              {(["A", "B", "C"] as const).map((p) => {
                const entry = todayFocus[p];
                if (!entry) return null;
                const r = results.find((r) => r.id === entry.resultId);
                const area = r?.areas.find((a) => a.id === entry.areaId);
                const action = area?.actions.find((a) => a.id === entry.actionId);
                if (!action) return null;
                return (
                  <div key={p} className="flex items-center gap-2">
                    <Badge label={p} variant={p} />
                    <span className="text-sm" style={{ color: "var(--text)" }}>{action.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Link>
      )}

      {/* Create Result */}
      {creating ? (
        <div className="mb-6 p-5 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Define Your Result</h3>
          <div className="space-y-3">
            <Input label="What specifically do you want?" placeholder="e.g. Launch Strength Focused Gym"
              value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCreate()} />
            <Textarea label="Why does this matter? (optional)" placeholder="Context and background..."
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={!title.trim()}>Create Result</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="mb-6 w-full p-4 rounded-xl border border-dashed text-sm flex items-center gap-2 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <Plus size={16} />
          Define a new Result
        </button>
      )}

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeResults.map((r, i) => {
          const { done, total } = getAreaProgress(r.id);
          const progress = total > 0 ? Math.round((done / total) * 100) : 0;
          const isDragging = dragIndex === i;
          const isOver = dragOverIndex === i && dragIndex !== i;

          return (
            <div
              key={r.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={clsx(
                "p-5 rounded-xl border transition-all group relative",
                isDragging && "opacity-30 scale-[0.98]",
                isOver && "border-[var(--accent)]/40 translate-y-[-2px]"
              )}
              style={{
                background: isOver ? "var(--accent-glow)" : "var(--surface)",
                borderColor: isOver ? undefined : "var(--border)",
                cursor: "grab",
              }}
            >
              {/* Color accent */}
              <div className="w-full h-0.5 rounded-full mb-4 opacity-70" style={{ background: r.color ?? "var(--accent)" }} />

              {/* Drag handle + Title row */}
              <div className="flex items-start gap-2 mb-2">
                <div className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                  style={{ color: "var(--text-dim)" }}>
                  <GripVertical size={14} />
                </div>

                {editingId === r.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(r.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 font-semibold text-sm bg-transparent border-b outline-none"
                      style={{ borderColor: "var(--accent)", color: "var(--text)" }} />
                    <button onClick={() => saveEdit(r.id)}><Check size={13} className="text-emerald-400" /></button>
                    <button onClick={() => setEditingId(null)}><X size={12} style={{ color: "var(--text-dim)" }} /></button>
                  </div>
                ) : (
                  <Link href={`/result/${r.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>{r.title}</h3>
                  </Link>
                )}

                {/* Action buttons */}
                {editingId !== r.id && (
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(r.id, r.title)} className="p-1 rounded hover:bg-[var(--surface-2)]" title="Edit">
                      <Pencil size={12} style={{ color: "var(--text-dim)" }} />
                    </button>
                    <button onClick={() => archiveResult(r.id)} className="p-1 rounded hover:bg-[var(--surface-2)]" title="Archive">
                      <Archive size={12} style={{ color: "var(--text-dim)" }} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(r.id)} className="p-1 rounded hover:bg-[var(--surface-2)]" title="Delete">
                      <Trash2 size={12} style={{ color: "var(--text-dim)" }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Delete confirmation */}
              {confirmDeleteId === r.id && (
                <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <p className="mb-2" style={{ color: "var(--text)" }}>Delete &quot;{r.title}&quot;? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => { deleteResult(r.id); setConfirmDeleteId(null); }}
                      className="px-2.5 py-1 rounded text-white text-xs font-medium" style={{ background: "#ef4444" }}>
                      Delete
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 rounded text-xs" style={{ color: "var(--text-muted)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Purposes */}
              {r.purposes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 ml-5">
                  {r.purposes.map((p) => (
                    <span key={p.id} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {p.emoji && `${p.emoji} `}{p.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {total > 0 && (
                <div className="mt-2 ml-5">
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-dim)" }}>
                    <span>{done}/{total} focus areas</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: r.color ?? "var(--accent)" }} />
                  </div>
                </div>
              )}

              {total === 0 && r.purposes.length === 0 && (
                <Link href={`/result/${r.id}`}>
                  <p className="text-xs ml-5" style={{ color: "var(--text-dim)" }}>Continue setup →</p>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {activeResults.length === 0 && !creating && (
        <div className="text-center py-16">
          <Target size={40} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>Start with a Result</h3>
          <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            A Result is a clearly defined outcome — not a task. What specifically do you want to achieve?
          </p>
        </div>
      )}
    </div>
  );
}
