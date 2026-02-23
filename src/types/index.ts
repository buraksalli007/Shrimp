export interface Task {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export interface VerificationResult {
  success: boolean;
  errors: string[];
  stdout?: string;
  stderr?: string;
}

export type TaskStatus = "running" | "awaiting_approval" | "completed" | "failed";

export interface TaskState {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface StartRequest {
  idea: string;
  githubRepo: string;
  branch?: string;
  tasks?: Task[];
}

export interface ApproveRequest {
  projectId: string;
}

export interface CursorWebhookPayload {
  event?: string;
  id?: string;
  agentId?: string;
  status?: string;
  summary?: string;
  source?: { repository?: string; ref?: string };
  target?: { branchName?: string; prUrl?: string; url?: string };
  timestamp?: string;
  [key: string]: unknown;
}
