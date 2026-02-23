import { useState, useEffect } from "react";
import { api, type ProjectDetail as ProjectDetailType } from "../api";

interface Props {
  projectId: string;
  onClose: () => void;
  onApprove: () => void;
}

export function ProjectDetail({ projectId, onClose, onApprove }: Props) {
  const [project, setProject] = useState<ProjectDetailType | null>(null);
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Hata");
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

  async function handleApprove() {
    setApproving(true);
    try {
      await api.approve(projectId);
      onApprove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onay hatası");
    } finally {
      setApproving(false);
    }
  }

  if (loading) return <p className="loading">Yükleniyor...</p>;
  if (error || !project) return <p className="error">{error ?? "Proje bulunamadı"}</p>;

  const canApprove = project.status === "awaiting_approval";

  return (
    <div className="detail">
      <div className="detail-header">
        <h3>Proje Detayı</h3>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Kapat
        </button>
      </div>
      <dl className="detail-grid">
        <dt>Proje ID</dt>
        <dd><code>{project.projectId}</code></dd>
        <dt>Fikir</dt>
        <dd>{project.idea}</dd>
        <dt>GitHub Repo</dt>
        <dd><code>{project.githubRepo}</code></dd>
        <dt>Branch</dt>
        <dd>{project.branch}</dd>
        <dt>Durum</dt>
        <dd><span className={`status-badge status-${project.status}`}>{project.status}</span></dd>
        <dt>Task</dt>
        <dd>{project.currentTaskIndex + 1} / {project.totalTasks}</dd>
        <dt>İterasyon</dt>
        <dd>{project.iteration} / {project.maxIterations}</dd>
        <dt>Agent ID</dt>
        <dd><code>{project.currentAgentId ?? "-"}</code></dd>
        <dt>Oluşturulma</dt>
        <dd>{new Date(project.createdAt).toLocaleString("tr-TR")}</dd>
        <dt>Güncelleme</dt>
        <dd>{new Date(project.updatedAt).toLocaleString("tr-TR")}</dd>
      </dl>
      {canApprove && (
        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-success"
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? "Yükleniyor..." : "Onayla ve App Store'a Yükle"}
          </button>
        </div>
      )}
    </div>
  );
}
