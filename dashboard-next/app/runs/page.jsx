"use client";

import { DataState, Empty, PageHeader, Panel, StatusBadge, useDashboard } from "../ui";

export default function RunsPage() {
  const view = useDashboard("workflows", { runs: [] });
  return <DataState loading={view.loading} error={view.error}><PageHeader eyebrow="Core / orchestration" title="Runs that stay bounded." description="Track deterministic workflow progress, consent checkpoints, and recovery state. The dashboard observes; the governed CLI executes." action={<StatusBadge tone="good">Deterministic</StatusBadge>} />
    <div className="grid"><div className="span-4"><Panel title="Execution model"><p className="metric-value">Bounded</p><p className="muted">Retries, checkpoints, cancellation, and explicit human approval are part of the workflow contract.</p></Panel></div><div className="span-4"><Panel title="Recorded runs"><p className="metric-value">{view.data?.runs?.length ?? 0}</p><p className="muted">Metadata-only run records visible in this workspace.</p></Panel></div><div className="span-4"><Panel title="Policy"><p className="metric-value">CLI</p><p className="muted">Run and resume operations remain on the reviewed command path.</p></Panel></div></div>
    <section className="section"><div className="section-heading"><div><h2>Workflow history</h2><p className="muted">Inputs, secrets, and arbitrary workflow files are not rendered here.</p></div></div><Panel>{(view.data?.runs ?? []).length ? <div className="list">{(view.data?.runs ?? []).map((run) => <div className="list-item" key={run.runId}><div className="list-copy"><strong>{run.workflow} <span className="mono">v{run.version}</span></strong><span>{run.runId} · {run.cursor}/{run.totalNodes} nodes · {run.updatedAt ? new Date(run.updatedAt).toLocaleString() : "no timestamp"}</span></div><StatusBadge tone={run.status === "completed" ? "good" : run.status === "failed" ? "danger" : "warn"}>{run.status}{run.resumable ? " · resumable" : ""}</StatusBadge></div>)}</div> : <Empty title="No workflow runs yet">Start a validated workflow through `forgevena workflows run` after reviewing its plan and approvals.</Empty>}</Panel></section>
  </DataState>;
}
