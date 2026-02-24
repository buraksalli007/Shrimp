import { useState } from "react";
import { api, type UserCredentials } from "../api";

interface FormProps {
  onSuccess: () => void;
}

export function StartForm({ onSuccess }: FormProps) {
  const [idea, setIdea] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [platform, setPlatform] = useState<"cursor" | "vibecode">("cursor");
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<UserCredentials>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const creds = (credentials.cursorApiKey || credentials.openclawToken) ? credentials : undefined;
      await api.start({
        idea,
        githubRepo,
        branch,
        platform,
        credentials: creds,
      });
      setIdea("");
      setGithubRepo("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="platform">Platform</label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as "cursor" | "vibecode")}
        >
          <option value="cursor">Cursor (Expo/React Native)</option>
          <option value="vibecode">Vibecode</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="idea">App idea</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. Fitness tracker with daily goals and calorie counter..."
          rows={3}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="repo">GitHub repo</label>
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
      <div className="form-group">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowCredentials(!showCredentials)}
        >
          {showCredentials ? "Hide" : "Add"} my Cursor & OpenClaw credentials
        </button>
        {showCredentials && (
          <div className="credentials-fields">
            <input
              type="password"
              placeholder="Cursor API key (optional)"
              value={credentials.cursorApiKey ?? ""}
              onChange={(e) => setCredentials((c) => ({ ...c, cursorApiKey: e.target.value || undefined }))}
            />
            <input
              type="password"
              placeholder="Cursor webhook secret (optional)"
              value={credentials.cursorWebhookSecret ?? ""}
              onChange={(e) => setCredentials((c) => ({ ...c, cursorWebhookSecret: e.target.value || undefined }))}
            />
            <input
              type="password"
              placeholder="OpenClaw token (optional)"
              value={credentials.openclawToken ?? ""}
              onChange={(e) => setCredentials((c) => ({ ...c, openclawToken: e.target.value || undefined }))}
            />
            <input
              type="text"
              placeholder="OpenClaw gateway URL (optional)"
              value={credentials.openclawGatewayUrl ?? ""}
              onChange={(e) => setCredentials((c) => ({ ...c, openclawGatewayUrl: e.target.value || undefined }))}
            />
            <input
              type="password"
              placeholder="GitHub token (private repo)"
              value={credentials.githubToken ?? ""}
              onChange={(e) => setCredentials((c) => ({ ...c, githubToken: e.target.value || undefined }))}
            />
          </div>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Starting..." : "Start project"}
      </button>
    </form>
  );
}
