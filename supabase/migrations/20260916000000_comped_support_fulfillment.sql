-- A fully discounted (100%-off promotion code) support Checkout Session charges nothing, so
-- Stripe creates no PaymentIntent for it. Such a session previously had no representable
-- supporter row and its webhook event was rejected before settlement, leaving a comped
-- supporter permanently unverified. Comped support is now a first-class fulfillment outcome.

ALTER TABLE support_private.supporters
  ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION support_private.fulfill_checkout_session(
  p_stripe_session_id text,
  p_stripe_event_id text,
  p_stripe_customer_id text,
  p_stripe_payment_intent_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_checkout support_private.checkout_sessions%ROWTYPE;
  v_event_session_id text;
  v_owner_id uuid;
  v_supporter_found boolean;
  v_existing_payment_id text;
BEGIN
  IF char_length(p_stripe_event_id) NOT BETWEEN 1 AND 255
    OR char_length(p_stripe_customer_id) NOT BETWEEN 1 AND 255
    OR (p_stripe_payment_intent_id IS NOT NULL AND char_length(p_stripe_payment_intent_id) NOT BETWEEN 1 AND 255) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid payment identifiers';
  END IF;

  SELECT stripe_session_id INTO v_event_session_id
  FROM support_private.stripe_events
  WHERE stripe_event_id = p_stripe_event_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_event_session_id IS DISTINCT FROM p_stripe_session_id THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'stripe event conflict';
    END IF;

    RETURN true;
  END IF;

  SELECT * INTO v_checkout
  FROM support_private.checkout_sessions
  WHERE stripe_session_id = p_stripe_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'unknown checkout session';
  END IF;

  IF v_checkout.fulfilled_at IS NULL THEN
    SELECT stripe_payment_intent_id INTO v_existing_payment_id
    FROM support_private.supporters
    WHERE user_id = v_checkout.user_id
    FOR UPDATE;

    v_supporter_found := FOUND;

    -- Two distinct charged payments for one supporter remain an auditable conflict. A comped
    -- fulfillment carries no PaymentIntent, so it can neither create nor claim that conflict.
    IF v_supporter_found
      AND v_existing_payment_id IS NOT NULL
      AND p_stripe_payment_intent_id IS NOT NULL
      AND v_existing_payment_id <> p_stripe_payment_intent_id THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'supporter payment conflict';
    END IF;

    INSERT INTO support_private.supporters (user_id, verified_at, stripe_customer_id, stripe_payment_intent_id)
    VALUES (v_checkout.user_id, pg_catalog.now(), p_stripe_customer_id, p_stripe_payment_intent_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT user_id INTO v_owner_id
    FROM support_private.installation_bindings
    WHERE installation_id = v_checkout.installation_id
    FOR UPDATE;

    IF FOUND AND v_owner_id IS DISTINCT FROM v_checkout.user_id THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'installation already bound';
    END IF;

    INSERT INTO support_private.installation_bindings (installation_id, user_id, verified_at)
    VALUES (v_checkout.installation_id, v_checkout.user_id, pg_catalog.now())
    ON CONFLICT (installation_id) DO NOTHING;

    UPDATE support_private.checkout_sessions
    SET fulfilled_at = pg_catalog.now()
    WHERE id = v_checkout.id;
  END IF;

  INSERT INTO support_private.stripe_events (stripe_event_id, stripe_session_id)
  VALUES (p_stripe_event_id, v_checkout.stripe_session_id);

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION support_private.fulfill_checkout_session(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION support_private.fulfill_checkout_session(text, text, text, text) TO service_role;
