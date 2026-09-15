export function sessionToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("forgevena-dashboard-token") ?? "";
}

export async function dashboardApi(route, options = {}) {
  const token = sessionToken();
  const headers = { "x-ai-workspace-session": token, ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers ?? {}) };
  const response = await fetch(`/api/forgevena/${route}`, { ...options, headers, cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? body.error ?? "Dashboard request failed.");
  return body;
}

export function connectDashboardUrl(value) {
  const parsed = new URL(value.trim());
  const token = new URLSearchParams(parsed.hash.slice(1)).get("token");
  if (!token) throw new Error("The URL does not contain a Forgevena session token.");
  sessionStorage.setItem("forgevena-dashboard-token", token);
  sessionStorage.setItem("forgevena-dashboard-url", `${parsed.origin}${parsed.pathname}`);
  return token;
}

export function clearDashboardSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("forgevena-dashboard-token");
  sessionStorage.removeItem("forgevena-dashboard-url");
}
