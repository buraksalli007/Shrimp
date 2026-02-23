import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

export interface OpenClawAgentPayload {
  message: string;
  name?: string;
  agentId?: string;
  model?: string;
  channel?: string;
  deliver?: boolean;
  wakeMode?: "now" | "next-heartbeat";
  timeoutSeconds?: number;
}

export async function sendToOpenClaw(payload: OpenClawAgentPayload): Promise<void> {
  const env = getEnv();
  if (!env.OPENCLAW_HOOKS_TOKEN) {
    throw new Error("OPENCLAW_HOOKS_TOKEN is required for OpenClaw API");
  }
  const url = `${env.OPENCLAW_GATEWAY_URL.replace(/^ws/, "http")}/hooks/agent`;

  const body: OpenClawAgentPayload = {
    ...payload,
    message: payload.message,
    name: payload.name ?? "Orchestrator",
    agentId: payload.agentId ?? env.OPENCLAW_AGENT_ID,
    wakeMode: payload.wakeMode ?? "now",
    deliver: payload.deliver ?? true,
  };

  await withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENCLAW_HOOKS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenClaw API error ${res.status}: ${text}`);
    }
  });

  logger.info("Message sent to OpenClaw", { name: body.name, messageLength: payload.message.length });
}
