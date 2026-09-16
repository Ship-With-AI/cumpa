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

// Stripe reports a 100%-off session as "paid" with a zero total and no PaymentIntent, so the
// status string cannot distinguish a comp from a charge. The explaining full discount can:
// amount_subtotal is the list price and amount_discount must cancel it exactly.
const CompedCheckoutSchema = CheckoutIdentitySchema.extend({
  payment_status: z.enum(["paid", "no_payment_required"]),
  amount_total: z.literal(0),
  payment_intent: z.null().optional(),
  total_details: z.object({ amount_discount: z.literal(4999) }),
});

const RetrievedCheckoutSchema = z.union([PaidCheckoutSchema, CompedCheckoutSchema]);

export function checkoutSessionInvariant(session: unknown, priceId: string): VerifiedCheckout | undefined {
  const parsed = RetrievedCheckoutSchema.safeParse(session);
  if (!parsed.success || parsed.data.line_items.data[0].price.id !== priceId || !CheckoutMetadataSchema.safeParse(parsed.data.metadata).success) return undefined;
  return {
    sessionId: parsed.data.id,
    customerId: parsed.data.customer,
    paymentIntentId: parsed.data.payment_intent ?? null,
  };
}

// Bounded field names only: never a retrieved value, identifier, or signature detail.
const rejectionFieldPattern = /^[a-z_]{1,32}$/u;

function failingFields(schema: typeof PaidCheckoutSchema | typeof CompedCheckoutSchema, session: unknown): string | undefined {
  const parsed = schema.safeParse(session);
  if (parsed.success) return undefined;
  const fields: string[] = [];
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && rejectionFieldPattern.test(field) && !fields.includes(field)) fields.push(field);
  }
  return fields.length === 0 ? "shape" : fields.sort().join("+");
}

// A union reports both branches' failures at once, which buries the real cause. Report the
// closest shape instead: the branch the session came nearest to satisfying.
export function describeCheckoutRejection(session: unknown, priceId: string): string {
  const paid = failingFields(PaidCheckoutSchema, session);
  const comped = failingFields(CompedCheckoutSchema, session);
  if (paid !== undefined && comped !== undefined) {
    const paidWidth = paid.split("+").length;
    const compedWidth = comped.split("+").length;
    if (paidWidth !== compedWidth) return paidWidth < compedWidth ? paid : comped;
    return paid <= comped ? paid : comped;
  }
  const parsed = RetrievedCheckoutSchema.safeParse(session);
  if (!parsed.success) return "shape";
  if (parsed.data.line_items.data[0].price.id !== priceId) return "price_id";
  if (!CheckoutMetadataSchema.safeParse(parsed.data.metadata).success) return "metadata";
  return "none";
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
