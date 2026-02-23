import { useState, useEffect } from "react";
import { api } from "./api";
import "./App.css";
import { StartForm } from "./components/StartForm";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetail } from "./components/ProjectDetail";
import { Header } from "./components/Header";

function App() {
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
      setError(err instanceof Error ? err.message : "Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="main">
        <section className="section">
          <h2>Yeni Proje Başlat</h2>
          <StartForm onSuccess={() => { loadProjects(); setSelectedProjectId(null); }} />
        </section>

        <section className="section">
          <h2>Projeler</h2>
          {loading && <p className="loading">Yükleniyor...</p>}
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

export interface ProjectSummary {
  projectId: string;
  idea: string;
  status: string;
  createdAt: string;
}

export default App;
