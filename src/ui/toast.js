/**
 * ui/toast.js — "+N COIN" popup toast
 * Phase 3: small animated label that floats up and fades out.
 *           Used for: coin pickups, Easter egg bonuses, score pop-ups.
 *           Honours prefers-reduced-motion (shows briefly without animation).
 *
 * Usage:
 *   showToast('+3 COINS', { x: 180, y: 300, color: '#FFA5AB' });
 */
// TODO Phase 3
export function showToast(_message, { x: _x = 180, y: _y = 320, color: _color = '#FFA5AB' } = {}) {
  // Phase 1 stub: log to console only
  console.debug(`[toast] ${_message}`);
}
