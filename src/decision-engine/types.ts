import type { Task } from "../types/index.js";
import type { ProjectMemorySummary } from "../memory/types.js";

export type DecisionOutcome = "approve" | "postpone" | "reject";

export type AutonomyMode = "assist" | "builder" | "autopilot";

export interface DecisionInput {
  idea: string;
  proposedTasks: Task[];
  projectMemory?: ProjectMemorySummary;
  mode: AutonomyMode;
}

export interface DecisionResult {
  outcome: DecisionOutcome;
  approvedTasks: Task[];
  postponedTasks: Task[];
  rejectedReasons: string[];
  reasoningLog: ReasoningEntry[];
  scopeScore: number;
  complexityScore: number;
}

export interface ReasoningEntry {
  timestamp: string;
  rule: string;
  input: unknown;
  output: string;
  confidence: number;
}
