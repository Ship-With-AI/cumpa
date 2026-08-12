CREATE TABLE entitlements (
  id BIGSERIAL PRIMARY KEY,
  email_lookup BYTEA UNIQUE NOT NULL,
  source_session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE installation_bindings (
  installation_id TEXT PRIMARY KEY CHECK (installation_id ~ '^[A-Za-z0-9_-]{43}$'),
  entitlement_id BIGINT NOT NULL REFERENCES entitlements,
  verified_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('payment', 'recovery'))
);

CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
