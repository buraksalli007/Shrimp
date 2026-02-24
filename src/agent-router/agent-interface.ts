import type { ProjectMemorySummary } from "../memory/types.js";
import type { AutonomyMode } from "../core/mode-router.js";

export type AgentCapability = "planning" | "coding" | "research" | "deploy";

export interface AgentContext {
  memorySummary?: ProjectMemorySummary;
  previousFailures?: string[];
  mode: AutonomyMode;
}

export interface AgentRequest {
  capability: AgentCapability;
  prompt: string;
  context: AgentContext;
  projectId: string;
}

export interface AgentResponse {
  success: boolean;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface IAgent {
  readonly capability: AgentCapability;
  execute(request: AgentRequest): Promise<AgentResponse>;
}
