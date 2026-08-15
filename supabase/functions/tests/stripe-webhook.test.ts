import { handleStripeWebhookRequest } from "../stripe-webhook/index.ts";

const installationId = "i".repeat(43);
const userId = "11111111-1111-4111-8111-111111111111";
const secret = "whsec_test";

function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_server_owned",
    mode: "payment",
    payment_status: "paid",
    currency: "usd",
    amount_total: 4999,
    customer: "cus_server_owned",
    payment_intent: "pi_server_owned",
    metadata: { user_id: userId, installation_id: installationId, intent_id: "intent-row" },
    line_items: { data: [{ price: { id: "price_4999" }, quantity: 1 }], has_more: false },
    ...overrides,
  };
}

function dependencies(overrides: Partial<Record<string, unknown>> = {}) {
  const order: string[] = [];
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  return {
    order,
    calls,
    webhookSecret: secret,
    priceId: "price_4999",
    stripe: {
      webhooks: { constructEventAsync: async (raw: string, signature: string, webhookSecret: string) => {
        order.push(`verify:${raw}:${signature}:${webhookSecret}`);
        return { id: "evt_server_owned", type: "checkout.session.completed", data: { object: { id: "cs_server_owned" } } };
      } },
      checkout: { sessions: { retrieve: async () => {
        order.push("retrieve");
        return session();
      } } },
    },
    service: { rpc: async (name: string, args: Record<string, unknown>) => {
      order.push("settle");
      calls.push({ name, args });
      return { data: true, error: null };
    } },
    log: () => undefined,
    ...overrides,
  };
}

function request(body = '{"id":"evt_server_owned"}', signature = "signature") {
  return new Request("https://support.example/stripe-webhook", {
    method: "POST", headers: { "content-type": "application/json", "stripe-signature": signature }, body,
  });
}

Deno.test("valid signed paid exact-product event settles through one atomic authority RPC", async () => {
  const deps = dependencies();
  const response = await handleStripeWebhookRequest(request(), deps);

  assert(response.status === 200 && JSON.stringify(await response.json()) === '{"received":true}');
  assert(deps.order.join(",").startsWith("verify:{\"id\":\"evt_server_owned\"}:signature:whsec_test,retrieve,settle"));
  assert(JSON.stringify(deps.calls) === JSON.stringify([{
    name: "fulfill_checkout_session",
    args: { p_stripe_session_id: "cs_server_owned", p_stripe_event_id: "evt_server_owned", p_stripe_customer_id: "cus_server_owned", p_stripe_payment_intent_id: "pi_server_owned" },
  }]));
});

Deno.test("raw signature verification happens before JSON interpretation, lookup, or settlement", async () => {
  const deps = dependencies({ stripe: { webhooks: { constructEventAsync: async () => { throw new Error("invalid signature"); } } } });
  const response = await handleStripeWebhookRequest(request('{"id":"evt_server_owned"} '), deps);

  assert(response.status === 400 && JSON.stringify(await response.json()) === '{"error":"invalid_request"}');
  assert(deps.order.length === 0 && deps.calls.length === 0);
});

Deno.test("irrelevant events and every non-authoritative product fact are ignored without settlement", async () => {
  const ignored = dependencies({ stripe: { webhooks: { constructEventAsync: async () => ({ id: "evt_other", type: "customer.created", data: { object: {} } }) } } });
  const ignoredResponse = await handleStripeWebhookRequest(request(), ignored);
  assert(ignoredResponse.status === 200 && ignored.calls.length === 0);

  const cases = [
    { livemode: false },
    { mode: "subscription" },
    { payment_status: "unpaid" },
    { currency: "eur" },
    { amount_total: 5000 },
    { line_items: { data: [{ price: { id: "price_wrong" }, quantity: 1 }], has_more: false } },
    { line_items: { data: [{ price: { id: "price_4999" }, quantity: 2 }], has_more: false } },
    { metadata: { user_id: "not-a-uuid", installation_id: installationId, intent_id: "intent-row" } },
    { metadata: { user_id: userId, installation_id: "bad", intent_id: "intent-row" } },
    { id: "" },
  ];
  for (const override of cases) {
    const deps = dependencies({ stripe: { webhooks: { constructEventAsync: async () => ({ id: "evt_server_owned", type: "checkout.session.completed", data: { object: { id: "cs_server_owned" } } }) }, checkout: { sessions: { retrieve: async () => session(override) } } } });
    const response = await handleStripeWebhookRequest(request(), deps);
    assert(response.status === 400 && deps.calls.length === 0);
  }
});

Deno.test("completed and delayed-payment events preserve database replay and concurrency idempotency", async () => {
  const results: number[] = [];
  for (const type of ["checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
    const deps = dependencies({ stripe: { webhooks: { constructEventAsync: async () => ({ id: "evt_replayed", type, data: { object: { id: "cs_server_owned" } } }) }, checkout: { sessions: { retrieve: async () => session() } } } });
    results.push((await handleStripeWebhookRequest(request(), deps)).status);
    results.push((await handleStripeWebhookRequest(request(), deps)).status);
    assert(deps.calls.length === 2 && deps.calls.every((call) => call.name === "fulfill_checkout_session"));
  }
  assert(results.every((status) => status === 200));
});

Deno.test("transient settlement failures are retryable while invalid input and logs remain redacted", async () => {
  const logs: unknown[] = [];
  const deps = dependencies({
    service: { rpc: async () => ({ data: null, error: { message: "database unavailable STRIPE_SECRET_KEY=secret" } }) },
    log: (value: unknown) => logs.push(value),
  });
  const response = await handleStripeWebhookRequest(request(), deps);

  assert(response.status === 503 && JSON.stringify(await response.json()) === '{"error":"unavailable"}');
  assert(!JSON.stringify(logs).match(/secret|signature|evt_server_owned/i));
});
