/**
 * engine/canvas.js — Logical canvas with DPR scaling and letterboxing.
 *
 * Logical size: CANVAS_W × CANVAS_H (360 × 640 from constants.js).
 * The physical canvas is scaled by devicePixelRatio so everything is crisp.
 * A CSS transform centres it within the viewport with letterboxing.
 * Drawing code always works in logical pixels — no manual DPR multiplication needed.
 */

import { CANVAS_W, CANVAS_H } from '@/config/constants.js';

/**
 * Create and mount a scaled game canvas inside `container`.
 * @param {HTMLElement} container
 * @returns {{ canvas, ctx, getScale, destroy }}
 */
export function setupCanvas(container) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Wrapper fills the container and provides the letterbox background
  const wrapper = document.createElement('div');
  wrapper.id = 'game-canvas-wrapper';
  wrapper.style.cssText = `
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: #06021a;
    overflow: hidden;
  `;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    display: block;
    touch-action: none;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    cursor: none;
    position: relative;
    z-index: 1;
  `;

  wrapper.appendChild(canvas);
  container.appendChild(wrapper);

  const ctx = canvas.getContext('2d', { alpha: false });

  let _scale = 1;

  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Fit inside viewport maintaining aspect ratio
    const scaleX = vw / CANVAS_W;
    const scaleY = vh / CANVAS_H;
    _scale = Math.min(scaleX, scaleY);

    // Physical pixels
    canvas.width  = Math.round(CANVAS_W * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);

    // CSS display size
    canvas.style.width  = Math.round(CANVAS_W * _scale) + 'px';
    canvas.style.height = Math.round(CANVAS_H * _scale) + 'px';

    // Scale ctx so drawing in logical coords is correct
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  const _ro = new ResizeObserver(resize);
  _ro.observe(document.documentElement);

  return {
    canvas,
    ctx,
    getScale()  { return _scale; },
    getWidth()  { return CANVAS_W; },
    getHeight() { return CANVAS_H; },
    destroy() {
      _ro.disconnect();
      wrapper.remove();
    },
  };
}
