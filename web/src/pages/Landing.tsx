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
        <div className="hero-badge">API · OpenClaw Tool</div>
        <h1 className="hero-title">
          The bridge between <span className="gradient">Cursor</span> and <span className="gradient">OpenClaw</span>
        </h1>
        <p className="hero-subtitle">
          Orchestrate AI agents to build production apps from idea to App Store. 
          One API key. Automated verification. Error-fix loops. Full control.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary">Get API Key</Link>
          <a href="#how-it-works" className="btn btn-ghost">How it works</a>
        </div>
      </header>

      <section id="features" className="section features">
        <h2 className="section-title">Built for professional workflows</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⟡</div>
            <h3>Cursor Integration</h3>
            <p>Launch Cloud Agents via API. Webhook-triggered verification on every completion.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◇</div>
            <h3>OpenClaw Tool</h3>
            <p>Native OpenClaw integration. Research, plan, and orchestrate from your assistant.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <h3>Error-Fix Loop</h3>
            <p>Automatic verification, fix-prompt generation, and retry until the app is production-ready.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◆</div>
            <h3>App Store Ready</h3>
            <p>EAS build and submit. One approval flow from your dashboard to the store.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section how">
        <h2 className="section-title">How it works</h2>
        <div className="flow">
          <div className="flow-step">
            <span className="flow-num">1</span>
            <p>Submit your idea via API or dashboard</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="flow-num">2</span>
            <p>OpenClaw researches and plans. Cursor builds.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="flow-num">3</span>
            <p>Each completion triggers verification. Errors → fix prompts → retry.</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="flow-num">4</span>
            <p>Approve. EAS uploads to App Store.</p>
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
          <p className="docs-intro">Authenticate with <code>Authorization: Bearer YOUR_API_KEY</code>. Base URL: <code>https://api.shrimpbridge.io</code></p>
          <div className="docs-endpoints">
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
