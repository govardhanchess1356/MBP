import { supabase }   from './supabase.js';
import { UNLOCK_UTC } from '@/config/constants.js';

// ─── Server-time offset cache ────────────────────────────────────────────────
// Computed once at app boot; used on every frame without a network call.
let _serverOffsetMs = 0;  // serverTime - localTime in ms
let _unlockAt       = new Date(UNLOCK_UTC);  // fallback to the hardcoded value
let _isUnlocked     = false;

/**
 * Fetch unlock_at + server now() from the Postgres RPC get_countdown().
 * Computes and caches the clock offset so countdown ticks use server time.
 *
 * Should be called ONCE at app boot (and again on wake-from-sleep).
 *
 * @returns {{ unlockAt: Date, isUnlocked: boolean, serverOffsetMs: number }}
 */
export async function fetchCountdown() {
  // ── Dev URL preview shortcuts (?preview=boot | ?unlock=true | ?lock=true) ─
  const params = new URLSearchParams(window.location.search);
  if (params.get('lock') === 'true') {
    localStorage.removeItem('muski_dev_unlocked');
  }
  const isForceUnlocked = params.get('preview') === 'boot' ||
                          params.get('unlock') === 'true' ||
                          localStorage.getItem('muski_dev_unlocked') === 'true' ||
                          import.meta.env.VITE_DEV_FORCE_UNLOCK === 'true';

  if (isForceUnlocked) {
    _unlockAt   = new Date(Date.now() - 1000);   // 1s ago → already unlocked
    _isUnlocked = true;
    return { unlockAt: _unlockAt, isUnlocked: true, serverOffsetMs: 0 };
  }

  if (import.meta.env.DEV) {
    if (params.get('preview') === 'countdown') {
      _unlockAt   = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      _isUnlocked = false;
      return { unlockAt: _unlockAt, isUnlocked: false, serverOffsetMs: 0 };
    }
  }

  const localBefore = Date.now();

  let data;
  try {
    const res = await supabase.rpc('get_countdown');
    if (res.error) throw res.error;
    data = res.data;
  } catch (err) {
    // Fall back gracefully to hardcoded UNLOCK_UTC date
    console.warn('[countdown-api] Supabase unavailable, falling back to hardcoded unlock time:', err);
    _unlockAt   = new Date(UNLOCK_UTC);
    _isUnlocked = Date.now() >= _unlockAt.getTime();
    return { unlockAt: _unlockAt, isUnlocked: _isUnlocked, serverOffsetMs: 0 };
  }

  const localAfter   = Date.now();
  const rtt          = localAfter - localBefore;
  const serverNowMs  = new Date(data.server_now).getTime();
  _serverOffsetMs    = serverNowMs - (localBefore + rtt / 2);
  _unlockAt          = new Date(data.unlock_at);
  _isUnlocked        = Boolean(data.is_unlocked);

  return {
    unlockAt:       _unlockAt,
    isUnlocked:     _isUnlocked,
    serverOffsetMs: _serverOffsetMs,
  };
}

/**
 * Current server time in ms.
 * Safe to call every frame — no network request, uses cached offset.
 */
export function serverNow() {
  return Date.now() + _serverOffsetMs;
}

/**
 * Milliseconds remaining until unlock (negative if already past).
 * Uses the cached server offset so device clock drift is corrected.
 */
export function msUntilUnlock() {
  return _unlockAt.getTime() - serverNow();
}

/** Cached unlock state — set by the most recent fetchCountdown() call. */
export function getCachedIsUnlocked() {
  return _isUnlocked;
}

/** Cached unlock date — set by the most recent fetchCountdown() call. */
export function getCachedUnlockAt() {
  return _unlockAt;
}
