import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  getProject,
  markCompleted,
  updateProjectWithTasks,
  getNextTask,
  setCurrentAgentId,
  setProjectRunning,
} from "../services/task-manager.js";
import { executeAppStoreUpload } from "../services/eas-controller.js";
import { sendToOpenClaw } from "../api/openclaw-api.js";
import { launchAgent } from "../api/cursor-api.js";
import type { Task } from "../types/index.js";

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

function parseJsonTasksFromMessage(message: string): Task[] | null {
  const jsonMatch = message.match(/\[[\s\S]*?\{[\s\S]*?"(?:id|prompt|title)"[\s\S]*?\}[\s\S]*?\]/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((t, i) => {
      const o = t as Record<string, unknown>;
      return {
        id: (o.id as string) ?? `task_${i + 1}`,
        title: (o.title as string) ?? "Task",
        description: (o.description as string) ?? "",
        prompt: (o.prompt as string) ?? (o.title as string) ?? "",
      };
    });
  } catch {
    return null;
  }
}

function parseFixPromptFromMessage(message: string): string | null {
  const jsonMatch = message.match(/\{\s*"fixPrompt"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/);
  if (jsonMatch) {
    try {
      const str = jsonMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
      return str || null;
    } catch {
      return null;
    }
  }
  const codeMatch = message.match(/```(?:json)?\s*(\{[^`]*"fixPrompt"[^`]*\})\s*```/s);
  if (codeMatch) {
    try {
      const obj = JSON.parse(codeMatch[1].trim());
      return (obj.fixPrompt as string) ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

async function handlePlanCallback(projectId: string, tasks: Task[]): Promise<void> {
  const updated = updateProjectWithTasks(projectId, tasks);
  if (!updated) return;
  const state = getProject(projectId);
  if (!state) return;
  const firstTask = getNextTask(projectId);
  if (!firstTask) return;
  const env = getEnv();
  const creds = state.userCredentials;
  const agent = await launchAgent({
    prompt: firstTask.prompt,
    repo: state.githubRepo,
    branch: state.branch,
    cursorApiKey: creds?.cursorApiKey,
    cursorWebhookSecret: creds?.cursorWebhookSecret ?? env.CURSOR_WEBHOOK_SECRET,
  });
  setCurrentAgentId(projectId, agent.id);
  await sendToOpenClaw(
    {
      message: `Plan received. Cursor agent launched for ${projectId}.`,
      name: "Orchestrator",
    },
    creds
  );
  logger.info("Plan callback: launch agent", { projectId, agentId: agent.id });
}

async function handleFixCallback(projectId: string, fixPrompt: string): Promise<void> {
  const state = getProject(projectId);
  if (!state || state.status !== "pending_fix") return;
  setProjectRunning(projectId);
  const env = getEnv();
  const creds = state.userCredentials;
  const agent = await launchAgent({
    prompt: fixPrompt,
    repo: state.githubRepo,
    branch: state.branch,
    cursorApiKey: creds?.cursorApiKey,
    cursorWebhookSecret: creds?.cursorWebhookSecret ?? env.CURSOR_WEBHOOK_SECRET,
  });
  setCurrentAgentId(projectId, agent.id);
  await sendToOpenClaw(
    {
      message: `Fix prompt received. Cursor agent launched for ${projectId}.`,
      name: "Orchestrator",
    },
    creds
  );
  logger.info("Fix callback: launch agent", { projectId, agentId: agent.id });
}

export function registerOpenClawWebhook(app: import("express").Express): void {
  app.post("/webhooks/openclaw", async (req: Request, res: Response) => {
    if (!verifyOpenClawToken(req)) {
      logger.warn("OpenClaw webhook: invalid token");
      res.status(401).send();
      return;
    }

    const body = req.body as {
      message?: string;
      projectId?: string;
      type?: "plan" | "approval" | "fix";
      tasks?: unknown[];
      fixPrompt?: string;
    };
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

    if (body.type === "plan" && Array.isArray(body.tasks) && body.tasks.length > 0) {
      const tasks: Task[] = body.tasks.map((t, i) => {
        const o = t as Record<string, unknown>;
        return {
          id: (o.id as string) ?? `task_${i + 1}`,
          title: (o.title as string) ?? "Task",
          description: (o.description as string) ?? "",
          prompt: (o.prompt as string) ?? (o.title as string) ?? "",
        };
      });
      res.status(202).json({ status: "processing", projectId, type: "plan" });
      setImmediate(() => handlePlanCallback(projectId, tasks).catch((e) => logger.error("Plan callback failed", { error: String(e) })));
      return;
    }

    if (body.type === "fix" && body.fixPrompt) {
      res.status(202).json({ status: "processing", projectId, type: "fix" });
      setImmediate(() => handleFixCallback(projectId, body.fixPrompt!).catch((e) => logger.error("Fix callback failed", { error: String(e) })));
      return;
    }

    if (state.status === "pending_plan") {
      const tasks = parseJsonTasksFromMessage(message);
      if (tasks && tasks.length > 0) {
        res.status(202).json({ status: "processing", projectId, type: "plan" });
        setImmediate(() => handlePlanCallback(projectId, tasks).catch((e) => logger.error("Plan callback failed", { error: String(e) })));
        return;
      }
    }

    if (state.status === "pending_fix") {
      const fixPrompt = body.fixPrompt ?? parseFixPromptFromMessage(message);
      if (fixPrompt) {
        res.status(202).json({ status: "processing", projectId, type: "fix" });
        setImmediate(() => handleFixCallback(projectId, fixPrompt).catch((e) => logger.error("Fix callback failed", { error: String(e) })));
        return;
      }
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
