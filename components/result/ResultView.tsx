"use client";
import { useState } from "react";
import { useRPMStore } from "@/lib/store";
import { PurposePanel } from "./PurposePanel";
import { MethodPanel } from "./MethodPanel";
import { AreasPanel } from "../areas/AreasPanel";
import { ActionsPanel } from "../actions/ActionsPanel";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Pencil, Check, X, Bot } from "lucide-react";
import clsx from "clsx";

const STEPS = [
  { id: "purpose",  label: "Purpose" },
  { id: "method",   label: "Method" },
  { id: "areas",    label: "Focus Areas" },
  { id: "actions",  label: "Massive Actions" },
] as const;

type Step = (typeof STEPS)[number]["id"];

interface ResultViewProps {
  resultId: string;
}

export function ResultView({ resultId }: ResultViewProps) {
  const { results, updateResult, setAIContext, setSidebarOpen } = useRPMStore();
  const result = results.find((r) => r.id === resultId);
  const [activeStep, setActiveStep] = useState<Step>("purpose");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
        Result not found.
      </div>
    );
  }

  const handleEditTitle = () => {
    setTitleDraft(result.title);
    setEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim()) updateResult(resultId, { title: titleDraft.trim() });
    setEditingTitle(false);
  };

  const openAI = (level: Step) => {
    const ctx =
      level === "purpose"
        ? { level: "purpose" as const, resultId }
        : level === "method"
        ? { level: "method" as const, resultId }
        : level === "areas"
        ? { level: "areas" as const, resultId }
        : { level: "actions" as const, resultId, areaId: result.areas[0]?.id ?? "" };
    setAIContext(ctx);
    setSidebarOpen(true);
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* Result header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-1">
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ background: result.color ?? "var(--accent)" }}
          />
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="flex-1 text-2xl font-bold bg-transparent border-b border-[var(--accent)] outline-none"
                  style={{ color: "var(--text)" }}
                />
                <button onClick={handleSaveTitle}><Check size={16} className="text-emerald-400" /></button>
                <button onClick={() => setEditingTitle(false)}><X size={14} style={{ color: "var(--text-dim)" }} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                  {result.title}
                </h1>
                <button
                  onClick={handleEditTitle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil size={14} style={{ color: "var(--text-dim)" }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {result.purposes.length > 0 && (
          <div className="flex flex-wrap gap-2 ml-4 mt-2">
            {result.purposes.map((p) => (
              <span
                key={p.id}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {p.emoji && `${p.emoji} `}{p.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Step tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "var(--surface)" }}
      >
        {STEPS.map((step, i) => {
          const active = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                active ? "text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
              style={active ? { background: result.color ?? "var(--accent)" } : {}}
            >
              <span className="text-xs opacity-60 font-mono">{i + 2}</span>
              {step.label}
            </button>
          );
        })}
      </div>

      {/* AI assist */}
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => openAI(activeStep)}>
          <Bot size={13} />
          AI: {STEPS.find((s) => s.id === activeStep)?.label}
        </Button>
      </div>

      {/* Panel content */}
      <div>
        {activeStep === "purpose" && <PurposePanel resultId={resultId} />}
        {activeStep === "method"  && <MethodPanel resultId={resultId} />}
        {activeStep === "areas"   && <AreasPanel resultId={resultId} />}
        {activeStep === "actions" && <ActionsPanel resultId={resultId} />}
      </div>

      {activeStep !== "actions" && (
        <button
          onClick={() => {
            const idx = STEPS.findIndex((s) => s.id === activeStep);
            if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1].id);
          }}
          className="mt-8 flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--accent)]"
          style={{ color: "var(--text-dim)" }}
        >
          Next: {STEPS[STEPS.findIndex((s) => s.id === activeStep) + 1]?.label}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
