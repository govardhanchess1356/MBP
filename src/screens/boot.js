/**
 * src/screens/boot.js — MUSKI Adventures Title / Opening Screen
 *
 * Phase 2: appears after the unlock sequence.
 * Shows the MUSKI Adventures artwork with a single "PRESS START" button.
 * Tapping START navigates to the Arcade Hall.
 *
 * Phase 3 connects onStart → real arcade hall with 5 game cabinets.
 */

import { getMuted, setMuted } from '@/data/local-state.js';
import { mountVaultScreen }     from '@/vault/vault-ui.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── CSS ────────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('boot-css')) return;
  const s = document.createElement('style');
  s.id = 'boot-css';
  s.textContent = /* css */`

    /* ── title screen root ───────────────────────────── */
    #boot-screen {
      position: fixed; inset: 0;
      overflow: hidden;
      touch-action: manipulation;
      font-family: 'Press Start 2P', monospace;
    }

    /* full-bleed background artwork */
    #boot-bg {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      /* on portrait mobile — show title + characters front-and-centre */
      object-position: center 38%;
      z-index: 0;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    }

    /* subtle dark vignette at bottom so START button is readable */
    #boot-bottom-grad {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 38%;
      background: linear-gradient(
        to bottom,
        transparent          0%,
        rgba(8, 4, 2, 0.70) 35%,
        rgba(8, 4, 2, 0.92) 100%
      );
      z-index: 1;
      pointer-events: none;
    }

    /* mute button — top right, always visible */
    #boot-mute {
      position: fixed;
      top: 14px; right: 14px;
      z-index: 10;
      background: rgba(8, 4, 2, 0.72);
      border: 2px solid #a06030;
      border-radius: 8px;
      width: 40px; height: 40px;
      font-size: 1.15rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    #boot-mute:active { transform: scale(0.88); }

    /* bottom container: holds PRESS START */
    #boot-start-area {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 24px;
      padding-bottom: max(28px, env(safe-area-inset-bottom, 28px));
      gap: 14px;
    }

    /* "MUSKI ADVENTURES" sub-title (since image already has the big logo) */
    #boot-tagline {
      font-size: clamp(0.3rem, 2vw, 0.4rem);
      color: rgba(245, 215, 142, 0.75);
      letter-spacing: 0.14em;
      text-shadow: 0 0 8px rgba(200,140,30,0.5);
      text-align: center;
    }

    /* ── PRESS START button ───────────────────────────── */
    #boot-start-btn {
      width: 100%;
      max-width: 340px;
      padding: 16px 20px;
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(0.65rem, 4vw, 0.9rem);
      letter-spacing: 0.12em;
      color: #ffd93b;
      text-shadow: 0 0 10px rgba(255,217,59,0.7);

      /* wooden-plank style matching the signpost in the reference image */
      background: linear-gradient(135deg,
        #6b3a10 0%,
        #9a5420 40%,
        #6b3a10 100%
      );
      border: 3px solid #f5d78e;
      border-radius: 8px;
      box-shadow:
        0 5px 0 #3a1a04,
        0 0 28px rgba(255, 180, 40, 0.55),
        inset 0 1px 0 rgba(255, 255, 200, 0.18);

      cursor: pointer;
      position: relative;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;

      /* blink / pulse animation */
      animation: ${REDUCED ? 'none' : 'start-pulse 1.3s ease-in-out infinite alternate'};
    }

    @keyframes start-pulse {
      from {
        box-shadow: 0 5px 0 #3a1a04, 0 0 18px rgba(255,180,40,0.4),  inset 0 1px 0 rgba(255,255,200,0.18);
        color: #ffd93b;
      }
      to {
        box-shadow: 0 5px 0 #3a1a04, 0 0 38px rgba(255,210,60,0.75), inset 0 1px 0 rgba(255,255,200,0.18);
        color: #fff5a0;
      }
    }

    /* shimmer sweep on the button */
    #boot-start-btn::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 60%; height: 100%;
      background: linear-gradient(90deg,
        transparent,
        rgba(255,255,180,0.18),
        transparent
      );
      animation: ${REDUCED ? 'none' : 'btn-shimmer 2.2s ease-in-out infinite'};
    }
    @keyframes btn-shimmer {
      0%   { left: -100%; }
      100% { left: 200%;  }
    }

    #boot-start-btn:active {
      transform: translateY(4px);
      box-shadow: 0 1px 0 #3a1a04, 0 0 10px rgba(255,180,40,0.3);
      animation: none;
    }

    /* decorative nail dots (top-left, top-right) */
    #boot-start-btn::after {
      content: '● ●';
      position: absolute;
      top: 6px; left: 50%;
      transform: translateX(-50%);
      font-size: 4px;
      letter-spacing: 250px;
      color: rgba(160, 90, 30, 0.6);
      pointer-events: none;
    }

    /* tap ripple effect */
    .boot-ripple {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      z-index: 20;
      background: rgba(255, 217, 59, 0.3);
      animation: ripple-expand 0.45s ease-out forwards;
    }
    @keyframes ripple-expand {
      0%   { transform: scale(0); opacity: 1; }
      100% { transform: scale(4); opacity: 0; }
    }

    /* screen fade-out on START tap */
    #boot-screen.fading {
      opacity: 0;
      transition: opacity 0.35s ease;
    }
  `;
  document.head.appendChild(s);
}

// ─── ripple feedback ─────────────────────────────────────────────────────────
function ripple(x, y, size = 80) {
  if (REDUCED) return;
  const el = document.createElement('div');
  el.className = 'boot-ripple';
  el.style.cssText = `left:${x - size/2}px;top:${y - size/2}px;width:${size}px;height:${size}px;`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
/**
 * Mount the title / opening screen.
 * @param {HTMLElement} container
 * @param {Function}    onStart   called when the user taps PRESS START
 */
export function mountBootScreen(container, onStart) {
  injectCSS();

  container.innerHTML = /* html */`
    <div id="boot-screen">

      <!-- 1. Background artwork — MUSKI Adventures -->
      <img id="boot-bg" src="/images/arcade-bg.png" alt=""
        onerror="this.style.background='linear-gradient(160deg,#0a1a3a,#1a0a3d)'" />

      <!-- 2. Bottom gradient for readability -->
      <div id="boot-bottom-grad"></div>

      <!-- 3. Mute button (top-right) -->
      <button id="boot-mute" aria-label="Toggle sound">
        ${getMuted() ? '🔇' : '🔊'}
      </button>

      <!-- 4. Bottom: tagline + PRESS START -->
      <div id="boot-start-area">
        <p id="boot-tagline">✦ TAP TO ENTER THE MUSKIVERSE ✦</p>
        <button id="boot-start-btn" aria-label="Press Start">
          ▶ PRESS START
        </button>
      </div>

    </div>
  `;

  // ── Mute ──────────────────────────────────────────────────────────────────
  document.getElementById('boot-mute').addEventListener('click', () => {
    const next = !getMuted();
    setMuted(next);
    document.getElementById('boot-mute').textContent = next ? '🔇' : '🔊';
  });

  // ── PRESS START ───────────────────────────────────────────────────────────
  document.getElementById('boot-start-btn').addEventListener('click', (e) => {
    ripple(e.clientX, e.clientY, 100);

    // Brief fade-out, then call onStart
    const screen = document.getElementById('boot-screen');
    if (screen) screen.classList.add('fading');

    setTimeout(() => {
      onStart();
    }, REDUCED ? 0 : 360);
  });

  // ── Tap anywhere else ripples + 7x Cake Tap Secret Vault Trigger ────────
  let cakeTaps = 0;
  let cakeTimer = null;

  document.getElementById('boot-screen').addEventListener('click', (e) => {
    if (e.target.id !== 'boot-start-btn' && e.target.id !== 'boot-mute') {
      ripple(e.clientX, e.clientY, 60);

      // Secret vault trigger: 7 taps in 5s
      cakeTaps++;
      clearTimeout(cakeTimer);
      cakeTimer = setTimeout(() => { cakeTaps = 0; }, 5000);

      if (cakeTaps >= 7) {
        cakeTaps = 0;
        clearTimeout(cakeTimer);
        mountVaultScreen(container, () => mountBootScreen(container, onStart));
      }
    }
  });
}
