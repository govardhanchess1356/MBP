// ─── Site Identity ────────────────────────────────────────────────────────────
// These values are intentionally in source rather than env vars:
// - None of them are secrets (no passwords, no keys)
// - They must be available before a Supabase call completes (e.g. fallback UI)
// - Changing them requires a redeploy anyway

export const BIRTHDAY_NAME   = 'Muski';
export const BIRTHDAY_AGE    = 19;
/** ISO date string (YYYY-MM-DD) of her actual birthday — used for Easter eggs */
export const BIRTHDAY_DATE   = '2007-10-23';
/** UTC ISO string of the unlock moment (midnight IST = 18:30 UTC the day before) */
export const UNLOCK_UTC      = '2026-10-22T18:30:00Z';
export const TIMEZONE        = 'Asia/Kolkata';

// ─── Canvas / Engine ─────────────────────────────────────────────────────────
/** Logical canvas width in CSS pixels (engine scales for DPR) */
export const CANVAS_W = 360;
/** Logical canvas height in CSS pixels */
export const CANVAS_H = 640;

// ─── Coin System ─────────────────────────────────────────────────────────────
/** Losses on a level before the engine silently enables easy mode */
export const EASY_MODE_LOSS_THRESHOLD = 1;
/** Coins awarded by Konami code and logo-tap Easter eggs */
export const SECRET_SKIP_COINS = 5;
/** Coin cost to dispense one scratch card from the vending machine */
export const CARD_COST_COINS = 3;

// ─── Vault ───────────────────────────────────────────────────────────────────
/** Unique placeholder password required to decrypt and unlock the Secret Vault */
export const VAULT_SECRET_PASSWORD = 'MUSKI_SECRET_VAULT_2026';
/** Number of wrong vault password attempts before silently returning to Boot */
export const VAULT_MAX_ATTEMPTS = 5;
/** Delay (ms) on a wrong vault attempt — mirrors server-side pg_sleep */
export const VAULT_FAIL_DELAY_MS = 2000;
/** PBKDF2 iteration count — NIST recommends ≥ 200 000 for SHA-256 */
export const PBKDF2_ITERATIONS = 210_000;

// ─── Scratch Card ────────────────────────────────────────────────────────────
/** Fraction of scratch area cleared before auto-reveal fires */
export const SCRATCH_AUTO_REVEAL_THRESHOLD = 0.55;

// ─── Easter Egg IDs (also used as keys in admin checklist) ───────────────────
export const EGG_IDS = {
  KONAMI:          'konami_code',
  KONAMI_CODE:     'konami_code',   // alias used by engine/index.js
  LOGO_TAP:        'logo_tap_5',
  VAULT_TRIGGER:   'vault_trigger',
  BDAY_KEYBOARD:   'bday_keyboard',
  PHONE_SHAKE:     'phone_shake',
  HIDDEN_BALLOONS: 'hidden_balloons',
  BIRTHDAY_DATE:   'birthday_date',
  DINO_19M:        'dino_19m_cake',
  VENDING_COMBO:   'vending_combo',
  DEVTOOLS_NOTE:   'devtools_note',
  BIRTH_TIME:      'birth_time',
};
