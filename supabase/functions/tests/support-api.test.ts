import { handleSupportApiRequest } from "../support-api/index.ts";

const installationId = "i".repeat(43);
const publicOrigin = "https://support.example";

function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

async function body(response: Response) {
  return await response.json() as Record<string, unknown>;
}

function dependencies(overrides: Partial<Record<string, unknown>> = {}) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  return {
    calls,
    publicOrigin,
    randomBytes: () => new Uint8Array(32).fill(7),
    now: () => new Date("2026-08-15T00:00:00.000Z"),
    service: {
      rpc: async (name: string, args: Record<string, unknown>) => {
        calls.push({ name, args });
        return { data: name === "installation_status" ? false : "intent-id", error: null };
      },
    },
    ...overrides,
  };
}

Deno.test("anonymous start creates only a hashed expiring intent and fixed flow URL", async () => {
  const deps = dependencies();
  const response = await handleSupportApiRequest(new Request(`${publicOrigin}/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "support", installationId }),
  }), deps);

  assert(response.status === 200);
  const result = await body(response);
  assert(typeof result.flowUrl === "string");
  const flowUrl = new URL(result.flowUrl);
  assert(flowUrl.origin === publicOrigin && flowUrl.pathname === "/functions/v1/support-flow");
  assert(flowUrl.searchParams.get("intent") === "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc");
  assert(deps.calls.length === 1 && deps.calls[0]?.name === "create_support_intent");
  assert(deps.calls[0]?.args.p_action === "support" && deps.calls[0]?.args.p_installation_id === installationId);
  assert(deps.calls[0]?.args.p_intent_hash instanceof Uint8Array && (deps.calls[0]?.args.p_intent_hash as Uint8Array).byteLength === 32);
  assert(deps.calls[0]?.args.p_expires_at === "2026-08-15T00:10:00.000Z");
  assert(!JSON.stringify(result).match(/token|code|email|profile|user/i));
});

Deno.test("anonymous status needs no Supabase session and returns only the boolean status", async () => {
  const deps = dependencies();
  deps.service.rpc = async (name: string, args: Record<string, unknown>) => {
    deps.calls.push({ name, args });
    return { data: true, error: null };
  };
  const response = await handleSupportApiRequest(new Request(`${publicOrigin}/status?installationId=${installationId}`), deps);

  assert(response.status === 200);
  assert(JSON.stringify(await body(response)) === '{"status":"verified"}');
  assert(deps.calls.length === 1 && deps.calls[0]?.name === "installation_status");
});

Deno.test("start rejects hostile input without database mutation", async () => {
  const cases = [
    new Request(`${publicOrigin}/start`, { method: "POST", body: "{}", headers: { "content-type": "text/plain" } }),
    new Request(`${publicOrigin}/start`, { method: "POST", body: JSON.stringify({ action: "other", installationId }), headers: { "content-type": "application/json" } }),
    new Request(`${publicOrigin}/start`, { method: "POST", body: JSON.stringify({ action: "support", installationId: "bad" }), headers: { "content-type": "application/json" } }),
    new Request(`${publicOrigin}/start`, { method: "POST", body: JSON.stringify({ action: "restore", installationId, userId: "attacker" }), headers: { "content-type": "application/json" } }),
    new Request(`${publicOrigin}/start`, { method: "POST", body: "x".repeat(8_193), headers: { "content-type": "application/json" } }),
    new Request(`${publicOrigin}/start`, { method: "POST", body: JSON.stringify({ action: "support", installationId }), headers: { "content-type": "application/json", origin: "https://attacker.example" } }),
  ];
  for (const request of cases) {
    const deps = dependencies();
    const response = await handleSupportApiRequest(request, deps);
    assert(response.status >= 400 && response.status < 500);
    assert(JSON.stringify(await body(response)) === '{"error":"invalid_request"}');
    assert(deps.calls.length === 0);
  }
});

Deno.test("status rejects malformed methods, identifiers, origins, and extra query authority", async () => {
  const cases = [
    new Request(`${publicOrigin}/status?installationId=bad`),
    new Request(`${publicOrigin}/status?installationId=${installationId}&userId=attacker`),
    new Request(`${publicOrigin}/status?installationId=${installationId}`, { method: "POST" }),
    new Request(`${publicOrigin}/status?installationId=${installationId}`, { headers: { origin: "https://attacker.example" } }),
  ];
  for (const request of cases) {
    const deps = dependencies();
    const response = await handleSupportApiRequest(request, deps);
    assert(response.status >= 400 && response.status < 500);
    assert(JSON.stringify(await body(response)) === '{"error":"invalid_request"}');
    assert(deps.calls.length === 0);
  }
});

Deno.test("server faults remain generic and never log opaque intent or credentials", async () => {
  const logs: unknown[] = [];
  const deps = dependencies({
    service: { rpc: async () => ({ data: null, error: { message: "SUPABASE_SERVICE_ROLE_KEY=secret" } }) },
    log: (value: unknown) => logs.push(value),
  });
  const response = await handleSupportApiRequest(new Request(`${publicOrigin}/start`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "support", installationId }),
  }), deps);

  assert(response.status === 503);
  assert(JSON.stringify(await body(response)) === '{"error":"unavailable"}');
  assert(!JSON.stringify(logs).match(/secret|service_role|BwcHBwc/i));
});
