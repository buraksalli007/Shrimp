import type { ProjectSummary } from "../App";

interface Props {
  projects: ProjectSummary[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    running: "Çalışıyor",
    awaiting_approval: "Onay Bekliyor",
    completed: "Tamamlandı",
    failed: "Başarısız",
  };
  return map[status] ?? status;
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    running: "status-running",
    awaiting_approval: "status-awaiting",
    completed: "status-completed",
    failed: "status-failed",
  };
  return map[status] ?? "";
}

export function ProjectList({ projects, selectedId, onSelect }: Props) {
  if (projects.length === 0) {
    return (
      <p className="empty">Henüz proje yok. Yeni proje başlatın.</p>
    );
  }

  return (
    <div className="project-list">
      {projects.map((p) => (
        <div
          key={p.projectId}
          className={`project-card ${selectedId === p.projectId ? "selected" : ""}`}
          onClick={() => onSelect(p.projectId)}
        >
          <div className="project-card-header">
            <span className="project-id">{p.projectId}</span>
            <span className={`status-badge ${statusClass(p.status)}`}>
              {statusLabel(p.status)}
            </span>
          </div>
          <p className="project-idea">{p.idea}</p>
          <p className="project-date">
            {new Date(p.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
      ))}
    </div>
  );
}
