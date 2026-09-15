import { PageHeader, Panel, StatusBadge } from "../ui";

const families = [
  ["Intelligence & behavior", "Agent · Agent Team · Skill · Prompt · Rule Set · Planner · Evaluator · Guardrail"],
  ["Actions & connectivity", "Tool · MCP Server · Connector · Integration · API Package · Browser Adapter"],
  ["Context & knowledge", "Memory · Context Pack · Knowledge Pack · Dataset · Index · Retriever"],
  ["Orchestration", "Workflow · Chain · DAG · State Machine · Bounded Loop · Pipeline · Playbook"],
  ["Experience & interfaces", "AI Application · Dashboard · Widget · Theme · IDE Extension · CLI Module"],
  ["Delivery & development", "Template · Blueprint · Project Generator · SDK · Extension · Deployment Pack"],
  ["Governance & assurance", "Policy Pack · Compliance Pack · Evaluation Suite · Security Pack · Compatibility Pack"],
];

export default function CapabilitiesPage() {
  return <><PageHeader eyebrow="ForgeRegistry / capability model" title="One model. Many surfaces." description="Browse the enterprise capability taxonomy without confusing package identity, installation, activation, invocation, or evidence. Permanent authority remains in Core and ForgeRegistry." action={<StatusBadge tone="warn">Future contracts gated</StatusBadge>} /><div className="grid">{families.map(([name, types]) => <Panel className="span-4" key={name} title={name} action={<StatusBadge tone="good">Extensible</StatusBadge>}><p className="muted">{types}</p><div className="bar"><span style={{ width: name === "Orchestration" ? "42%" : "68%" }} /></div><p className="muted" style={{ margin: "8px 0 0" }}>Maturity is declared per capability; popularity never implies trust.</p></Panel>)}</div><section className="section"><div className="grid"><Panel className="span-6" title="Lifecycle separation" subtitle="Every object has independent identity and evidence"><div className="list">{["Definition", "Package", "Release", "Installation", "Configuration", "Activation", "Invocation / run", "Evidence record"].map((item, index) => <div className="list-item" key={item}><div className="list-copy"><strong>{String(index + 1).padStart(2, "0")} · {item}</strong><span>Resolve, govern, observe, and roll back through the owning authority.</span></div><StatusBadge tone="good">Distinct</StatusBadge></div>)}</div></Panel><Panel className="span-6" title="Policy inheritance" subtitle="Lower layers may restrict, never broaden"><pre className="empty mono" style={{ justifyContent: "start", alignItems: "start", whiteSpace: "pre-wrap", color: "var(--cyan)" }}>Platform Constitution{`\n`}→ Organization Policy{`\n`}→ Workspace Policy{`\n`}→ Project Policy{`\n`}→ Host Policy{`\n`}→ Package Rules{`\n`}→ Session Restrictions</pre><div className="agent-policy" style={{ marginTop: 13 }}>Deny overrides allow. Package presence never grants runtime permission.</div></Panel></div></section></>;
}
