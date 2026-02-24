import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const ALLOWED_GATEWAY_PROTOCOLS = ["http:", "https:"];

function isValidGatewayUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (!ALLOWED_GATEWAY_PROTOCOLS.includes(u.protocol)) return false;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    const host = u.hostname.toLowerCase();
    if (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")) return false;
    return true;
  } catch {
    return false;
  }
}

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
  if (env.ORCHESTRATION_SIMULATION) {
    logger.info("Simulation: OpenClaw message (skipped)", { messageLength: payload.message?.length ?? 0 });
    return;
  }
  const token = credentialsOverride?.openclawToken ?? env.OPENCLAW_HOOKS_TOKEN;
  if (!token) {
    logger.info("OpenClaw: skipping (no token)");
    return;
  }
  let gatewayUrl = credentialsOverride?.openclawGatewayUrl ?? env.OPENCLAW_GATEWAY_URL;
  gatewayUrl = gatewayUrl.replace(/^ws/, "http").replace(/\/+$/, "");
  if (!isValidGatewayUrl(gatewayUrl)) {
    logger.warn("OpenClaw: invalid gateway URL (blocked)", { gatewayUrl: gatewayUrl.slice(0, 50) });
    throw new Error("Invalid OpenClaw gateway URL. Use http(s)://host:port. Internal IPs blocked.");
  }
  const url = `${gatewayUrl}/hooks/agent`;

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
