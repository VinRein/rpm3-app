"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Plus, X, Heart, BookMarked } from "lucide-react";
import clsx from "clsx";

const DEFAULT_PURPOSES = [
  { label: "Financial Freedom", emoji: "💰" },
  { label: "Family", emoji: "👨‍👩‍👧" },
  { label: "Health", emoji: "💪" },
  { label: "Impact", emoji: "🌍" },
  { label: "Legacy", emoji: "🏛️" },
  { label: "Community", emoji: "🤝" },
  { label: "Growth", emoji: "📈" },
  { label: "Adventure", emoji: "🚀" },
];

interface Props {
  resultId: string;
}

export function PurposePanel({ resultId }: Props) {
  const { results, addPurpose, removePurpose, purposeLibrary } = useRPMStore();
  const result = results.find((r) => r.id === resultId);
  const [custom, setCustom] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  if (!result) return null;

  const existingLabels = new Set(result.purposes.map((p) => p.label.toLowerCase()));

  // Merge default + saved library, deduplicating
  const quickPurposes = [
    ...DEFAULT_PURPOSES,
    ...purposeLibrary.filter(
      (p) => !DEFAULT_PURPOSES.some((d) => d.label.toLowerCase() === p.label.toLowerCase())
    ),
  ];

  const handleQuickAdd = (label: string, emoji?: string) => {
    if (existingLabels.has(label.toLowerCase())) return;
    addPurpose(resultId, label, emoji);
  };

  const handleCustomAdd = () => {
    if (!custom.trim()) return;
    // saveToLibrary=true so it appears in quick-add next time
    addPurpose(resultId, custom.trim(), customEmoji || undefined, true);
    setCustom("");
    setCustomEmoji("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          Why is this important?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Purpose creates emotional leverage. Every great outcome is fuelled by a powerful why.
        </p>
      </div>

      {/* Current purposes */}
      {result.purposes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.purposes.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm group"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              {p.emoji && <span>{p.emoji}</span>}
              <span>{p.label}</span>
              <button
                onClick={() => removePurpose(resultId, p.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              >
                <X size={12} style={{ color: "var(--text-dim)" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick add */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
            Quick add
          </p>
          {purposeLibrary.length > 0 && (
            <span
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}
            >
              <BookMarked size={10} />
              {purposeLibrary.length} saved
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPurposes.map((qp) => {
            const already = existingLabels.has(qp.label.toLowerCase());
            const isCustomSaved = !DEFAULT_PURPOSES.some(
              (d) => d.label.toLowerCase() === qp.label.toLowerCase()
            );
            return (
              <button
                key={qp.label}
                disabled={already}
                onClick={() => handleQuickAdd(qp.label, qp.emoji)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border",
                  already && "opacity-40 cursor-default",
                  !already && "hover:border-[var(--accent)]/50 hover:text-[var(--text)]"
                )}
                style={{
                  background: already ? "var(--surface-2)" : "transparent",
                  borderColor: isCustomSaved && !already
                    ? "rgba(99,102,241,0.35)"
                    : "var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {qp.emoji && <span>{qp.emoji}</span>}
                {qp.label}
                {isCustomSaved && (
                  <span style={{ color: "var(--text-dim)", fontSize: 9 }}>★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom purpose */}
      <div
        className="p-4 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          Add custom purpose
        </p>
        <div className="flex gap-2">
          <input
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="emoji"
            className="w-16 text-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
            style={{ color: "var(--text)" }}
          />
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Build wealth for my children"
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            style={{ color: "var(--text)" }}
            onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleCustomAdd}
            disabled={!custom.trim()}
          >
            <Plus size={14} />
            Add
          </Button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
          Custom purposes are saved to your library and will appear in quick-add next time.
        </p>
      </div>

      {result.purposes.length === 0 && (
        <div
          className="flex items-center gap-2 p-4 rounded-xl text-sm"
          style={{
            background: "var(--accent-glow)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "var(--text-muted)",
          }}
        >
          <Heart size={14} style={{ color: "var(--accent)" }} />
          A strong purpose dramatically increases the chance you&apos;ll follow through.
        </div>
      )}
    </div>
  );
}
