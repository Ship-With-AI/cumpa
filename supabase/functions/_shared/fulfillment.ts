import { z } from "zod";

import { CheckoutMetadataSchema } from "./validation.ts";

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;

type VerifiedCheckout = Readonly<{
  sessionId: string;
  customerId: string;
  paymentIntentId: string;
}>;

const RetrievedCheckoutSchema = z.object({
  id: z.string().min(1),
  mode: z.literal("payment"),
  payment_status: z.literal("paid"),
  currency: z.literal("usd"),
  amount_total: z.literal(4999),
  customer: z.string().min(1),
  payment_intent: z.string().min(1),
  metadata: z.unknown(),
  line_items: z.object({
    data: z.tuple([z.object({
      price: z.object({ id: z.string() }),
      quantity: z.literal(1),
    })]),
  }),
});

export function checkoutSessionInvariant(session: unknown, priceId: string): VerifiedCheckout | undefined {
  const parsed = RetrievedCheckoutSchema.safeParse(session);
  if (!parsed.success || parsed.data.line_items.data[0].price.id !== priceId || !CheckoutMetadataSchema.safeParse(parsed.data.metadata).success) return undefined;
  return {
    sessionId: parsed.data.id,
    customerId: parsed.data.customer,
    paymentIntentId: parsed.data.payment_intent,
  };
}

export async function fulfillVerifiedCheckout(rpc: Rpc, eventId: string, checkout: VerifiedCheckout): Promise<"settled" | "unavailable"> {
  const result = await rpc("fulfill_checkout_session", {
    p_stripe_session_id: checkout.sessionId,
    p_stripe_event_id: eventId,
    p_stripe_customer_id: checkout.customerId,
    p_stripe_payment_intent_id: checkout.paymentIntentId,
  });
  return result.error ? "unavailable" : "settled";
}
