"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "../api-client";

export function useDashboard(resource, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await dashboardApi(resource)); } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  }, [resource]);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="lede">{description}</p></div>{action}</header>;
}

export function Panel({ children, className = "", title, subtitle, action }) {
  return <section className={`panel ${className}`}><div className="panel-title">{title ? <div><h3>{title}</h3>{subtitle && <p className="muted">{subtitle}</p>}</div> : <span />}{action}</div>{children}</section>;
}

export function StatusBadge({ children, tone = "quiet" }) {
  return <span className={`status-badge ${tone}`}><span className={tone === "good" ? "pulse good" : tone === "warn" ? "pulse" : tone === "danger" ? "pulse" : "pulse"} />{children}</span>;
}

export function LoadingState({ label = "Reading local workspace…" }) { return <div className="empty"><p className="muted">{label}</p></div>; }

export function DataState({ loading, error, children }) {
  if (loading) return <LoadingState />;
  if (error) return <div className="fatal"><strong>Local API unavailable</strong><p>{error}</p><span className="muted">Start <code>forgevena dashboard --port 4317</code>, connect its URL in Settings, and reload.</span></div>;
  return children;
}

export function Metric({ label, value, detail, tone = "" }) {
  return <div className="panel metric"><div><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div><span className={`metric-trend ${tone}`}>{detail}</span></div>;
}

export function KeyValue({ label, value }) { return <div className="list-item"><div className="list-copy"><span>{label}</span><strong>{value}</strong></div></div>; }

export function Empty({ title, children }) { return <div className="empty"><div><h3>{title}</h3><p className="muted">{children}</p></div></div>; }
