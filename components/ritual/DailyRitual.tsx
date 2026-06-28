"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRPMStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { PriorityLevel, Purpose } from "@/lib/types";
import {
  LayoutGrid,
  Check,
  Search,
  Target,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
  AlignLeft,
} from "lucide-react";
import clsx from "clsx";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActionOption {
  actionId: string;
  areaId: string;
  resultId: string;
  actionTitle: string;
  areaTitle: string;
  resultTitle: string;
  resultColor: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { color: string; bg: string; border: string; sublabel: string; question: string }
> = {
  A: {
    color: "var(--A)",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.28)",
    sublabel: "Must do today — if nothing else",
    question: "What single action, if done today, would create the most momentum toward one of your results?",
  },
  B: {
    color: "var(--B)",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.28)",
    sublabel: "Do this if A is done",
    question: "What's the highest-leverage action you'd focus on next — for any of your results?",
  },
  C: {
    color: "var(--C)",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.28)",
    sublabel: "Do this if B is done",
    question: "What else would meaningfully move any of your results forward today?",
  },
};

// ─── ActionPicker ────────────────────────────────────────────────────────────

function ActionPicker({
  options,
  assigned,
  onSelect,
  onClose,
  accentColor,
  question,
}: {
  options: ActionOption[];
  assigned: Set<string>;
  onSelect: (opt: ActionOption) => void;
  onClose: () => void;
  accentColor: string;
  question: string;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = options.filter(
    (o) =>
      !assigned.has(o.actionId) &&
      (query === "" ||
        o.actionTitle.toLowerCase().includes(query.toLowerCase()) ||
        o.resultTitle.toLowerCase().includes(query.toLowerCase()))
  );

  // Group by result
  const grouped: Record<string, ActionOption[]> = {};
  for (const o of filtered) {
    if (!grouped[o.resultTitle]) grouped[o.resultTitle] = [];
    grouped[o.resultTitle].push(o);
  }

  return (
    <div
      ref={containerRef}
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: `1px solid ${accentColor}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Search size={13} style={{ color: "var(--text-dim)" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actions…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text)" }}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
        <button onClick={onClose}>
          <X size={13} style={{ color: "var(--text-dim)" }} />
        </button>
      </div>

      {/* Leverage guidance */}
      <div
        className="px-3 py-2 border-b flex items-start gap-2"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <span style={{ color: accentColor, fontSize: 13, lineHeight: 1.4 }}>⚡</span>
        <p className="text-xs leading-relaxed italic" style={{ color: "var(--text-muted)" }}>
          {question}
        </p>
      </div>

      {/* Options */}
      <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
        {Object.keys(grouped).length === 0 ? (
          <p className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
            {options.length === 0
              ? "No actions yet — add some in the Plan workspace."
              : "No matches."}
          </p>
        ) : (
          Object.entries(grouped).map(([resultTitle, actions]) => (
            <div key={resultTitle}>
              <div
                className="flex items-center gap-2 px-3 py-1.5 sticky top-0"
                style={{ background: "var(--surface-2)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: actions[0].resultColor }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {resultTitle}
                </span>
              </div>
              {actions.map((opt) => (
                <button
                  key={opt.actionId}
                  onClick={() => onSelect(opt)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors border-b last:border-b-0"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-sm" style={{ color: "var(--text)" }}>
                    {opt.actionTitle}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                    {opt.areaTitle}
                  </p>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── PriorityCard ────────────────────────────────────────────────────────────

function PriorityCard({
  priority,
  action,
  resultTitle,
  resultColor,
  resultId,
  areaTitle,
  areaId,
  isCompleted,
  allOptions,
  assignedIds,
  onComplete,
  onAssign,
  onClear,
}: {
  priority: PriorityLevel;
  action: { id: string; title: string; description?: string } | null;
  resultTitle?: string;
  resultColor?: string;
  resultId?: string;
  areaTitle?: string;
  areaId?: string;
  isCompleted: boolean;
  allOptions: ActionOption[];
  assignedIds: Set<string>;
  onComplete: () => void;
  onAssign: (opt: ActionOption) => void;
  onClear: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[priority];

  // Completed state — show celebration + option to pick next
  if (action && isCompleted) {
    return (
      <div>
        <div
          className="p-4 rounded-xl border"
          style={{
            background: "rgba(16,185,129,0.06)",
            borderColor: "rgba(16,185,129,0.2)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <Check size={16} style={{ color: "var(--C)" }} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--C)" }}>
                Well done — {priority} complete!
              </p>
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "var(--text-dim)", textDecoration: "line-through" }}
              >
                {action.title}
              </p>
            </div>
            <button
              onClick={onComplete}
              className="text-xs shrink-0"
              style={{ color: "var(--text-dim)" }}
              title="Undo"
            >
              undo
            </button>
          </div>
          <button
            onClick={() => { onClear(); setPickerOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all border"
            style={{
              borderColor: "rgba(16,185,129,0.3)",
              color: "var(--C)",
              background: "rgba(16,185,129,0.08)",
            }}
          >
            <ChevronRight size={13} />
            Choose next {priority} focus
          </button>
        </div>
        {pickerOpen && (
          <ActionPicker
            options={allOptions}
            assigned={assignedIds}
            accentColor={cfg.color}
            question={cfg.question}
            onSelect={(opt) => {
              onAssign(opt);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    );
  }

  if (action) {
    // Filled, not completed
    return (
      <div
        className="p-4 rounded-xl border transition-all duration-200"
        style={{ background: cfg.bg, borderColor: cfg.border }}
      >
        <div className="flex items-start gap-4">
          {/* Priority badge */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5"
            style={{ background: cfg.color, color: "#fff" }}
          >
            {priority}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-snug" style={{ color: "var(--text)" }}>
              {action.title}
            </p>
            {resultTitle && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: resultColor ?? cfg.color }}
                />
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>{resultTitle}</span>
                {areaTitle && resultId && areaId && (
                  <>
                    <span className="text-xs opacity-40" style={{ color: "var(--text-dim)" }}>→</span>
                    <Link
                      href={`/result/${resultId}?tab=actions&area=${areaId}`}
                      className="text-xs underline underline-offset-2 transition-opacity hover:opacity-80"
                      style={{ color: cfg.color }}
                    >
                      {areaTitle}
                    </Link>
                  </>
                )}
                <button
                  onClick={onClear}
                  className="ml-1 text-xs opacity-0 hover:opacity-100 transition-opacity shrink-0"
                  style={{ color: "var(--text-dim)" }}
                >
                  change
                </button>
              </div>
            )}
          </div>

          {/* Description toggle + Complete button */}
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {action.description && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                title="Toggle description"
                style={{ color: descExpanded ? cfg.color : "var(--text-dim)" }}
              >
                {descExpanded ? <ChevronDown size={15} /> : <AlignLeft size={15} />}
              </button>
            )}
            <button
              onClick={onComplete}
              className="rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                width: 26,
                height: 26,
                border: `1.5px solid ${cfg.border}`,
                background: "transparent",
              }}
              title="Mark complete"
            />
          </div>
        </div>

        {/* Expandable description */}
        {descExpanded && action.description && (
          <div
            className="mt-3 ml-[52px] text-xs leading-relaxed rounded-lg px-3 py-2"
            style={{
              color: "var(--text-muted)",
              background: "rgba(0,0,0,0.15)",
              borderLeft: `2px solid ${cfg.color}`,
            }}
          >
            {action.description}
          </div>
        )}
      </div>
    );
  }

  // Empty slot
  return (
    <div>
      <button
        onClick={() => setPickerOpen((o) => !o)}
        className="w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200"
        style={{
          background: "transparent",
          borderColor: pickerOpen ? cfg.color : "var(--border)",
          borderStyle: "dashed",
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5"
          style={{
            background: "var(--surface-2)",
            color: cfg.color,
            border: `1.5px dashed ${cfg.border}`,
          }}
        >
          {priority}
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Choose {priority} priority
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
            {cfg.sublabel} — pick from your actions
          </p>
        </div>
        <ChevronRight
          size={14}
          className={clsx(
            "shrink-0 mt-1 transition-transform duration-200",
            pickerOpen && "rotate-90"
          )}
          style={{ color: "var(--text-dim)" }}
        />
      </button>

      {pickerOpen && (
        <ActionPicker
          options={allOptions}
          assigned={assignedIds}
          accentColor={cfg.color}
          question={cfg.question}
          onSelect={(opt) => {
            onAssign(opt);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ─── DailyRitual (main) ──────────────────────────────────────────────────────

export function DailyRitual() {
  const {
    results,
    getTodayFocus3,
    setFocusPriority,
    setFocusReflection,
    toggleActionComplete,
  } = useRPMStore();

  const today = new Date().toISOString().slice(0, 10);
  const focus = getTodayFocus3();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  // Local draft — editing = reflection is empty (user clicked "Edit") or not yet saved
  const [editingReflection, setEditingReflection] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setFirstName(data.user?.user_metadata?.first_name ?? null);
    });
  }, []);
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [greeting] = useState(getGreeting);
  const [dateStr] = useState(formatDate);

  // Build flat list of all available (non-completed) actions across all results
  const allOptions = useMemo<ActionOption[]>(() => {
    return results
      .filter((r) => !r.archived)
      .flatMap((r) =>
        r.areas.flatMap((area) =>
          area.actions
            .filter((a) => !a.completed)
            .map((a) => ({
              actionId: a.id,
              areaId: area.id,
              resultId: r.id,
              actionTitle: a.title,
              areaTitle: area.title,
              resultTitle: r.title,
              resultColor: r.color ?? "var(--accent)",
            }))
        )
      );
  }, [results]);

  // IDs currently assigned to any slot today
  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    (["A", "B", "C"] as PriorityLevel[]).forEach((p) => {
      if (focus[p]?.actionId) ids.add(focus[p]!.actionId);
    });
    return ids;
  }, [focus]);

  // Resolve a slot reference to a full action + context
  const resolveSlot = (p: PriorityLevel) => {
    const ref = focus[p];
    if (!ref) return null;
    const result = results.find((r) => r.id === ref.resultId);
    const area = result?.areas.find((a) => a.id === ref.areaId);
    const action = area?.actions.find((a) => a.id === ref.actionId);
    if (!action) return null;
    return {
      action,
      resultTitle: result?.title,
      resultColor: result?.color,
      resultId: result?.id,
      areaTitle: area?.title,
      areaId: area?.id,
    };
  };

  // Collect unique purposes from all results that have active focus slots today
  const displayPurposes = useMemo<Purpose[]>(() => {
    const seen = new Set<string>();
    const purposes: Purpose[] = [];
    // Gather from A, B, C result IDs
    const resultIds = (["A", "B", "C"] as PriorityLevel[])
      .map((p) => focus[p]?.resultId)
      .filter((id): id is string => !!id);
    // Also fall back to any result with purposes if no slots assigned
    const fallback = results.find((r) => !r.archived && r.purposes.length > 0);
    const ids = resultIds.length > 0 ? [...new Set(resultIds)] : fallback ? [fallback.id] : [];
    for (const id of ids) {
      const r = results.find((r) => r.id === id);
      if (r?.purposes.length) {
        for (const p of r.purposes.slice(0, 2)) {
          if (!seen.has(p.label)) {
            seen.add(p.label);
            purposes.push(p);
          }
        }
      }
    }
    return purposes.slice(0, 3);
  }, [results, focus]);

  // Check if all set priorities are completed
  const setSlots = (["A", "B", "C"] as PriorityLevel[]).filter((p) => focus[p]);
  const completedSlots = setSlots.filter((p) => {
    const ref = focus[p];
    if (!ref) return false;
    const r = results.find((r) => r.id === ref.resultId);
    const area = r?.areas.find((a) => a.id === ref.areaId);
    return area?.actions.find((a) => a.id === ref.actionId)?.completed ?? false;
  });
  const allDone = setSlots.length > 0 && completedSlots.length === setSlots.length;

  const handleComplete = (p: PriorityLevel) => {
    const ref = focus[p];
    if (ref) toggleActionComplete(ref.resultId, ref.areaId, ref.actionId);
  };

  const handleAssign = (p: PriorityLevel, opt: ActionOption) => {
    setFocusPriority(today, p, {
      actionId: opt.actionId,
      areaId: opt.areaId,
      resultId: opt.resultId,
    });
  };

  const handleClear = (p: PriorityLevel) => {
    setFocusPriority(today, p, null);
  };

  const handleSaveReflection = () => {
    if (reflectionDraft.trim()) {
      setFocusReflection(today, reflectionDraft.trim());
      setEditingReflection(false);
    }
  };

  const startEditReflection = () => {
    setReflectionDraft(focus.reflection ?? "");
    setEditingReflection(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--accent)" }}
          >
            R³
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            RPM³
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/plan"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            <LayoutGrid size={13} />
            Plan
            <ChevronRight size={12} className="opacity-50" />
          </Link>
          {userEmail && (
            <button
              onClick={async () => {
                await createClient().auth.signOut();
                window.location.href = "/login";
              }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
              style={{ color: "var(--text-dim)", borderColor: "var(--border)" }}
              title={`Signed in as ${userEmail}`}
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-12 pb-16">
        <div className="w-full max-w-[560px]">

          {/* Greeting */}
          <div className="mb-1">
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {greeting}{firstName ? `, ${firstName}` : ""}.
            </h1>
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {dateStr}
          </p>

          {/* Purpose bar */}
          {displayPurposes.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  Fuelled by
                </span>
              </div>
              {displayPurposes.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--accent-glow)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "var(--text)",
                  }}
                >
                  {p.emoji && <span>{p.emoji}</span>}
                  {p.label}
                </span>
              ))}
            </div>
          ) : (
            <div className="mb-8">
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-dim)" }}
              >
                <Sparkles size={11} />
                Add a purpose to your results to see your why here
              </Link>
            </div>
          )}

          {/* All done banner */}
          {allDone && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-6"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(16,185,129,0.15)" }}
              >
                <Check size={16} style={{ color: "var(--C)" }} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--C)" }}>
                  Focus 3 complete
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  You did what mattered most today. That&apos;s the whole game.
                </p>
              </div>
            </div>
          )}

          {/* Section label */}
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-dim)" }}
            >
              Today&apos;s Focus 3
            </p>
            {setSlots.length > 0 && (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {completedSlots.length}/{setSlots.length} done
              </p>
            )}
          </div>

          {/* Priority cards */}
          <div className="space-y-2.5 mb-10">
            {(["A", "B", "C"] as PriorityLevel[]).map((p) => {
              const slot = resolveSlot(p);
              const isCompleted =
                slot?.action.completed ?? false;

              return (
                <PriorityCard
                  key={p}
                  priority={p}
                  action={slot?.action ?? null}
                  resultTitle={slot?.resultTitle}
                  resultColor={slot?.resultColor}
                  resultId={slot?.resultId}
                  areaTitle={slot?.areaTitle}
                  areaId={slot?.areaId}
                  isCompleted={isCompleted}
                  allOptions={allOptions}
                  assignedIds={assignedIds}
                  onComplete={() => handleComplete(p)}
                  onAssign={(opt) => handleAssign(p, opt)}
                  onClear={() => handleClear(p)}
                />
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="mb-6"
            style={{ height: 1, background: "var(--border-subtle)" }}
          />

          {/* Reflection */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-dim)" }}
            >
              Reflection
            </p>

            {focus.reflection && !editingReflection ? (
              <div className="group">
                <p
                  className="text-sm italic leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  &ldquo;{focus.reflection}&rdquo;
                </p>
                <button
                  className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-dim)" }}
                  onClick={startEditReflection}
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5 items-center">
                <input
                  value={reflectionDraft}
                  onChange={(e) => setReflectionDraft(e.target.value)}
                  onBlur={handleSaveReflection}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveReflection()}
                  placeholder="What's the key insight from today?"
                  className="flex-1 bg-transparent border-b outline-none text-sm py-1.5 transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                />
              </div>
            )}
          </div>

          {/* No results nudge */}
          {results.filter((r) => !r.archived).length === 0 && (
            <div
              className="mt-10 p-5 rounded-xl text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <Target
                size={28}
                className="mx-auto mb-3 opacity-20"
                style={{ color: "var(--text)" }}
              />
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text)" }}
              >
                No results yet
              </p>
              <p
                className="text-xs mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Define what you want before choosing what to do today.
              </p>
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                }}
              >
                Go to Plan workspace
                <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
