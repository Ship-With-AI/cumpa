CREATE FUNCTION public.create_support_intent(
  p_action text,
  p_installation_id text,
  p_intent_hash bytea,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT support_private.create_support_intent(p_action, p_installation_id, p_intent_hash, p_expires_at);
$function$;

CREATE FUNCTION public.claim_support_intent(
  p_intent_hash bytea,
  p_user_id uuid
)
RETURNS TABLE (id uuid, action text, installation_id text)
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT * FROM support_private.claim_support_intent(p_intent_hash, p_user_id);
$function$;

CREATE FUNCTION public.record_checkout_session(
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
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT support_private.record_checkout_session(
    p_intent_id,
    p_stripe_session_id,
    p_user_id,
    p_installation_id,
    p_currency,
    p_price_id,
    p_amount_total,
    p_quantity
  );
$function$;

CREATE FUNCTION public.restore_installation(
  p_user_id uuid,
  p_installation_id text
)
RETURNS boolean
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT support_private.restore_installation(p_user_id, p_installation_id);
$function$;

CREATE FUNCTION public.fulfill_checkout_session(
  p_stripe_session_id text,
  p_stripe_event_id text,
  p_stripe_customer_id text,
  p_stripe_payment_intent_id text
)
RETURNS boolean
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT support_private.fulfill_checkout_session(
    p_stripe_session_id,
    p_stripe_event_id,
    p_stripe_customer_id,
    p_stripe_payment_intent_id
  );
$function$;

CREATE FUNCTION public.installation_status(
  p_installation_id text
)
RETURNS boolean
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT support_private.installation_status(p_installation_id);
$function$;

REVOKE ALL ON FUNCTION public.create_support_intent(text, text, bytea, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_support_intent(bytea, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_checkout_session(uuid, text, uuid, text, text, text, bigint, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_installation(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fulfill_checkout_session(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.installation_status(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_support_intent(text, text, bytea, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_support_intent(bytea, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_checkout_session(uuid, text, uuid, text, text, text, bigint, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_installation(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_checkout_session(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.installation_status(text) TO service_role;

NOTIFY pgrst, 'reload schema';
