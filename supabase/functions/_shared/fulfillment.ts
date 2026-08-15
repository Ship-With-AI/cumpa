import { CheckoutMetadataSchema } from "./validation.ts";

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;

type VerifiedCheckout = Readonly<{
  sessionId: string;
  customerId: string;
  paymentIntentId: string;
}>;

export function checkoutSessionInvariant(session: unknown, priceId: string): VerifiedCheckout | undefined {
  if (!session || typeof session !== "object") return undefined;
  const value = session as Record<string, unknown>;
  const lineItems = value.line_items as { data?: unknown } | undefined;
  const items = lineItems?.data;
  if (
    typeof value.id !== "string" || value.id.length === 0 ||
    value.mode !== "payment" || value.payment_status !== "paid" ||
    value.currency !== "usd" || value.amount_total !== 4999 ||
    typeof value.customer !== "string" || value.customer.length === 0 ||
    typeof value.payment_intent !== "string" || value.payment_intent.length === 0 ||
    !Array.isArray(items) || items.length !== 1
  ) return undefined;
  const item = items[0] as { price?: { id?: unknown }; quantity?: unknown };
  if (item?.price?.id !== priceId || item.quantity !== 1 || !CheckoutMetadataSchema.safeParse(value.metadata).success) return undefined;
  return { sessionId: value.id, customerId: value.customer, paymentIntentId: value.payment_intent };
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
