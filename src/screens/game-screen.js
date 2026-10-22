/**
 * src/screens/game-screen.js — Game session container
 *
 * Wraps the engine for a single game+level session.
 * Called by the arcade hall when the player taps a cabinet.
 *
 * Phase 3: supports Flappy Bird (both levels).
 * Phase 4+: add other game imports here.
 *
 * Usage:
 *   mountGameScreen(container, { gameId: 'flappy', levelIndex: 0, onHome });
 */

import { startGame }      from '@/engine/index.js';
import { getLevelConfig } from '@/config/levels.js';
import { getMuted, setMuted } from '@/data/local-state.js';
import { SFX }            from '@/engine/sound.js';

// ─── CSS ────────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('game-screen-css')) return;
  const s = document.createElement('style');
  s.id = 'game-screen-css';
  s.textContent = /* css */`
    #game-screen {
      position: fixed; inset: 0;
      background: #04010a;
      overflow: hidden;
      max-width: 520px;
      margin: 0 auto;
      border-left: 3px solid rgba(165,56,96,0.3);
      border-right: 3px solid rgba(165,56,96,0.3);
      box-shadow: 0 0 60px rgba(0,0,0,0.95);
    }

    /* Pause / mute strip at very top — visible over the canvas */
    #game-topbar {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 200;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      padding-top: max(8px, env(safe-area-inset-top, 8px));
      pointer-events: none;
    }

    #game-pc-hints {
      position: absolute;
      bottom: 8px; left: 0; right: 0;
      z-index: 200;
      text-align: center;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.24rem;
      color: rgba(255,217,59,0.7);
      pointer-events: none;
      letter-spacing: 0.04em;
    }

    .g-topbar-btn {
      pointer-events: auto;
      background: rgba(6, 2, 26, 0.72);
      border: 2px solid rgba(165, 56, 96, 0.65);
      border-radius: 8px;
      width: 38px; height: 38px;
      font-size: 1rem;
      color: #F9DBBD;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    .g-topbar-btn:active { transform: scale(0.88); }

    /* Level badge */
    #game-level-badge {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.32rem;
      color: rgba(200, 160, 255, 0.8);
      letter-spacing: 0.06em;
      text-shadow: 0 0 6px rgba(200,160,255,0.4);
      pointer-events: none;
    }
  `;
  document.head.appendChild(s);
}

// ─── Game plugin loader (dynamic import by game ID) ──────────────────────────
async function loadPlugin(gameId) {
  switch (gameId) {
    case 'flappy':     { const m = await import('@/games/flappy/index.js');     return m.default; }
    case 'dino':       { const m = await import('@/games/dino/index.js');       return m.default; }
    case 'asteroids':  { const m = await import('@/games/asteroids/index.js');  return m.default; }
    case 'jetpack':    { const m = await import('@/games/jetpack/index.js');    return m.default; }
    case 'platformer': { const m = await import('@/games/platformer/index.js'); return m.default; }
    default:
      throw new Error(`Unknown game: ${gameId}`);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
/**
 * @param {HTMLElement} container
 * @param {{
 *   gameId:      string,
 *   levelIndex:  number,
 *   onHome:      Function,
 *   onLevelClear?: (score: number) => void,
 * }} opts
 */
export async function mountGameScreen(container, opts) {
  const { gameId, levelIndex, onHome, onLevelClear } = opts;

  injectCSS();

  // Sync audio mute
  SFX.setMuted(getMuted());

  // Build the screen shell (canvas will be injected inside #game-canvas-area)
  container.innerHTML = /* html */`
    <div id="game-screen">

      <!-- Top bar: pause + mute + level label -->
      <div id="game-topbar">
        <button class="g-topbar-btn" id="g-pause-btn" aria-label="Pause">⏸</button>
        <div id="game-level-badge"></div>
        <button class="g-topbar-btn" id="g-mute-btn" aria-label="Toggle sound">
          ${getMuted() ? '🔇' : '🔊'}
        </button>
      </div>

      <!-- PC Keyboard Hints -->
      <div id="game-pc-hints">⌨️ SPACE / ↑ JUMP • ARROWS / WASD MOVE • P PAUSE</div>

    </div>
  `;

  const screen = document.getElementById('game-screen');

  // ── Load level config + plugin ───────────────────────────────────────────
  let levelConfig;
  try {
    levelConfig = getLevelConfig(gameId, levelIndex);
  } catch (err) {
    container.innerHTML = `<div style="color:#FFA5AB;font-family:monospace;padding:2rem;">Error: ${err.message}</div>`;
    return;
  }

  // Show level label
  const badge = document.getElementById('game-level-badge');
  if (badge) badge.textContent = `LVL ${levelIndex + 1}: ${levelConfig.label ?? ''}`;

  let plugin;
  try {
    plugin = await loadPlugin(gameId);
  } catch (err) {
    container.innerHTML = `<div style="color:#FFA5AB;font-family:monospace;padding:2rem;">Error loading game: ${err.message}</div>`;
    return;
  }

  // ── Start engine ─────────────────────────────────────────────────────────
  let session = startGame(screen, plugin, levelConfig, {
    onLevelClear(score) {
      const nextIdx = levelIndex + 1;
      let hasNext = false;
      try { getLevelConfig(gameId, nextIdx); hasNext = true; } catch (_) {}
      if (hasNext && typeof onLevelClear === 'function') {
        onLevelClear(score, nextIdx);
      } else {
        onHome();
      }
    },
    onHome,
  });

  // ── Pause button ─────────────────────────────────────────────────────────
  document.getElementById('g-pause-btn').addEventListener('click', () => {
    session.pause();
  });

  // ── Mute button ───────────────────────────────────────────────────────────
  const muteBtn = document.getElementById('g-mute-btn');
  muteBtn.addEventListener('click', () => {
    const next = !getMuted();
    setMuted(next);
    SFX.setMuted(next);
    muteBtn.textContent = next ? '🔇' : '🔊';
  });

  // Return cleanup handle
  return () => session?.stop();
}
