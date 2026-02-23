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

function getAuthHeader(): string {
  const env = getEnv();
  if (!env.CURSOR_API_KEY) {
    throw new Error("CURSOR_API_KEY is required for Cursor API");
  }
  const encoded = Buffer.from(`${env.CURSOR_API_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function launchAgent(params: LaunchAgentParams): Promise<LaunchAgentResponse> {
  const env = getEnv();
  const webhookUrl = params.webhookUrl ?? `${env.ORCHESTRATION_URL}/webhooks/cursor`;

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
      ...(params.webhookSecret && { secret: params.webhookSecret }),
    },
  };

  const response = await withRetry(async (): Promise<LaunchAgentResponse> => {
    const res = await fetch(`${CURSOR_API_BASE}/agents`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
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
