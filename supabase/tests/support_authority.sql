begin;

select extensions.plan(38);

select extensions.ok(exists (select 1 from pg_namespace where nspname = 'support_private'), 'private authority schema exists');
select extensions.ok((select count(*) from pg_tables where schemaname = 'support_private') = 5, 'exactly five authority tables exist');
select extensions.ok((select count(*) from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace where nspname = 'support_private' and proname in ('create_support_intent', 'claim_support_intent', 'record_checkout_session', 'restore_installation', 'fulfill_checkout_session', 'installation_status')) = 6, 'all authority RPCs exist');
create function _test_migration_applied() returns boolean language plpgsql as $function$
declare applied boolean;
begin
  execute 'select exists (select 1 from supabase_migrations.schema_migrations where version = ''20260814000000'')' into applied;
  return applied;
exception when undefined_table then
  return false;
end;
$function$;

select extensions.ok(_test_migration_applied(), 'authority migration is applied');
select extensions.ok((select count(*) from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace where nspname = 'support_private' and relkind = 'r' and relrowsecurity) = 5, 'RLS is enabled on every authority table');
select extensions.ok(not exists (select 1 from information_schema.columns where table_schema = 'support_private' and column_name in ('email', 'email_lookup', 'github_profile', 'github_login', 'oauth_token', 'access_token', 'recovery_token', 'magic_token', 'poll_token', 'challenge_id')), 'authority schema stores no identity or recovery fields');
select extensions.ok(not has_table_privilege('public', 'support_private.support_intents', 'select'), 'PUBLIC cannot read authority tables');
select extensions.ok(not has_table_privilege('anon', 'support_private.support_intents', 'select'), 'anon cannot read authority tables');
select extensions.ok(not has_table_privilege('authenticated', 'support_private.support_intents', 'select'), 'authenticated cannot read authority tables');
select extensions.ok(not has_function_privilege('public', 'support_private.installation_status(text)', 'execute'), 'PUBLIC cannot execute authority RPCs');
select extensions.ok(not has_function_privilege('anon', 'support_private.installation_status(text)', 'execute'), 'anon cannot execute authority RPCs');
select extensions.ok(not has_function_privilege('authenticated', 'support_private.installation_status(text)', 'execute'), 'authenticated cannot execute authority RPCs');
select extensions.ok(has_function_privilege('service_role', 'support_private.installation_status(text)', 'execute'), 'service_role can execute authority RPCs');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'supporter-one@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'supporter-two@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'unpaid@example.test', '', now(), now(), now());

select extensions.throws_ok(
  $$select support_private.create_support_intent('support', 'bad', decode(repeat('01', 32), 'hex'), now() + interval '5 minutes')$$,
  '23514', null,
  'malformed installation IDs are rejected'
);
select extensions.throws_ok(
  $$select support_private.create_support_intent('invalid', repeat('a', 43), decode(repeat('02', 32), 'hex'), now() + interval '5 minutes')$$,
  '23514', null,
  'invalid intent actions are rejected'
);
select extensions.throws_ok(
  $$select support_private.create_support_intent('support', repeat('a', 43), decode('00', 'hex'), now() + interval '5 minutes')$$,
  '23514', null,
  'intent digests must be SHA-256 length'
);
select extensions.lives_ok(
  $$select support_private.create_support_intent('restore', repeat('a', 43), decode(repeat('03', 32), 'hex'), now() - interval '1 second')$$,
  'expired intent can be recorded without plaintext'
);
select extensions.throws_ok(
  $$select * from support_private.claim_support_intent(decode(repeat('03', 32), 'hex'), '00000000-0000-0000-0000-000000000001')$$,
  'P0001', null,
  'expired intent cannot be claimed'
);
select extensions.lives_ok(
  $$select support_private.create_support_intent('support', repeat('a', 43), decode(repeat('04', 32), 'hex'), now() + interval '5 minutes')$$,
  'valid intent is created from a digest only'
);
select extensions.lives_ok(
  $$select * from support_private.claim_support_intent(decode(repeat('04', 32), 'hex'), '00000000-0000-0000-0000-000000000001')$$,
  'first intent claimant is accepted'
);
select extensions.throws_ok(
  $$select * from support_private.claim_support_intent(decode(repeat('04', 32), 'hex'), '00000000-0000-0000-0000-000000000002')$$,
  'P0001', null,
  'consumed intents cannot be reused by another user'
);
select extensions.lives_ok(
  $$select support_private.create_support_intent('support', repeat('b', 43), decode(repeat('05', 32), 'hex'), now() + interval '5 minutes')$$,
  'checkout intent is created'
);
select extensions.lives_ok(
  $$select * from support_private.claim_support_intent(decode(repeat('05', 32), 'hex'), '00000000-0000-0000-0000-000000000001')$$,
  'checkout intent is claimed'
);
select extensions.throws_ok(
  $$select support_private.record_checkout_session((select id from support_private.support_intents where intent_hash = decode(repeat('05', 32), 'hex')), 'cs_wrong', '00000000-0000-0000-0000-000000000001', repeat('b', 43), 'eur', 'price_support', 4999, 1)$$,
  'P0001', null,
  'wrong payment currency is rejected'
);
select extensions.lives_ok(
  $$select support_private.record_checkout_session((select id from support_private.support_intents where intent_hash = decode(repeat('05', 32), 'hex')), 'cs_paid_one', '00000000-0000-0000-0000-000000000001', repeat('b', 43), 'usd', 'price_support', 4999, 1)$$,
  'server-recorded checkout facts are accepted'
);
select extensions.throws_ok(
  $$select support_private.fulfill_checkout_session('cs_missing', 'evt_missing', 'cus_missing', 'pi_missing')$$,
  'P0001', null,
  'unrecorded payment sessions cannot fulfill'
);
select extensions.lives_ok(
  $$select support_private.fulfill_checkout_session('cs_paid_one', 'evt_paid_one', 'cus_paid_one', 'pi_paid_one')$$,
  'recorded payment fulfillment is accepted'
);
select extensions.lives_ok(
  $$select support_private.fulfill_checkout_session('cs_paid_one', 'evt_paid_one', 'cus_paid_one', 'pi_paid_one')$$,
  'replayed event is idempotent'
);
select extensions.is(support_private.installation_status(repeat('b', 43)), true, 'fulfilled checkout verifies its installation');
select extensions.is(support_private.restore_installation('00000000-0000-0000-0000-000000000003', repeat('c', 43)), false, 'unpaid restoration returns generic false');
select extensions.is(support_private.restore_installation('00000000-0000-0000-0000-000000000001', repeat('c', 43)), true, 'paid user restores another installation');
select extensions.is(support_private.restore_installation('00000000-0000-0000-0000-000000000001', repeat('d', 43)), true, 'paid user restores unlimited installations');
select extensions.lives_ok(
  $$select support_private.create_support_intent('support', repeat('e', 43), decode(repeat('06', 32), 'hex'), now() + interval '5 minutes')$$,
  'second supporter intent is created'
);
select extensions.lives_ok(
  $$select * from support_private.claim_support_intent(decode(repeat('06', 32), 'hex'), '00000000-0000-0000-0000-000000000002')$$,
  'second supporter claims intent'
);
select extensions.lives_ok(
  $$select support_private.record_checkout_session((select id from support_private.support_intents where intent_hash = decode(repeat('06', 32), 'hex')), 'cs_paid_two', '00000000-0000-0000-0000-000000000002', repeat('e', 43), 'usd', 'price_support_two', 4999, 1)$$,
  'second checkout is recorded'
);
select extensions.lives_ok(
  $$select support_private.fulfill_checkout_session('cs_paid_two', 'evt_paid_two', 'cus_paid_two', 'pi_paid_two')$$,
  'second supporter is fulfilled'
);
select extensions.throws_ok(
  $$select support_private.restore_installation('00000000-0000-0000-0000-000000000002', repeat('b', 43))$$,
  'P0001', null,
  'another paid user cannot rebind an installation'
);

select * from extensions.finish();
rollback;
