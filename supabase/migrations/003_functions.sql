-- =============================================================================
-- Migration 003 — RPC Functions
-- Muski Birthday Site
--
-- All functions use SECURITY DEFINER so they run as the Postgres role that
-- owns them (bypassing RLS), after performing their own auth checks.
--
-- Public RPCs (no auth required): get_countdown, validate_contributor_token
-- Contributor RPCs (token validated internally): submit_card, update_card,
--   get_my_cards, submit_corner_item
-- Admin RPCs (is_admin() checked internally): generate_invite_token,
--   set_unlock_time, moderate_item, register_admin
-- =============================================================================

-- =============================================================================
-- get_countdown()
-- ─────────────────────────────────────────────────────────────────────────────
-- PUBLIC. Returns only { unlock_at, server_now, is_unlocked }.
-- No personal data whatsoever. Safe for anonymous callers.
-- The browser uses server_now to compute a clock offset and drives the
-- countdown using (Date.now() + offset) so device clock drift is corrected.
-- =============================================================================
CREATE OR REPLACE FUNCTION get_countdown()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'unlock_at',   unlock_at,
    'server_now',  now(),
    'is_unlocked', is_unlocked()
  )
  FROM settings
  LIMIT 1;
$$;

-- =============================================================================
-- validate_contributor_token(p_token TEXT)
-- ─────────────────────────────────────────────────────────────────────────────
-- PUBLIC. Hashes the raw token with SHA-256 and looks it up.
-- Returns { contributor_id UUID, name TEXT } on success, NULL on failure.
-- Includes a 2-second sleep on failure to resist brute-force attempts.
-- The client MUST also enforce rate limiting (see VAULT_MAX_ATTEMPTS).
-- =============================================================================
CREATE OR REPLACE FUNCTION validate_contributor_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row contributors%ROWTYPE;
BEGIN
  -- sha256() is available in Postgres 11+ without extensions
  SELECT *
    INTO v_row
    FROM contributors
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex')
     AND is_active  = TRUE;

  IF NOT FOUND THEN
    -- Slow down brute-force; mirrors client-side delay
    PERFORM pg_sleep(2);
    RETURN NULL;
  END IF;

  -- Record first use (used_at stays NULL until first successful call)
  IF v_row.used_at IS NULL THEN
    UPDATE contributors SET used_at = now() WHERE id = v_row.id;
  END IF;

  RETURN json_build_object(
    'contributor_id', v_row.id,
    'name',           v_row.name
  );
END;
$$;

-- =============================================================================
-- submit_card(...)
-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRIBUTOR. Validates token, inserts card, logs action.
-- Photo/audio/video paths are attached via a separate upload flow (the client
-- calls Supabase Storage after getting the card UUID back from this RPC).
-- Returns the new card UUID.
-- =============================================================================
CREATE OR REPLACE FUNCTION submit_card(
  p_token         TEXT,
  p_title         TEXT,
  p_message       TEXT,
  p_scratch_color TEXT DEFAULT 'gold',
  p_card_theme    TEXT DEFAULT 'theme1',
  p_emoji         TEXT DEFAULT '🎂',
  p_font_style    TEXT DEFAULT 'font1',
  p_reveal_effect TEXT DEFAULT 'confetti',
  p_position_hint TEXT DEFAULT 'middle'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cid     UUID;
  v_card_id UUID;
BEGIN
  -- 1. Validate contributor token
  SELECT id
    INTO v_cid
    FROM contributors
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex')
     AND is_active  = TRUE;

  IF NOT FOUND THEN
    PERFORM pg_sleep(2);
    RAISE EXCEPTION 'invalid_token';
  END IF;

  -- 2. Server-side message length guard (defence-in-depth — CHECK constraint also exists)
  IF char_length(p_message) > 500 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;
  IF char_length(p_message) < 1 THEN
    RAISE EXCEPTION 'message_empty';
  END IF;

  -- 3. Insert card (status defaults to 'pending'; admin must approve)
  INSERT INTO cards (
    contributor_id,
    title,
    message,
    scratch_color,
    card_theme,
    emoji,
    font_style,
    reveal_effect,
    position_hint
  ) VALUES (
    v_cid,
    p_title,
    p_message,
    p_scratch_color,
    p_card_theme,
    p_emoji,
    p_font_style,
    p_reveal_effect,
    p_position_hint
  )
  RETURNING id INTO v_card_id;

  -- 4. Audit trail
  INSERT INTO audit_log (action, target_table, target_id, details)
  VALUES (
    'card_submitted',
    'cards',
    v_card_id,
    jsonb_build_object('contributor_id', v_cid)
  );

  RETURN v_card_id;
END;
$$;

-- =============================================================================
-- update_card(p_token, p_card_id, p_title, p_message)
-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRIBUTOR. Edit a card that is still PENDING (not yet approved).
-- Returns TRUE if a row was actually updated, FALSE if not found / already approved.
-- =============================================================================
CREATE OR REPLACE FUNCTION update_card(
  p_token   TEXT,
  p_card_id UUID,
  p_title   TEXT,
  p_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cid UUID;
BEGIN
  SELECT id
    INTO v_cid
    FROM contributors
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex')
     AND is_active  = TRUE;

  IF NOT FOUND THEN
    PERFORM pg_sleep(2);
    RAISE EXCEPTION 'invalid_token';
  END IF;

  IF char_length(p_message) > 500 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  UPDATE cards
     SET title      = p_title,
         message    = p_message,
         updated_at = now()
   WHERE id             = p_card_id
     AND contributor_id = v_cid
     AND status         = 'pending';   -- locked once approved

  RETURN FOUND;
END;
$$;

-- =============================================================================
-- get_my_cards(p_token TEXT)
-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRIBUTOR. Returns only this contributor's own cards.
-- Contributors CANNOT see other contributors' cards (enforced here, not just RLS).
-- =============================================================================
CREATE OR REPLACE FUNCTION get_my_cards(p_token TEXT)
RETURNS SETOF cards
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cid UUID;
BEGIN
  SELECT id
    INTO v_cid
    FROM contributors
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex')
     AND is_active  = TRUE;

  IF NOT FOUND THEN
    PERFORM pg_sleep(2);
    RAISE EXCEPTION 'invalid_token';
  END IF;

  RETURN QUERY
    SELECT *
      FROM cards
     WHERE contributor_id = v_cid
     ORDER BY created_at DESC;
END;
$$;

-- =============================================================================
-- submit_corner_item(p_token, p_corner_id, p_payload)
-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRIBUTOR. Generic submission endpoint for all registered corners.
-- Payload JSON schema validation is done client-side; this RPC does a basic
-- sanity check only. Returns the new item UUID.
-- =============================================================================
CREATE OR REPLACE FUNCTION submit_corner_item(
  p_token     TEXT,
  p_corner_id TEXT,
  p_payload   JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cid     UUID;
  v_item_id UUID;
BEGIN
  SELECT id
    INTO v_cid
    FROM contributors
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex')
     AND is_active  = TRUE;

  IF NOT FOUND THEN
    PERFORM pg_sleep(2);
    RAISE EXCEPTION 'invalid_token';
  END IF;

  -- Basic guard: corner_id must be a non-empty identifier
  IF p_corner_id IS NULL OR trim(p_corner_id) = '' THEN
    RAISE EXCEPTION 'invalid_corner_id';
  END IF;

  INSERT INTO corner_items (corner_id, contributor_id, payload)
  VALUES (p_corner_id, v_cid, p_payload)
  RETURNING id INTO v_item_id;

  INSERT INTO audit_log (action, target_table, target_id, details)
  VALUES (
    'corner_item_submitted',
    'corner_items',
    v_item_id,
    jsonb_build_object('corner_id', p_corner_id, 'contributor_id', v_cid)
  );

  RETURN v_item_id;
END;
$$;

-- =============================================================================
-- generate_invite_token(p_name, p_email)
-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN. Generates a cryptographically random 32-byte base64url token.
-- Stores only the SHA-256 hash. Returns the raw token ONCE — admin must
-- immediately share it. It cannot be retrieved again.
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_invite_token(
  p_name  TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token      TEXT;
  v_token_hash TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 32 random bytes → base64 → make URL-safe (replace + with - and / with _)
  v_token := replace(
               replace(
                 encode(gen_random_bytes(32), 'base64'),
                 '+', '-'
               ),
               '/', '_'
             );

  -- Strip any trailing '=' padding (not needed in URLs)
  v_token := rtrim(v_token, '=');

  v_token_hash := encode(sha256(v_token::bytea), 'hex');

  INSERT INTO contributors (name, email, token_hash)
  VALUES (p_name, p_email, v_token_hash);

  INSERT INTO audit_log (actor_uid, action, details)
  VALUES (
    auth.uid(),
    'create_invite_token',
    jsonb_build_object('name', p_name, 'email', p_email)
  );

  RETURN v_token;
END;
$$;

-- =============================================================================
-- set_unlock_time(p_unlock_at TIMESTAMPTZ)
-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN. Update the site unlock timestamp.
-- =============================================================================
CREATE OR REPLACE FUNCTION set_unlock_time(p_unlock_at TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE settings SET unlock_at = p_unlock_at WHERE id = 1;

  INSERT INTO audit_log (actor_uid, action, details)
  VALUES (
    auth.uid(),
    'set_unlock_time',
    jsonb_build_object('unlock_at', p_unlock_at)
  );
END;
$$;

-- =============================================================================
-- moderate_item(p_table, p_id, p_status)
-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN. Approve or reject a card, photo, or corner_item.
-- Uses dynamic SQL (EXECUTE) because the table name is a parameter.
-- Table name is validated against an allowlist before use.
-- =============================================================================
CREATE OR REPLACE FUNCTION moderate_item(
  p_table  TEXT,
  p_id     UUID,
  p_status TEXT   -- 'approved' | 'rejected'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Allowlist check prevents SQL injection via p_table
  IF p_table NOT IN ('cards', 'photos', 'corner_items') THEN
    RAISE EXCEPTION 'invalid_table: %', p_table;
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_status: %', p_status;
  END IF;

  EXECUTE format(
    'UPDATE %I SET status = $1, updated_at = now() WHERE id = $2',
    p_table
  ) USING p_status, p_id;

  INSERT INTO audit_log (actor_uid, action, target_table, target_id, details)
  VALUES (
    auth.uid(),
    'moderate_item',
    p_table,
    p_id,
    jsonb_build_object('new_status', p_status)
  );
END;
$$;

-- =============================================================================
-- register_admin(p_uid UUID)
-- ─────────────────────────────────────────────────────────────────────────────
-- ONE-TIME BOOTSTRAP. Call this once immediately after creating your Supabase
-- Auth account. Sets settings.admin_uid to your user ID.
--
-- Security: only works when admin_uid IS NULL (first run only).
--           Caller must be the same UID they are registering (cannot hijack
--           someone else's UID into the admin slot).
--
-- After running this, the is_admin() function works for all subsequent calls.
-- =============================================================================
CREATE OR REPLACE FUNCTION register_admin(p_uid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only callable before an admin is registered
  IF (SELECT admin_uid FROM settings LIMIT 1) IS NOT NULL THEN
    RAISE EXCEPTION 'admin_already_registered — contact your DB admin if you need to reset';
  END IF;

  -- Caller must match the UID they're trying to register
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF auth.uid() != p_uid THEN
    RAISE EXCEPTION 'uid_mismatch';
  END IF;

  UPDATE settings SET admin_uid = p_uid WHERE id = 1;
END;
$$;
