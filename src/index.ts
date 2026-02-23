import express from "express";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { registerCursorWebhook } from "./webhooks/cursor-webhook.js";
import { registerOpenClawWebhook } from "./webhooks/openclaw-webhook.js";
import { createProject, getNextTask, setCurrentAgentId } from "./services/task-manager.js";
import { getAllProjects, getProject, markCompleted } from "./services/task-manager.js";
import { launchAgent } from "./api/cursor-api.js";
import { sendToOpenClaw } from "./api/openclaw-api.js";
import { requestPlanFromOpenClaw } from "./webhooks/openclaw-bridge.js";
import { executeAppStoreUpload } from "./services/eas-controller.js";
import { startRequestSchema, approveRequestSchema } from "./validation/schemas.js";
import type { Task } from "./types/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "1mb" }));


app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "openclaw-cursor-orchestrator", version: "1.0.0" });
});

app.get("/projects", (_req, res) => {
  const projects = getAllProjects();
  res.json({ projects });
});

app.get("/projects/:projectId", (req, res) => {
  const state = getProject(req.params.projectId);
  if (!state) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({
    projectId: state.projectId,
    idea: state.idea,
    githubRepo: state.githubRepo,
    branch: state.branch,
    status: state.status,
    currentTaskIndex: state.currentIndex,
    totalTasks: state.tasks.length,
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    currentAgentId: state.currentAgentId,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  });
});

app.post("/start", async (req, res) => {
  try {
    const parseResult = startRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      res.status(400).json({ error: msg });
      return;
    }
    const { idea, githubRepo, branch = "main", tasks: providedTasks } = parseResult.data;

    let tasks: Task[];
    const filtered = providedTasks?.filter((t) => t.prompt || t.title) ?? [];
    if (filtered.length > 0) {
      tasks = filtered.map((t) => ({
        id: t.id ?? `task_${Math.random().toString(36).slice(2, 9)}`,
        title: t.title ?? "Task",
        description: t.description ?? "",
        prompt: t.prompt ?? t.title ?? idea,
      }));
    } else {
      await requestPlanFromOpenClaw(idea);
      tasks = [
        {
          id: "task_1",
          title: "Initial implementation",
          description: `Implement app based on: ${idea}`,
          prompt: `Create a complete Expo/React Native app for: ${idea}. Use the Vibecode template structure. Follow Apple HIG for design.`,
        },
      ];
    }

    const state = createProject({
      idea,
      githubRepo,
      branch,
      tasks,
    });

    const firstTask = getNextTask(state.projectId);
    if (!firstTask) {
      res.status(400).json({ error: "No tasks to execute" });
      return;
    }

    const env = getEnv();
    const agent = await launchAgent({
      prompt: firstTask.prompt,
      repo: githubRepo,
      branch,
      webhookSecret: env.CURSOR_WEBHOOK_SECRET,
    });
    setCurrentAgentId(state.projectId, agent.id);

    logger.info("Project started", {
      projectId: state.projectId,
      agentId: agent.id,
      taskCount: tasks.length,
    });

    res.status(202).json({
      projectId: state.projectId,
      agentId: agent.id,
      status: "running",
      message: "First agent launched. Webhook will be triggered on completion.",
    });
  } catch (err) {
    logger.error("Start failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.post("/approve", async (req, res) => {
  try {
    const parseResult = approveRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      res.status(400).json({ error: msg });
      return;
    }
    const { projectId } = parseResult.data;

    const state = getProject(projectId);
    if (!state) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (state.status !== "awaiting_approval") {
      res.status(400).json({
        error: `Project not awaiting approval. Current status: ${state.status}`,
      });
      return;
    }

    await executeAppStoreUpload(projectId);
    markCompleted(projectId);

    await sendToOpenClaw({
      message: `Proje ${projectId} App Store'a yüklendi.`,
      name: "Orchestrator",
    });

    res.json({
      projectId,
      status: "completed",
      message: "App Store upload initiated",
    });
  } catch (err) {
    logger.error("Approve failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

registerCursorWebhook(app);
registerOpenClawWebhook(app);

const webDistPath = path.join(__dirname, "..", "web", "dist");
if (existsSync(webDistPath)) {
  app.use(express.static(webDistPath, { index: false }));
  app.get("*", (req, res, next) => {
    const p = req.path;
    const isApi = p === "/health" || p === "/projects" || p === "/start" || p === "/approve" ||
      p.startsWith("/projects/") || p.startsWith("/webhooks/");
    if (!isApi) {
      res.sendFile(path.join(webDistPath, "index.html"), (err) => {
        if (err) next(err);
      });
    } else {
      next();
    }
  });
  logger.info("Serving web dashboard from " + webDistPath);
}

app.use((err: Error, _req: express.Request, res: express.Response) => {
  logger.error("Unhandled error", { error: err.message });
  res.status(500).json({ error: "Internal server error" });
});

async function main() {
  try {
    const env = getEnv();
    app.listen(env.PORT, () => {
      logger.info(`Orchestrator listening on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
