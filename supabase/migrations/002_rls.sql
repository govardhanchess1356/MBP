-- =============================================================================
-- Migration 002 — Row Level Security
-- Muski Birthday Site
--
-- PHILOSOPHY
-- ──────────
-- Every content table enforces the site time-lock IN POSTGRES, not in the
-- browser. The is_unlocked() helper reads now() vs. settings.unlock_at and
-- is called inside every public-facing SELECT policy. Changing device clocks
-- or disabling JavaScript has zero effect.
--
-- Contributors interact exclusively through SECURITY DEFINER RPCs (migration
-- 003). Those RPCs validate the raw token internally and then use their
-- elevated (definer) rights to read/write. No direct anon INSERT is allowed.
-- =============================================================================

-- ─── Enable RLS on all tables ──────────────────────────────────────────────
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE corner_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_keys   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log    ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Helper Functions
-- SECURITY DEFINER: run as the function owner, bypassing RLS, so they can
-- safely read the settings table even from within a policy.
-- STABLE: Postgres can cache the result within a single query (performance).
-- =============================================================================

-- is_admin(): TRUE iff the current Supabase Auth user matches the stored
-- admin_uid. Returns FALSE (not NULL) when no user is signed in.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND auth.uid() = (SELECT admin_uid FROM settings LIMIT 1)
$$;

-- is_unlocked(): TRUE iff the server clock has passed unlock_at, OR the
-- emergency_unlock flag is set. Evaluated in Postgres — browser cannot spoof.
CREATE OR REPLACE FUNCTION is_unlocked()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    (now() AT TIME ZONE 'UTC') >=
    (SELECT unlock_at AT TIME ZONE 'UTC' FROM settings LIMIT 1)
    OR (SELECT emergency_unlock FROM settings LIMIT 1) = TRUE
$$;

-- =============================================================================
-- settings
-- ─────────
-- Anyone can read (unlock_at is needed for the countdown timer).
-- Only admin can write (e.g. emergency_unlock, unlock_at changes).
-- =============================================================================

-- Policy: public read — no personal data lives here, just timestamps + flags
CREATE POLICY "settings_select_all"
  ON settings
  FOR SELECT
  USING (TRUE);

-- Policy: admin update only
-- admin_uid itself is protected because is_admin() is the gate; once set,
-- only the admin can update it (which means updating admin_uid requires already
-- being admin — a chicken-and-egg intentionally broken by register_admin() RPC).
CREATE POLICY "settings_update_admin"
  ON settings
  FOR UPDATE
  USING (is_admin());

-- =============================================================================
-- contributors
-- ─────────────
-- No public access at all. Token hashes must never be visible to non-admins.
-- All contributor interactions go through SECURITY DEFINER RPCs that validate
-- the raw token and perform all reads/writes internally.
-- =============================================================================

CREATE POLICY "contributors_admin_all"
  ON contributors
  FOR ALL
  USING (is_admin());

-- (No other SELECT/INSERT/UPDATE/DELETE policies → table is invisible to anon)

-- =============================================================================
-- cards
-- ──────
-- VIEWER: can SELECT approved cards only after unlock.
-- ADMIN: full access (preview before unlock, approve/reject, pin).
-- CONTRIBUTOR: goes through submit_card() / get_my_cards() RPCs — no direct
--              access from the anon role.
-- =============================================================================

-- Public read: enforces BOTH the time-lock AND the approval gate server-side.
-- A viewer who inspects their network requests sees an empty [] before unlock.
CREATE POLICY "cards_viewer_select"
  ON cards
  FOR SELECT
  USING (
    is_unlocked()
    AND status = 'approved'
  );

-- Admin sees and modifies everything, regardless of unlock or status.
CREATE POLICY "cards_admin_all"
  ON cards
  FOR ALL
  USING (is_admin());

-- =============================================================================
-- photos
-- ───────
-- Same pattern as cards.
-- =============================================================================

CREATE POLICY "photos_viewer_select"
  ON photos
  FOR SELECT
  USING (
    is_unlocked()
    AND status = 'approved'
  );

CREATE POLICY "photos_admin_all"
  ON photos
  FOR ALL
  USING (is_admin());

-- =============================================================================
-- corner_items
-- ─────────────
-- Same pattern as cards.
-- =============================================================================

CREATE POLICY "corner_items_viewer_select"
  ON corner_items
  FOR SELECT
  USING (
    is_unlocked()
    AND status = 'approved'
  );

CREATE POLICY "corner_items_admin_all"
  ON corner_items
  FOR ALL
  USING (is_admin());

-- =============================================================================
-- vault_items
-- ─────────────
-- Admin-only from a DB-access perspective. The content is encrypted; even
-- admin access returns only ciphertext. Birthday girl reads via admin-scoped
-- session (or a dedicated read-only token in a future hardening pass).
--
-- WHY NOT PUBLIC?: While the ciphertext alone is useless, exposing it to
-- anonymous users reveals how many vault items exist and who submitted them.
-- These metadata are kept admin-only to avoid hinting at the vault's existence.
-- =============================================================================

CREATE POLICY "vault_items_admin_only"
  ON vault_items
  FOR ALL
  USING (is_admin());

-- =============================================================================
-- vault_keys
-- ───────────
-- Public key is readable by ANYONE (contributors need it to encrypt secret drops).
-- Private key ciphertext is also fine to expose — it is useless without the
-- password that generated the PBKDF2 decryption key.
-- Only admin can write (initial one-time setup via vault-setup page).
-- =============================================================================

CREATE POLICY "vault_keys_select_all"
  ON vault_keys
  FOR SELECT
  USING (TRUE);

CREATE POLICY "vault_keys_admin_write"
  ON vault_keys
  FOR ALL
  USING (is_admin());

-- =============================================================================
-- audit_log
-- ──────────
-- Admin-only. Non-admin users cannot read, insert, or modify audit records.
-- This is important: contributors must not be able to see moderation history.
-- =============================================================================

CREATE POLICY "audit_log_admin_all"
  ON audit_log
  FOR ALL
  USING (is_admin());
