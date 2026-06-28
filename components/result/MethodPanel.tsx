"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import type { MethodPath } from "@/lib/types";
import {
  Plus, Check, Trash2, Zap, ArrowRight,
  Shield, TrendingUp, Settings, GripVertical, Pencil, X,
} from "lucide-react";
import clsx from "clsx";

const PATH_OPTIONS: {
  value: MethodPath;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "fastest",          label: "Fastest Path",      icon: <Zap size={14} /> },
  { value: "easiest",          label: "Easiest Path",      icon: <ArrowRight size={14} /> },
  { value: "highest_leverage", label: "Highest Leverage",  icon: <TrendingUp size={14} /> },
  { value: "lowest_risk",      label: "Lowest Risk",       icon: <Shield size={14} /> },
  { value: "custom",           label: "Custom Strategy",   icon: <Settings size={14} /> },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  path: "highest_leverage" as MethodPath,
  constraints: "",
  risks: "",
  successCriteria: "",
};

interface Props {
  resultId: string;
}

export function MethodPanel({ resultId }: Props) {
  const { results, addMethod, updateMethod, selectMethod, deleteMethod, reorderMethods } = useRPMStore();
  const result = results.find((r) => r.id === resultId);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!result) return null;

  const sorted = [...result.methods].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    addMethod(resultId, {
      title: form.title.trim(),
      description: form.description.trim(),
      path: form.path,
      constraints: form.constraints.trim(),
      risks: form.risks.trim(),
      successCriteria: form.successCriteria.trim(),
    });
    setForm(EMPTY_FORM);
    setAdding(false);
  };

  const startEdit = (methodId: string) => {
    const m = result.methods.find((m) => m.id === methodId);
    if (!m) return;
    setEditForm({
      title: m.title,
      description: m.description ?? "",
      path: m.path,
      constraints: m.constraints ?? "",
      risks: m.risks ?? "",
      successCriteria: m.successCriteria ?? "",
    });
    setEditingId(methodId);
  };

  const saveEdit = () => {
    if (!editingId || !editForm.title.trim()) return;
    updateMethod(resultId, editingId, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      path: editForm.path,
      constraints: editForm.constraints.trim(),
      risks: editForm.risks.trim(),
      successCriteria: editForm.successCriteria.trim(),
    });
    setEditingId(null);
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reorderMethods(resultId, reordered.map((m) => m.id));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          What is the smartest path?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Most people skip strategy and jump straight to action. Define your approach before executing. Then select the one you&apos;re committing to.
        </p>
      </div>

      {/* Existing methods */}
      <div className="space-y-2">
        {sorted.map((method, i) => {
          const pathInfo = PATH_OPTIONS.find((p) => p.value === method.path);
          const isDragging = dragIndex === i;
          const isOver = dragOverIndex === i && dragIndex !== i;
          const isEditing = editingId === method.id;

          return (
            <div
              key={method.id}
              draggable={!isEditing}
              onDragStart={() => !isEditing && setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={clsx(
                "flex items-start gap-3 p-4 rounded-xl border transition-all duration-150",
                method.selected ? "border-[var(--accent)]" : "border-[var(--border)]",
                isDragging && "opacity-40 scale-[0.98]",
                isOver && "border-[var(--accent)]/60 bg-[var(--accent-glow)]"
              )}
              style={{
                background: method.selected ? "var(--accent-glow)" : "var(--surface)",
                cursor: isEditing ? "default" : "grab",
              }}
            >
              {/* Drag handle */}
              {!isEditing && (
                <div className="mt-1 shrink-0 cursor-grab" style={{ color: "var(--text-dim)" }}>
                  <GripVertical size={14} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  /* ── Edit form ── */
                  <div className="space-y-3">
                    {/* Path selector */}
                    <div>
                      <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                        Strategy type
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {PATH_OPTIONS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setEditForm((f) => ({ ...f, path: p.value }))}
                            className={clsx(
                              "flex flex-col items-start p-2.5 rounded-lg border text-left transition-all",
                              editForm.path === p.value
                                ? "border-[var(--accent)] bg-[var(--accent-glow)]"
                                : "border-[var(--border)] hover:border-[var(--accent)]/40"
                            )}
                          >
                            <span style={{ color: editForm.path === p.value ? "var(--accent)" : "var(--text-muted)" }}>
                              {p.icon}
                            </span>
                            <span className="text-xs font-medium mt-1" style={{ color: "var(--text)" }}>
                              {p.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      label="Method title"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      autoFocus
                    />
                    <Textarea
                      label="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Constraints"
                        value={editForm.constraints}
                        onChange={(e) => setEditForm((f) => ({ ...f, constraints: e.target.value }))}
                      />
                      <Input
                        label="Risks"
                        value={editForm.risks}
                        onChange={(e) => setEditForm((f) => ({ ...f, risks: e.target.value }))}
                      />
                      <Input
                        label="Success criteria"
                        value={editForm.successCriteria}
                        onChange={(e) => setEditForm((f) => ({ ...f, successCriteria: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={saveEdit} disabled={!editForm.title.trim()}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Display ── */
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                      >
                        {pathInfo?.icon}
                        {pathInfo?.label}
                      </span>
                      {method.selected && (
                        <span className="text-xs font-medium" style={{ color: "var(--C)" }}>
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-sm" style={{ color: "var(--text)" }}>
                      {method.title}
                    </h4>
                    {method.description && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {method.description}
                      </p>
                    )}
                    {(method.constraints || method.risks || method.successCriteria) && (
                      <div className="mt-2 space-y-0.5">
                        {method.constraints && (
                          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                            <span className="font-medium">Constraints:</span> {method.constraints}
                          </p>
                        )}
                        {method.risks && (
                          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                            <span className="font-medium">Risks:</span> {method.risks}
                          </p>
                        )}
                        {method.successCriteria && (
                          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                            <span className="font-medium">Success:</span> {method.successCriteria}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(method.id)}
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={method.selected ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => selectMethod(resultId, method.id)}
                    title={method.selected ? "Deselect" : "Select as active method"}
                  >
                    <Check size={12} />
                    {method.selected ? "Deselect" : "Select"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMethod(resultId, method.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}

              {isEditing && (
                <button onClick={() => setEditingId(null)} className="shrink-0 ml-2 mt-0.5" style={{ color: "var(--text-dim)" }}>
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {dragIndex !== null && (
        <div
          className="h-1 rounded-full transition-all"
          style={{ background: "var(--accent)", opacity: 0.3 }}
        />
      )}

      {/* Add Method form */}
      {adding ? (
        <div
          className="p-5 rounded-xl border"
          style={{ background: "var(--surface)", borderColor: "var(--accent)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            Define a Method
          </h3>

          <div className="mb-4">
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
              Strategy type
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PATH_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setForm((f) => ({ ...f, path: p.value }))}
                  className={clsx(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                    form.path === p.value
                      ? "border-[var(--accent)] bg-[var(--accent-glow)]"
                      : "border-[var(--border)] hover:border-[var(--accent)]/40"
                  )}
                >
                  <span style={{ color: form.path === p.value ? "var(--accent)" : "var(--text-muted)" }}>
                    {p.icon}
                  </span>
                  <span className="text-xs font-medium mt-1" style={{ color: "var(--text)" }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Method title"
              placeholder="e.g. Partner with established manufacturer"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <Textarea
              label="Description"
              placeholder="How does this approach work?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Constraints"
                placeholder="Budget, time…"
                value={form.constraints}
                onChange={(e) => setForm((f) => ({ ...f, constraints: e.target.value }))}
              />
              <Input
                label="Risks"
                placeholder="What could go wrong?"
                value={form.risks}
                onChange={(e) => setForm((f) => ({ ...f, risks: e.target.value }))}
              />
              <Input
                label="Success criteria"
                placeholder="How do you know it worked?"
                value={form.successCriteria}
                onChange={(e) => setForm((f) => ({ ...f, successCriteria: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!form.title.trim()}>
              Add Method
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} />
          Add Method
        </Button>
      )}

      {result.methods.length === 0 && !adding && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          💡 Before choosing actions, choose your path. The method determines whether you&apos;re rowing with or against the current.
        </div>
      )}
    </div>
  );
}
