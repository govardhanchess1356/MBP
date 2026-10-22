/**
 * src/main.js — App entry point
 *
 * Phase 2: connects server time, routes to countdown or boot screen,
 *          handles the unlock sequence transition.
 */
import { injectPalette }          from '@/config/palette.js';
import { BIRTHDAY_NAME,
         BIRTHDAY_AGE, EGG_IDS }  from '@/config/constants.js';
import { fetchCountdown,
         msUntilUnlock }          from '@/data/countdown-api.js';
import { initGlobalEasterEggs }   from '@/eggs/eggs.js';

// ─── 1. Easter Egg #10: DevTools console note ────────────────────────────────
console.log(
  `%c🎂 Hey, curious one!`,
  'font-size:20px;font-weight:bold;color:#DA627D;font-family:monospace;'
);
console.log(
  `%cThis is a birthday surprise for ${BIRTHDAY_NAME}.\n` +
  `If you're snooping around in DevTools, you're already our kind of person.\n` +
  `Happy Birthday to the best ${BIRTHDAY_AGE}-year-old ever! 🎉\n\n` +
  `(P.S. There's nothing personal in the bundle. You'll have to wait like everyone else.)`,
  'font-size:13px;color:#A53860;font-family:monospace;line-height:1.7;'
);
window.__eggTriggered = window.__eggTriggered ?? {};
window.__eggTriggered[EGG_IDS.DEVTOOLS_NOTE] = true;

// ─── 2. Inject CSS palette custom properties ──────────────────────────────────
injectPalette();
initGlobalEasterEggs();

// ─── 3. Global base styles ────────────────────────────────────────────────────
(function injectBaseCSS() {
  if (document.getElementById('base-css')) return;
  const s = document.createElement('style');
  s.id = 'base-css';
  s.textContent = /* css */`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%; height: 100%;
      overflow: hidden;
      background: #06021a;
      /* Pixel rendering for the overall shell */
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    #app {
      position: fixed;
      inset: 0;
      overflow: hidden;
    }

    /* ── CRT scanline overlay ────────────────────────── */
    #app.crt::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background: repeating-linear-gradient(
        to bottom,
        transparent             0px,
        transparent             2px,
        rgba(0, 0, 0, 0.08)    2px,
        rgba(0, 0, 0, 0.08)    4px
      );
    }

    /* ── Global pixel font pre-load hint ────────────── */
    body {
      font-family: 'Press Start 2P', monospace;
    }

    /* ── Error screen ────────────────────────────────── */
    #error-screen {
      position: fixed; inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #06021a;
      font-family: 'Press Start 2P', monospace;
      color: #F9DBBD;
      text-align: center;
      padding: 2rem;
      gap: 1.2rem;
    }
    .err-title {
      font-size: 0.6rem;
      color: #FFA5AB;
      line-height: 2.2;
      letter-spacing: 0.08em;
    }
    .err-msg {
      font-size: 0.35rem;
      color: #DA627D;
      opacity: 0.8;
      max-width: 280px;
      line-height: 1.9;
      word-break: break-all;
    }

    /* ── Loading screen ──────────────────────────────── */
    #loading-screen {
      position: fixed; inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #06021a;
      font-family: 'Press Start 2P', monospace;
      gap: 1.5rem;
    }
    .load-cake {
      font-size: 3rem;
      animation: load-pulse 1s ease-in-out infinite alternate;
    }
    .load-text {
      font-size: 0.45rem;
      color: #c9a0ff;
      letter-spacing: 0.1em;
      line-height: 2;
    }
    @keyframes load-pulse {
      from { transform: scale(1);   opacity: 0.7; }
      to   { transform: scale(1.1); opacity: 1;   }
    }
    @media (prefers-reduced-motion: reduce) {
      .load-cake { animation: none; opacity: 1; }
    }
  `;
  document.head.appendChild(s);
})();

// ─── 4. DOM root ──────────────────────────────────────────────────────────────
const app = document.getElementById('app');

// Enable CRT scanline overlay (skipped under prefers-reduced-motion by CSS only)
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!REDUCED) app.classList.add('crt');

// ─── 5. Screen helpers ────────────────────────────────────────────────────────
function showLoading() {
  app.innerHTML = `
    <div id="loading-screen">
      <div class="load-cake">🎂</div>
      <div class="load-text">LOADING MUSKIVERSE...</div>
    </div>
  `;
}

function showError(err) {
  console.error('[muski-birthday] Boot error:', err);
  app.innerHTML = `
    <div id="error-screen">
      <div class="err-title">CONNECTION ERROR<br><br>CHECK YOUR .env.local<br>SEE README.md</div>
      <div class="err-msg">${err?.message ?? 'Unknown error'}</div>
    </div>
  `;
}

// ─── 6. Screen transitions ────────────────────────────────────────────────────

async function goToArcadeHall() {
  const { mountArcadeHall } = await import('@/screens/arcade-hall.js');
  mountArcadeHall(app, {
    onHome: () => goToBootScreen(),   // home button → back to title screen
  });
}

async function goToBootScreen() {
  const { mountBootScreen } = await import('@/screens/boot.js');
  // Title screen: MUSKI Adventures image + PRESS START
  // onStart → fade into Arcade Hall
  mountBootScreen(app, () => goToArcadeHall());
}

async function goToCountdown(unlockAt, serverOffsetMs) {
  const { mountCountdown } = await import('@/countdown/countdown.js');

  mountCountdown(app, unlockAt, serverOffsetMs, async () => {
    // Countdown hit zero: unlock sequence → title screen
    app.innerHTML = '';
    const { playUnlockSequence } = await import('@/countdown/unlock-sequence.js');
    playUnlockSequence(app, () => goToBootScreen());
  });
}

// ─── 7. Tab wake re-sync ──────────────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    fetchCountdown().catch(console.warn);
  }
});

// ─── 8. BOOT ──────────────────────────────────────────────────────────────────
async function boot() {
  showLoading();

  try {
    const { isUnlocked, unlockAt, serverOffsetMs } = await fetchCountdown();

    if (isUnlocked) {
      await goToBootScreen();
    } else {
      await goToCountdown(unlockAt, serverOffsetMs);
    }
  } catch (err) {
    showError(err);
  }
}

boot();
