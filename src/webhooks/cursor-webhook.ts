import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { CursorWebhookPayload } from "../types/index.js";
import { getProjectByAgentId } from "../services/task-manager.js";
import { verifyProject, cloneOrPullRepo } from "../services/verification-engine.js";
import { generateFixPrompt } from "../services/prompt-generator.js";
import { launchAgent } from "../api/cursor-api.js";
import { sendToOpenClaw } from "../api/openclaw-api.js";
import * as path from "path";
import * as os from "os";

function verifyWebhookSignature(req: Request): boolean {
  const secret = getEnv().CURSOR_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers["x-webhook-signature"] as string | undefined;
  if (!signature) return false;

  const crypto = require("crypto");
  const payload = JSON.stringify(req.body);
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}

export async function handleAgentComplete(
  agentId: string,
  status: string,
  summary?: string,
  cursorBranchName?: string
): Promise<void> {
  logger.info("Agent complete - starting verification", {
    agentId,
    status,
    summaryLength: summary?.length ?? 0,
  });

  const state = getProjectByAgentId(agentId);
  if (!state) {
    logger.warn("No project found for agent", { agentId });
    return;
  }

  const { projectId, githubRepo, branch, tasks, currentIndex } = state;
  const task = tasks[currentIndex];
  if (!task) {
    logger.warn("No current task", { projectId, currentIndex });
    return;
  }

  const workDir = path.join(os.tmpdir(), "orchestrator", projectId);
  let repoPath: string;

  const branchToVerify = cursorBranchName ?? branch;

  try {
    repoPath = await cloneOrPullRepo(githubRepo, branchToVerify, workDir);
  } catch (err) {
    logger.error("Failed to clone repo", {
      projectId,
      error: err instanceof Error ? err.message : String(err),
    });
    await sendToOpenClaw({
      message: `Repo clone error: ${err instanceof Error ? err.message : String(err)}. Project: ${projectId}`,
      name: "Orchestrator",
    });
    return;
  }

  const verificationResult = await verifyProject(repoPath);
  const { recordCompletion } = await import("../services/task-manager.js");
  const { nextTask, status: newStatus, shouldContinue } = recordCompletion(
    projectId,
    verificationResult
  );

  if (newStatus === "awaiting_approval") {
    await sendToOpenClaw({
      message: `App ready for approval. Send projectId via POST /approve: ${projectId}`,
      name: "Orchestrator",
    });
    return;
  }

  if (newStatus === "failed") {
    await sendToOpenClaw({
      message: `Project failed (max iterations exceeded): ${projectId}`,
      name: "Orchestrator",
    });
    return;
  }

  if (!shouldContinue) return;

  let prompt: string;
  if (verificationResult.success && nextTask) {
    prompt = nextTask.prompt;
  } else {
    const env = getEnv();
    if (env.OPENCLAW_HOOKS_TOKEN) {
      const { setPendingFix } = await import("../services/task-manager.js");
      const { requestFixFromOpenClaw } = await import("../webhooks/openclaw-bridge.js");
      setPendingFix(projectId);
      await requestFixFromOpenClaw(
        projectId,
        verificationResult.errors,
        task.prompt,
        verificationResult.stderr
      );
      await sendToOpenClaw({
        message: `Verification failed for ${projectId}. OpenClaw: research a fix and reply via webhook with { "projectId": "${projectId}", "type": "fix", "fixPrompt": "..." }`,
        name: "Orchestrator",
      });
      return;
    }
    prompt = await generateFixPrompt(
      verificationResult.errors,
      task.prompt,
      verificationResult.stderr
    );
  }

  const env = getEnv();
  const { setCurrentAgentId } = await import("../services/task-manager.js");

  try {
    const agent = await launchAgent({
      prompt,
      repo: githubRepo,
      branch,
      webhookSecret: env.CURSOR_WEBHOOK_SECRET,
    });
    setCurrentAgentId(projectId, agent.id);
  } catch (err) {
    logger.error("Failed to launch Cursor agent", {
      error: err instanceof Error ? err.message : String(err),
    });
    await sendToOpenClaw({
      message: `Cursor agent failed to launch: ${err instanceof Error ? err.message : String(err)}`,
      name: "Orchestrator",
    });
  }
}

export function registerCursorWebhook(app: import("express").Express): void {
  app.post("/webhooks/cursor", async (req: Request, res: Response) => {
    logger.info("Cursor webhook received", {
      event: req.body?.event,
      agentId: req.body?.agentId,
      status: req.body?.status,
    });

    if (getEnv().CURSOR_WEBHOOK_SECRET && !verifyWebhookSignature(req)) {
      logger.warn("Invalid webhook signature", { agentId: req.body?.agentId });
      res.status(401).send();
      return;
    }

    const body = req.body as CursorWebhookPayload;
    const event = body.event;
    const agentId = body.id ?? body.agentId;
    const status = body.status;

    if (event !== "statusChange" || !agentId || !["FINISHED", "ERROR"].includes(status ?? "")) {
      res.status(200).send();
      return;
    }

    res.status(200).send();

    setImmediate(() => {
      handleAgentComplete(agentId, status!, body.summary, body.target?.branchName).catch((err) => {
        logger.error("handleAgentComplete failed", {
          error: err instanceof Error ? err.message : String(err),
          agentId,
        });
      });
    });
  });
}
