import type { TaskState, Task } from "../types/index.js";

async function getPrisma() {
  try {
    const { prisma } = await import("../lib/db.js");
    return prisma;
  } catch {
    return null;
  }
}

export async function loadProjectsFromDb(): Promise<void> {
  const prisma = await getPrisma();
  if (!prisma) return;
  try {
    const rows = await prisma.project.findMany();
    const { hydrateProjectStates } = await import("./task-manager.js");
    for (const row of rows) {
      hydrateProjectStates({
        projectId: row.projectId,
        idea: row.idea,
        githubRepo: row.githubRepo,
        branch: row.branch,
        tasks: JSON.parse(row.tasksJson) as Task[],
        currentIndex: row.currentIndex,
        iteration: row.iteration,
        maxIterations: row.maxIterations,
        status: row.status as TaskState["status"],
        currentAgentId: row.currentAgentId ?? undefined,
        platform: row.platform,
        autonomyMode: row.autonomyMode as TaskState["autonomyMode"],
        outcomeJson: row.outcomeJson ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        userId: row.userId ?? undefined,
        apiKeyId: row.apiKeyId ?? undefined,
      });
    }
  } catch (err) {
    console.warn("Project load from DB failed:", err);
  }
}

export async function persistProject(
  state: TaskState,
  meta?: { userId?: string; apiKeyId?: string }
): Promise<void> {
  const prisma = await getPrisma();
  if (!prisma) return;
  const userId = meta?.userId;
  const apiKeyId = meta?.apiKeyId;
  try {
    await prisma.project.upsert({
      where: { projectId: state.projectId },
      create: {
        projectId: state.projectId,
        userId: userId ?? null,
        apiKeyId: apiKeyId ?? null,
        idea: state.idea,
        githubRepo: state.githubRepo,
        branch: state.branch,
        status: state.status,
        tasksJson: JSON.stringify(state.tasks),
        currentIndex: state.currentIndex,
        iteration: state.iteration,
        maxIterations: state.maxIterations,
        currentAgentId: state.currentAgentId ?? null,
        platform: state.platform ?? "cursor",
        autonomyMode: state.autonomyMode ?? "builder",
        outcomeJson: state.outcomeJson ?? null,
      },
      update: {
        status: state.status,
        tasksJson: JSON.stringify(state.tasks),
        currentIndex: state.currentIndex,
        iteration: state.iteration,
        currentAgentId: state.currentAgentId ?? null,
        updatedAt: state.updatedAt,
      },
    });
  } catch (err) {
    console.warn("Project persist failed:", err);
  }
}

export async function getProjectIdsByUserId(userId: string): Promise<string[]> {
  const prisma = await getPrisma();
  if (!prisma) return [];
  try {
    const rows = await prisma.project.findMany({
      where: { userId },
      select: { projectId: true },
    });
    return rows.map((r) => r.projectId);
  } catch {
    return [];
  }
}

export async function getProjectIdsByApiKeyId(apiKeyId: string): Promise<string[]> {
  const prisma = await getPrisma();
  if (!prisma) return [];
  try {
    const rows = await prisma.project.findMany({
      where: { apiKeyId },
      select: { projectId: true },
    });
    return rows.map((r) => r.projectId);
  } catch {
    return [];
  }
}
