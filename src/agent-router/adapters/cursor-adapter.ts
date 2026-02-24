import type { IAgent, AgentRequest, AgentResponse } from "../agent-interface.js";
import { launchAgent } from "../../api/cursor-api.js";
import { getEnv } from "../../config/env.js";

export interface CursorAdapterConfig {
  repo: string;
  branch?: string;
  cursorApiKey?: string;
  cursorWebhookSecret?: string;
}

const configs = new Map<string, CursorAdapterConfig>();

export function setCursorConfig(projectId: string, config: CursorAdapterConfig): void {
  configs.set(projectId, config);
}

export function getCursorConfig(projectId: string): CursorAdapterConfig | undefined {
  return configs.get(projectId);
}

export const CursorCodingAgent: IAgent = {
  capability: "coding",
  async execute(request: AgentRequest): Promise<AgentResponse> {
    const config = configs.get(request.projectId);
    if (!config) {
      const env = getEnv();
      return {
        success: false,
        output: "Cursor config not set for project. Provide repo, branch, and credentials.",
        metadata: { error: "missing_config" },
      };
    }

    try {
      const enrichedPrompt = request.context.memorySummary
        ? `Context from previous work:\n${request.context.memorySummary.architectureDecisions.join("\n")}\n\nPrevious failures to avoid:\n${request.context.memorySummary.failedFixPatterns.join("\n")}\n\n---\n\n${request.prompt}`
        : request.prompt;

      const result = await launchAgent({
        prompt: enrichedPrompt,
        repo: config.repo,
        branch: config.branch,
        cursorApiKey: config.cursorApiKey,
        cursorWebhookSecret: config.cursorWebhookSecret,
      });

      return {
        success: true,
        output: result.id,
        metadata: { agentId: result.id },
      };
    } catch (err) {
      return {
        success: false,
        output: err instanceof Error ? err.message : String(err),
        metadata: { error: "launch_failed" },
      };
    }
  },
};
