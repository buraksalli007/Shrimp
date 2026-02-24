import type { IAgent, AgentRequest, AgentResponse } from "../agent-interface.js";
import { sendToOpenClaw } from "../../api/openclaw-api.js";

export interface OpenClawAdapterConfig {
  openclawToken?: string;
  openclawGatewayUrl?: string;
}

const configs = new Map<string, OpenClawAdapterConfig>();

export function setOpenClawConfig(projectId: string, config: OpenClawAdapterConfig): void {
  configs.set(projectId, config);
}

export function getOpenClawConfig(projectId: string): OpenClawAdapterConfig | undefined {
  return configs.get(projectId);
}

export const OpenClawPlanningAgent: IAgent = {
  capability: "planning",
  async execute(request: AgentRequest): Promise<AgentResponse> {
    const config = configs.get(request.projectId);
    const creds = config
      ? { openclawToken: config.openclawToken, openclawGatewayUrl: config.openclawGatewayUrl }
      : undefined;

    const enrichedPrompt = request.context.memorySummary
      ? `Avoid these previous failures:\n${request.context.memorySummary.failedFixPatterns.join("\n")}\n\n---\n\n${request.prompt}`
      : request.prompt;

    try {
      await sendToOpenClaw(
        {
          message: enrichedPrompt,
          name: "Orchestrator",
          timeoutSeconds: 180,
        },
        creds
      );
      return {
        success: true,
        output: "Plan request sent to OpenClaw. Response will arrive via webhook.",
        metadata: { async: true },
      };
    } catch (err) {
      return {
        success: false,
        output: err instanceof Error ? err.message : String(err),
        metadata: { error: "send_failed" },
      };
    }
  },
};

export const OpenClawResearchAgent: IAgent = {
  capability: "research",
  async execute(request: AgentRequest): Promise<AgentResponse> {
    return OpenClawPlanningAgent.execute(request);
  },
};
