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

export interface OpenClawCredentialsOverride {
  openclawToken?: string;
  openclawGatewayUrl?: string;
}

export async function sendToOpenClaw(
  payload: OpenClawAgentPayload,
  credentialsOverride?: OpenClawCredentialsOverride
): Promise<void> {
  const env = getEnv();
  const token = credentialsOverride?.openclawToken ?? env.OPENCLAW_HOOKS_TOKEN;
  if (!token) {
    logger.info("OpenClaw: skipping (no token)");
    return;
  }
  const gatewayUrl = credentialsOverride?.openclawGatewayUrl ?? env.OPENCLAW_GATEWAY_URL;
  const url = `${gatewayUrl.replace(/^ws/, "http")}/hooks/agent`;

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
        "Authorization": `Bearer ${token}`,
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
