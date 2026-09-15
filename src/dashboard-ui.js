export const DASHBOARD_SHELL = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Forgevena Command Center</title><style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d241f;background:#eceee9;font-synthesis:none}*{box-sizing:border-box}body{margin:0;min-width:320px;background:linear-gradient(135deg,#edf0eb 0%,#e4e8e1 100%)}button,input,select{font:inherit}.console-shell{min-height:100vh;display:grid;grid-template-columns:238px minmax(0,1fr)}.sidebar{background:#18201d;color:#dbe5dd;padding:28px 18px;display:flex;flex-direction:column;gap:24px}.brand{font-size:12px;font-weight:800;letter-spacing:.18em;color:#bcff79}.sidebar-copy{margin:-16px 0 0;font-size:13px;color:#94a59b}.nav{display:grid;gap:6px}.nav-item{padding:10px 12px;border-radius:8px;font-size:14px;color:#aebbb2}.nav-item.active{background:#2a3730;color:#fff}.sidebar-foot{margin-top:auto;padding-top:16px;border-top:1px solid #35423a;font-size:12px;color:#9aa99f}.content{padding:clamp(24px,5vw,64px);max-width:1500px;width:100%;margin:0 auto}.topbar{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;border-bottom:1px solid #cfd5cc;padding-bottom:34px}.eyebrow{margin:0 0 12px;text-transform:uppercase;font-weight:800;letter-spacing:.12em;font-size:11px;color:#628645}.h1,h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(40px,6vw,74px);letter-spacing:-.055em;line-height:.92;margin:0;color:#1e2721}.lede{max-width:650px;font-size:17px;line-height:1.6;color:#59665e;margin:20px 0 0}.security-note{max-width:300px;padding:15px 16px;border-left:3px solid #8ac35c;background:#f7faf3;display:grid;gap:4px;font-size:13px;color:#546159}.security-note strong{color:#344c29}.notice{margin:22px 0 0;padding:14px 16px;border-radius:8px;font-size:14px}.notice-info{background:#edf3e9;color:#3f5930}.notice-success{background:#e3f4db;color:#245524}.notice-warning{background:#fff0ca;color:#6e4b00}.notice-danger{background:#f9e0dc;color:#7e2720}.section{padding-top:36px}.section-heading{display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-bottom:18px}.section h2{margin:0;color:#27342b;font-size:21px;letter-spacing:-.02em}.muted{margin:5px 0 0;color:#6a756d;font-size:13px;line-height:1.45}.provider-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.provider-card,.integration-card{background:rgba(255,255,252,.78);border:1px solid #d3dad1;border-radius:12px;padding:19px;box-shadow:0 10px 25px rgba(38,54,42,.05)}.provider-card{display:flex;flex-direction:column;gap:15px}.card-header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.provider-title{display:flex;gap:10px;align-items:center}.provider-title h3,.integration-card h3{margin:0;font-size:16px;color:#1d2d22}.provider-mark{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:#e1ecd6;color:#3d6030;font-weight:800}.badge{display:inline-flex;white-space:nowrap;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700}.badge-good{background:#d9efd0;color:#326d2a}.badge-quiet{background:#edf0eb;color:#69746c}.capabilities{margin:0;color:#59675e;font-size:13px;line-height:1.45}.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0}.fact{padding:9px;background:#f3f5f1;border-radius:7px}.fact dt{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#7a857d}.fact dd{margin:4px 0 0;font-size:12px;color:#38463d;overflow-wrap:anywhere}.controls{display:grid;gap:9px;margin-top:auto}.controls input,.controls select{min-height:38px;padding:8px 10px;border:1px solid #cbd5ca;border-radius:7px;background:#fff;color:#253229}.policy-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.button{min-height:38px;padding:8px 12px;border-radius:7px;border:1px solid transparent;cursor:pointer;font-weight:700;font-size:13px}.button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b6dc8f;outline-offset:2px}.button:disabled{opacity:.55;cursor:wait}.primary{background:#334c2b;color:#fff}.primary:hover{background:#263d20}.secondary{background:#eff3ec;color:#344a37;border-color:#ced7cc}.text{background:transparent;color:#4e733b;text-align:left;padding-left:0}.integration-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.integrations{padding-bottom:40px}.fatal{margin:10vh auto;max-width:640px;background:#fff1ef;color:#702820;padding:24px;border-radius:12px}@media(max-width:760px){.console-shell{grid-template-columns:1fr}.sidebar{padding:18px;gap:12px}.nav{grid-template-columns:repeat(4,1fr);overflow:auto}.nav-item{white-space:nowrap;text-align:center;font-size:12px}.sidebar-foot{display:none}.content{padding:26px 18px}.topbar{display:grid}.facts{grid-template-columns:1fr}.section-heading{display:grid}.security-note{max-width:none}}@media(prefers-reduced-motion:no-preference){.provider-card,.integration-card{transition:transform .18s ease,box-shadow .18s ease}.provider-card:hover,.integration-card:hover{transform:translateY(-2px);box-shadow:0 16px 28px rgba(38,54,42,.09)}}
</style><style>
:root[data-theme="dark"]{color-scheme:dark;background:#101417}:root[data-theme="dark"] body{background:radial-gradient(circle at 78% -20%,#26382e 0%,#121817 38%,#0d1110 100%)}.console-shell[data-theme="dark"] .content{background:linear-gradient(125deg,rgba(20,27,25,.96),rgba(15,20,19,.98));color:#e5eee7}.console-shell[data-theme="dark"] .topbar{border-color:#2c3933}.console-shell[data-theme="dark"] .h1,.console-shell[data-theme="dark"] h1,.console-shell[data-theme="dark"] .section h2,.console-shell[data-theme="dark"] .provider-title h3,.console-shell[data-theme="dark"] .integration-card h3{color:#eef6ef}.console-shell[data-theme="dark"] .lede,.console-shell[data-theme="dark"] .muted,.console-shell[data-theme="dark"] .capabilities{color:#aebcb2}.console-shell[data-theme="dark"] .security-note{background:#19241d;border-color:#9dce6e;color:#b7c8ba}.console-shell[data-theme="dark"] .security-note strong{color:#d8ffc0}.console-shell[data-theme="dark"] .provider-card,.console-shell[data-theme="dark"] .integration-card{background:rgba(27,36,32,.82);border-color:#34433b;box-shadow:0 14px 32px rgba(0,0,0,.24)}.console-shell[data-theme="dark"] .fact{background:#202a25}.console-shell[data-theme="dark"] .fact dt{color:#93a59a}.console-shell[data-theme="dark"] .fact dd{color:#d6e1d8}.console-shell[data-theme="dark"] .controls input,.console-shell[data-theme="dark"] .controls select{background:#121a16;border-color:#405048;color:#eef6ef}.console-shell[data-theme="dark"] .secondary{background:#26332b;border-color:#425449;color:#d5e4d8}.console-shell[data-theme="dark"] .text{color:#bcff79}.console-shell[data-theme="dark"] .notice-info{background:#203020;color:#c8e6b9}.console-shell[data-theme="dark"] .notice-success{background:#17381f;color:#c9f4cc}.console-shell[data-theme="dark"] .notice-warning{background:#3d3013;color:#ffe5a2}.console-shell[data-theme="dark"] .notice-danger{background:#482320;color:#ffc2bb}.nav-item{appearance:none;border:0;background:transparent;cursor:pointer;text-align:left;width:100%}.nav-item:hover{background:rgba(189,255,121,.1);color:#fff}.nav-item:focus-visible{outline:2px solid #bcff79;outline-offset:2px}.theme-toggle{min-height:38px;padding:8px 12px;border:1px solid #9bb491;border-radius:999px;background:transparent;color:inherit;cursor:pointer;font-size:12px;font-weight:800;letter-spacing:.02em}.theme-toggle:hover{background:rgba(141,190,102,.14)}@media(max-width:760px){.theme-toggle{justify-self:start}}
</style><style>.credential-manager{display:grid;gap:8px;padding:11px;border:1px solid #d8dfd6;border-radius:8px;background:#f7f9f5}.control-label{margin:0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#657367}.slot-list{display:grid;gap:6px}.slot-row{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:7px 0;border-top:1px solid #e1e7df}.slot-copy{display:grid;gap:2px;min-width:0}.slot-copy strong{font-size:12px;color:#2a3a2e}.slot-copy span{font-size:11px;color:#6c786f}.slot-actions{display:flex;gap:5px;flex-wrap:wrap}.slot-actions .button{min-height:30px;padding:5px 8px;font-size:11px}.danger{background:#fff0ee;color:#9f3329;border-color:#edc3bd}.key-form{display:grid;grid-template-columns:110px minmax(0,1fr) 100px minmax(0,1.5fr) auto;gap:7px}.key-form input,.key-form select{min-width:0}.console-shell[data-theme="dark"] .credential-manager{background:#18231d;border-color:#3c4b42}.console-shell[data-theme="dark"] .slot-row{border-color:#344238}.console-shell[data-theme="dark"] .slot-copy strong{color:#e1ebe2}.console-shell[data-theme="dark"] .slot-copy span,.console-shell[data-theme="dark"] .control-label{color:#9eb0a2}.console-shell[data-theme="dark"] .danger{background:#4c2622;border-color:#7b3b32;color:#ffd0ca}@media(max-width:760px){.key-form{grid-template-columns:1fr 1fr}.key-form input,.key-form .primary{grid-column:1/-1}}</style></head><body><div id="app" aria-live="polite">Loading Forgevena Command Center…</div><script src="/dashboard-ui.js"></script></body></html>`;

export const DASHBOARD_UI_SCRIPT = String.raw`(() => {
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const app = document.querySelector("#app");
  const extraStyle = document.createElement("style");
  extraStyle.textContent = ".agent-grid,.run-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.agent-card,.run-card{background:rgba(255,255,252,.78);border:1px solid #d3dad1;border-radius:12px;padding:17px;display:grid;gap:11px}.agent-card h3,.run-card h3{margin:0;color:#1d2d22;font-size:16px}.agent-meta{display:flex;gap:7px;flex-wrap:wrap}.agent-policy{padding:12px 14px;border-left:3px solid #9bcf6d;background:#f4f8ef;color:#516051;font-size:13px;line-height:1.5}.run-row{display:flex;justify-content:space-between;gap:12px;align-items:center;border-top:1px solid #e1e7df;padding:9px 0}.integration-card .policy-row input,.integration-card .policy-row select{min-height:38px;padding:8px 10px;border:1px solid #cbd5ca;border-radius:7px;background:#fff;color:#253229;min-width:0}.console-shell[data-theme=dark] .agent-card,.console-shell[data-theme=dark] .run-card{background:rgba(27,36,32,.82);border-color:#34433b}.console-shell[data-theme=dark] .agent-card h3,.console-shell[data-theme=dark] .run-card h3{color:#eef6ef}.console-shell[data-theme=dark] .agent-policy{background:#19241d;color:#b7c8ba;border-color:#9dce6e}.console-shell[data-theme=dark] .run-row{border-color:#344238}.console-shell[data-theme=dark] .integration-card .policy-row input,.console-shell[data-theme=dark] .integration-card .policy-row select{background:#121a16;border-color:#405048;color:#eef6ef}";
  extraStyle.textContent += ".console-shell:not([data-theme=dark]) .nav-item{background:#24312a;color:#dbe8de}.console-shell:not([data-theme=dark]) .nav-item.active{background:#8fbd70;color:#102016}.console-shell:not([data-theme=dark]) .nav-item:hover{background:#405542;color:#fff}.console-shell:not([data-theme=dark]) .muted{color:#4d5d52}.console-shell:not([data-theme=dark]) .lede{color:#46564b}.console-shell:not([data-theme=dark]) .sidebar-copy{color:#b5c6b9}.console-shell:not([data-theme=dark]) .sidebar-foot{color:#b0c1b5}@media(max-width:760px){.nav{grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}.nav-item{white-space:normal;text-align:left}.content{padding:24px 16px}.topbar{display:grid;gap:18px}.key-form{grid-template-columns:1fr}.key-form input,.key-form .primary{grid-column:1/-1}.provider-grid,.integration-grid{grid-template-columns:1fr}}";
  document.head.append(extraStyle);
  const savedTheme = localStorage.getItem("forgevena-dashboard-theme");
  const state = {
    providers: null,
    platform: null,
    agents: null,
    workflows: null,
    notice: null,
    activeView: "overview",
    theme: savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  };

  history.replaceState(null, "", location.pathname);

  function request(path, body) {
    const options = { headers: { "x-ai-workspace-session": token } };
    if (body !== undefined) {
      options.method = "POST";
      options.headers["content-type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    return fetch(path, options).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Request failed.");
      return payload;
    });
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function badge(text, tone) {
    return node("span", "badge badge-" + tone, text);
  }

  function setNotice(message, tone = "info") {
    state.notice = { message, tone };
    render();
  }

  function providerStatus(profile) {
    return state.providers.status.find((item) => item.provider === profile.name) || {};
  }

  function compatibility(profile) {
    return (state.providers.compatibility.find(([name]) => name === profile.name) || [null, {}])[1];
  }

  function credentialState(profile) {
    return state.providers.credentials[profile.name] || { keys: [], status: {}, audit: { audit: [] } };
  }

  async function refreshProviders() { state.providers = await request("/api/providers"); }

  function agentCard(agent) {
    const card = node("article", "agent-card");
    const header = node("div", "card-header");
    header.append(node("h3", "", agent.name), badge(agent.status, agent.status === "available" || agent.status === "ready" ? "good" : "quiet"));
    card.append(header, node("p", "muted", agent.kind + " · " + agent.service));
    const meta = node("div", "agent-meta");
    meta.append(badge(agent.authority, "quiet"), badge(agent.execution, "quiet"));
    card.append(meta, node("p", "capabilities", agent.capabilities.join(" · ") || "No declared capabilities."));
    return card;
  }

  function renderAgents() {
    const section = node("section", "section", undefined);
    section.id = "agents";
    const heading = node("div", "section-heading", undefined);
    heading.append(node("h2", "", "Agent command center"), node("p", "muted", "Inspect host adapters and plan read-only engineering work without granting hidden authority."));
    section.append(heading);
    const policy = state.agents.policy;
    section.append(node("p", "agent-policy", "Human promotion remains required. External transmission needs consent. Source contents are excluded from copilot context, and unbounded loops are not enabled."));
    const planner = node("div", "integration-card");
    planner.append(node("h3", "Plan read-only engineering work"), node("p", "muted", "Creates a bounded plan from the local metadata index. It does not run a provider or change files."));
    const planRow = node("div", "policy-row");
    const objective = document.createElement("input");
    objective.placeholder = "Describe the engineering objective";
    objective.setAttribute("aria-label", "Engineering objective");
    const provider = document.createElement("select");
    provider.setAttribute("aria-label", "Planning provider");
    state.providers.profiles.filter((profile) => ["model-api", "local-model"].includes(profile.kind)).forEach((profile) => { const option = node("option", "", profile.name); option.value = profile.name; provider.append(option); });
    const planButton = node("button", "button primary", "Build plan");
    const planResult = node("pre", "muted", "");
    planButton.addEventListener("click", async () => {
      if (!objective.value.trim()) return setNotice("Describe an objective before planning.", "warning");
      try { planButton.disabled = true; const result = await request("/api/agents/plan", { objective: objective.value, provider: provider.value }); planResult.textContent = result.provider + "/" + result.model + " · metadata-only plan ready"; setNotice("Read-only plan prepared. No provider call was made.", "success"); } catch (error) { setNotice(error.message, "danger"); } finally { planButton.disabled = false; }
    });
    planRow.append(objective, provider, planButton);
    planner.append(planRow, planResult);
    section.append(planner);
    const grid = node("div", "agent-grid");
    state.agents.agents.forEach((agent) => grid.append(agentCard(agent)));
    section.append(grid);
    return section;
  }

  function renderRuns() {
    const section = node("section", "section integrations", undefined);
    section.id = "runs";
    const heading = node("div", "section-heading", undefined);
    heading.append(node("h2", "", "Runs and workflows"), node("p", "muted", "Resumable run metadata is visible here; execution remains governed through the CLI consent path."));
    section.append(heading);
    const grid = node("div", "run-grid");
    if (!state.workflows.runs.length) grid.append(integrationCard("No workflow runs", "Start a validated workflow from the CLI with explicit approval. This console does not launch arbitrary runs.", "quiet"));
    state.workflows.runs.forEach((run) => {
      const card = node("article", "run-card");
      card.append(node("h3", "", run.workflow), node("p", "muted", "v" + run.version + " · " + run.runId));
      const row = node("div", "run-row");
      row.append(node("span", "", run.cursor + "/" + run.totalNodes + " nodes"), badge(run.status, run.status === "completed" ? "good" : "quiet"));
      card.append(row, node("p", "muted", run.resumable ? "Resumable through the governed CLI path." : "Terminal run."));
      grid.append(card);
    });
    section.append(grid);
    return section;
  }

  function credentialManager(profile) {
    const data = credentialState(profile);
    const wrap = node("div", "credential-manager");
    wrap.append(node("p", "control-label", "Key slots"));
    const list = node("div", "slot-list");
    data.keys.forEach((slot) => {
      const row = node("div", "slot-row");
      const copy = node("div", "slot-copy");
      copy.append(node("strong", "", slot.keyId), node("span", "", (slot.active ? "Active · " : "") + slot.storage + " · " + slot.status));
      const actions = node("div", "slot-actions");
      if (!slot.active && slot.status === "active") {
        const activate = node("button", "button secondary", "Activate");
        activate.addEventListener("click", async () => { try { await request("/api/providers/credential/activate", { provider: profile.name, keyId: slot.keyId }); await refreshProviders(); setNotice(slot.keyId + " is now active.", "success"); } catch (error) { setNotice(error.message, "danger"); } });
        actions.append(activate);
      }
      if (slot.status === "quarantined") {
        const recover = node("button", "button secondary", "Recover");
        recover.addEventListener("click", async () => { try { await request("/api/providers/credential/recover", { provider: profile.name, keyId: slot.keyId }); await refreshProviders(); setNotice(slot.keyId + " recovered without exposing its value.", "success"); } catch (error) { setNotice(error.message, "danger"); } });
        actions.append(recover);
      } else if (slot.status === "active") {
        const remove = node("button", "button danger", "Quarantine");
        const replacements = data.keys.filter((entry) => entry.status === "active" && entry.keyId !== slot.keyId);
        const replacement = replacements.length ? document.createElement("select") : null;
        if (replacement) {
          replacement.setAttribute("aria-label", "Replacement active key for " + slot.keyId);
          replacement.append(node("option", "", "Select replacement"));
          replacements.forEach((entry) => { const option = node("option", "", entry.keyId); option.value = entry.keyId; replacement.append(option); });
          actions.append(replacement);
        }
        remove.addEventListener("click", async () => {
          const nextKeyId = replacement?.value || null;
          if (slot.active && replacements.length && !nextKeyId) return setNotice("Choose a replacement active slot before quarantining " + slot.keyId + ".", "warning");
          if (!confirm("Quarantine " + slot.keyId + "? It can be recovered for 30 days.")) return;
          try { await request("/api/providers/credential/remove", { provider: profile.name, keyId: slot.keyId, nextKeyId: nextKeyId || null }); await refreshProviders(); setNotice(slot.keyId + " quarantined. It remains recoverable for 30 days.", "success"); } catch (error) { setNotice(error.message, "danger"); }
        });
        actions.append(remove);
      }
      row.append(copy, actions); list.append(row);
    });
    if (!data.keys.length) list.append(node("p", "muted", "No managed slots yet. Environment-owned keys remain external and cannot be changed here."));
    wrap.append(list);
    const form = node("div", "key-form");
    const slot = document.createElement("select");
    slot.setAttribute("aria-label", profile.name + " key slot");
    ["primary", "personal", "work", "staging", "custom"].forEach((value) => { const option = node("option", "", value); option.value = value; slot.append(option); });
    const custom = document.createElement("input"); custom.placeholder = "custom slot ID"; custom.hidden = true; custom.setAttribute("aria-label", profile.name + " custom key slot");
    slot.addEventListener("change", () => { custom.hidden = slot.value !== "custom"; });
    const storage = document.createElement("select"); storage.setAttribute("aria-label", profile.name + " key storage"); ["local", "encrypted"].forEach((value) => { const option = node("option", "", value); option.value = value; storage.append(option); });
    const secret = document.createElement("input"); secret.type = "password"; secret.autocomplete = "off"; secret.placeholder = "Enter a new local key"; secret.setAttribute("aria-label", profile.name + " API key");
    const save = node("button", "button primary", "Add or rotate key");
    save.addEventListener("click", async () => {
      const keyId = slot.value === "custom" ? custom.value.trim() : slot.value;
      if (!keyId || !secret.value) return setNotice("Choose a slot and enter a key.", "warning");
      const exists = data.keys.some((entry) => entry.keyId === keyId && entry.status === "active");
      try { save.disabled = true; await request(exists ? "/api/providers/credential/rotate" : "/api/providers/credential", { provider: profile.name, keyId, storage: storage.value, secret: secret.value }); secret.value = ""; custom.value = ""; await refreshProviders(); setNotice(exists ? keyId + " rotated safely." : keyId + " stored locally. The value is never shown.", "success"); } catch (error) { setNotice(error.message, "danger"); } finally { save.disabled = false; }
    });
    form.append(slot, custom, storage, secret, save); wrap.append(form);
    return wrap;
  }

  function providerCard(profile) {
    const status = providerStatus(profile);
    const policy = state.providers.policies[profile.name] || {};
    const evidence = compatibility(profile);
    const card = node("article", "provider-card");
    const header = node("div", "card-header");
    const title = node("div", "provider-title");
    title.append(node("span", "provider-mark", profile.name.slice(0, 1).toUpperCase()), node("div", "", undefined));
    const copy = title.lastChild;
    copy.append(node("h3", "", profile.name), node("p", "muted", profile.kind));
    header.append(title, badge(status.credentialAvailable ? "connected" : "needs key", status.credentialAvailable ? "good" : "quiet"));
    card.append(header);
    card.append(node("p", "capabilities", (profile.capabilities || []).join(" · ") || "Provider profile"));

    const facts = node("dl", "facts");
    facts.append(fact("Model", profile.defaultModel || "Choose during invocation"));
    facts.append(fact("Evidence", evidence.freshness || "not verified"));
    facts.append(fact("Policy", policy.mode || "guarded"));
    card.append(facts);

    const controls = node("div", "controls");
    controls.append(credentialManager(profile));

    const modelRow = node("div", "policy-row");
    const discoveredModels = state.providers.models?.[profile.name] || [];
    const model = document.createElement(discoveredModels.length ? "select" : "input");
    model.setAttribute("aria-label", profile.name + " model");
    if (discoveredModels.length) {
      discoveredModels.forEach((value) => { const option = node("option", "", value); option.value = value; option.selected = value === profile.defaultModel; model.append(option); });
    } else {
      model.value = profile.defaultModel || "";
      model.placeholder = "Provider model ID";
      model.autocomplete = "off";
    }
    const saveModel = node("button", "button secondary", "Save model");
    saveModel.addEventListener("click", async () => {
      try { await request("/api/providers/model", { provider: profile.name, model: model.value }); await refreshProviders(); setNotice(profile.name + " model saved without storing credentials.", "success"); }
      catch (error) { setNotice(error.message, "danger"); }
    });
    modelRow.append(model, saveModel);
    controls.append(modelRow);

    const policyRow = node("div", "policy-row");
    const select = document.createElement("select");
    select.setAttribute("aria-label", profile.name + " policy");
    ["guarded", "budgeted", "unrestricted"].forEach((mode) => {
      const option = node("option", "", mode);
      option.value = mode;
      option.selected = mode === policy.mode;
      select.append(option);
    });
    const savePolicy = node("button", "button secondary", "Save policy");
    savePolicy.addEventListener("click", async () => {
      try {
        await request("/api/providers/policy", { provider: profile.name, policy: { mode: select.value } });
        state.providers = await request("/api/providers");
        setNotice(profile.name + " policy saved.", "success");
      } catch (error) {
        setNotice(error.message, "danger");
      }
    });
    policyRow.append(select, savePolicy);
    controls.append(policyRow);

    const test = node("button", "button text", "Run consented health test");
    test.addEventListener("click", async () => {
      if (!confirm("Send the fixed text 'Reply only with OK.' to " + profile.name + "? This may use your provider account.")) return;
      try {
        test.disabled = true;
        const result = await request("/api/providers/test", { provider: profile.name, model: model.value || profile.defaultModel, confirmDataEgress: true });
        setNotice(profile.name + " responded successfully. Usage metadata was recorded; response content is not retained in this screen.", "success");
        console.info("Forgevena provider health result", { provider: result.provider, model: result.model, operationId: result.operationId, status: result.status });
      } catch (error) {
        setNotice(profile.name + ": " + error.message, "danger");
      } finally {
        test.disabled = false;
      }
    });
    controls.append(test);
    const recentTests = (state.providers.testHistory?.records || []).filter((record) => record.provider === profile.name).slice(-3).reverse();
    if (recentTests.length) card.append(node("p", "muted", "Recent consented tests: " + recentTests.map((record) => record.status + " · " + new Date(record.testedAt).toLocaleString()).join(" | ")));
    if (!status.credentialAvailable && profile.kind === "model-api") card.append(node("p", "muted", "Remediation: add a managed key slot or configure the provider-owned environment variable."));
    else if (evidence.freshness !== "current") card.append(node("p", "muted", "Remediation: run a consented test and retain current compatibility evidence before a stable support claim."));
    card.append(controls);
    return card;
  }

  function fact(label, value) {
    const wrapper = node("div", "fact");
    wrapper.append(node("dt", "", label), node("dd", "", value));
    return wrapper;
  }

  function integrationCard(title, summary, status, action) {
    const card = node("article", "integration-card");
    const header = node("div", "card-header");
    header.append(node("h3", "", title), badge(status, status === "ready" ? "good" : "quiet"));
    card.append(header, node("p", "muted", summary));
    if (action) card.append(action);
    return card;
  }

  function renderIntegrations() {
    const platform = state.platform;
    const grid = node("div", "integration-grid");
    const health = platform.ecosystem.counts;
    grid.append(integrationCard("Workspace health", health.healthy + " healthy · " + health.attention + " need attention · " + health.total + " checks", health.attention ? "review" : "ready"));
    grid.append(integrationCard("MCP servers", platform.mcpServers.length + " registered. Registering keeps every server disabled until explicit activation.", platform.mcpServers.length ? "configured" : "empty"));
    grid.append(integrationCard("Plugins", platform.plugins.length + " installed plugin records. Runtime execution stays disabled until trusted and enabled.", platform.plugins.length ? "configured" : "empty"));
    grid.append(integrationCard("Render", platform.render.valid ? "Blueprint is structurally valid. Deployment always asks for consent." : "No valid Render blueprint yet.", platform.render.valid ? "ready" : "not ready"));
    return grid;
  }

  function evidenceSummary() {
    const records = state.providers.compatibility.map(([, evidence]) => evidence || {});
    const fresh = records.filter((evidence) => evidence.freshness === "fresh").length;
    const stale = records.filter((evidence) => evidence.freshness === "stale").length;
    const unverified = records.length - fresh - stale;
    return { fresh, stale, unverified, total: records.length };
  }

  function jumpTo(view) {
    state.activeView = view;
    render();
    const target = document.getElementById(view);
    if (target) target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function render() {
    app.replaceChildren();
    document.documentElement.dataset.theme = state.theme;
    const shell = node("main", "console-shell");
    shell.dataset.theme = state.theme;
    const sidebar = node("aside", "sidebar");
    sidebar.append(node("div", "brand", "FORGEVENA"), node("p", "sidebar-copy", "Governed engineering console"));
    const nav = node("nav", "nav", undefined);
    [["overview", "Overview"], ["agents", "Agents"], ["providers", "Providers"], ["runs", "Runs"], ["integrations", "Integrations"], ["evidence", "Evidence"]].forEach(([view, label]) => {
      const item = node("button", "nav-item" + (state.activeView === view ? " active" : ""), label);
      item.type = "button";
      item.setAttribute("aria-current", state.activeView === view ? "page" : "false");
      item.addEventListener("click", () => jumpTo(view));
      nav.append(item);
    });
    sidebar.append(nav, node("p", "sidebar-foot", "Local session · no telemetry"));

    const content = node("section", "content");
    const top = node("header", "topbar");
    const heading = node("div", "", undefined);
    heading.append(node("p", "eyebrow", "Provider control plane"), node("h1", "", "Build with control."), node("p", "lede", "Configure local credentials, inspect compatibility evidence, and run deliberately consented health checks."));
    const security = node("div", "security-note", undefined);
    security.append(node("strong", "", "Local by design"), node("span", "", "Keys are stored locally and never returned by this dashboard."));
    const topActions = node("div", "", undefined);
    const toggle = node("button", "theme-toggle", state.theme === "dark" ? "Use light mode" : "Use dark mode");
    toggle.type = "button";
    toggle.setAttribute("aria-pressed", String(state.theme === "dark"));
    toggle.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("forgevena-dashboard-theme", state.theme);
      render();
    });
    topActions.append(toggle, security);
    top.append(heading, topActions);
    top.id = "overview";
    content.append(top);

    if (state.notice) content.append(node("div", "notice notice-" + state.notice.tone, state.notice.message));
    content.append(renderAgents());
    const section = node("section", "section", undefined);
    section.id = "providers";
    section.append(node("div", "section-heading", undefined));
    section.firstChild.append(node("h2", "", "Provider workspace"), node("p", "muted", "Stable providers are ready for local configuration. Agent hosts remain compatibility-only."));
    const grid = node("div", "provider-grid");
    state.providers.profiles.forEach((profile) => grid.append(providerCard(profile)));
    section.append(grid);
    content.append(section);
    content.append(renderRuns());
    const integrations = node("section", "section integrations", undefined);
    integrations.id = "integrations";
    integrations.append(node("div", "section-heading", undefined));
    integrations.firstChild.append(node("h2", "", "System readiness"), node("p", "muted", "MCP, plugins, and cloud tools stay governed by explicit activation and consent."));
    integrations.append(renderIntegrations());
    content.append(integrations);
    const evidence = evidenceSummary();
    const evidenceSection = node("section", "section integrations", undefined);
    evidenceSection.id = "evidence";
    evidenceSection.append(node("div", "section-heading", undefined));
    evidenceSection.firstChild.append(node("h2", "", "Compatibility evidence"), node("p", "muted", "Evidence records are local metadata. Credentials and provider content are excluded."));
    const evidenceGrid = node("div", "integration-grid");
    evidenceGrid.append(integrationCard("Freshness", evidence.fresh + " of " + evidence.total + " provider records are current.", evidence.stale ? "review" : "ready"));
    evidenceGrid.append(integrationCard("Stale records", evidence.stale ? evidence.stale + " records need re-verification before a new stable support claim." : "No stale compatibility records.", evidence.stale ? "review" : "ready"));
    evidenceGrid.append(integrationCard("Unverified records", evidence.unverified + " profiles have no dated compatibility record yet.", evidence.unverified ? "review" : "ready"));
    evidenceSection.append(evidenceGrid);
    content.append(evidenceSection);
    shell.append(sidebar, content);
    app.append(shell);
  }

  Promise.all([request("/api/providers"), request("/api/platform"), request("/api/agents"), request("/api/workflows")]).then(([providers, platform, agents, workflows]) => {
    state.providers = providers;
    state.platform = platform;
    state.agents = agents;
    state.workflows = workflows;
    render();
  }).catch((error) => {
    app.replaceChildren(node("main", "fatal", "Dashboard could not load: " + error.message));
  });
})();`;
