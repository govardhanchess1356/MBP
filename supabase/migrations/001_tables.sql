-- =============================================================================
-- Migration 001 — Table Definitions
-- Muski Birthday Site
-- Run order: 001 → 002 → 003 → 004
-- =============================================================================

-- Enable extensions
-- pgcrypto: gen_random_bytes() for token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- settings — Singleton row (id always = 1). Site-wide configuration.
-- =============================================================================
CREATE TABLE settings (
  id               INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  unlock_at        TIMESTAMPTZ NOT NULL DEFAULT '2026-10-22T18:30:00Z', -- midnight IST Oct 23 2026
  admin_uid        UUID,                -- auth.uid() of admin; set via register_admin() RPC once
  emergency_unlock BOOLEAN     NOT NULL DEFAULT FALSE,                  -- flip TRUE to unlock early
  site_name        TEXT        NOT NULL DEFAULT 'Happy Birthday Muski!',
  birthday_name    TEXT        NOT NULL DEFAULT 'Muski',
  birthday_age     INT         NOT NULL DEFAULT 19,
  birthday_date    DATE        NOT NULL DEFAULT '2007-10-23',
  timezone         TEXT        NOT NULL DEFAULT 'Asia/Kolkata'
);

-- Seed the singleton row (runs once; subsequent runs are idempotent via INSERT … ON CONFLICT)
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- contributors — Friends and family with invite tokens.
-- The raw token is NEVER stored; only SHA-256(token) in hex is kept.
-- =============================================================================
CREATE TABLE contributors (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT,                    -- optional admin reference; never shown publicly
  token_hash TEXT        NOT NULL UNIQUE, -- encode(sha256(raw_token::bytea), 'hex')
  used_at    TIMESTAMPTZ,             -- timestamp of first successful validation
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contributors_token ON contributors (token_hash);
CREATE INDEX idx_contributors_active ON contributors (is_active);

-- =============================================================================
-- cards — Birthday scratch cards submitted by contributors.
-- =============================================================================
CREATE TABLE cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id  UUID        NOT NULL REFERENCES contributors (id) ON DELETE CASCADE,

  -- Content
  title           TEXT        NOT NULL DEFAULT '',
  message         TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),

  -- Optional media (storage paths in the 'media' private bucket)
  photo_path      TEXT,
  audio_path      TEXT,
  video_path      TEXT,

  -- Visual customisation
  scratch_color   TEXT        NOT NULL DEFAULT 'gold'
                  CHECK (scratch_color IN ('gold', 'glitter', 'holographic', 'pixel_dots', 'silver')),
  card_theme      TEXT        NOT NULL DEFAULT 'theme1'
                  CHECK (card_theme IN ('theme1', 'theme2', 'theme3', 'theme4', 'theme5')),
  emoji           TEXT        NOT NULL DEFAULT '🎂',
  font_style      TEXT        NOT NULL DEFAULT 'font1'
                  CHECK (font_style IN ('font1', 'font2', 'font3')),
  reveal_effect   TEXT        NOT NULL DEFAULT 'confetti'
                  CHECK (reveal_effect IN ('confetti', 'hearts', 'fireworks', 'glitch')),

  -- Ordering
  -- 'early' cards appear first (funny), 'final' last (emotional).
  -- Admin can pin one card as THE final card (is_pinned = TRUE).
  position_hint   TEXT        NOT NULL DEFAULT 'middle'
                  CHECK (position_hint IN ('early', 'middle', 'final')),
  is_pinned       BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Moderation
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_status      ON cards (status);
CREATE INDEX idx_cards_contributor ON cards (contributor_id);
-- Compound index for the ordering query used in fetchApprovedCards()
CREATE INDEX idx_cards_order       ON cards (is_pinned, position_hint, created_at)
  WHERE status = 'approved';

-- =============================================================================
-- photos — Face photos for Avatar Maker and friend NPC sprites in games.
-- =============================================================================
CREATE TABLE photos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id  UUID        REFERENCES contributors (id) ON DELETE SET NULL,
  uploaded_by_uid UUID,                -- auth.uid() for photos uploaded directly by admin

  -- Private bucket path (e.g. 'photos/uuid/photo.webp')
  storage_path    TEXT        NOT NULL,

  -- 'muski'  → her face photos (used by Avatar Maker for all games)
  -- 'friend' → friend/family faces (NPC sprites, enemies, collectibles)
  -- 'admin'  → uploaded directly by admin
  role            TEXT        NOT NULL DEFAULT 'friend'
                  CHECK (role IN ('muski', 'friend', 'admin')),

  label           TEXT,                -- display name shown in games / credits

  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_status ON photos (status, role);

-- =============================================================================
-- corner_items — Generic table for the extensible Corners system.
-- Each corner (sticker_book, guestbook, etc.) stores items here with a
-- corner_id discriminator. The payload JSONB structure is defined per-corner.
-- =============================================================================
CREATE TABLE corner_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  corner_id      TEXT        NOT NULL,   -- e.g. 'sticker_book', 'guestbook'
  contributor_id UUID        REFERENCES contributors (id) ON DELETE CASCADE,
  payload        JSONB       NOT NULL DEFAULT '{}',
  status         TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_corner_items_corner ON corner_items (corner_id, status);
CREATE INDEX idx_corner_items_contrib ON corner_items (contributor_id);

-- =============================================================================
-- vault_items — End-to-end encrypted messages / media for birthday girl.
--
-- SECURITY NOTE: The server stores ONLY ciphertext + crypto parameters.
-- The plaintext is NEVER transmitted to the server.
-- Even with direct DB access, vault contents are unreadable without her password.
--
-- Two encryption modes:
--   'symmetric'  → AES-GCM-256 keyed from her password via PBKDF2.
--                  Used for messages she adds to her own vault.
--   'rsa_oaep'   → RSA-OAEP-4096. Used for "secret drops" by contributors.
--                  Encrypted with the public key; only her password can unlock
--                  the private key needed to decrypt.
-- =============================================================================
CREATE TABLE vault_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id  UUID        REFERENCES contributors (id) ON DELETE SET NULL,

  encryption_type TEXT        NOT NULL DEFAULT 'symmetric'
                  CHECK (encryption_type IN ('symmetric', 'rsa_oaep')),

  ciphertext      TEXT        NOT NULL,  -- base64url encoded ciphertext
  iv              TEXT,                  -- base64url IV (used for AES-GCM; NULL for RSA)
  salt            TEXT,                  -- base64url PBKDF2 salt (symmetric only)

  item_type       TEXT        NOT NULL DEFAULT 'message'
                  CHECK (item_type IN ('message', 'photo', 'audio')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- vault_keys — RSA-OAEP keypair for contributor "secret drops". Singleton row.
--
-- public_key_jwk           → stored plaintext (used by contributors to encrypt)
-- private_key_ciphertext   → AES-GCM encrypted RSA private key (encrypted with
--                            the same PBKDF2 key derived from her password)
--
-- Only the birthday girl, by entering her password, can decrypt the private key
-- and thus read the RSA-OAEP encrypted secret drops.
-- =============================================================================
CREATE TABLE vault_keys (
  id                     INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  public_key_jwk         JSONB       NOT NULL,
  private_key_ciphertext TEXT        NOT NULL,
  private_key_iv         TEXT        NOT NULL,  -- base64url
  private_key_salt       TEXT        NOT NULL,  -- base64url PBKDF2 salt
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- audit_log — Immutable record of admin actions.
-- =============================================================================
CREATE TABLE audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_uid    UUID,                  -- auth.uid() of admin performing the action
  action       TEXT        NOT NULL,  -- e.g. 'approve_card', 'create_invite_token'
  target_table TEXT,                  -- table affected (if applicable)
  target_id    UUID,                  -- row ID affected (if applicable)
  details      JSONB,                 -- extra context (names, counts, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_time  ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_uid, created_at DESC);
