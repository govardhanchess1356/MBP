/**
 * engine/index.js — Public Engine API
 *
 * Creates a full game session: canvas, loop, input, particles, shake, HUD.
 * Game plug-ins implement { init, update, render } and call engine.win() / engine.lose().
 *
 * ── FROZEN AFTER PHASE 3 ──
 * Do NOT modify this file. Add games as plug-ins only.
 *
 * Usage:
 *   import { startGame } from '@/engine/index.js';
 *   const session = startGame(container, flappyPlugin, levelConfig, {
 *     onLevelClear: (score) => ...,
 *     onGameOver:   ()      => ...,
 *     onHome:       ()      => ...,
 *   });
 *   // later:
 *   session.stop();
 */

import { createLoop }          from './loop.js';
import { setupCanvas }         from './canvas.js';
import { createInput }         from './input.js';
import { createParticleSystem } from './particles.js';
import { createShake }         from './shake.js';
import { SFX }                 from './sound.js';
import {
  showLevelClear, showTryAgain,
  showPaused, hideOverlay,
}                              from './overlays.js';
import { getMuted }            from '@/data/local-state.js';
import {
  addCoins,
  getLevelsCleared, markLevelCleared,
}                              from '@/data/local-state.js';
import {
  EASY_MODE_LOSS_THRESHOLD,
  EGG_IDS,
}                              from '@/config/constants.js';
import { triggerEgg }          from '@/eggs/eggs.js';

// Sync mute state to audio engine at startup
SFX.setMuted(getMuted());

/**
 * Start a game session.
 *
 * @param {HTMLElement} container       - where to mount the canvas
 * @param {Object}      plugin          - { init(ctx, config, assets), update(dt, input, engine), render(ctx, engine) }
 * @param {Object}      levelConfig     - from getLevelConfig(gameId, levelIdx, easyMode)
 * @param {{
 *   onLevelClear?: (score: number) => void,
 *   onGameOver?:   () => void,
 *   onHome?:       () => void,
 * }} opts
 *
 * @returns {{ stop: Function, pause: Function, resume: Function }}
 */
export function startGame(container, plugin, levelConfig, opts = {}) {
  // ── Canvas + systems ────────────────────────────────────────────────────────
  const { canvas, ctx, destroy: destroyCanvas } = setupCanvas(container);
  const input     = createInput(canvas);
  const particles = createParticleSystem();
  const shake     = createShake();

  // ── Loss tracking for easy mode ─────────────────────────────────────────────
  const lossKey = `loss_${levelConfig.gameId}_${levelConfig.levelIndex}`;
  let _losses = parseInt(sessionStorage.getItem(lossKey) ?? '0', 10);
  const _easyMode = _losses >= EASY_MODE_LOSS_THRESHOLD;
  if (_easyMode) console.info('[engine] Easy mode active for', levelConfig.gameId, 'level', levelConfig.levelIndex);

  // Merge easy mode overrides silently
  const _config = _easyMode && levelConfig.easyMode
    ? { ...levelConfig, ...levelConfig.easyMode }
    : { ...levelConfig };

  // ── State flags ─────────────────────────────────────────────────────────────
  let _alive    = true; // set to false after win/lose so they fire only once
  let _stopFlag = false;

  // ── Konami / logo-tap skip (awards +5 coins) ─────────────────────────────
  let _skipUsed = false;

  // ── Public engine object exposed to game plugins ────────────────────────────
  const engine = {
    /** Call from plugin when player wins. */
    win(score = 0) {
      if (!_alive) return;
      _alive = false;
      loop.pause();
      SFX.win();
      particles.burst(180, 300, { count: 30, speed: 7, life: 1000,
        colors: ['#ffd93b','#ff6eb4','#5effa3','#5ee0ff','#c9a0ff'] });

      // Reset loss counter
      sessionStorage.removeItem(lossKey);

      // Award coins
      const earned = _config.coinReward ?? 5;
      addCoins(earned);
      markLevelCleared(_config.gameId, _config.levelIndex);

      setTimeout(() => {
        hideOverlay();
        showLevelClear(score, earned, () => {
          hideOverlay();
          opts.onLevelClear?.(score);
        });
      }, 400);
    },

    /** Call from plugin when player loses. */
    lose() {
      if (!_alive) return;
      _alive = false;
      loop.pause();
      SFX.lose();
      shake.shake(10, 500);

      // Increment loss counter
      _losses++;
      sessionStorage.setItem(lossKey, _losses);

      const nextEasy = _losses >= EASY_MODE_LOSS_THRESHOLD;

      setTimeout(() => {
        hideOverlay();
        showTryAgain(
          () => { hideOverlay(); restart(); },          // retry
          () => { hideOverlay(); cleanup(); opts.onHome?.(); }, // home
          nextEasy,
        );
      }, 600);
    },

    // ── Helpers for plug-ins ─────────────────────────────────────────────────
    particles,
    shake,
    SFX,
    canvas,
    ctx,

    /** The (possibly easy-mode-adjusted) level config. */
    get config() { return _config; },
    get isEasyMode() { return _easyMode; },
    get losses() { return _losses; },
  };

  // ── Init plugin ─────────────────────────────────────────────────────────────
  function initPlugin() {
    plugin.init(ctx, _config, { engine, particles, shake, SFX });
  }

  // ── Main loop ───────────────────────────────────────────────────────────────
  const loop = createLoop((dt) => {
    if (_stopFlag) return;

    const inp = input.read();

    // Konami code → secret skip (+5 coins, one-time per session)
    if (inp.konamiCode && !_skipUsed) {
      _skipUsed = true;
      addCoins(5);
      triggerEgg(EGG_IDS.KONAMI_CODE);
      particles.burst(180, 320, { count: 20, speed: 6, life: 900,
        colors: ['#ffd93b','#c9a0ff','#5ee0ff'] });
      SFX.coin();
    }

    // Update
    shake.update(dt);
    plugin.update(dt, inp, engine);
    particles.update(dt);

    // Render
    ctx.save();
    shake.apply(ctx);
    plugin.render(ctx, engine);
    particles.render(ctx);
    ctx.restore();
  });

  function restart() {
    _alive = true;
    particles.clear();
    initPlugin();
    loop.resume();
  }

  function cleanup() {
    _stopFlag = true;
    loop.stop();
    input.destroy();
    destroyCanvas();
    hideOverlay();
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  initPlugin();
  loop.start();

  return {
    stop:    cleanup,
    pause()  { loop.pause();  showPaused(() => { hideOverlay(); loop.resume(); }, () => { hideOverlay(); cleanup(); opts.onHome?.(); }); },
    resume() { loop.resume(); hideOverlay(); },
  };
}
