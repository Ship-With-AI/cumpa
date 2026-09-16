import { z } from "zod";

import { CheckoutMetadataSchema } from "./validation.ts";

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;

type VerifiedCheckout = Readonly<{
  sessionId: string;
  customerId: string;
  paymentIntentId: string | null;
}>;

const CheckoutIdentitySchema = z.object({
  id: z.string().min(1),
  mode: z.literal("payment"),
  currency: z.literal("usd"),
  amount_subtotal: z.literal(4999),
  customer: z.string().min(1),
  metadata: z.unknown(),
  line_items: z.object({
    data: z.tuple([z.object({
      price: z.object({ id: z.string() }),
      quantity: z.literal(1),
    })]),
  }),
});

// A charged session must expose the PaymentIntent that funded it.
const PaidCheckoutSchema = CheckoutIdentitySchema.extend({
  payment_status: z.literal("paid"),
  amount_total: z.number().int().min(1).max(4999),
  payment_intent: z.string().min(1),
});

// A fully discounted (comped) session charges nothing, so Stripe creates no PaymentIntent.
const CompedCheckoutSchema = CheckoutIdentitySchema.extend({
  payment_status: z.literal("no_payment_required"),
  amount_total: z.literal(0),
  payment_intent: z.null().optional(),
});

const RetrievedCheckoutSchema = z.union([PaidCheckoutSchema, CompedCheckoutSchema]);

export function checkoutSessionInvariant(session: unknown, priceId: string): VerifiedCheckout | undefined {
  const parsed = RetrievedCheckoutSchema.safeParse(session);
  if (!parsed.success || parsed.data.line_items.data[0].price.id !== priceId || !CheckoutMetadataSchema.safeParse(parsed.data.metadata).success) return undefined;
  return {
    sessionId: parsed.data.id,
    customerId: parsed.data.customer,
    paymentIntentId: parsed.data.payment_status === "paid" ? parsed.data.payment_intent : null,
  };
}

export async function fulfillVerifiedCheckout(
  rpc: Rpc,
  eventId: string,
  checkout: VerifiedCheckout,
): Promise<{ status: "settled" } | { status: "unavailable"; error: unknown }> {
  const result = await rpc("fulfill_checkout_session", {
    p_stripe_session_id: checkout.sessionId,
    p_stripe_event_id: eventId,
    p_stripe_customer_id: checkout.customerId,
    p_stripe_payment_intent_id: checkout.paymentIntentId,
  });
  return result.error ? { status: "unavailable", error: result.error } : { status: "settled" };
}
