/**
 * engine/shake.js — Screen shake
 * Applied via ctx.translate in the game loop render step.
 */

export function createShake() {
  let _intensity = 0;
  let _remaining = 0;
  let _ox = 0;
  let _oy = 0;

  return {
    /** Trigger a screen shake.
     * @param {number} intensity  max pixel offset (logical coords)
     * @param {number} durationMs
     */
    shake(intensity = 6, durationMs = 300) {
      _intensity = intensity;
      _remaining = durationMs;
    },

    /** Call once per frame before rendering. */
    update(dt) {
      if (_remaining <= 0) { _ox = 0; _oy = 0; return; }
      _remaining -= dt;
      const factor = Math.max(0, _remaining / 300) * _intensity;
      _ox = (Math.random() * 2 - 1) * factor;
      _oy = (Math.random() * 2 - 1) * factor;
    },

    /** Call ctx.save() first, then this, then render, then ctx.restore(). */
    apply(ctx) {
      if (_ox !== 0 || _oy !== 0) ctx.translate(_ox, _oy);
    },

    isActive() { return _remaining > 0; },
    get offsetX() { return _ox; },
    get offsetY() { return _oy; },
  };
}
