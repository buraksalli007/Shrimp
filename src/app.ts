import express from "express";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { registerCursorWebhook } from "./webhooks/cursor-webhook.js";
import { registerOpenClawWebhook } from "./webhooks/openclaw-webhook.js";
import { createProject, getNextTask, setCurrentAgentId, getAllProjects, getProject, markCompleted, getProjectMeta } from "./services/task-manager.js";
import { persistProject } from "./services/project-persistence.js";
import { getAgent } from "./agent-router/index.js";
import { getProjectSummary } from "./memory/index.js";
import { sendToOpenClaw } from "./api/openclaw-api.js";
import { requestPlanFromOpenClaw } from "./webhooks/openclaw-bridge.js";
import { runOrchestratorFlow } from "./core/orchestrator.js";
import { setCursorConfig, setOpenClawConfig } from "./agent-router/index.js";
import { executeAppStoreUpload } from "./services/eas-controller.js";
import { startRequestSchema, approveRequestSchema } from "./validation/schemas.js";
import { requireApiKey, requireAuth } from "./middleware/auth.js";
import { securityMiddleware } from "./middleware/security.js";
import type { Task } from "./types/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const { limiter, helmet } = securityMiddleware();

app.use(helmet);
app.use((_req, res, next) => {
  const origin = getEnv().CORS_ORIGIN || "*";
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const { handleStripeWebhook } = await import("./webhooks/stripe-webhook.js");
    await handleStripeWebhook(req, res);
  }
);

app.use(express.json({ limit: "1mb" }));
app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "openclaw-cursor-orchestrator", version: "1.0.0" });
});

app.get("/status", (_req, res) => {
  const env = getEnv();
  const apiKeys = env.API_KEYS?.split(",").map((k) => k.trim()).filter(Boolean) ?? [];
  res.json({
    status: "ok",
    cursorConfigured: !!env.CURSOR_API_KEY,
    openclawConfigured: !!env.OPENCLAW_HOOKS_TOKEN,
    githubConfigured: !!env.GITHUB_TOKEN,
    apiKeysRequired: apiKeys.length > 0,
    stripeConfigured: !!env.STRIPE_SECRET_KEY,
  });
});

app.get("/projects", requireApiKey, (req, res) => {
  const auth = (req as { auth?: { userId: string; apiKeyId: string } }).auth;
  const filter = auth ? { userId: auth.userId, apiKeyId: auth.apiKeyId } : undefined;
  const projects = getAllProjects(filter);
  res.json({ projects });
});

app.get("/projects/:projectId", requireApiKey, (req, res) => {
  const state = getProject(req.params.projectId);
  if (!state) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const auth = (req as { auth?: { userId: string; apiKeyId: string } }).auth;
  if (auth) {
    const meta = getProjectMeta(state.projectId);
    const owns = meta?.userId === auth.userId || meta?.apiKeyId === auth.apiKeyId;
    if (!owns) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
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
    autonomyMode: state.autonomyMode,
    outcomeJson: state.outcomeJson,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  });
});

app.get("/outcome", requireApiKey, async (req, res) => {
  const idea = req.query.idea as string;
  if (!idea?.trim()) {
    res.status(400).json({ error: "idea query param required" });
    return;
  }
  const { generateOutcome } = await import("./outcome-workflow/index.js");
  const outcome = generateOutcome(idea);
  res.json(outcome);
});

app.get("/projects/:projectId/memory", requireApiKey, async (req, res) => {
  const state = getProject(req.params.projectId);
  if (!state) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const authMem = (req as { auth?: { userId: string; apiKeyId: string } }).auth;
  if (authMem) {
    const meta = getProjectMeta(state.projectId);
    const owns = meta?.userId === authMem.userId || meta?.apiKeyId === authMem.apiKeyId;
    if (!owns) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }
  const { getProjectSummary } = await import("./memory/index.js");
  const summary = await getProjectSummary(state.projectId);
  res.json(summary);
});

app.post("/start", requireApiKey, async (req, res) => {
  try {
    const parseResult = startRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      res.status(400).json({ error: msg });
      return;
    }
    const { idea, githubRepo, branch = "main", platform = "cursor", autonomyMode = "builder", tasks: providedTasks, credentials } = parseResult.data;

    const creds = credentials && (credentials.cursorApiKey || credentials.openclawToken)
      ? {
          cursorApiKey: credentials.cursorApiKey,
          cursorWebhookSecret: credentials.cursorWebhookSecret,
          openclawToken: credentials.openclawToken,
          openclawGatewayUrl: credentials.openclawGatewayUrl,
          githubToken: credentials.githubToken,
        }
      : undefined;

    const filtered = providedTasks?.filter((t) => t.prompt || t.title) ?? [];
    const proposedTasks: Task[] = filtered.length > 0
      ? filtered.map((t) => ({
          id: t.id ?? `task_${Math.random().toString(36).slice(2, 9)}`,
          title: t.title ?? "Task",
          description: t.description ?? "",
          prompt: t.prompt ?? t.title ?? idea,
        }))
      : [];

    const orchestratorResult = await runOrchestratorFlow("_preview", {
      idea,
      githubRepo,
      branch,
      proposedTasks: proposedTasks.length > 0 ? proposedTasks : undefined,
      autonomyMode: autonomyMode as "assist" | "builder" | "autopilot",
      credentials: creds,
    });

    if (autonomyMode === "assist") {
      res.status(200).json({
        mode: "assist",
        outcome: orchestratorResult.outcome,
        decision: orchestratorResult.decision,
        message: "Suggestions only. Switch to builder or autopilot to execute.",
      });
      return;
    }

    const tasks = orchestratorResult.approvedTasks.length > 0
      ? orchestratorResult.approvedTasks
      : [
          {
            id: "task_1",
            title: "Initial implementation",
            description: `Implement app based on: ${idea}`,
            prompt: `Create a complete Expo/React Native app for: ${idea}. Use the Vibecode template structure. Follow Apple HIG for design.`,
          },
        ];

    const useOpenClawPlan = !!(creds?.openclawToken || getEnv().OPENCLAW_HOOKS_TOKEN);
    const hasCursorKey = creds?.cursorApiKey || getEnv().CURSOR_API_KEY;

    if (!useOpenClawPlan && !hasCursorKey) {
      res.status(400).json({
        error: "Cursor API key required",
        message: "Add your Cursor API key in credentials, or set CURSOR_API_KEY in server .env. Get it from Cursor Dashboard > Integrations.",
      });
      return;
    }

    const auth = (req as { auth?: { userId: string; apiKeyId: string } }).auth;
    const state = createProject({
      idea,
      githubRepo,
      branch,
      tasks,
      status: useOpenClawPlan ? "pending_plan" : "running",
      userCredentials: creds,
      platform,
      autonomyMode: autonomyMode as "assist" | "builder" | "autopilot",
      outcomeJson: orchestratorResult.outcome ? JSON.stringify(orchestratorResult.outcome) : undefined,
      userId: auth?.userId,
      apiKeyId: auth?.apiKeyId,
    });

    setCursorConfig(state.projectId, {
      repo: githubRepo,
      branch,
      cursorApiKey: creds?.cursorApiKey,
      cursorWebhookSecret: creds?.cursorWebhookSecret ?? getEnv().CURSOR_WEBHOOK_SECRET,
    });
    setOpenClawConfig(state.projectId, {
      openclawToken: creds?.openclawToken,
      openclawGatewayUrl: creds?.openclawGatewayUrl,
    });

    await persistProject(state, getProjectMeta(state.projectId));

    if (useOpenClawPlan) {
      await requestPlanFromOpenClaw(idea, state.projectId, creds);
      logger.info("Project created, awaiting OpenClaw plan", {
        projectId: state.projectId,
      });
      res.status(202).json({
        projectId: state.projectId,
        status: "pending_plan",
        message: "OpenClaw will research and send plan. Reply via POST /webhooks/openclaw with { projectId, type: 'plan', tasks: [...] }",
      });
      return;
    }

    const firstTask = getNextTask(state.projectId);
    if (!firstTask) {
      res.status(400).json({ error: "No tasks to execute" });
      return;
    }

    const codingAgent = getAgent("coding");
    if (!codingAgent) {
      res.status(503).json({ error: "Coding agent not available" });
      return;
    }

    const memorySummary = await getProjectSummary(state.projectId);
    const result = await codingAgent.execute({
      projectId: state.projectId,
      capability: "coding",
      prompt: firstTask.prompt,
      context: {
        memorySummary,
        mode: (state.autonomyMode ?? "builder") as "assist" | "builder" | "autopilot",
      },
    });

    if (!result.success || !result.metadata?.agentId) {
      res.status(500).json({
        error: result.output ?? "Failed to launch agent",
      });
      return;
    }

    setCurrentAgentId(state.projectId, result.metadata.agentId as string);
    const runningState = getProject(state.projectId);
    if (runningState) await persistProject(runningState, getProjectMeta(state.projectId));

    logger.info("Project started", {
      projectId: state.projectId,
      agentId: result.metadata.agentId,
      taskCount: tasks.length,
    });

    res.status(202).json({
      projectId: state.projectId,
      agentId: result.metadata.agentId,
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

app.post("/approve", requireApiKey, async (req, res) => {
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
    const authApprove = (req as { auth?: { userId: string; apiKeyId: string } }).auth;
    if (authApprove) {
      const meta = getProjectMeta(projectId);
      const owns = meta?.userId === authApprove.userId || meta?.apiKeyId === authApprove.apiKeyId;
      if (!owns) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
    }

    if (state.status !== "awaiting_approval") {
      res.status(400).json({
        error: `Project not awaiting approval. Current status: ${state.status}`,
      });
      return;
    }

    await executeAppStoreUpload(projectId);
    markCompleted(projectId);
    const completedState = getProject(projectId);
    if (completedState) await persistProject(completedState, getProjectMeta(projectId));

    await sendToOpenClaw({
      message: `Project ${projectId} uploaded to App Store.`,
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

app.post("/auth/register", async (req, res) => {
  const { handleRegister } = await import("./routes/auth.js");
  await handleRegister(req, res);
});

app.post("/auth/login", async (req, res) => {
  const { handleLogin } = await import("./routes/auth.js");
  await handleLogin(req, res);
});

app.get("/auth/me", requireApiKey, requireAuth, async (req, res) => {
  const { handleMe } = await import("./routes/auth.js");
  await handleMe(req, res);
});

app.post("/auth/keys", requireApiKey, requireAuth, async (req, res) => {
  const { handleCreateApiKey } = await import("./routes/auth.js");
  await handleCreateApiKey(req, res);
});

app.get("/auth/keys", requireApiKey, requireAuth, async (req, res) => {
  const { handleListApiKeys } = await import("./routes/auth.js");
  await handleListApiKeys(req, res);
});

app.delete("/auth/keys/:keyId", requireApiKey, requireAuth, async (req, res) => {
  const { handleRevokeApiKey } = await import("./routes/auth.js");
  await handleRevokeApiKey(req, res);
});

app.post("/checkout", requireApiKey, requireAuth, async (req, res) => {
  const { createCheckoutSession } = await import("./routes/checkout.js");
  await createCheckoutSession(req, res);
});

registerCursorWebhook(app);
registerOpenClawWebhook(app);
const { registerStripeWebhook } = await import("./webhooks/stripe-webhook.js");
registerStripeWebhook(app);

const webDistPath = path.join(__dirname, "..", "web", "dist");
if (existsSync(webDistPath)) {
  app.use(express.static(webDistPath, { index: false }));
  app.get("*", (req, res, next) => {
    const p = req.path;
    const isApi =
      p === "/health" || p === "/status" || p === "/projects" || p === "/outcome" || p === "/start" || p === "/approve" ||
      p === "/checkout" || p.startsWith("/projects/") || p.startsWith("/webhooks/") || p.startsWith("/auth/");
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

export default app;
