const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "/api" : "");
const API_KEY_STORAGE = "shrimp_api_key";

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {}
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = getStoredApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  getHealth: () => fetchApi<{ status: string }>("/health"),
  getStatus: () =>
    fetchApi<{
      status: string;
      cursorConfigured: boolean;
      openclawConfigured: boolean;
      githubConfigured: boolean;
    }>("/status"),
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
