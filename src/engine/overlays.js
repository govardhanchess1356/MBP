/**
 * engine/overlays.js — LEVEL CLEAR / TRY AGAIN / PAUSED DOM overlays.
 *
 * Overlays are DOM elements layered above the game canvas.
 * They don't go through the canvas draw path so they're always crisp and
 * accessible regardless of canvas scale.
 *
 * CSS is injected once. Each show* function replaces any existing overlay.
 */

// ─── CSS ─────────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('overlay-css')) return;
  const s = document.createElement('style');
  s.id = 'overlay-css';
  s.textContent = /* css */`
    #engine-overlay {
      position: fixed; inset: 0;
      z-index: 500;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      font-family: 'Press Start 2P', monospace;
      text-align: center;
    }

    /* ── Semi-transparent dark background ── */
    #engine-overlay::before {
      content: '';
      position: absolute; inset: 0;
      background: rgba(6, 2, 26, 0.88);
      z-index: -1;
    }

    .ovl-icon   { font-size: 3rem; animation: ovl-bounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
    .ovl-title  {
      font-size: clamp(0.7rem, 4vw, 1rem);
      line-height: 1.8;
      letter-spacing: 0.1em;
      animation: ovl-fadein 0.35s ease both;
      animation-delay: 0.12s;
    }
    .ovl-sub    {
      font-size: clamp(0.35rem, 2.5vw, 0.5rem);
      line-height: 2;
      letter-spacing: 0.06em;
      animation: ovl-fadein 0.35s ease both;
      animation-delay: 0.22s;
    }
    .ovl-coins  {
      font-size: clamp(0.4rem, 3vw, 0.6rem);
      color: #ffd93b;
      text-shadow: 0 0 10px rgba(255,217,59,0.7);
      animation: ovl-fadein 0.35s ease both;
      animation-delay: 0.3s;
    }
    .ovl-btn-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 8px;
      animation: ovl-fadein 0.35s ease both;
      animation-delay: 0.4s;
    }

    /* wooden-plank button */
    .ovl-btn {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(0.38rem, 2.5vw, 0.52rem);
      letter-spacing: 0.06em;
      color: #f5d78e;
      background: linear-gradient(135deg, #7a4010 0%, #b05a18 50%, #7a4010 100%);
      border: 2.5px solid #f5d78e;
      border-radius: 6px;
      box-shadow: 0 4px 0 #3a1a04;
      padding: 11px 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      min-width: 100px;
    }
    .ovl-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #3a1a04; }
    .ovl-btn.secondary {
      background: linear-gradient(135deg, #3a1e08 0%, #5a2e10 50%, #3a1e08 100%);
      border-color: #a06030;
      color: rgba(245,215,142,0.8);
      box-shadow: 0 3px 0 #2a1008;
    }

    @keyframes ovl-bounce  { from { transform: scale(0); } to { transform: scale(1); } }
    @keyframes ovl-fadein  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

    @media (prefers-reduced-motion: reduce) {
      .ovl-icon, .ovl-title, .ovl-sub, .ovl-coins, .ovl-btn-row {
        animation: none !important;
      }
    }

    /* Colour variants */
    .ovl-win   .ovl-title { color: #ffd93b; text-shadow: 0 0 16px rgba(255,217,59,0.6); }
    .ovl-lose  .ovl-title { color: #ff6eb4; text-shadow: 0 0 12px rgba(255,110,180,0.5); }
    .ovl-pause .ovl-title { color: #c9a0ff; text-shadow: 0 0 12px rgba(200,160,255,0.5); }
  `;
  document.head.appendChild(s);
}

// ─── Internal ─────────────────────────────────────────────────────────────────
function mount(html) {
  const old = document.getElementById('engine-overlay');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'engine-overlay';
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

// ─── Public API ───────────────────────────────────────────────────────────────
injectCSS();

/**
 * Show "LEVEL CLEAR!" overlay.
 * @param {number}   score
 * @param {number}   coinsEarned
 * @param {Function} onContinue
 */
export function showLevelClear(score, coinsEarned, onContinue) {
  const el = mount(/* html */`
    <div class="ovl-win">
      <div class="ovl-icon">🎉</div>
      <div class="ovl-title">LEVEL CLEAR!</div>
      <div class="ovl-sub">SCORE: ${score}</div>
      <div class="ovl-coins">+${coinsEarned} 🪙 COINS EARNED</div>
      <div class="ovl-btn-row">
        <button class="ovl-btn" id="ovl-continue">CONTINUE ▶</button>
      </div>
    </div>
  `);
  el.querySelector('#ovl-continue').addEventListener('click', onContinue, { once: true });
}

/**
 * Show "TRY AGAIN?" overlay.
 * @param {Function} onRetry
 * @param {Function} onHome
 * @param {boolean}  [easyModeEnabled]
 */
export function showTryAgain(onRetry, onHome, easyModeEnabled = false) {
  const el = mount(/* html */`
    <div class="ovl-lose">
      <div class="ovl-icon">💫</div>
      <div class="ovl-title">TRY AGAIN?</div>
      ${easyModeEnabled ? `<div class="ovl-sub" style="color:#5effa3">EASY MODE ON 🌟</div>` : ''}
      <div class="ovl-btn-row">
        <button class="ovl-btn" id="ovl-retry">▶ RETRY</button>
        <button class="ovl-btn secondary" id="ovl-home">🏠 HOME</button>
      </div>
    </div>
  `);
  el.querySelector('#ovl-retry').addEventListener('click', onRetry, { once: true });
  el.querySelector('#ovl-home').addEventListener('click',  onHome,  { once: true });
}

/**
 * Show "PAUSED" overlay.
 * @param {Function} onResume
 * @param {Function} onHome
 */
export function showPaused(onResume, onHome) {
  const el = mount(/* html */`
    <div class="ovl-pause">
      <div class="ovl-icon">⏸</div>
      <div class="ovl-title">PAUSED</div>
      <div class="ovl-btn-row">
        <button class="ovl-btn" id="ovl-resume">▶ RESUME</button>
        <button class="ovl-btn secondary" id="ovl-home">🏠 HOME</button>
      </div>
    </div>
  `);
  el.querySelector('#ovl-resume').addEventListener('click', onResume, { once: true });
  el.querySelector('#ovl-home').addEventListener('click',   onHome,   { once: true });
}

/** Remove any active overlay. */
export function hideOverlay() {
  document.getElementById('engine-overlay')?.remove();
}
