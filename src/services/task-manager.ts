import type {
  Task,
  TaskState,
  TaskStatus,
  VerificationResult,
  UserCredentialsOverride,
  AutonomyMode,
} from "../types/index.js";
import { DEFAULT_MAX_ITERATIONS } from "../config/constants.js";

const projectStates = new Map<string, TaskState>();
const projectMeta = new Map<string, { userId?: string; apiKeyId?: string }>();

export function resetForTesting(): void {
  if (process.env.NODE_ENV !== "test") return;
  projectStates.clear();
  projectMeta.clear();
}

export function hydrateProjectStates(params: {
  projectId: string;
  idea: string;
  githubRepo: string;
  branch: string;
  tasks: Task[];
  currentIndex: number;
  iteration: number;
  maxIterations: number;
  status: TaskStatus;
  currentAgentId?: string;
  platform?: string;
  autonomyMode?: AutonomyMode;
  outcomeJson?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  apiKeyId?: string;
}): void {
  const { userId, apiKeyId, ...rest } = params;
  const state: TaskState = {
    ...rest,
    userCredentials: undefined,
  };
  projectStates.set(params.projectId, state);
  if (userId || apiKeyId) {
    projectMeta.set(params.projectId, { userId, apiKeyId });
  }
}

function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createProject(params: {
  idea: string;
  githubRepo: string;
  branch?: string;
  tasks: Task[];
  maxIterations?: number;
  status?: TaskStatus;
  userCredentials?: UserCredentialsOverride;
  platform?: string;
  autonomyMode?: AutonomyMode;
  outcomeJson?: string;
  userId?: string;
  apiKeyId?: string;
}): TaskState {
  const projectId = generateProjectId();
  const now = new Date();
  const state: TaskState = {
    projectId,
    idea: params.idea,
    githubRepo: params.githubRepo,
    branch: params.branch ?? "main",
    tasks: params.tasks,
    currentIndex: 0,
    iteration: 0,
    maxIterations: params.maxIterations ?? DEFAULT_MAX_ITERATIONS,
    status: params.status ?? "running",
    userCredentials: params.userCredentials,
    platform: params.platform ?? "cursor",
    autonomyMode: params.autonomyMode ?? "builder",
    outcomeJson: params.outcomeJson,
    createdAt: now,
    updatedAt: now,
  };
  projectStates.set(projectId, state);
  if (params.userId || params.apiKeyId) {
    projectMeta.set(projectId, { userId: params.userId, apiKeyId: params.apiKeyId });
  }
  return state;
}

export function getProjectMeta(projectId: string): { userId?: string; apiKeyId?: string } | undefined {
  return projectMeta.get(projectId);
}

export function getProject(projectId: string): TaskState | undefined {
  return projectStates.get(projectId);
}

export function getAllProjects(filter?: { userId?: string; apiKeyId?: string }): Array<Pick<TaskState, "projectId" | "idea" | "status" | "createdAt">> {
  const all = Array.from(projectStates.values()).map((s) => ({
    projectId: s.projectId,
    idea: s.idea,
    status: s.status,
    createdAt: s.createdAt,
  }));
  if (!filter?.userId && !filter?.apiKeyId) return all;
  return all.filter((p) => {
    const meta = projectMeta.get(p.projectId);
    if (filter.userId && meta?.userId === filter.userId) return true;
    if (filter.apiKeyId && meta?.apiKeyId === filter.apiKeyId) return true;
    return false;
  });
}

export function getProjectByAgentId(agentId: string): TaskState | undefined {
  for (const state of projectStates.values()) {
    if (state.currentAgentId === agentId) return state;
  }
  return undefined;
}

export function setCurrentAgentId(projectId: string, agentId: string): void {
  const state = projectStates.get(projectId);
  if (state) {
    state.currentAgentId = agentId;
    state.updatedAt = new Date();
  }
}

export function getNextTask(projectId: string): Task | null {
  const state = projectStates.get(projectId);
  if (!state || state.currentIndex >= state.tasks.length) return null;
  return state.tasks[state.currentIndex];
}

export function recordCompletion(
  projectId: string,
  verificationResult: VerificationResult
): { nextTask: Task | null; status: TaskStatus; shouldContinue: boolean } {
  const state = projectStates.get(projectId);
  if (!state) {
    return { nextTask: null, status: "failed", shouldContinue: false };
  }

  state.updatedAt = new Date();
  state.iteration += 1;

  if (state.iteration >= state.maxIterations) {
    state.status = "failed";
    return { nextTask: null, status: "failed", shouldContinue: false };
  }

  if (verificationResult.success) {
    state.currentIndex += 1;
    if (state.currentIndex >= state.tasks.length) {
      state.status = "awaiting_approval";
      return { nextTask: null, status: "awaiting_approval", shouldContinue: false };
    }
    return {
      nextTask: state.tasks[state.currentIndex],
      status: state.status,
      shouldContinue: true,
    };
  }

  return {
    nextTask: state.tasks[state.currentIndex],
    status: "running",
    shouldContinue: true,
  };
}

export function shouldContinue(
  state: TaskState,
  verificationResult: VerificationResult
): boolean {
  if (state.iteration >= state.maxIterations) return false;
  if (verificationResult.success) {
    if (state.currentIndex >= state.tasks.length - 1) return false;
    return true;
  }
  return true;
}

export function markCompleted(projectId: string): void {
  const state = projectStates.get(projectId);
  if (state) {
    state.status = "completed";
    state.updatedAt = new Date();
  }
}

export function updateProjectWithTasks(projectId: string, tasks: Task[]): boolean {
  const state = projectStates.get(projectId);
  if (!state || state.status !== "pending_plan") return false;
  state.tasks = tasks;
  state.status = "running";
  state.updatedAt = new Date();
  return true;
}

export function setPendingFix(projectId: string): void {
  const state = projectStates.get(projectId);
  if (state) {
    state.status = "pending_fix";
    state.updatedAt = new Date();
  }
}

export function setProjectRunning(projectId: string): void {
  const state = projectStates.get(projectId);
  if (state) {
    state.status = "running";
    state.updatedAt = new Date();
  }
}
