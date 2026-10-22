/**
 * engine/hud.js — Persistent in-game HUD overlay
 *
 * Phase 2 skeleton: mute toggle + coin counter, rendered as a fixed
 * DOM element layered above the game canvas.
 * Phase 3 adds: cards-collected x/N, home button, full game integration.
 *
 * Usage:
 *   const hud = createHud(container);
 *   hud.setCoins(12);
 *   hud.setCards(3, 9);
 *   hud.setMuted(true);
 *   hud.destroy();
 */

import { getMuted, setMuted } from '@/data/local-state.js';

// ─── CSS ────────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('hud-css')) return;
  const s = document.createElement('style');
  s.id = 'hud-css';
  s.textContent = /* css */`
    #game-hud {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      padding-top: max(8px, env(safe-area-inset-top, 8px));
      background: linear-gradient(to bottom, rgba(69,9,32,0.85) 0%, transparent 100%);
      pointer-events: none;
      font-family: 'Press Start 2P', monospace;
    }

    .hud-group {
      display: flex;
      align-items: center;
      gap: 6px;
      pointer-events: auto;
    }

    /* Coin display */
    #hud-coin-display {
      font-size: 0.42rem;
      color: #ffd93b;
      text-shadow: 0 0 6px rgba(255,217,59,0.6);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #hud-coin-count {
      color: #F9DBBD;
      min-width: 2ch;
    }

    /* Cards display */
    #hud-card-display {
      font-size: 0.42rem;
      color: #FFA5AB;
      text-shadow: 0 0 6px rgba(255,165,171,0.5);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #hud-card-count { color: #F9DBBD; }

    /* Home button */
    #hud-home {
      background: rgba(69,9,32,0.7);
      border: 2px solid #A53860;
      border-radius: 6px;
      width: 36px; height: 36px;
      font-size: 1rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    #hud-home:active { transform: scale(0.88); }

    /* Mute button */
    #hud-mute {
      background: rgba(69,9,32,0.7);
      border: 2px solid #A53860;
      border-radius: 6px;
      width: 36px; height: 36px;
      font-size: 1rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    #hud-mute:active { transform: scale(0.88); }
  `;
  document.head.appendChild(s);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
/**
 * Create and mount the game HUD.
 * @param {HTMLElement} container     element to append HUD to
 * @param {{ onHome?: Function }}      opts
 * @returns {{ setCoins, setCards, setMuted, destroy }}
 */
export function createHud(container, opts = {}) {
  injectCSS();

  const hud = document.createElement('div');
  hud.id = 'game-hud';
  hud.innerHTML = /* html */`
    <!-- Left group: home + coins -->
    <div class="hud-group">
      <button id="hud-home" aria-label="Home">🏠</button>
      <div id="hud-coin-display">🪙 <span id="hud-coin-count">0</span></div>
    </div>

    <!-- Centre: cards progress -->
    <div id="hud-card-display">🃏 <span id="hud-card-count">0/0</span></div>

    <!-- Right: mute -->
    <div class="hud-group">
      <button id="hud-mute" aria-label="Toggle sound">
        ${getMuted() ? '🔇' : '🔊'}
      </button>
    </div>
  `;

  container.appendChild(hud);

  // ── Mute toggle ───────────────────────────────────────────────────────
  const muteBtn = hud.querySelector('#hud-mute');
  muteBtn.addEventListener('click', () => {
    const next = !getMuted();
    setMuted(next);
    muteBtn.textContent = next ? '🔇' : '🔊';
  });

  // ── Home button ────────────────────────────────────────────────────────
  hud.querySelector('#hud-home').addEventListener('click', () => {
    opts.onHome?.();
  });

  // ── Public API ────────────────────────────────────────────────────────
  return {
    setCoins(n) {
      const el = document.getElementById('hud-coin-count');
      if (el) el.textContent = n;
    },
    setCards(done, total) {
      const el = document.getElementById('hud-card-count');
      if (el) el.textContent = `${done}/${total}`;
    },
    setMuted(on) {
      setMuted(on);
      if (muteBtn) muteBtn.textContent = on ? '🔇' : '🔊';
    },
    destroy() {
      hud.remove();
    },
  };
}
