import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  Result,
  FocusArea,
  MassiveAction,
  Method,
  Focus3Entry,
  ChatMessage,
  AIContext,
  PriorityLevel,
  Purpose,
} from "./types";

interface RPMState {
  // Data
  results: Result[];
  focus3History: Focus3Entry[];
  aiChat: ChatMessage[];
  purposeLibrary: Omit<Purpose, "id">[]; // saved custom purposes
  activeResultId: string | null;
  activeAreaId: string | null;
  aiContext: AIContext | null;
  sidebarOpen: boolean;

  // Result CRUD
  createResult: (title: string, description?: string) => Result;
  updateResult: (id: string, patch: Partial<Omit<Result, "id">>) => void;
  archiveResult: (id: string) => void;
  deleteResult: (id: string) => void;
  setActiveResult: (id: string | null) => void;

  // Purpose
  addPurpose: (resultId: string, label: string, emoji?: string, saveToLibrary?: boolean) => void;
  removePurpose: (resultId: string, purposeId: string) => void;
  addToPurposeLibrary: (label: string, emoji?: string) => void;

  // Method
  addMethod: (resultId: string, method: Omit<Method, "id" | "selected" | "order">) => void;
  updateMethod: (resultId: string, methodId: string, patch: Partial<Method>) => void;
  selectMethod: (resultId: string, methodId: string) => void; // toggles selection
  deleteMethod: (resultId: string, methodId: string) => void;
  reorderMethods: (resultId: string, orderedIds: string[]) => void;

  // Focus Areas (formerly Milestones)
  addArea: (resultId: string, title: string, description?: string) => FocusArea;
  updateArea: (resultId: string, areaId: string, patch: Partial<FocusArea>) => void;
  deleteArea: (resultId: string, areaId: string) => void;
  reorderAreas: (resultId: string, orderedIds: string[]) => void;
  setActiveArea: (id: string | null) => void;
  completeArea: (resultId: string, areaId: string) => void;

  // Actions
  addAction: (resultId: string, areaId: string, title: string, category?: string) => MassiveAction;
  updateAction: (resultId: string, areaId: string, actionId: string, patch: Partial<MassiveAction>) => void;
  deleteAction: (resultId: string, areaId: string, actionId: string) => void;
  toggleActionComplete: (resultId: string, areaId: string, actionId: string) => void;
  reorderActions: (resultId: string, areaId: string, orderedIds: string[]) => void;
  reorderResults: (orderedIds: string[]) => void;

  // Focus 3
  getTodayFocus3: () => Focus3Entry;
  setFocusPriority: (
    date: string,
    priority: PriorityLevel,
    ref: { actionId: string; areaId: string; resultId: string } | null
  ) => void;
  setFocusReflection: (date: string, reflection: string) => void;

  // AI
  setAIContext: (ctx: AIContext | null) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChat: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Sync
  hydrateStore: (data: { results?: Result[]; focus3History?: Focus3Entry[]; purposeLibrary?: Omit<Purpose, "id">[] }) => void;
}

const now = () => new Date().toISOString();

export const useRPMStore = create<RPMState>()(
  persist(
    (set, get) => ({
      results: [],
      focus3History: [],
      aiChat: [],
      purposeLibrary: [],
      activeResultId: null,
      activeAreaId: null,
      aiContext: null,
      sidebarOpen: false,

      // ── Results ──────────────────────────────────────────────────────────
      createResult: (title, description) => {
        const result: Result = {
          id: uuid(),
          title,
          description: description ?? "",
          purposes: [],
          methods: [],
          areas: [],
          createdAt: now(),
          updatedAt: now(),
          archived: false,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
        set((s) => ({ results: [result, ...s.results], activeResultId: result.id }));
        return result;
      },

      updateResult: (id, patch) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: now() } : r
          ),
        })),

      archiveResult: (id) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === id ? { ...r, archived: true, updatedAt: now() } : r
          ),
        })),

      deleteResult: (id) =>
        set((s) => ({
          results: s.results.filter((r) => r.id !== id),
          activeResultId: s.activeResultId === id ? null : s.activeResultId,
        })),

      setActiveResult: (id) => set({ activeResultId: id }),

      // ── Purposes ─────────────────────────────────────────────────────────
      addPurpose: (resultId, label, emoji, saveToLibrary = false) => {
        set((s) => {
          const newLibrary = saveToLibrary
            ? s.purposeLibrary.some((p) => p.label.toLowerCase() === label.toLowerCase())
              ? s.purposeLibrary
              : [...s.purposeLibrary, { label, emoji }]
            : s.purposeLibrary;

          return {
            purposeLibrary: newLibrary,
            results: s.results.map((r) =>
              r.id === resultId
                ? {
                    ...r,
                    purposes: [...r.purposes, { id: uuid(), label, emoji }],
                    updatedAt: now(),
                  }
                : r
            ),
          };
        });
      },

      removePurpose: (resultId, purposeId) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? { ...r, purposes: r.purposes.filter((p) => p.id !== purposeId), updatedAt: now() }
              : r
          ),
        })),

      addToPurposeLibrary: (label, emoji) =>
        set((s) => ({
          purposeLibrary: s.purposeLibrary.some(
            (p) => p.label.toLowerCase() === label.toLowerCase()
          )
            ? s.purposeLibrary
            : [...s.purposeLibrary, { label, emoji }],
        })),

      // ── Methods ──────────────────────────────────────────────────────────
      addMethod: (resultId, method) =>
        set((s) => {
          const result = s.results.find((r) => r.id === resultId);
          const order = result ? result.methods.length : 0;
          return {
            results: s.results.map((r) =>
              r.id === resultId
                ? {
                    ...r,
                    methods: [...r.methods, { id: uuid(), selected: false, order, ...method }],
                    updatedAt: now(),
                  }
                : r
            ),
          };
        }),

      updateMethod: (resultId, methodId, patch) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  methods: r.methods.map((m) => (m.id === methodId ? { ...m, ...patch } : m)),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      // Toggle: clicking the already-selected method deselects it
      selectMethod: (resultId, methodId) =>
        set((s) => ({
          results: s.results.map((r) => {
            if (r.id !== resultId) return r;
            const isAlreadySelected = r.methods.find((m) => m.id === methodId)?.selected;
            return {
              ...r,
              methods: r.methods.map((m) =>
                m.id === methodId
                  ? { ...m, selected: !isAlreadySelected }
                  : isAlreadySelected
                  ? m // deselecting — leave others as-is
                  : { ...m, selected: false } // selecting new — deselect others
              ),
              updatedAt: now(),
            };
          }),
        })),

      deleteMethod: (resultId, methodId) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? { ...r, methods: r.methods.filter((m) => m.id !== methodId), updatedAt: now() }
              : r
          ),
        })),

      reorderMethods: (resultId, orderedIds) =>
        set((s) => ({
          results: s.results.map((r) => {
            if (r.id !== resultId) return r;
            const reordered = orderedIds
              .map((id, i) => {
                const m = r.methods.find((m) => m.id === id);
                return m ? { ...m, order: i } : null;
              })
              .filter(Boolean) as Method[];
            return { ...r, methods: reordered, updatedAt: now() };
          }),
        })),

      // ── Focus Areas ───────────────────────────────────────────────────────
      addArea: (resultId, title, description) => {
        const result = get().results.find((r) => r.id === resultId);
        const order = result ? result.areas.length : 0;
        const area: FocusArea = {
          id: uuid(),
          resultId,
          title,
          description: description ?? "",
          status: "active",
          order,
          actions: [],
        };
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? { ...r, areas: [...r.areas, area], updatedAt: now() }
              : r
          ),
        }));
        return area;
      },

      updateArea: (resultId, areaId, patch) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  areas: r.areas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      deleteArea: (resultId, areaId) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? { ...r, areas: r.areas.filter((a) => a.id !== areaId), updatedAt: now() }
              : r
          ),
        })),

      reorderAreas: (resultId, orderedIds) =>
        set((s) => ({
          results: s.results.map((r) => {
            if (r.id !== resultId) return r;
            const reordered = orderedIds
              .map((id, i) => {
                const a = r.areas.find((a) => a.id === id);
                return a ? { ...a, order: i } : null;
              })
              .filter(Boolean) as FocusArea[];
            return { ...r, areas: reordered, updatedAt: now() };
          }),
        })),

      setActiveArea: (id) => set({ activeAreaId: id }),

      completeArea: (resultId, areaId) =>
        set((s) => ({
          results: s.results.map((r) => {
            if (r.id !== resultId) return r;
            return {
              ...r,
              updatedAt: now(),
              areas: r.areas.map((a) =>
                a.id === areaId
                  ? { ...a, status: a.status === "completed" ? "active" : "completed" }
                  : a
              ),
            };
          }),
        })),

      // ── Actions ──────────────────────────────────────────────────────────
      addAction: (resultId, areaId, title, category) => {
        const area = get().results.find((r) => r.id === resultId)?.areas.find((a) => a.id === areaId);
        const order = area ? area.actions.length : 0;
        const action: MassiveAction = {
          id: uuid(),
          areaId,
          title,
          category,
          completed: false,
          completedAt: null,
          order,
          focusPriority: null,
          focusDate: null,
        };
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  areas: r.areas.map((a) =>
                    a.id === areaId ? { ...a, actions: [...a.actions, action] } : a
                  ),
                  updatedAt: now(),
                }
              : r
          ),
        }));
        return action;
      },

      updateAction: (resultId, areaId, actionId, patch) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  areas: r.areas.map((a) =>
                    a.id === areaId
                      ? {
                          ...a,
                          actions: a.actions.map((ac) =>
                            ac.id === actionId ? { ...ac, ...patch } : ac
                          ),
                        }
                      : a
                  ),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      deleteAction: (resultId, areaId, actionId) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  areas: r.areas.map((a) =>
                    a.id === areaId
                      ? { ...a, actions: a.actions.filter((ac) => ac.id !== actionId) }
                      : a
                  ),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      toggleActionComplete: (resultId, areaId, actionId) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  areas: r.areas.map((a) =>
                    a.id === areaId
                      ? {
                          ...a,
                          actions: a.actions.map((ac) => {
                            if (ac.id !== actionId) return ac;
                            const nowCompleted = !ac.completed;
                            return {
                              ...ac,
                              completed: nowCompleted,
                              completedAt: nowCompleted ? new Date().toISOString().slice(0, 10) : null,
                            };
                          }),
                        }
                      : a
                  ),
                  updatedAt: now(),
                }
              : r
          ),
        })),

      reorderActions: (resultId, areaId, orderedIds) =>
        set((s) => ({
          results: s.results.map((r) => {
            if (r.id !== resultId) return r;
            return {
              ...r,
              areas: r.areas.map((a) => {
                if (a.id !== areaId) return a;
                const reordered = orderedIds
                  .map((id, i) => {
                    const ac = a.actions.find((ac) => ac.id === id);
                    return ac ? { ...ac, order: i } : null;
                  })
                  .filter(Boolean) as MassiveAction[];
                return { ...a, actions: reordered };
              }),
              updatedAt: now(),
            };
          }),
        })),

      reorderResults: (orderedIds) =>
        set((s) => {
          const reordered = orderedIds
            .map((id) => s.results.find((r) => r.id === id))
            .filter(Boolean) as Result[];
          return { results: reordered };
        }),

      // ── Focus 3 ──────────────────────────────────────────────────────────
      getTodayFocus3: () => {
        const d = new Date().toISOString().slice(0, 10);
        return get().focus3History.find((f) => f.date === d) ?? { date: d };
      },

      setFocusPriority: (date, priority, ref) =>
        set((s) => {
          const existing = s.focus3History.find((f) => f.date === date) ?? { date };
          const updated = { ...existing, [priority]: ref };
          return {
            focus3History: [
              ...s.focus3History.filter((f) => f.date !== date),
              updated,
            ],
          };
        }),

      setFocusReflection: (date, reflection) =>
        set((s) => {
          const existing = s.focus3History.find((f) => f.date === date) ?? { date };
          return {
            focus3History: [
              ...s.focus3History.filter((f) => f.date !== date),
              { ...existing, reflection },
            ],
          };
        }),

      // ── AI ───────────────────────────────────────────────────────────────
      setAIContext: (ctx) => set({ aiContext: ctx }),

      addChatMessage: (msg) =>
        set((s) => ({
          aiChat: [...s.aiChat, { id: uuid(), timestamp: now(), ...msg }],
        })),

      clearChat: () => set({ aiChat: [] }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // ── Sync ─────────────────────────────────────────────────────────────
      // Replace app data from a Supabase snapshot (preserves UI state)
      hydrateStore: (data: { results?: Result[]; focus3History?: Focus3Entry[]; purposeLibrary?: Omit<Purpose, "id">[] }) =>
        set({
          results: data.results ?? [],
          focus3History: data.focus3History ?? [],
          purposeLibrary: data.purposeLibrary ?? [],
        }),
    }),
    {
      name: "rpm3-store",
      version: 2, // bumped — clears old localStorage with milestones shape
    }
  )
);

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];
