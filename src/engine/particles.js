/**
 * engine/particles.js — Lightweight canvas particle system.
 *
 * Supports square and circle particles with gravity and fade-out.
 * Designed to be called from game plugins via engine.particles.burst().
 */

const PALETTE = ['#ff6eb4','#ffb340','#5effa3','#5ee0ff','#ffd93b','#c9a0ff','#ffffff'];

export function createParticleSystem() {
  /** @type {Array<Particle>} */
  const pool = [];

  return {
    /**
     * Emit a burst of particles at (x, y).
     * @param {number} x
     * @param {number} y
     * @param {{
     *   count?: number,
     *   colors?: string[],
     *   speed?: number,
     *   life?: number,
     *   size?: number,
     *   gravity?: number,
     *   shape?: 'square'|'circle'
     * }} opts
     */
    burst(x, y, opts = {}) {
      const {
        count   = 12,
        colors  = PALETTE,
        speed   = 4,
        life    = 700,
        size    = 5,
        gravity = 0.15,
        shape   = 'square',
      } = opts;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.8;
        const s     = speed * (0.5 + Math.random() * 0.7);
        pool.push({
          x, y,
          vx:      Math.cos(angle) * s,
          vy:      Math.sin(angle) * s,
          life:    life + Math.random() * 200,
          maxLife: life + 200,
          color:   colors[Math.floor(Math.random() * colors.length)],
          size:    size  * (0.6 + Math.random() * 0.6),
          gravity,
          shape,
        });
      }
    },

    /** Update all particles. Call once per frame with dt in ms. */
    update(dt) {
      const f = dt / 16.67; // normalise to 60fps
      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        p.x   += p.vx * f;
        p.y   += p.vy * f;
        p.vy  += p.gravity * f;
        p.vx  *= 0.98;
        p.life -= dt;
        if (p.life <= 0) pool.splice(i, 1);
      }
    },

    /** Render all particles. Call after game render, before ctx.restore(). */
    render(ctx) {
      for (const p of pool) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;
        const half = p.size / 2;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, half, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(Math.round(p.x - half), Math.round(p.y - half), p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;
    },

    clear() { pool.length = 0; },
    get count() { return pool.length; },
  };
}
