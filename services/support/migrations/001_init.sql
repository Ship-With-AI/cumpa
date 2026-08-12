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

CREATE TABLE recovery_challenges (
  challenge_id TEXT PRIMARY KEY,
  poll_token_hash BYTEA UNIQUE NOT NULL,
  magic_token_hash BYTEA UNIQUE,
  installation_id TEXT NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{43}$'),
  entitlement_id BIGINT REFERENCES entitlements,
  email_lookup BYTEA NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  state TEXT NOT NULL CHECK (state IN ('pending', 'verified'))
);

CREATE TABLE recovery_rate_limits (
  scope TEXT NOT NULL CHECK (scope IN ('ip', 'email')),
  lookup BYTEA NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, lookup, window_started_at)
);
