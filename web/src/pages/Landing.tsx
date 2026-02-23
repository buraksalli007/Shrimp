import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-inner">
          <span className="logo">Shrimp Bridge</span>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#docs">Docs</a>
            <Link to="/dashboard" className="nav-cta">Dashboard</Link>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-badge">Cursor + OpenClaw · API · Tool</div>
        <h1 className="hero-title">
          <span className="gradient">Cursor</span> that works with <span className="gradient">OpenClaw</span>
        </h1>
        <p className="hero-subtitle">
          Shrimp Bridge connects Cursor Cloud Agents and OpenClaw so they work together. 
          OpenClaw researches and plans. Cursor builds. Automated verification and error-fix loops 
          take your app from idea to App Store.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary">Open Dashboard</Link>
          <a href="#how-it-works" className="btn btn-ghost">How it works</a>
        </div>
      </header>

      <section id="features" className="section features">
        <h2 className="section-title">Why Cursor + OpenClaw together</h2>
        <p className="section-intro">
          Cursor excels at code. OpenClaw excels at research and planning. Shrimp Bridge orchestrates both.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⟡</div>
            <h3>Cursor builds</h3>
            <p>Launch Cursor Cloud Agents via API. Each completion triggers verification. Webhooks keep everything in sync.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◇</div>
            <h3>OpenClaw plans</h3>
            <p>OpenClaw researches your idea, creates task lists, and notifies you when the app is ready for approval.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <h3>Error-fix loop</h3>
            <p>Verification fails? We generate fix prompts and retry with Cursor until the app passes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◆</div>
            <h3>App Store deploy</h3>
            <p>Approve from dashboard or OpenClaw. EAS builds and submits to the App Store.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section how">
        <h2 className="section-title">How Cursor and OpenClaw work together</h2>
        <div className="flow">
          <div className="flow-step">
            <span className="flow-num">1</span>
            <p>You submit an app idea (API or dashboard)</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="flow-num">2</span>
            <p>OpenClaw researches and plans tasks. Cursor implements each task.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="flow-num">3</span>
            <p>On each Cursor completion: verify → if errors, generate fix prompt → retry.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="flow-num">4</span>
            <p>App ready. Approve from dashboard or OpenClaw. EAS uploads to App Store.</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="section pricing">
        <h2 className="section-title">Simple, transparent pricing</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Starter</h3>
            <div className="price">$29<span>/mo</span></div>
            <ul>
              <li>1 API key</li>
              <li>50 project runs</li>
              <li>Standard support</li>
            </ul>
            <Link to="/dashboard" className="btn btn-outline">Get started</Link>
          </div>
          <div className="pricing-card featured">
            <div className="badge">Popular</div>
            <h3>Pro</h3>
            <div className="price">$99<span>/mo</span></div>
            <ul>
              <li>5 API keys</li>
              <li>Unlimited runs</li>
              <li>Priority support</li>
              <li>OpenClaw tool access</li>
            </ul>
            <Link to="/dashboard" className="btn btn-primary">Get Pro</Link>
          </div>
          <div className="pricing-card">
            <h3>Enterprise</h3>
            <div className="price">Custom</div>
            <ul>
              <li>Unlimited keys</li>
              <li>Dedicated infra</li>
              <li>SLA & onboarding</li>
            </ul>
            <a href="mailto:sales@shrimpbridge.io" className="btn btn-outline">Contact</a>
          </div>
        </div>
      </section>

      <section id="docs" className="section docs">
        <h2 className="section-title">API reference</h2>
        <div className="docs-block">
          <p className="docs-intro">Use <code>Authorization: Bearer YOUR_API_KEY</code> when API keys are enabled. Base URL is your deployment URL (e.g. <code>https://your-domain.com</code>).</p>
          <div className="docs-endpoints">
            <div className="docs-endpoint">
              <code>GET /status</code>
              <p>Check service status and configuration (cursorConfigured, openclawConfigured, githubConfigured).</p>
            </div>
            <div className="docs-endpoint">
              <code>POST /start</code>
              <p>Start a new project. Body: idea, githubRepo, branch?, tasks?</p>
            </div>
            <div className="docs-endpoint">
              <code>GET /projects</code>
              <p>List all projects for your account.</p>
            </div>
            <div className="docs-endpoint">
              <code>GET /projects/:id</code>
              <p>Get project details and status.</p>
            </div>
            <div className="docs-endpoint">
              <code>POST /approve</code>
              <p>Approve and trigger EAS submit. Body: projectId.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta">
        <h2 className="section-title">Ready to automate?</h2>
        <p className="cta-text">Get your API key and connect Cursor with OpenClaw in minutes.</p>
        <Link to="/dashboard" className="btn btn-primary btn-lg">Open Dashboard</Link>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span>Shrimp Bridge</span>
          <a href="https://github.com/buraksalli007/Shrimp">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
