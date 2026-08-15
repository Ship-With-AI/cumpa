CREATE SCHEMA support_private;

CREATE TABLE support_private.support_intents (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  intent_hash bytea NOT NULL UNIQUE CHECK (octet_length(intent_hash) = 32),
  action text NOT NULL CHECK (action IN ('support', 'restore')),
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{43}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((consumed_at IS NULL) = (consumed_by IS NULL))
);

CREATE TABLE support_private.supporters (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  verified_at timestamptz NOT NULL,
  stripe_customer_id text NOT NULL UNIQUE CHECK (char_length(stripe_customer_id) BETWEEN 1 AND 255),
  stripe_payment_intent_id text NOT NULL UNIQUE CHECK (char_length(stripe_payment_intent_id) BETWEEN 1 AND 255)
);

CREATE TABLE support_private.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  intent_id uuid NOT NULL UNIQUE REFERENCES support_private.support_intents(id),
  stripe_session_id text NOT NULL UNIQUE CHECK (char_length(stripe_session_id) BETWEEN 1 AND 255),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{43}$'),
  currency text NOT NULL CHECK (currency = 'usd'),
  price_id text NOT NULL CHECK (char_length(price_id) BETWEEN 1 AND 255),
  amount_total bigint NOT NULL CHECK (amount_total = 4999),
  quantity integer NOT NULL CHECK (quantity = 1),
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_private.stripe_events (
  stripe_event_id text PRIMARY KEY CHECK (char_length(stripe_event_id) BETWEEN 1 AND 255),
  stripe_session_id text NOT NULL REFERENCES support_private.checkout_sessions(stripe_session_id),
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_private.installation_bindings (
  installation_id text PRIMARY KEY CHECK (installation_id ~ '^[A-Za-z0-9_-]{43}$'),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  verified_at timestamptz NOT NULL
);

CREATE INDEX support_intents_unconsumed_expiry_idx
  ON support_private.support_intents (expires_at)
  WHERE consumed_at IS NULL;
CREATE INDEX checkout_sessions_unfulfilled_idx
  ON support_private.checkout_sessions (created_at)
  WHERE fulfilled_at IS NULL;
CREATE INDEX installation_bindings_user_id_idx
  ON support_private.installation_bindings (user_id);

ALTER TABLE support_private.support_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_private.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_private.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_private.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_private.installation_bindings ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION support_private.create_support_intent(
  p_action text,
  p_installation_id text,
  p_intent_hash bytea,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_intent_id uuid;
BEGIN
  INSERT INTO support_private.support_intents (action, installation_id, intent_hash, expires_at)
  VALUES (p_action, p_installation_id, p_intent_hash, p_expires_at)
  RETURNING id INTO v_intent_id;

  RETURN v_intent_id;
END;
$function$;

CREATE FUNCTION support_private.claim_support_intent(
  p_intent_hash bytea,
  p_user_id uuid
)
RETURNS TABLE (id uuid, action text, installation_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  UPDATE support_private.support_intents
  SET consumed_at = pg_catalog.now(), consumed_by = p_user_id
  WHERE intent_hash = p_intent_hash
    AND consumed_at IS NULL
    AND expires_at > pg_catalog.now()
  RETURNING support_intents.id, support_intents.action, support_intents.installation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid support intent';
  END IF;
END;
$function$;

CREATE FUNCTION support_private.record_checkout_session(
  p_intent_id uuid,
  p_stripe_session_id text,
  p_user_id uuid,
  p_installation_id text,
  p_currency text,
  p_price_id text,
  p_amount_total bigint,
  p_quantity integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_intent support_private.support_intents%ROWTYPE;
  v_checkout support_private.checkout_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_intent
  FROM support_private.support_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND
    OR v_intent.action <> 'support'
    OR v_intent.consumed_by IS DISTINCT FROM p_user_id
    OR v_intent.installation_id <> p_installation_id THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid checkout intent';
  END IF;

  IF p_currency <> 'usd'
    OR p_amount_total <> 4999
    OR p_quantity <> 1
    OR char_length(p_stripe_session_id) NOT BETWEEN 1 AND 255
    OR char_length(p_price_id) NOT BETWEEN 1 AND 255 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid checkout facts';
  END IF;

  SELECT * INTO v_checkout
  FROM support_private.checkout_sessions
  WHERE stripe_session_id = p_stripe_session_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_checkout.intent_id IS DISTINCT FROM p_intent_id
      OR v_checkout.user_id IS DISTINCT FROM p_user_id
      OR v_checkout.installation_id IS DISTINCT FROM p_installation_id
      OR v_checkout.currency IS DISTINCT FROM p_currency
      OR v_checkout.price_id IS DISTINCT FROM p_price_id
      OR v_checkout.amount_total IS DISTINCT FROM p_amount_total
      OR v_checkout.quantity IS DISTINCT FROM p_quantity THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'checkout facts conflict';
    END IF;

    RETURN v_checkout.id;
  END IF;

  INSERT INTO support_private.checkout_sessions (
    intent_id, stripe_session_id, user_id, installation_id, currency, price_id, amount_total, quantity
  ) VALUES (
    p_intent_id, p_stripe_session_id, p_user_id, p_installation_id, p_currency, p_price_id, p_amount_total, p_quantity
  ) RETURNING id INTO v_checkout.id;

  RETURN v_checkout.id;
END;
$function$;

CREATE FUNCTION support_private.restore_installation(
  p_user_id uuid,
  p_installation_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_owner_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM support_private.supporters WHERE user_id = p_user_id) THEN
    RETURN false;
  END IF;

  SELECT user_id INTO v_owner_id
  FROM support_private.installation_bindings
  WHERE installation_id = p_installation_id
  FOR UPDATE;

  IF FOUND AND v_owner_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'installation already bound';
  END IF;

  INSERT INTO support_private.installation_bindings (installation_id, user_id, verified_at)
  VALUES (p_installation_id, p_user_id, pg_catalog.now())
  ON CONFLICT (installation_id) DO NOTHING;

  RETURN true;
END;
$function$;

CREATE FUNCTION support_private.fulfill_checkout_session(
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
  v_existing_payment_id text;
BEGIN
  IF char_length(p_stripe_event_id) NOT BETWEEN 1 AND 255
    OR char_length(p_stripe_customer_id) NOT BETWEEN 1 AND 255
    OR char_length(p_stripe_payment_intent_id) NOT BETWEEN 1 AND 255 THEN
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

    IF FOUND AND v_existing_payment_id IS DISTINCT FROM p_stripe_payment_intent_id THEN
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

CREATE FUNCTION support_private.installation_status(
  p_installation_id text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM support_private.installation_bindings
    WHERE installation_id = p_installation_id
  );
$function$;

REVOKE ALL ON SCHEMA support_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA support_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA support_private FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA support_private TO service_role;
GRANT EXECUTE ON FUNCTION support_private.create_support_intent(text, text, bytea, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION support_private.claim_support_intent(bytea, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION support_private.record_checkout_session(uuid, text, uuid, text, text, text, bigint, integer) TO service_role;
GRANT EXECUTE ON FUNCTION support_private.restore_installation(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION support_private.fulfill_checkout_session(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION support_private.installation_status(text) TO service_role;
