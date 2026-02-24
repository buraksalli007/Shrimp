import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { CursorWebhookPayload } from "../types/index.js";
import { getProjectByAgentId, getProjectMeta, getProject } from "../services/task-manager.js";
import { persistProject } from "../services/project-persistence.js";
import { verifyProject, cloneOrPullRepo } from "../services/verification-engine.js";
import { generateFixPrompt } from "../services/prompt-generator.js";
import { launchAgent } from "../api/cursor-api.js";
import { sendToOpenClaw } from "../api/openclaw-api.js";
import { writeMemory } from "../memory/index.js";
import { analyzeFailure } from "../failure-recovery/index.js";
import * as path from "path";
import * as os from "os";

function verifyWebhookSignature(req: Request, secret?: string): boolean {
  const sig = secret ?? getEnv().CURSOR_WEBHOOK_SECRET;
  if (!sig) return true;

  const signature = req.headers["x-webhook-signature"] as string | undefined;
  if (!signature) return false;

  const crypto = require("crypto");
  const payload = JSON.stringify(req.body);
  const expected = "sha256=" + crypto.createHmac("sha256", sig).update(payload).digest("hex");
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

  const { projectId, githubRepo, branch, tasks, currentIndex, userCredentials: creds } = state;
  const task = tasks[currentIndex];
  if (!task) {
    logger.warn("No current task", { projectId, currentIndex });
    return;
  }

  const workDir = path.join(os.tmpdir(), "orchestrator", projectId);
  let repoPath: string;

  const branchToVerify = cursorBranchName ?? branch;

  try {
    repoPath = await cloneOrPullRepo(githubRepo, branchToVerify, workDir, creds?.githubToken);
  } catch (err) {
    logger.error("Failed to clone repo", {
      projectId,
      error: err instanceof Error ? err.message : String(err),
    });
    await sendToOpenClaw(
      {
        message: `Repo clone error: ${err instanceof Error ? err.message : String(err)}. Project: ${projectId}`,
        name: "Orchestrator",
      },
      creds
    );
    return;
  }

  const env = getEnv();
  const failCount = env.SIMULATION_VERIFY_FAIL_COUNT ?? 0;
  const verificationResult = await verifyProject(repoPath, {
    simulationFailIteration: env.ORCHESTRATION_SIMULATION ? state.iteration : undefined,
    simulationFailCount: failCount > 0 ? failCount : undefined,
  });
  const { recordCompletion } = await import("../services/task-manager.js");
  const { nextTask, status: newStatus, shouldContinue } = recordCompletion(
    projectId,
    verificationResult
  );
  const updatedState = getProject(projectId);
  if (updatedState) {
    await persistProject(updatedState, getProjectMeta(projectId));
  }

  if (verificationResult.success) {
    await writeMemory({
      projectId,
      type: "implementation",
      payload: {
        taskId: task.id,
        promptUsed: task.prompt,
        verificationPassed: true,
        agentId,
      },
    });
  }

  if (newStatus === "awaiting_approval") {
    await sendToOpenClaw(
      {
        message: `App ready for approval. Send projectId via POST /approve: ${projectId}`,
        name: "Orchestrator",
      },
      creds
    );
    return;
  }

  if (newStatus === "failed") {
    await sendToOpenClaw(
      {
        message: `Project failed (max iterations exceeded): ${projectId}`,
        name: "Orchestrator",
      },
      creds
    );
    return;
  }

  if (!shouldContinue) return;

  let prompt: string;
  if (verificationResult.success && nextTask) {
    prompt = nextTask.prompt;
  } else {
    const failureAnalysis = analyzeFailure(
      verificationResult.errors,
      verificationResult.stderr,
      task.prompt,
      state.iteration
    );

    await writeMemory({
      projectId,
      type: "failed_fix",
      payload: {
        taskId: task.id,
        promptUsed: task.prompt,
        errorOutput: verificationResult.errors.join("\n"),
        category: failureAnalysis.category,
        attemptNumber: state.iteration,
      },
    });

    if (failureAnalysis.shouldEscalate && failureAnalysis.retryStrategy.action === "abort") {
      await sendToOpenClaw(
        {
          message: `Project ${projectId} aborted: ${failureAnalysis.rootCauseHint}. Environment/config issue.`,
          name: "Orchestrator",
        },
        creds
      );
      return;
    }

    const hasOpenClaw = !!(creds?.openclawToken || env.OPENCLAW_HOOKS_TOKEN);
    if (hasOpenClaw && (failureAnalysis.shouldEscalate || failureAnalysis.retryStrategy.action === "escalate")) {
      const { setPendingFix } = await import("../services/task-manager.js");
      const { requestFixFromOpenClaw } = await import("../webhooks/openclaw-bridge.js");
      setPendingFix(projectId);
      const pendingState = getProject(projectId);
      if (pendingState) await persistProject(pendingState, getProjectMeta(projectId));
      await requestFixFromOpenClaw(
        projectId,
        verificationResult.errors,
        task.prompt,
        verificationResult.stderr,
        creds
      );
      await sendToOpenClaw(
        {
          message: `Verification failed for ${projectId}. OpenClaw: research a fix and reply via webhook with { "projectId": "${projectId}", "type": "fix", "fixPrompt": "..." }`,
          name: "Orchestrator",
        },
        creds
      );
      return;
    }

    prompt = failureAnalysis.suggestedPrompt ?? (await generateFixPrompt(
      verificationResult.errors,
      task.prompt,
      verificationResult.stderr
    ));
  }

  const { setCurrentAgentId } = await import("../services/task-manager.js");

  try {
    const agent = await launchAgent({
      prompt,
      repo: githubRepo,
      branch,
      cursorApiKey: creds?.cursorApiKey,
      cursorWebhookSecret: creds?.cursorWebhookSecret ?? env.CURSOR_WEBHOOK_SECRET,
    });
    setCurrentAgentId(projectId, agent.id);
    const updated = getProject(projectId);
    if (updated) await persistProject(updated, getProjectMeta(projectId));
  } catch (err) {
    logger.error("Failed to launch Cursor agent", {
      error: err instanceof Error ? err.message : String(err),
    });
    await sendToOpenClaw(
      {
        message: `Cursor agent failed to launch: ${err instanceof Error ? err.message : String(err)}`,
        name: "Orchestrator",
      },
      creds
    );
  }
}

export function registerCursorWebhook(app: import("express").Express): void {
  app.post("/webhooks/cursor", async (req: Request, res: Response) => {
    logger.info("Cursor webhook received", {
      event: req.body?.event,
      agentId: req.body?.agentId,
      status: req.body?.status,
    });

    const body = req.body as CursorWebhookPayload;
    const agentIdForVerify = body.id ?? body.agentId;
    const projectState = agentIdForVerify ? getProjectByAgentId(agentIdForVerify) : undefined;
    const webhookSecret = projectState?.userCredentials?.cursorWebhookSecret ?? getEnv().CURSOR_WEBHOOK_SECRET;

    if (webhookSecret && !verifyWebhookSignature(req, webhookSecret)) {
      logger.warn("Invalid webhook signature", { agentId: agentIdForVerify });
      res.status(401).send();
      return;
    }

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
