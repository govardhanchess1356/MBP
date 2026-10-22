/**
 * ui/crt-overlay.js — CRT scanline overlay
 * Phase 2: adds/removes the .crt class on #app which activates the
 *           CSS scanline gradient defined in index.html.
 *           The overlay is skipped entirely under prefers-reduced-motion.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Enable the CRT scanline overlay on the app root.
 * No-ops under prefers-reduced-motion.
 */
export function enableCRT() {
  if (REDUCED_MOTION) return;
  document.getElementById('app')?.classList.add('crt');
}

/**
 * Disable the CRT scanline overlay.
 */
export function disableCRT() {
  document.getElementById('app')?.classList.remove('crt');
}
