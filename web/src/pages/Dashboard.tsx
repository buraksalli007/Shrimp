import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, type ProjectSummary } from "../api";
import { StartForm } from "../components/StartForm";
import { ProjectList } from "../components/ProjectList";
import { ProjectDetail } from "../components/ProjectDetail";

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadProjects() {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <nav className="nav nav-dashboard">
        <div className="nav-inner">
          <Link to="/" className="logo">Shrimp Bridge</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <span className="nav-label">Dashboard</span>
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        <section className="section api-keys-section">
          <h2>API keys</h2>
          <div className="form">
            <p className="api-key-placeholder">
              Get your API key from the pricing plan you choose. Use it in the <code>Authorization: Bearer</code> header for all API requests.
            </p>
            <Link to="/" className="btn btn-outline">View pricing</Link>
          </div>
        </section>

        <section className="section">
          <h2>Start new project</h2>
          <StartForm onSuccess={() => { loadProjects(); setSelectedProjectId(null); }} />
        </section>

        <section className="section">
          <h2>Projects</h2>
          {loading && <p className="loading">Loading...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <ProjectList
              projects={projects}
              selectedId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />
          )}
        </section>

        {selectedProjectId && (
          <section className="section">
            <ProjectDetail
              projectId={selectedProjectId}
              onClose={() => setSelectedProjectId(null)}
              onApprove={() => { loadProjects(); setSelectedProjectId(null); }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
