"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ArchivePage() {
  const { results, updateResult, deleteResult } = useRPMStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const archived = results.filter((r) => r.archived);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppShell>
      <div className="px-4 py-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Archive size={18} style={{ color: "var(--text-muted)" }} />
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Archive
          </h1>
        </div>

        {archived.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No archived results.
          </p>
        ) : (
          <div className="space-y-3">
            {archived.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm" style={{ color: "var(--text-muted)" }}>
                      {r.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                        {r.areas.filter((a) => a.status === "completed").length}/
                        {r.areas.length} focus areas
                      </p>
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>·</span>
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                        Created {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateResult(r.id, { archived: false })}
                      title="Restore"
                    >
                      <RotateCcw size={13} />
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmDeleteId(r.id)}
                      title="Delete permanently"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Delete confirmation */}
                {confirmDeleteId === r.id && (
                  <div className="mt-3 p-2.5 rounded-lg text-xs"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <p className="mb-2" style={{ color: "var(--text)" }}>
                      Permanently delete &quot;{r.title}&quot;? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { deleteResult(r.id); setConfirmDeleteId(null); }}
                        className="px-2.5 py-1 rounded text-white text-xs font-medium"
                        style={{ background: "#ef4444" }}
                      >
                        Delete permanently
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
