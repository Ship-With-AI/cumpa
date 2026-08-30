import { handleSupportFlowRequest, validateSupportPublicOrigin } from "../support-flow/index.ts";

const installationId = "i".repeat(43);
const intent = "a".repeat(43);
const publicOrigin = "https://support.example";
const userId = "11111111-1111-4111-8111-111111111111";

function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function cookie(response: Response) {
  return response.headers.get("set-cookie") ?? "";
}

function dependencies(overrides: Partial<Record<string, unknown>> = {}) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const authCalls: string[] = [];
  const checkoutCalls: unknown[] = [];
  return {
    calls,
    authCalls,
    checkoutCalls,
    publicOrigin,
    priceId: "price_4999",
    service: {
      rpc: async (name: string, args: Record<string, unknown>) => {
        calls.push({ name, args });
        if (name === "claim_support_intent") return { data: [{ id: "22222222-2222-4222-8222-222222222222", action: "support", installation_id: installationId }], error: null };
        if (name === "restore_installation") return { data: true, error: null };
        return { data: "checkout-row", error: null };
      },
    },
    createAuthClient: () => ({
      auth: {
        signInWithOAuth: async (options: unknown) => {
          authCalls.push("signInWithOAuth");
          return { data: { url: "https://github.com/login/oauth/authorize?state=supabase-state" }, error: null, options };
        },
        exchangeCodeForSession: async () => {
          authCalls.push("exchangeCodeForSession");
          return { data: {}, error: null };
        },
        getUser: async () => {
          authCalls.push("getUser");
          return { data: { user: { id: userId, email: "never-returned@example.test" } }, error: null };
        },
      },
    }),
    stripe: { checkout: { sessions: { create: async (options: unknown) => {
      checkoutCalls.push(options);
      return { id: "cs_server_owned", url: "https://checkout.stripe.example/c/server" };
    } } } },
    log: () => undefined,
    ...overrides,
  };
}

Deno.test("custom origin rejects all non-browser-safe values before client construction", () => {
  assert(validateSupportPublicOrigin(publicOrigin, "projectref") === publicOrigin);
  for (const value of [
    "",
    "http://support.example",
    "https://user:pass@support.example",
    "https://support.example/path",
    "https://support.example?query=value",
    "https://support.example#fragment",
    "https://projectref.supabase.co",
    "https://support.supabase.co",
    "https://projectref.example",
  ]) {
    let failed = false;
    try {
      validateSupportPublicOrigin(value, "projectref");
    } catch {
      failed = true;
    }
    assert(failed, `accepted invalid public origin ${value}`);
  }
});

Deno.test("completion and invalid browser state use a bounded HTML response", async () => {
  const complete = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow/complete`), dependencies());
  const invalid = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow/callback`), dependencies());
  for (const response of [complete, invalid]) {
    const body = await response.text();
    assert(response.headers.get("content-type") === "text/html; charset=utf-8");
    assert(body.startsWith("<!doctype html>") && body.length < 512);
    assert(!/supabase|projectref|token|email/i.test(body));
  }
});

Deno.test("flow start uses GitHub PKCE with an exact hosted callback and script-inaccessible state cookie", async () => {
  const deps = dependencies();
  const response = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow?intent=${intent}`), deps);

  assert(response.status === 302 && response.headers.get("location")?.startsWith("https://github.com/"));
  assert(cookie(response).includes(`support-intent=${intent}`));
  assert(cookie(response).includes("HttpOnly") && cookie(response).includes("Secure") && cookie(response).includes("SameSite=Lax"));
  assert(cookie(response).includes("Path=/functions/v1/support-flow") && cookie(response).includes("Max-Age=600"));
  assert(deps.authCalls.join(",") === "signInWithOAuth");
});

Deno.test("callback validates hosted user then makes one server-owned support Checkout", async () => {
  const deps = dependencies();
  const response = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=provider-code`, {
    headers: { cookie: `support-intent=${intent}` },
  }), deps);

  assert(response.status === 302 && response.headers.get("location") === "https://checkout.stripe.example/c/server");
  assert(deps.authCalls.join(",") === "exchangeCodeForSession,getUser");
  assert(deps.calls[0]?.name === "claim_support_intent" && deps.calls[0]?.args.p_user_id === userId);
  assert(deps.calls[1]?.name === "record_checkout_session");
  assert(JSON.stringify(deps.checkoutCalls[0]) === JSON.stringify({
    mode: "payment", line_items: [{ price: "price_4999", quantity: 1 }],
    client_reference_id: userId,
    metadata: { user_id: userId, installation_id: installationId, intent_id: "22222222-2222-4222-8222-222222222222" },
    success_url: `${publicOrigin}/functions/v1/support-flow/complete`,
    cancel_url: `${publicOrigin}/functions/v1/support-flow/complete`,
  }));
  assert(!JSON.stringify(await response.text()).match(/code|token|email|profile|user/i));
});

Deno.test("callback refuses missing, mismatched, reused, expired, and unauthenticated proof before Checkout", async () => {
  const cases = [
    { request: new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=code`), override: {} },
    { request: new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=code`, { headers: { cookie: "support-intent=bad" } }), override: {} },
    { request: new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=code`, { headers: { cookie: `support-intent=${intent}` } }), override: { service: { rpc: async () => ({ data: null, error: { message: "invalid support intent" } }) } } },
    { request: new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=code`, { headers: { cookie: `support-intent=${intent}` } }), override: { createAuthClient: () => ({ auth: { exchangeCodeForSession: async () => ({ data: {}, error: null }), getUser: async () => ({ data: { user: null }, error: null }) } }) } },
  ];
  for (const item of cases) {
    const deps = dependencies(item.override);
    const response = await handleSupportFlowRequest(item.request, deps);
    assert(response.status === 400);
    assert(response.headers.get("location") === null);
    assert(deps.checkoutCalls.length === 0);
    assert(!JSON.stringify(await response.text()).match(/code|token|email|profile|user|intent/i));
  }
});

Deno.test("restore uses the same opaque proof but has indistinguishable paid and unpaid completion", async () => {
  const outcomes: string[] = [];
  for (const paid of [true, false]) {
    const deps = dependencies();
    deps.service.rpc = async (name: string, args: Record<string, unknown>) => {
      deps.calls.push({ name, args });
      if (name === "claim_support_intent") return { data: [{ id: "22222222-2222-4222-8222-222222222222", action: "restore", installation_id: installationId }], error: null };
      return { data: paid, error: null };
    };
    const response = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=provider-code`, {
      headers: { cookie: `support-intent=${intent}` },
    }), deps);
    assert(response.status === 302 && response.headers.get("location") === `${publicOrigin}/functions/v1/support-flow/complete`);
    assert(deps.calls.at(-1)?.name === "restore_installation");
    assert(deps.checkoutCalls.length === 0);
    outcomes.push(`${response.status}:${response.headers.get("location")}`);
  }
  assert(outcomes[0] === outcomes[1]);
});

Deno.test("success, cancellation, foreign origin, and server errors never grant authority or expose secrets", async () => {
  const logs: unknown[] = [];
  const completionDeps = dependencies({ log: (value: unknown) => logs.push(value) });
  const completion = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow/complete`), completionDeps);
  assert(completion.status === 200 && completion.headers.get("location") === null);
  assert(completionDeps.calls.length === 0 && completionDeps.checkoutCalls.length === 0);

  const foreignDeps = dependencies({ log: (value: unknown) => logs.push(value) });
  const foreign = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow?intent=${intent}`, { headers: { origin: "https://attacker.example" } }), foreignDeps);
  assert(foreign.status === 400);
  assert(foreignDeps.calls.length === 0 && foreignDeps.checkoutCalls.length === 0);
  const deps = dependencies({
    service: { rpc: async () => ({ data: null, error: { message: "STRIPE_SECRET_KEY=secret" } }) },
    log: (value: unknown) => logs.push(value),
  });
  const response = await handleSupportFlowRequest(new Request(`${publicOrigin}/functions/v1/support-flow/callback?code=provider-code`, { headers: { cookie: `support-intent=${intent}` } }), deps);
  assert(response.status >= 400 && !JSON.stringify(await response.text()).match(/secret|code|token|email|profile|user/i));
  assert(!JSON.stringify(logs).match(/secret|provider-code|support-intent/i));
});
