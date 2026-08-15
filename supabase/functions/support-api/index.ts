import { createClient } from "@supabase/supabase-js";

import { InstallationIdSchema, SupportStartRequestSchema } from "../_shared/validation.ts";

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;

type SupportApiDependencies = Readonly<{
  service: { rpc: Rpc };
  publicOrigin: string;
  randomBytes: () => Uint8Array;
  now: () => Date;
  log?: (value: string) => void;
}>;

const maxBodyBytes = 8_192;

function json(value: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function defaultDependencies(): SupportApiDependencies {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return {
    service: createClient(url, key) as unknown as { rpc: Rpc },
    publicOrigin: Deno.env.get("SUPPORT_PUBLIC_ORIGIN") ?? "",
    randomBytes: () => crypto.getRandomValues(new Uint8Array(32)),
    now: () => new Date(),
    log: (value) => console.error(value),
  };
}

async function requestText(request: Request): Promise<string | undefined> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > maxBodyBytes || !request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > maxBodyBytes) return undefined;
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function permittedOrigin(request: Request, publicOrigin: string) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(publicOrigin).origin;
}

export async function handleSupportApiRequest(request: Request, dependencies = defaultDependencies()): Promise<Response> {
  const url = new URL(request.url);
  if (!permittedOrigin(request, dependencies.publicOrigin)) return json({ error: "invalid_request" }, 400);

  if (request.method === "POST" && url.pathname.endsWith("/start")) {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return json({ error: "invalid_request" }, 400);
    const text = await requestText(request);
    if (text === undefined) return json({ error: "invalid_request" }, 400);
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      return json({ error: "invalid_request" }, 400);
    }
    const parsed = SupportStartRequestSchema.safeParse(input);
    if (!parsed.success) return json({ error: "invalid_request" }, 400);
    const opaqueIntent = Uint8Array.from(dependencies.randomBytes());
    if (opaqueIntent.byteLength !== 32) return json({ error: "unavailable" }, 503);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", opaqueIntent));
    const result = await dependencies.service.rpc("create_support_intent", {
      p_action: parsed.data.action,
      p_installation_id: parsed.data.installationId,
      p_intent_hash: digest,
      p_expires_at: new Date(dependencies.now().getTime() + 600_000).toISOString(),
    });
    if (result.error) {
      dependencies.log?.("support_api_unavailable");
      return json({ error: "unavailable" }, 503);
    }
    const flowUrl = new URL("/functions/v1/support-flow", dependencies.publicOrigin);
    flowUrl.searchParams.set("intent", bytesToBase64Url(opaqueIntent));
    return json({ flowUrl: flowUrl.toString() });
  }

  if (request.method === "GET" && url.pathname.endsWith("/status") && url.searchParams.size === 1) {
    const installationId = url.searchParams.get("installationId");
    if (!InstallationIdSchema.safeParse(installationId).success) return json({ error: "invalid_request" }, 400);
    const result = await dependencies.service.rpc("installation_status", { p_installation_id: installationId });
    if (result.error || typeof result.data !== "boolean") {
      dependencies.log?.("support_api_unavailable");
      return json({ error: "unavailable" }, 503);
    }
    return json({ status: result.data ? "verified" : "unverified" });
  }

  return json({ error: "invalid_request" }, 400);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

if (import.meta.main) Deno.serve((request) => handleSupportApiRequest(request));
