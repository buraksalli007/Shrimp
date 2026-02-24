import { useState } from "react";
import { api, type UserCredentials, type AutonomyMode, type OutcomeResult } from "../api";

interface FormProps {
  onSuccess: () => void;
}

export function StartForm({ onSuccess }: FormProps) {
  const [idea, setIdea] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [platform, setPlatform] = useState<"cursor" | "vibecode">("cursor");
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>("builder");
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<UserCredentials>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistResult, setAssistResult] = useState<{ outcome?: OutcomeResult; decision?: unknown; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAssistResult(null);
    setLoading(true);
    try {
      const creds = (credentials.cursorApiKey || credentials.openclawToken) ? credentials : undefined;
      const res = await api.start({
        idea,
        githubRepo,
        branch,
        platform,
        autonomyMode,
        credentials: creds,
      });
      if ("mode" in res && res.mode === "assist") {
        setAssistResult({
          outcome: res.outcome,
          decision: res.decision,
          message: res.message,
        });
      } else {
        setIdea("");
        setGithubRepo("");
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-row form-row-equal">
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
          <label htmlFor="autonomyMode">Autonomy</label>
          <select
            id="autonomyMode"
            value={autonomyMode}
            onChange={(e) => setAutonomyMode(e.target.value as AutonomyMode)}
          >
            <option value="assist">Assist – suggestions only</option>
            <option value="builder">Builder – execute with approval</option>
            <option value="autopilot">Autopilot – full automation</option>
          </select>
        </div>
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
      {assistResult && (
        <div className="assist-result">
          <p className="assist-message">{assistResult.message}</p>
          {assistResult.outcome && (
            <details className="assist-outcome">
              <summary>MVP features & plan</summary>
              <ul>
                {assistResult.outcome.mvpFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              {assistResult.outcome.riskAnalysis.length > 0 && (
                <>
                  <strong>Risks:</strong>
                  <ul>
                    {assistResult.outcome.riskAnalysis.map((r, i) => (
                      <li key={i}>{r.risk} ({r.severity}) – {r.mitigation}</li>
                    ))}
                  </ul>
                </>
              )}
            </details>
          )}
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Starting..." : "Start project"}
      </button>
    </form>
  );
}
