"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DataState, Metric, PageHeader, Panel, StatusBadge, useDashboard } from "./ui";

export default function OverviewPage() {
  const providers = useDashboard("providers", { status: [] });
  const platform = useDashboard("platform", { ecosystem: { counts: {} } });
  const agents = useDashboard("agents", { agents: [] });
  const workflows = useDashboard("workflows", { runs: [] });
  const status = providers.data?.status ?? [];
  const health = platform.data?.ecosystem?.counts ?? {};
  const connected = status.filter((entry) => entry.credentialAvailable || entry.runtime?.healthy || entry.runtime?.executableAvailable).length;
  const evidence = useMemo(() => status.filter((entry) => entry.compatibility?.freshness === "fresh").length, [status]);
  const ready = health.total ? health.attention === 0 : false;
  return <DataState loading={providers.loading || platform.loading || agents.loading || workflows.loading} error={providers.error || platform.error || agents.error || workflows.error}>
    <PageHeader eyebrow="Forgevena / workspace" title="Build with control." description="One governed command center for providers, agents, workflows, capabilities, evidence, and the boundaries that keep engineering local-first." action={<div className="button-row"><Link className="button primary" href="/agents">Open AgentSpace</Link><Link className="button" href="/security">Review posture</Link></div>} />
    <div className="grid"><div className="span-3"><Metric label="Workspace health" value={ready ? "Ready" : "Review"} detail={`${health.healthy ?? 0}/${health.total ?? 0} checks`} tone={ready ? "" : "warn"} /></div><div className="span-3"><Metric label="Provider connections" value={connected} detail={`${status.length} profiles`} /></div><div className="span-3"><Metric label="Fresh evidence" value={evidence} detail={`of ${status.length} providers`} /></div><div className="span-3"><Metric label="Active runs" value={(workflows.data?.runs ?? []).filter((run) => run.resumable).length} detail="bounded and resumable" /></div></div>
    <section className="section"><div className="section-heading"><div><h2>Operating picture</h2><p className="muted">The fastest path from signal to a safe next action.</p></div><StatusBadge tone={ready ? "good" : "warn"}>{ready ? "All systems nominal" : "Attention required"}</StatusBadge></div><div className="grid"><Panel className="span-8" title="Workspace pulse" subtitle="Normalized metadata only; source content and credentials never appear here."><div className="list"><div className="list-item"><div className="list-copy"><strong>Agent posture</strong><span>{agents.data?.agents?.length ?? 0} managed surfaces · human promotion required</span></div><StatusBadge tone="good">Governed</StatusBadge></div><div className="list-item"><div className="list-copy"><strong>Workflow posture</strong><span>{workflows.data?.runs?.length ?? 0} recorded runs · execution remains on the CLI path</span></div><StatusBadge tone="good">Bounded</StatusBadge></div><div className="list-item"><div className="list-copy"><strong>External effects</strong><span>Provider tests, MCP, deployment, and publication require explicit consent</span></div><StatusBadge tone="warn">Consent-gated</StatusBadge></div></div></Panel><Panel className="span-4" title="Quick actions" subtitle="Safe entry points for the current workspace"><div className="stack"><Link className="button" href="/providers">Manage provider keys</Link><Link className="button" href="/agents">Plan engineering work</Link><Link className="button" href="/runs">Inspect workflow runs</Link><Link className="button" href="/integrations">Review integrations</Link></div></Panel></div></section>
  </DataState>;
}
