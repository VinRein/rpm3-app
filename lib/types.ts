// ─── RPM³ Core Types ───────────────────────────────────────────────────────

export type PriorityLevel = "A" | "B" | "C";

export interface Purpose {
  id: string;
  label: string;
  emoji?: string;
}

export type MethodPath = "fastest" | "easiest" | "highest_leverage" | "lowest_risk" | "custom";

export interface Method {
  id: string;
  title: string;
  description: string;
  path: MethodPath;
  constraints?: string;
  resources?: string;
  risks?: string;
  successCriteria?: string;
  selected: boolean;
  order: number; // for drag-to-reorder
}

export interface MassiveAction {
  id: string;
  areaId: string; // formerly milestoneId
  title: string;
  category?: string;
  completed: boolean;
  focusPriority?: PriorityLevel | null;
  focusDate?: string | null;
}

export type AreaStatus = "active" | "completed";

export interface FocusArea {
  id: string;
  resultId: string;
  title: string;
  description?: string;
  status: AreaStatus;
  order: number;
  dueDate?: string | null;
  actions: MassiveAction[];
}

export interface Result {
  id: string;
  title: string;
  description?: string;
  purposes: Purpose[];
  methods: Method[];
  areas: FocusArea[]; // formerly milestones
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  color?: string;
}

export interface Focus3Entry {
  date: string; // ISO date "YYYY-MM-DD"
  A?: { actionId: string; areaId: string; resultId: string } | null;
  B?: { actionId: string; areaId: string; resultId: string } | null;
  C?: { actionId: string; areaId: string; resultId: string } | null;
  reflection?: string;
  completedAt?: string | null;
}

// ─── AI types ───────────────────────────────────────────────────────────────

export type AIContext =
  | { level: "result"; resultId?: string }
  | { level: "purpose"; resultId: string }
  | { level: "method"; resultId: string }
  | { level: "areas"; resultId: string }
  | { level: "actions"; resultId: string; areaId: string }
  | { level: "focus3"; date: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
