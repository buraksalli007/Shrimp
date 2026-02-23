export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="currentColor" opacity="0.2" />
            <path d="M8 12h16M8 16h12M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="12" r="3" fill="var(--success)" />
          </svg>
          <span>OpenClaw-Cursor Orchestrator</span>
        </div>
        <p className="tagline">Fikirden App Store&apos;a otomatik uygulama geliştirme</p>
      </div>
    </header>
  );
}
