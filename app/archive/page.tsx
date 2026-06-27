"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Archive, RotateCcw } from "lucide-react";

export default function ArchivePage() {
  const { results, updateResult } = useRPMStore();
  const archived = results.filter((r) => r.archived);

  return (
    <AppShell>
      <div className="p-8 max-w-3xl mx-auto">
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
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--text-muted)" }}>
                    {r.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                    {r.areas.filter((a) => a.status === "completed").length}/
                    {r.areas.length} focus areas
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateResult(r.id, { archived: false })}
                >
                  <RotateCcw size={13} />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
