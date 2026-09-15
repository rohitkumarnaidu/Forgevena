import { NextResponse } from "next/server";

const READ_ROUTES = new Set(["providers", "platform", "clouds", "agents", "workflows"]);
const POST_ROUTES = new Set([
  "providers/profile",
  "providers/credential",
  "providers/credential/activate",
  "providers/credential/rotate",
  "providers/credential/remove",
  "providers/credential/recover",
  "providers/policy",
  "providers/model",
  "providers/test",
  "agents/plan",
  "workflows/plan",
]);

export async function GET(request, context) {
  return proxy(request, context, "GET");
}

export async function POST(request, context) {
  return proxy(request, context, "POST");
}

async function proxy(request, context, method) {
  const segments = (await context.params).path ?? [];
  const route = segments.join("/");
  const allowed = method === "GET" ? READ_ROUTES.has(route) : POST_ROUTES.has(route);
  if (!allowed) return NextResponse.json({ error: "route_not_allowed" }, { status: 404 });
  const token = request.headers.get("x-ai-workspace-session");
  if (!token) return NextResponse.json({ error: "session_required" }, { status: 401 });
  const base = process.env.FORGEVENA_DASHBOARD_URL ?? "http://127.0.0.1:4317";
  const options = { method, headers: { "x-ai-workspace-session": token, accept: "application/json" } };
  if (method === "POST") {
    options.headers["content-type"] = "application/json";
    options.body = await request.text();
  }
  try {
    const response = await fetch(`${base}/api/${route}`, options);
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json", "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "dashboard_unreachable", message: "The local Forgevena dashboard could not be reached." }, { status: 502 });
  }
}
