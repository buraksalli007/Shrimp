import type {
  Task,
  TaskState,
  TaskStatus,
  VerificationResult,
} from "../types/index.js";
import { DEFAULT_MAX_ITERATIONS } from "../config/constants.js";

const projectStates = new Map<string, TaskState>();

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
    createdAt: now,
    updatedAt: now,
  };
  projectStates.set(projectId, state);
  return state;
}

export function getProject(projectId: string): TaskState | undefined {
  return projectStates.get(projectId);
}

export function getAllProjects(): Array<Pick<TaskState, "projectId" | "idea" | "status" | "createdAt">> {
  return Array.from(projectStates.values()).map((s) => ({
    projectId: s.projectId,
    idea: s.idea,
    status: s.status,
    createdAt: s.createdAt,
  }));
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
