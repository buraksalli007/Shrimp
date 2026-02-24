import type { Task } from "../types/index.js";
import type { AutonomyMode } from "./mode-router.js";
import { evaluateDecision } from "../decision-engine/index.js";
import { generateOutcome } from "../outcome-workflow/index.js";
import { getProjectSummary, writeMemory } from "../memory/index.js";
import { setCursorConfig, setOpenClawConfig } from "../agent-router/index.js";
import { logger } from "../utils/logger.js";

export interface OrchestratorStartInput {
  idea: string;
  githubRepo: string;
  branch?: string;
  proposedTasks?: Task[];
  autonomyMode?: AutonomyMode;
  credentials?: {
    cursorApiKey?: string;
    cursorWebhookSecret?: string;
    openclawToken?: string;
    openclawGatewayUrl?: string;
    githubToken?: string;
  };
}

export interface OrchestratorStartResult {
  outcome?: ReturnType<typeof generateOutcome>;
  decision?: Awaited<ReturnType<typeof evaluateDecision>>;
  approvedTasks: Task[];
  postponedTasks: Task[];
  shouldProceed: boolean;
}

export async function runOrchestratorFlow(
  projectId: string,
  input: OrchestratorStartInput
): Promise<OrchestratorStartResult> {
  const mode = (input.autonomyMode ?? "builder") as AutonomyMode;

  setCursorConfig(projectId, {
    repo: input.githubRepo,
    branch: input.branch ?? "main",
    cursorApiKey: input.credentials?.cursorApiKey,
    cursorWebhookSecret: input.credentials?.cursorWebhookSecret,
  });
  setOpenClawConfig(projectId, {
    openclawToken: input.credentials?.openclawToken,
    openclawGatewayUrl: input.credentials?.openclawGatewayUrl,
  });

  const outcome = generateOutcome(input.idea);
  await writeMemory({
    projectId,
    type: "architectural_decision",
    payload: {
      decision: "Outcome generated",
      rationale: JSON.stringify(outcome.recommendedArchitecture),
      impact: "Initial project setup",
    },
  });

  const memory = await getProjectSummary(projectId);
  const proposedTasks = input.proposedTasks ?? [
    {
      id: "task_1",
      title: "Initial implementation",
      description: `Implement app based on: ${input.idea}`,
      prompt: `Create a complete Expo/React Native app for: ${input.idea}. MVP features: ${outcome.mvpFeatures.slice(0, 3).join(", ")}. Use Vibecode template.`,
    },
  ];

  const decision = await evaluateDecision({
    idea: input.idea,
    proposedTasks,
    projectMemory: memory,
    mode,
  });

  logger.info("Orchestrator decision", {
    projectId,
    outcome: decision.outcome,
    approvedCount: decision.approvedTasks.length,
    postponedCount: decision.postponedTasks.length,
    reasoningCount: decision.reasoningLog.length,
  });

  return {
    outcome,
    decision,
    approvedTasks: decision.approvedTasks,
    postponedTasks: decision.postponedTasks,
    shouldProceed: decision.outcome !== "reject" && decision.approvedTasks.length > 0,
  };
}
