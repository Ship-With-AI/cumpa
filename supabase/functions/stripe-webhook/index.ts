import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { checkoutSessionInvariant, fulfillVerifiedCheckout } from "../_shared/fulfillment.ts";

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
type StripeClient = {
  webhooks: { constructEventAsync(body: string, signature: string, secret: string): Promise<{ id: string; type: string; data: { object: unknown } }> };
  checkout: { sessions: { retrieve(id: string, options: { expand: string[] }): Promise<unknown> } };
};
type StripeWebhookDependencies = Readonly<{
  service: { rpc: Rpc };
  stripe: StripeClient;
  webhookSecret: string;
  priceId: string;
  log?: (value: string) => void;
}>;

function json(value: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function defaultDependencies(): StripeWebhookDependencies {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { httpClient: Stripe.createFetchHttpClient() });
  return {
    service: createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "") as unknown as { rpc: Rpc },
    stripe: stripe as unknown as StripeClient,
    webhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
    priceId: Deno.env.get("STRIPE_PRICE_ID") ?? "",
    log: (value) => console.error(value),
  };
}

export async function handleStripeWebhookRequest(request: Request, dependencies = defaultDependencies()): Promise<Response> {
  if (request.method !== "POST" || request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return json({ error: "invalid_request" }, 400);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "invalid_request" }, 400);
  const rawBody = await request.text();
  let event: { id: string; type: string; data: { object: unknown } };
  try {
    event = await dependencies.stripe.webhooks.constructEventAsync(rawBody, signature, dependencies.webhookSecret);
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return json({ received: true });
  const object = event.data.object;
  if (!event.id || !object || typeof object !== "object" || !("id" in object) || typeof object.id !== "string") return json({ error: "invalid_request" }, 400);

  try {
    const session = await dependencies.stripe.checkout.sessions.retrieve(object.id, { expand: ["line_items.data.price"] });
    const checkout = checkoutSessionInvariant(session, dependencies.priceId);
    if (!checkout) return json({ error: "invalid_request" }, 400);
    if (await fulfillVerifiedCheckout(dependencies.service.rpc, event.id, checkout) === "unavailable") {
      dependencies.log?.("stripe_webhook_unavailable");
      return json({ error: "unavailable" }, 503);
    }
    return json({ received: true });
  } catch {
    dependencies.log?.("stripe_webhook_unavailable");
    return json({ error: "unavailable" }, 503);
  }
}

if (import.meta.main) Deno.serve((request) => handleStripeWebhookRequest(request));
