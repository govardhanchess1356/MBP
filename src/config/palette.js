/**
 * Colour palette — warm rosy retro arcade.
 *
 * Usage in JS:   import { PALETTE } from '@/config/palette.js';
 * Usage in CSS:  var(--col-cream), var(--col-blush), etc.
 *
 * Call injectPalette() once at app boot to populate CSS custom properties.
 */
export const PALETTE = {
  cream:   '#F9DBBD',   // lightest — text on dark, light fill
  blush:   '#FFA5AB',   // soft pink — coin icons, buttons, callouts
  rose:    '#DA627D',   // dusty rose — borders, scanline tint, secondary
  magenta: '#A53860',   // deep magenta — headings, primary brand, pixel borders
  maroon:  '#450920',   // darkest — deep backgrounds, shadows
  hero:    '#780000',   // Muski's platformer outfit / hero accent
};

/**
 * Inject palette as CSS custom properties on :root.
 * Call once at application boot before rendering anything.
 */
export function injectPalette() {
  const r = document.documentElement.style;
  r.setProperty('--col-cream',   PALETTE.cream);
  r.setProperty('--col-blush',   PALETTE.blush);
  r.setProperty('--col-rose',    PALETTE.rose);
  r.setProperty('--col-magenta', PALETTE.magenta);
  r.setProperty('--col-maroon',  PALETTE.maroon);
  r.setProperty('--col-hero',    PALETTE.hero);
}

/**
 * Parse a hex colour string to [r, g, b] (0-255 each).
 * Used by the Avatar Maker palette-filter.
 * @param {string} hex  e.g. '#F9DBBD'
 * @returns {[number,number,number]}
 */
export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** All palette colours as [r,g,b] arrays — used by canvas pixel filters */
export const PALETTE_RGB = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, hexToRgb(v)])
);
