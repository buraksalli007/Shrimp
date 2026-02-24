export type MemoryRecordType =
  | "architectural_decision"
  | "failed_fix"
  | "implementation"
  | "prompt"
  | "tradeoff";

export interface MemoryRecordBase {
  projectId: string;
  type: MemoryRecordType;
  payload: Record<string, unknown>;
  createdAt?: Date;
}

export interface ArchitecturalDecisionPayload {
  decision: string;
  rationale: string;
  alternativesConsidered?: string[];
  impact?: string;
}

export interface FailedFixPayload {
  taskId: string;
  promptUsed: string;
  errorOutput: string;
  category: string;
  attemptNumber: number;
}

export interface ImplementationPayload {
  taskId: string;
  promptUsed: string;
  filesChanged?: string[];
  verificationPassed: boolean;
  agentId?: string;
}

export interface PromptPayload {
  capability: string;
  promptText: string;
  responseSummary?: string;
  agentUsed?: string;
}

export interface TradeoffPayload {
  tradeoff: string;
  reason: string;
  downside?: string;
}

export interface MemoryQuery {
  projectId: string;
  types?: MemoryRecordType[];
  since?: Date;
  limit?: number;
}

export interface ProjectMemorySummary {
  projectId: string;
  architectureDecisions: string[];
  failedFixPatterns: string[];
  lastPrompts: string[];
  tradeoffs: string[];
}
