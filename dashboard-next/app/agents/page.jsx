"use client";

import { useState } from "react";
import { dashboardApi } from "../../api-client";
import { DataState, PageHeader, Panel, StatusBadge, useDashboard } from "../ui";

export default function AgentsPage() {
  const view = useDashboard("agents", { agents: [] });
  const [objective, setObjective] = useState("");
  const [provider, setProvider] = useState("ollama");
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function makePlan(event) {
    event.preventDefault(); if (!objective.trim()) return setMessage("Describe an objective first.");
    setBusy(true); setMessage("");
    try { setPlan(await dashboardApi("agents/plan", { method: "POST", body: JSON.stringify({ objective, provider }) })); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <DataState loading={view.loading} error={view.error}><PageHeader eyebrow="ForgeHub / AgentSpace" title="Agents with boundaries." description="Inspect host adapters, plan engineering work from approved metadata, and keep execution authority in Forgevena Core." action={<StatusBadge tone="good">Human promotion required</StatusBadge>} />
    <div className="grid">{(view.data?.agents ?? []).map((agent) => <Panel className="span-4" key={agent.id} title={agent.name} action={<StatusBadge tone={agent.status === "available" || agent.status === "ready" ? "good" : "warn"}>{agent.status}</StatusBadge>}><p className="muted">{agent.kind} · {agent.service}</p><div className="tag-row">{agent.capabilities.map((capability) => <span className="tag" key={capability}>{capability}</span>)}</div><div className="list"><div className="list-item"><div className="list-copy"><span>Authority</span><strong>{agent.authority}</strong></div></div><div className="list-item"><div className="list-copy"><span>Execution</span><strong>{agent.execution}</strong></div></div></div></Panel>)}</div>
    <section className="section"><div className="grid"><Panel className="span-7" title="Plan read-only engineering work" subtitle="No provider call, source content, or file mutation happens during planning."><form className="stack-form" onSubmit={makePlan}><label className="field-label">Objective<textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Example: review provider migration risks and propose validation steps" /></label><label className="field-label">Planning provider<select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="ollama">Ollama · local</option><option value="gemini">Gemini</option><option value="openai">OpenAI</option><option value="claude">Claude</option><option value="openrouter">OpenRouter</option></select></label><div className="button-row"><button className="button primary" disabled={busy} type="submit">{busy ? "Preparing…" : "Prepare read-only plan"}</button><span className="muted">Requires an indexed workspace.</span></div>{message && <p className="muted">{message}</p>}</form></Panel><Panel className="span-5" title="Runtime policy" subtitle="Permanent guardrails applied to agent surfaces"><div className="list"><div className="list-item"><div className="list-copy"><strong>Source content</strong><span>Excluded from copilot context</span></div><StatusBadge tone="good">Excluded</StatusBadge></div><div className="list-item"><div className="list-copy"><strong>External transmission</strong><span>Requires explicit consent</span></div><StatusBadge tone="warn">Gated</StatusBadge></div><div className="list-item"><div className="list-copy"><strong>Unbounded loops</strong><span>Not enabled by the platform</span></div><StatusBadge tone="good">Blocked</StatusBadge></div></div></Panel></div></section>
    {plan && <section className="section"><Panel title="Plan preview" subtitle="This is an inspectable plan, not an approval or execution result."><div className="grid"><div className="span-6"><div className="list"><div className="list-item"><div className="list-copy"><span>Objective</span><strong>{plan.objective}</strong></div></div><div className="list-item"><div className="list-copy"><span>Provider and model</span><strong>{plan.provider} / {plan.model}</strong></div></div><div className="list-item"><div className="list-copy"><span>Data impact</span><strong>{plan.dataImpact}</strong></div></div></div></div><div className="span-6"><div className="empty"><div><StatusBadge tone="good">Read-only · no files changed</StatusBadge><p className="muted">{plan.rollback}</p></div></div></div></div></Panel></section>}
  </DataState>;
}
