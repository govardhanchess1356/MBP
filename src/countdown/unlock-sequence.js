/**
 * src/countdown/unlock-sequence.js — Dramatic unlock animation
 * Phase 2: screen flicker → "LEVEL 19 UNLOCKED!" → confetti rain → fade to boot.
 * Skipped entirely under prefers-reduced-motion (calls onComplete immediately).
 */

import { BIRTHDAY_AGE } from '@/config/constants.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Palette + gold for confetti
const CONFETTI_COLORS = [
  '#ff6eb4','#ffb340','#5effa3','#5ee0ff',
  '#ffd93b','#c9a0ff','#ffffff','#DA627D',
  '#FFA5AB','#F9DBBD',
];

// ─── confetti particle system ─────────────────────────────────────────────────
function runConfetti(canvas, durationMs) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W   = canvas.width  = window.innerWidth  * dpr;
  const H   = canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);

  const VW = window.innerWidth;
  const VH = window.innerHeight;

  // 120 confetti pieces
  const pieces = Array.from({ length: 120 }, () => ({
    x:    Math.random() * VW,
    y:    Math.random() * -200,       // start above screen
    vx:   (Math.random() - 0.5) * 3.5,
    vy:   Math.random() * 4 + 2,
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 8,
    w:    Math.random() * 8 + 5,
    h:    Math.random() * 4 + 3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    opacity: 1,
  }));

  let start = null;
  let raf;

  function draw(t) {
    if (!start) start = t;
    const elapsed = t - start;
    const fadeStart = durationMs * 0.65;
    const globalAlpha = elapsed > fadeStart
      ? Math.max(0, 1 - (elapsed - fadeStart) / (durationMs * 0.35))
      : 1;

    ctx.clearRect(0, 0, VW, VH);

    if (elapsed < durationMs && globalAlpha > 0) {
      ctx.globalAlpha = globalAlpha;
      for (const p of pieces) {
        // Physics
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += 0.08;         // gravity
        p.vx  *= 0.99;         // air resistance
        p.rot += p.rotV;

        // Wrap horizontally
        if (p.x < -20) p.x = VW + 20;
        if (p.x > VW + 20) p.x = -20;

        // Draw rotated rectangle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, VW, VH);
    }
  }

  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ─── inject CSS ───────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('unlock-css')) return;
  const s = document.createElement('style');
  s.id = 'unlock-css';
  s.textContent = /* css */`
    #unlock-overlay {
      position: fixed; inset: 0;
      z-index: 999;
      background: #06021a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #unlock-confetti {
      position: absolute; inset: 0;
      pointer-events: none;
    }

    #unlock-text {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      opacity: 0;
      transform: scale(0.6);
      transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
      padding: 0 20px;
      text-align: center;
    }
    #unlock-text.visible {
      opacity: 1;
      transform: scale(1);
    }

    .unlock-level {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(0.8rem, 4vw, 1.4rem);
      color: #c9a0ff;
      letter-spacing: 0.18em;
      text-shadow: 0 0 20px rgba(200,160,255,0.7);
    }

    .unlock-age {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(3rem, 18vw, 6rem);
      color: #ffd93b;
      text-shadow:
        0 0 30px rgba(255,217,59,0.9),
        0 0 60px rgba(255,217,59,0.4);
      line-height: 1;
      animation: unlock-glow 1s ease-in-out infinite alternate;
    }

    .unlock-unlocked {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(0.55rem, 3.5vw, 0.95rem);
      color: #5effa3;
      letter-spacing: 0.12em;
      text-shadow: 0 0 16px rgba(94,255,163,0.7);
    }

    .unlock-stars {
      font-size: clamp(1.5rem, 6vw, 2.5rem);
      letter-spacing: 0.3em;
      animation: unlock-spin 2s linear infinite;
    }

    @keyframes unlock-glow {
      from { text-shadow: 0 0 30px rgba(255,217,59,0.9), 0 0 60px rgba(255,217,59,0.4); }
      to   { text-shadow: 0 0 50px rgba(255,217,59,1),   0 0 90px rgba(255,217,59,0.6); }
    }
    @keyframes unlock-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* flicker effect on initial flash */
    @keyframes unlock-flicker {
      0%   { opacity: 1; }
      10%  { opacity: 0; }
      20%  { opacity: 1; }
      30%  { opacity: 0; }
      40%  { opacity: 1; }
      50%  { opacity: 0.4; }
      60%  { opacity: 1; }
      100% { opacity: 1; }
    }
    .unlock-flicker-anim {
      animation: unlock-flicker 0.4s ease forwards;
    }

    /* fade out */
    #unlock-overlay.fade-out {
      opacity: 0;
      transition: opacity 0.6s ease;
    }
  `;
  document.head.appendChild(s);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
/**
 * Play the unlock sequence, then call onComplete.
 * @param {HTMLElement} container  parent to append overlay to
 * @param {Function}    onComplete called after animation finishes
 */
export function playUnlockSequence(container, onComplete) {
  // Honour prefers-reduced-motion: skip straight to boot
  if (REDUCED) { onComplete(); return; }

  injectCSS();

  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'unlock-overlay';
  overlay.innerHTML = /* html */`
    <canvas id="unlock-confetti"></canvas>
    <div id="unlock-text">
      <div class="unlock-level">✨ LEVEL ✨</div>
      <div class="unlock-age">${BIRTHDAY_AGE}</div>
      <div class="unlock-unlocked">UNLOCKED!</div>
      <div class="unlock-stars">🎂🎉🎊</div>
    </div>
  `;
  container.appendChild(overlay);

  // ── Phase 1: quick screen flicker (200ms) ──────────────────────────────
  overlay.classList.add('unlock-flicker-anim');

  // ── Phase 2: text burst-in (at 250ms) ─────────────────────────────────
  setTimeout(() => {
    const text = document.getElementById('unlock-text');
    if (text) text.classList.add('visible');
  }, 250);

  // ── Phase 3: confetti starts (at 400ms) ───────────────────────────────
  let stopConfetti = () => {};
  setTimeout(() => {
    const canvas = document.getElementById('unlock-confetti');
    if (canvas) stopConfetti = runConfetti(canvas, 3800);
  }, 400);

  // ── Phase 4: fade out and call onComplete (at 4400ms) ─────────────────
  setTimeout(() => {
    stopConfetti();
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      onComplete();
    }, 650);
  }, 4400);
}
