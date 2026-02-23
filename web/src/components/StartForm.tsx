import { useState } from "react";
import { api } from "../api";

interface FormProps {
  onSuccess: () => void;
}

export function StartForm({ onSuccess }: FormProps) {
  const [idea, setIdea] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.start({ idea, githubRepo, branch });
      setIdea("");
      setGithubRepo("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="idea">Uygulama Fikri</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Örn: Fitness takip uygulaması, günlük hedefler, kalori sayacı..."
          rows={3}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="repo">GitHub Repo</label>
          <input
            id="repo"
            type="text"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            placeholder="owner/repo"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="branch">Branch</label>
          <input
            id="branch"
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
          />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Başlatılıyor..." : "Proje Başlat"}
      </button>
    </form>
  );
}
