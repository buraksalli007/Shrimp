const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "/api" : "");

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  getHealth: () => fetchApi<{ status: string }>("/health"),
  getProjects: () => fetchApi<{ projects: ProjectSummary[] }>("/projects"),
  getProject: (id: string) => fetchApi<ProjectDetail>("/projects/" + id),
  start: (body: StartRequest) =>
    fetchApi<{ projectId: string; agentId: string; status: string }>("/start", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  approve: (projectId: string) =>
    fetchApi<{ projectId: string; status: string }>("/approve", {
      method: "POST",
      body: JSON.stringify({ projectId }),
    }),
};

export interface ProjectSummary {
  projectId: string;
  idea: string;
  status: string;
  createdAt: string;
}

export interface ProjectDetail {
  projectId: string;
  idea: string;
  githubRepo: string;
  branch: string;
  status: string;
  currentTaskIndex: number;
  totalTasks: number;
  iteration: number;
  maxIterations: number;
  currentAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartRequest {
  idea: string;
  githubRepo: string;
  branch?: string;
  tasks?: Array<{ id?: string; title?: string; description?: string; prompt: string }>;
}
