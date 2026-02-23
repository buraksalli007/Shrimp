import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, type ProjectSummary } from "../api";
import { StartForm } from "../components/StartForm";
import { ProjectList } from "../components/ProjectList";
import { ProjectDetail } from "../components/ProjectDetail";

interface ServiceStatus {
  connected: boolean;
  cursorConfigured: boolean;
  openclawConfigured: boolean;
  githubConfigured: boolean;
}

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ServiceStatus | null>(null);

  useEffect(() => {
    loadStatus();
    loadProjects();
    const interval = setInterval(() => {
      loadStatus();
      loadProjects();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const data = await api.getStatus();
      setStatus({
        connected: true,
        cursorConfigured: data.cursorConfigured,
        openclawConfigured: data.openclawConfigured,
        githubConfigured: data.githubConfigured,
      });
    } catch {
      setStatus({
        connected: false,
        cursorConfigured: false,
        openclawConfigured: false,
        githubConfigured: false,
      });
    }
  }

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
        {status && (
          <section className="section status-section">
            <div className={`status-banner ${status.connected ? "connected" : "disconnected"}`}>
              <span className="status-dot" />
              <span className="status-text">
                {status.connected ? "Connected" : "Backend unreachable"}
              </span>
              {status.connected && (
                <span className="status-details">
                  Cursor: {status.cursorConfigured ? "OK" : "Not configured"}
                  {" · "}
                  OpenClaw: {status.openclawConfigured ? "OK" : "Optional"}
                  {" · "}
                  GitHub: {status.githubConfigured ? "OK" : "Not configured"}
                </span>
              )}
            </div>
            {status.connected && !status.cursorConfigured && (
              <div className="setup-hint">
                <strong>To start projects:</strong> Set <code>CURSOR_API_KEY</code> in your .env file. 
                Add <code>OPENCLAW_HOOKS_TOKEN</code> for OpenClaw notifications. <code>GITHUB_TOKEN</code> for repo cloning. 
                Run the backend with <code>npm run dev</code>.
              </div>
            )}
            {!status.connected && (
              <div className="setup-hint">
                <strong>Backend not running.</strong> From the project root, run <code>npm run dev</code> to start the orchestrator. 
                In development, run <code>npm run dev:web</code> in another terminal for hot reload.
              </div>
            )}
          </section>
        )}

        <section className="section">
          <h2>Start new project</h2>
          <p className="section-desc">Submit an app idea. Cursor will build it; OpenClaw can plan and notify.</p>
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
