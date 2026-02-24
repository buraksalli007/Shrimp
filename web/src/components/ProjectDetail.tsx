import { useState, useEffect } from "react";
import { api, type ProjectDetail as ProjectDetailType, type ProjectMemorySummary } from "../api";

interface Props {
  projectId: string;
  onClose: () => void;
  onApprove: () => void;
}

export function ProjectDetail({ projectId, onClose, onApprove }: Props) {
  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [memory, setMemory] = useState<ProjectMemorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getProject(projectId);
        if (!cancelled) setProject(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    async function loadMemory() {
      try {
        const data = await api.getMemory(projectId);
        if (!cancelled) setMemory(data);
      } catch {
        if (!cancelled) setMemory(null);
      }
    }
    loadMemory();
    const interval = setInterval(loadMemory, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId]);

  async function handleApprove() {
    setApproving(true);
    try {
      await api.approve(projectId);
      onApprove();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApproving(false);
    }
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (error || !project) return <p className="error">{error ?? "Project not found"}</p>;

  const canApprove = project.status === "awaiting_approval";
  const outcome = project.outcomeJson ? (() => {
    try {
      return JSON.parse(project.outcomeJson) as { mvpFeatures?: string[] };
    } catch {
      return null;
    }
  })() : null;

  return (
    <div className="detail">
      <div className="detail-header">
        <h3>Project detail</h3>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <dl className="detail-grid">
        <dt>Project ID</dt>
        <dd><code>{project.projectId}</code></dd>
        <dt>Idea</dt>
        <dd>{project.idea}</dd>
        <dt>GitHub repo</dt>
        <dd><code>{project.githubRepo}</code></dd>
        <dt>Branch</dt>
        <dd>{project.branch}</dd>
        <dt>Autonomy</dt>
        <dd><span className="status-badge">{project.autonomyMode ?? "builder"}</span></dd>
        <dt>Status</dt>
        <dd><span className={`status-badge status-${project.status}`}>{project.status}</span></dd>
        <dt>Task</dt>
        <dd>{project.currentTaskIndex + 1} / {project.totalTasks}</dd>
        <dt>Iteration</dt>
        <dd>{project.iteration} / {project.maxIterations}</dd>
        <dt>Agent ID</dt>
        <dd><code>{project.currentAgentId ?? "-"}</code></dd>
        <dt>Created</dt>
        <dd>{new Date(project.createdAt).toLocaleString("en-US")}</dd>
        <dt>Updated</dt>
        <dd>{new Date(project.updatedAt).toLocaleString("en-US")}</dd>
      </dl>
      {outcome?.mvpFeatures && outcome.mvpFeatures.length > 0 && (
        <div className="detail-section">
          <h4>MVP plan</h4>
          <ul>
            {outcome.mvpFeatures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {memory && (memory.architectureDecisions.length > 0 || memory.failedFixPatterns.length > 0 || memory.lastPrompts.length > 0) && (
        <div className="detail-section">
          <h4>Memory</h4>
          {memory.architectureDecisions.length > 0 && (
            <>
              <strong>Decisions</strong>
              <ul>
                {memory.architectureDecisions.slice(0, 5).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </>
          )}
          {memory.failedFixPatterns.length > 0 && (
            <>
              <strong>Failed fixes</strong>
              <ul>
                {memory.failedFixPatterns.slice(0, 3).map((f, i) => (
                  <li key={i} className="text-muted">{f.slice(0, 100)}…</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {canApprove && (
        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-success"
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? "Submitting..." : "Approve & submit to App Store"}
          </button>
        </div>
      )}
    </div>
  );
}
