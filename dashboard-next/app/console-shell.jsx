"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearDashboardSession, connectDashboardUrl, sessionToken } from "../api-client";

const navigation = [
  ["/", "Overview", "⌂"], ["/workspace", "Workspace", "▦"], ["/agents", "Agents", "✦"], ["/runs", "Runs", "↗"], ["/providers", "Providers", "◈"],
  ["/capabilities", "Capabilities", "◇"], ["/integrations", "Integrations", "⌁"], ["/updates", "Updates", "↻"], ["/evidence", "Evidence", "✓"], ["/releases", "Releases", "◆"], ["/activity", "Audit history", "≡"], ["/security", "Security", "⌾"],
];

export function ConsoleShell({ children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");
  const [connected, setConnected] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("forgevena-dashboard-theme") ?? "dark";
    setTheme(saved); document.documentElement.dataset.theme = saved; setConnected(Boolean(sessionToken()));
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); document.documentElement.dataset.theme = next; sessionStorage.setItem("forgevena-dashboard-theme", next);
  }

  function connect(event) {
    event.preventDefault();
    try { connectDashboardUrl(new FormData(event.currentTarget).get("dashboardUrl")); setConnected(true); setSetupOpen(false); setNotice("Loopback session connected. The token remains in this browser session only."); }
    catch (error) { setNotice(error.message); }
  }

  function reset() { clearDashboardSession(); setConnected(false); setNotice("Session cleared. No credentials were changed."); }

  return <div className="app-frame">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand-lockup"><span className="brand-mark">F</span><span><strong>FORGEVENA</strong><small>COMMAND CENTER</small></span></div>
      <div className="workspace-pill"><span className={connected ? "pulse good" : "pulse"} />{connected ? "Local workspace connected" : "Connect local workspace"}</div>
      <nav className="primary-nav" aria-label="Primary navigation">{navigation.map(([href, label, icon]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${pathname === href ? "active" : ""}`}><span className="nav-icon" aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-divider" />
      <Link href="/settings" onClick={() => setMenuOpen(false)} className={`nav-link ${pathname === "/settings" ? "active" : ""}`}><span className="nav-icon" aria-hidden="true">⚙</span>Settings</Link>
      <div className="sidebar-footer"><span>LOCAL-FIRST / NO TELEMETRY</span><span>v1.4.0 RC</span></div>
    </aside>
    <main className="main-column">
      <header className="topbar"><button className="menu-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /><span /></button><div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><strong>{navigation.find(([href]) => href === pathname)?.[1] ?? "Settings"}</strong></div><div className="top-actions"><span className="connection-dot"><span className={connected ? "pulse good" : "pulse"} />{connected ? "Loopback online" : "Session required"}</span><button className="icon-button" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? "☼" : "◐"}</button><Link className="avatar" href="/settings" aria-label="Open settings">RK</Link></div></header>
      {notice && <div className="global-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Dismiss</button></div>}
      {!connected && <section className="connect-banner"><div><span className="eyebrow">Secure local session</span><h2>Connect your Forgevena workspace</h2><p>Start <code>forgevena dashboard --port 4317</code>, then paste its printed URL. The session token stays in this browser tab.</p></div><button className="button primary" type="button" onClick={() => setSetupOpen(true)}>Connect workspace</button></section>}
      <div className="page-content">{children}</div>
    </main>
    {menuOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    {setupOpen && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="connect-title"><button className="modal-close" type="button" onClick={() => setSetupOpen(false)} aria-label="Close">×</button><span className="eyebrow">Loopback bridge</span><h2 id="connect-title">Connect local workspace</h2><p className="muted">Paste the complete URL printed by <code>forgevena dashboard --port 4317</code>. It contains a short-lived in-memory token.</p><form onSubmit={connect} className="stack-form"><label>Dashboard URL<input name="dashboardUrl" placeholder="http://127.0.0.1:4317/#token=…" autoFocus required /></label><button className="button primary" type="submit">Connect securely</button></form></section></div>}
    {connected && <button className="session-reset" type="button" onClick={reset}>Reset session</button>}
  </div>;
}
