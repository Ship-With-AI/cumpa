# Supabase Authority Schema Evidence

**Recorded:** 2026-08-15
**Target:** local database only (`supabase db start`); Auth, Edge Runtime, API, Storage, Studio, Realtime, Analytics, and local SMTP disabled in `supabase/config.toml`.

## Red Contract Before Migration

```text
$ npx supabase@2.114.0 db reset --local --no-seed && ! npx supabase@2.114.0 test db
Reset local database.
support_authority.sql: schema "support_private" does not exist
Failed tests include: private authority schema exists; exactly five authority tables exist;
all authority RPCs exist; authority migration is applied; RLS is enabled on every authority table.
Result: FAIL (expected RED)
```

The failure was caused by the absent authority schema on an otherwise started, reset database—not by local-stack startup or SQL syntax.

## Zero-State Application Cycle 1

```text
$ npx supabase@2.114.0 db reset --local --no-seed
Applying migration 20260814000000_support_authority.sql
Reset local database.

$ npx supabase@2.114.0 test db
support_authority.sql .. ok
All tests successful. Files=1, Tests=39

$ npx supabase@2.114.0 migration list --local
local: 20260814000000
remote: 20260814000000

$ npx supabase@2.114.0 db lint --local
Linting schema: extensions
Linting schema: public
Linting schema: support_private
No schema errors found
```

## Zero-State Application Cycle 2

```text
$ npx supabase@2.114.0 db reset --local --no-seed
Applying migration 20260814000000_support_authority.sql
Reset local database.

$ npx supabase@2.114.0 test db
support_authority.sql .. ok
All tests successful. Files=1, Tests=39

$ npx supabase@2.114.0 migration list --local
local: 20260814000000
remote: 20260814000000

$ npx supabase@2.114.0 db lint --local
Linting schema: extensions
Linting schema: public
Linting schema: support_private
No schema errors found
```

## SQL Contract Coverage

The 39 live pgTAP assertions inspect the applied migration version; every required RPC; RLS on all five `support_private` tables; service-role-only RPC grants and table denial; prohibited identity/recovery columns; malformed action, installation ID, and digest rejection; expiring/one-use intent consumption; payment-fact rejection; idempotent webhook replay; paid unlimited installation restoration; unpaid generic `false`; and immutable cross-user installation ownership.

No credentials, connection strings, or hosted identifiers are recorded here.
