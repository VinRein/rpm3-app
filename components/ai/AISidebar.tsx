"use client";
import { useState, useRef, useEffect } from "react";
import { useRPMStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Bot, X, Send, Trash2, Sparkles } from "lucide-react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CONTEXT_PROMPTS: Record<string, string> = {
  result: "Help me define a clear, powerful Result — a specific outcome I want to achieve.",
  purpose: "Help me identify deep, motivating Purposes for my Result.",
  method: "Help me evaluate and choose the smartest strategic Method for achieving my Result.",
  areas: "Help me define the key Focus Areas — the major pillars of work — for this Result.",
  actions: "Help me brainstorm Massive Actions for this Focus Area.",
  focus3: "Help me choose my Focus 3 for today — the A, B, and C priorities.",
};

const CONTEXT_LABELS: Record<string, string> = {
  result: "Result",
  purpose: "Purpose",
  method: "Method",
  areas: "Focus Areas",
  actions: "Massive Actions",
  focus3: "Focus 3",
};

const SUGGESTIONS: Record<string, string[]> = {
  result: [
    "Is my result specific and measurable?",
    "What would make this result even more compelling?",
    "Am I aiming too small?",
  ],
  purpose: [
    "What's my deepest why?",
    "How will achieving this change my life?",
    "What am I willing to sacrifice for this?",
  ],
  method: [
    "What's the fastest path to this result?",
    "What assumptions am I making?",
    "Where is the highest leverage?",
  ],
  areas: [
    "What are the key Focus Areas (Pillars)?",
    "Which area has the highest leverage?",
    "What could I accomplish in 90 days?",
  ],
  actions: [
    "Brainstorm 10 actions for this Focus Area",
    "What's the highest leverage action?",
    "What am I avoiding that I shouldn't be?",
  ],
  focus3: [
    "What should my A priority be today?",
    "Is this truly the most important thing?",
    "Am I focused on outcomes or busy work?",
  ],
};

export function AISidebar() {
  const { aiContext, aiChat, addChatMessage, clearChat, setSidebarOpen, results, focus3History } =
    useRPMStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const level = aiContext?.level ?? "result";
  const contextLabel = CONTEXT_LABELS[level] ?? "Assistant";
  const suggestions = SUGGESTIONS[level] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChat]);

  const buildSystemPrompt = () => {
    const parts = [
      `You are an elite strategic coach embedded in the RPM³ Outcome Operating System.`,
      `RPM³ has 6 levels: Result → Purpose → Method → Focus Areas → Massive Actions → Focus 3.`,
      `You are currently helping with: ${contextLabel}.`,
      ``,
      `Your role:`,
      `- Ask powerful questions that create clarity`,
      `- Challenge vague thinking; push for specificity`,
      `- Identify highest-leverage opportunities`,
      `- Keep responses concise and action-oriented`,
      `- Never just affirm — always add value or challenge`,
    ];

    // Inject relevant context data
    if (aiContext) {
      if ("resultId" in aiContext && aiContext.resultId) {
        const result = results.find((r) => r.id === aiContext.resultId);
        if (result) {
          parts.push(``, `Current Result: "${result.title}"`);
          if (result.purposes.length)
            parts.push(`Purposes: ${result.purposes.map((p) => p.label).join(", ")}`);
          if (result.methods.some((m) => m.selected)) {
            const m = result.methods.find((m) => m.selected);
            parts.push(`Selected Method: ${m?.title}`);
          }
          const activeAreas = result.areas.filter((a) => a.status === "active");
          if (activeAreas.length) {
            parts.push(`Focus Areas: ${activeAreas.map((a) => a.title).join(", ")}`);
            const allActions = activeAreas.flatMap((a) => a.actions);
            if (allActions.length)
              parts.push(`Actions: ${allActions.map((a) => a.title).join(", ")}`);
          }
        }
      }
      if (aiContext.level === "focus3") {
        const today = new Date().toISOString().slice(0, 10);
        const focus = focus3History.find((f) => f.date === today);
        if (focus?.A || focus?.B || focus?.C) {
          parts.push(``, `Today's Focus 3 so far:`);
        }
      }
    }

    return parts.join("\n");
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");

    addChatMessage({ role: "user", content: text });
    setLoading(true);

    try {
      const history = aiChat.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: text });

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          system: buildSystemPrompt(),
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      addChatMessage({ role: "assistant", content: data.content });
    } catch {
      addChatMessage({
        role: "assistant",
        content:
          "I couldn't connect to the AI. Make sure your `ANTHROPIC_API_KEY` is set in `.env.local`.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="flex flex-col w-80 shrink-0 border-l"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            AI: {contextLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={clearChat} title="Clear chat">
            <Trash2 size={12} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {aiChat.length === 0 && (
          <div className="text-center py-6">
            <Bot size={28} className="mx-auto mb-3 opacity-30" style={{ color: "var(--text)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {CONTEXT_PROMPTS[level]}
            </p>
            {suggestions.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {aiChat.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "text-sm rounded-xl px-3 py-2.5 max-w-[90%]",
              msg.role === "user" ? "ml-auto text-right" : "mr-auto"
            )}
            style={
              msg.role === "user"
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }
            }
          >
            {msg.role === "user" ? (
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="leading-relaxed mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: "var(--text)" }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic" style={{ color: "var(--text-muted)" }}>{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-2 space-y-1 pl-4 list-disc" style={{ color: "var(--text)" }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-2 space-y-1 pl-4 list-decimal" style={{ color: "var(--text)" }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="font-bold text-base mb-2 mt-3 first:mt-0" style={{ color: "var(--text)" }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-semibold text-sm mb-1.5 mt-3 first:mt-0" style={{ color: "var(--text)" }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-semibold text-sm mb-1 mt-2 first:mt-0" style={{ color: "var(--text-muted)" }}>{children}</h3>
                  ),
                  hr: () => (
                    <hr className="my-3" style={{ borderColor: "var(--border)" }} />
                  ),
                  code: ({ children }) => (
                    <code
                      className="px-1.5 py-0.5 rounded text-xs font-mono"
                      style={{ background: "var(--surface-3)", color: "var(--accent)" }}
                    >
                      {children}
                    </code>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-xs border-collapse" style={{ borderColor: "var(--border)" }}>
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead style={{ background: "var(--surface-3)" }}>{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th
                      className="text-left px-2 py-1.5 font-semibold border"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      className="px-2 py-1.5 border"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr style={{ borderColor: "var(--border)" }}>{children}</tr>
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        ))}

        {loading && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    background: "var(--accent)",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </span>
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask your coach..."
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            style={{ color: "var(--text)" }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => sendMessage(input)}
            loading={loading}
            disabled={!input.trim()}
          >
            <Send size={13} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
