import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { getProject, markCompleted } from "../services/task-manager.js";
import { executeAppStoreUpload } from "../services/eas-controller.js";
import { sendToOpenClaw } from "../api/openclaw-api.js";

const APPROVAL_KEYWORDS = ["onay", "onayla", "approve", "onaylıyorum", "onaylı", "tamam", "kabul"];

function verifyOpenClawToken(req: Request): boolean {
  const token = getEnv().OPENCLAW_HOOKS_TOKEN;
  if (!token) return true;
  const auth = req.headers.authorization ?? req.headers["x-openclaw-token"];
  if (typeof auth === "string") {
    return auth === `Bearer ${token}` || auth === token;
  }
  return false;
}

function extractProjectIdFromMessage(message: string): string | null {
  const match = message.match(/proj_[a-z0-9_]+/i);
  return match ? match[0] : null;
}

function isApprovalMessage(message: string): boolean {
  const lower = message.toLowerCase().trim();
  return APPROVAL_KEYWORDS.some((k) => lower.includes(k));
}

export function registerOpenClawWebhook(app: import("express").Express): void {
  app.post("/webhooks/openclaw", async (req: Request, res: Response) => {
    if (!verifyOpenClawToken(req)) {
      logger.warn("OpenClaw webhook: invalid token");
      res.status(401).send();
      return;
    }

    const body = req.body as { message?: string; projectId?: string };
    const message = (body.message ?? "").trim();
    const projectId = body.projectId ?? extractProjectIdFromMessage(message);

    if (!projectId) {
      res.status(400).json({ error: "projectId or message with projectId required" });
      return;
    }

    const state = getProject(projectId);
    if (!state) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (state.status !== "awaiting_approval") {
      res.status(400).json({
        error: `Project not awaiting approval. Status: ${state.status}`,
      });
      return;
    }

    if (!body.projectId && !isApprovalMessage(message)) {
      res.status(400).json({ error: "Approval message or projectId required" });
      return;
    }

    res.status(202).json({ status: "processing", projectId });

    setImmediate(async () => {
      try {
        await executeAppStoreUpload(projectId);
        markCompleted(projectId);
        await sendToOpenClaw({
          message: `Project ${projectId} uploaded to App Store.`,
          name: "Orchestrator",
        });
        logger.info("App Store upload completed via OpenClaw webhook", { projectId });
      } catch (err) {
        logger.error("App Store upload failed via OpenClaw webhook", {
          projectId,
          error: err instanceof Error ? err.message : String(err),
        });
        await sendToOpenClaw({
          message: `App Store upload failed (${projectId}): ${err instanceof Error ? err.message : String(err)}`,
          name: "Orchestrator",
        });
      }
    });
  });
}
