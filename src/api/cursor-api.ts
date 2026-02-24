import { getEnv } from "../config/env.js";
import { CURSOR_API_BASE } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

export interface LaunchAgentParams {
  prompt: string;
  repo: string;
  branch?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  cursorApiKey?: string;
  cursorWebhookSecret?: string;
}

export interface LaunchAgentResponse {
  id: string;
  [key: string]: unknown;
}

export interface GetAgentResponse {
  id: string;
  status: string;
  summary?: string;
  [key: string]: unknown;
}

function getAuthHeader(cursorApiKey?: string): string {
  const key = cursorApiKey ?? getEnv().CURSOR_API_KEY;
  if (!key) {
    throw new Error("Cursor API key required. Provide credentials.cursorApiKey or set CURSOR_API_KEY in env.");
  }
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function launchAgent(params: LaunchAgentParams): Promise<LaunchAgentResponse> {
  const env = getEnv();
  if (env.ORCHESTRATION_SIMULATION) {
    const id = `sim_agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    logger.info("Simulation: mock agent launched", { agentId: id });
    return { id };
  }
  const webhookUrl = params.webhookUrl ?? `${env.ORCHESTRATION_URL}/webhooks/cursor`;
  const webhookSecret = params.cursorWebhookSecret ?? env.CURSOR_WEBHOOK_SECRET;

  const body: Record<string, unknown> = {
    prompt: { text: params.prompt },
    source: {
      repository: params.repo.startsWith("http")
        ? params.repo.replace(/\.git$/, "")
        : `https://github.com/${params.repo.replace(/\.git$/, "")}`,
      ref: params.branch ?? "main",
    },
    webhook: {
      url: webhookUrl,
      ...(webhookSecret && { secret: webhookSecret }),
    },
  };

  const response = await withRetry(async (): Promise<LaunchAgentResponse> => {
    const res = await fetch(`${CURSOR_API_BASE}/agents`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(params.cursorApiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cursor API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<LaunchAgentResponse>;
  });

  logger.info("Cursor agent launched", { agentId: response.id, repo: params.repo });
  return response;
}

export async function getAgent(agentId: string): Promise<GetAgentResponse> {
  return withRetry(async () => {
    const res = await fetch(`${CURSOR_API_BASE}/agents/${agentId}`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cursor API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<GetAgentResponse>;
  });
}

export async function addFollowup(agentId: string, prompt: string): Promise<{ id: string }> {
  const response = await withRetry(async () => {
    const res = await fetch(`${CURSOR_API_BASE}/agents/${agentId}/followup`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: { text: prompt } }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cursor API error ${res.status}: ${text}`);
    }
    return res.json();
  });
  return response as Promise<{ id: string }>;
}
