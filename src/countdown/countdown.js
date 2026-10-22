/**
 * src/countdown/countdown.js — MuskiVERSE countdown screen
 *
 * Phase 2: full implementation.
 * Uses the MuskiVERSE Countdown Chaos artwork as background.
 * Overlays a live flip-clock countdown using server-synced time.
 * On reaching zero: calls onUnlock() to trigger the unlock sequence.
 */

import { msUntilUnlock, fetchCountdown }      from '@/data/countdown-api.js';
import { EGG_IDS, BIRTHDAY_AGE }               from '@/config/constants.js';
import { triggerEgg }                           from '@/eggs/eggs.js';
import { getMuted, setMuted }                   from '@/data/local-state.js';

// ─── helpers ────────────────────────────────────────────────────────────────
const pad = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');

function decompose(msLeft) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days:  Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins:  Math.floor((s % 3600)  / 60),
    secs:  s % 60,
  };
}

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── CSS (injected once) ─────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('cd-css')) return;
  const s = document.createElement('style');
  s.id = 'cd-css';
  s.textContent = /* css */`
    /* ── countdown screen ─────────────────────────── */
    #cd-screen {
      position: fixed; inset: 0;
      overflow: hidden;
      touch-action: manipulation;
      cursor: pointer;
      font-family: 'Press Start 2P', monospace;
    }

    /* background image fills screen */
    #cd-bg {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      /* on portrait mobile: show the top portion (characters + title) */
      object-position: center 18%;
      z-index: 0;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
      /* subtle image dim so overlaid text pops */
      filter: brightness(0.88);
    }

    /* gradient: clear at top, dark at bottom for clock readability */
    #cd-gradient {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 52%;
      background: linear-gradient(
        to bottom,
        transparent            0%,
        rgba(6, 2, 18, 0.75)  30%,
        rgba(6, 2, 18, 0.93)  60%,
        rgba(6, 2, 18, 0.97) 100%
      );
      z-index: 1;
      pointer-events: none;
    }

    /* twinkling star canvas */
    #cd-stars {
      position: absolute; inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    /* bottom content container */
    #cd-bottom {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 0 12px 20px;
      /* push up on phones with home bar */
      padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
    }

    /* birthday banner (hidden by default, shown on Oct 23) */
    #cd-bday-banner {
      font-size: 0.5rem;
      color: #ffd93b;
      text-shadow: 0 0 8px rgba(255,217,59,0.7);
      letter-spacing: 0.08em;
      text-align: center;
      animation: cd-pulse 1.2s ease-in-out infinite alternate;
    }
    @keyframes cd-pulse {
      from { opacity: 0.8; transform: scale(1);    }
      to   { opacity: 1;   transform: scale(1.04); }
    }

    /* "THE MUSKIVERSE OPENS IN" sub-label */
    #cd-subtext {
      font-size: clamp(0.35rem, 2.5vw, 0.45rem);
      color: #c9a0ff;
      letter-spacing: 0.1em;
      text-shadow: 0 0 10px rgba(160, 90, 255, 0.55);
      margin: 0;
      text-align: center;
      line-height: 1.8;
    }

    /* clock row: 4 units + 3 colons */
    #cd-clock {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(2px, 1vw, 6px);
    }

    /* each unit: DAYS / HOURS / MINS / SECS */
    .cd-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      /* steampunk dark metallic box */
      background: rgba(8, 3, 24, 0.9);
      border: 2.5px solid #3a1e70;
      border-radius: 10px;
      box-shadow:
        inset 0 0 14px rgba(0,0,0,0.85),
        0 0 16px rgba(100, 50, 220, 0.22),
        0 4px 0 rgba(0,0,0,0.55);
      padding: clamp(6px,2vw,10px) clamp(7px,2.5vw,13px) clamp(4px,1.5vw,7px);
      min-width: clamp(58px, 18vw, 78px);
      position: relative;
    }

    /* corner rivet decoration */
    .cd-unit::before,
    .cd-unit::after {
      content: '●';
      position: absolute;
      font-size: 5px;
      color: #5a3298;
      top: 5px;
    }
    .cd-unit::before { left: 5px; }
    .cd-unit::after  { right: 5px; }

    /* big digit */
    .cd-digit {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(1.65rem, 6.5vw, 2.2rem);
      line-height: 1;
      font-variant-numeric: tabular-nums;
      display: block;
    }

    /* per-unit digit colours matching the reference image */
    .cd-unit.days   .cd-digit { color: #ff6eb4; text-shadow: 0 0 14px rgba(255,110,180,0.7); }
    .cd-unit.hours  .cd-digit { color: #ffb340; text-shadow: 0 0 14px rgba(255,179,64,0.7);  }
    .cd-unit.mins   .cd-digit { color: #5effa3; text-shadow: 0 0 14px rgba(94,255,163,0.7);  }
    .cd-unit.secs   .cd-digit { color: #5ee0ff; text-shadow: 0 0 14px rgba(94,224,255,0.7);  }

    /* "DAYS" / "HOURS" etc. label */
    .cd-label {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(0.22rem, 1.1vw, 0.3rem);
      color: rgba(200, 175, 255, 0.72);
      letter-spacing: 0.06em;
    }

    /* colon separators */
    .cd-sep {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(1.1rem, 4.5vw, 1.6rem);
      color: rgba(180, 140, 255, 0.45);
      line-height: 1;
      padding-bottom: 14px;
      flex-shrink: 0;
      animation: cd-blink 1s step-end infinite;
    }

    /* "INSERT COIN" blinking text */
    #cd-insert {
      font-size: clamp(0.3rem, 2vw, 0.38rem);
      color: #ffd93b;
      letter-spacing: 0.06em;
      margin: 0;
      text-align: center;
      text-shadow: 0 0 8px rgba(255,217,59,0.5);
      animation: cd-blink 1.4s step-end infinite;
    }

    /* coin-tap feedback "+1" pop */
    .cd-tap-pop {
      position: fixed;
      pointer-events: none;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.55rem;
      color: #ffd93b;
      text-shadow: 0 0 6px #ffd93b;
      z-index: 20;
      animation: cd-float 0.8s ease-out forwards;
    }
    @keyframes cd-float {
      0%   { opacity: 1; transform: translateY(0)   scale(1);   }
      100% { opacity: 0; transform: translateY(-50px) scale(0.6); }
    }

    /* digit flip */
    .cd-digit.flip {
      animation: cd-flip 0.13s ease;
    }
    @keyframes cd-flip {
      0%   { transform: scaleY(1);  }
      45%  { transform: scaleY(0.05); opacity: 0.3; }
      55%  { transform: scaleY(0.05); opacity: 0.3; }
      100% { transform: scaleY(1);  }
    }

    /* mute button */
    #cd-mute {
      position: fixed;
      top: 14px; right: 14px;
      z-index: 10;
      background: rgba(8, 3, 24, 0.78);
      border: 2px solid #3a1e70;
      border-radius: 8px;
      width: 40px; height: 40px;
      font-size: 1.15rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      box-shadow: 0 0 8px rgba(100,50,200,0.3);
    }
    #cd-mute:active { transform: scale(0.9); }

    /* blink keyframe (shared) */
    @keyframes cd-blink {
      0%, 100% { opacity: 1;    }
      50%       { opacity: 0.12; }
    }

    /* reduced motion: kill ALL animations */
    @media (prefers-reduced-motion: reduce) {
      .cd-sep,
      #cd-insert,
      #cd-bday-banner { animation: none !important; opacity: 1; }
      .cd-digit.flip  { animation: none !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── star particle canvas ───────────────────────────────────────────────────
function startStars(canvas) {
  if (REDUCED) return () => {};

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const STAR_COLORS = ['#ffffff', '#c9a0ff', '#5ee0ff', '#ffb340', '#5effa3'];

  let W, H, stars;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    // Stars only in top 55% (below is covered by clock overlay)
    stars = Array.from({ length: 90 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H * 0.55,
      r:     Math.random() * 1.6 + 0.4,
      speed: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }

  resize();
  window.addEventListener('resize', resize);

  let raf;
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = 0.35 + Math.sin(t * 0.001 * s.speed + s.phase) * 0.4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = a;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}

// ─── digit update with flip ──────────────────────────────────────────────────
const _prev = {};

function setDigit(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const str = pad(value);
  if (_prev[id] === str) return;
  _prev[id] = str;

  if (REDUCED) {
    el.textContent = str;
    return;
  }
  el.classList.remove('flip');
  void el.offsetWidth;  // force reflow
  el.textContent = str;
  el.classList.add('flip');
}

// ─── tap feedback ────────────────────────────────────────────────────────────
function tapPop(x, y) {
  const el = document.createElement('div');
  el.className = 'cd-tap-pop';
  el.textContent = '⭐';
  el.style.left = (x - 12) + 'px';
  el.style.top  = (y - 20) + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ─── Easter egg checks ───────────────────────────────────────────────────────
function checkEggs() {
  const now   = new Date();
  const month = now.getMonth() + 1;   // 1-based
  const day   = now.getDate();
  const year  = now.getFullYear();

  // Egg: device date is Oct 23 (her actual birthday)
  if (month === 10 && day === 23) {
    triggerEgg(EGG_IDS.BIRTHDAY_DATE);
    const banner = document.getElementById('cd-bday-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.textContent = `🎂 TODAY IS HER BIRTHDAY! LEVEL ${BIRTHDAY_AGE} LOADING... 🎂`;
    }
  }

  // Egg: birth time ± 5 min of midnight IST Oct 23
  // Midnight IST = 18:30 UTC Oct 22
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcDay  = now.getUTCDate();
  const utcMon  = now.getUTCMonth() + 1;
  const nearMidnightIST =
    utcMon === 10 && utcDay === 22 && utcHour === 18 &&
    utcMin >= 25 && utcMin <= 35;
  if (nearMidnightIST) {
    triggerEgg(EGG_IDS.BIRTH_TIME);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
/**
 * Mount the countdown screen.
 * @param {HTMLElement} container
 * @param {string}      unlockAt       ISO string of unlock time
 * @param {number}      serverOffsetMs clock offset in ms
 * @param {Function}    onUnlock       called once when countdown reaches 0
 */
export function mountCountdown(container, unlockAt, serverOffsetMs, onUnlock) {
  injectCSS();

  container.innerHTML = /* html */`
    <div id="cd-screen">

      <!-- 1. Background artwork -->
      <img id="cd-bg" src="/images/countdown-bg.png" alt=""
        onerror="this.style.background='#06021a';this.style.display='block'" />

      <!-- 2. Bottom gradient overlay (darkens clock area) -->
      <div id="cd-gradient"></div>

      <!-- 3. Twinkling stars canvas -->
      <canvas id="cd-stars"></canvas>

      <!-- 4. Bottom interactive section -->
      <div id="cd-bottom">

        <!-- Birthday banner (shown only on Oct 23) -->
        <div id="cd-bday-banner" style="display:none"></div>

        <!-- Sub-label -->
        <p id="cd-subtext">✨ THE MUSKIVERSE OPENS IN ✨</p>

        <!-- Live countdown clock — styled to match the image boxes -->
        <div id="cd-clock">
          <div class="cd-unit days">
            <span class="cd-digit" id="dig-days">00</span>
            <span class="cd-label">DAYS</span>
          </div>
          <span class="cd-sep">:</span>

          <div class="cd-unit hours">
            <span class="cd-digit" id="dig-hours">00</span>
            <span class="cd-label">HOURS</span>
          </div>
          <span class="cd-sep">:</span>

          <div class="cd-unit mins">
            <span class="cd-digit" id="dig-mins">00</span>
            <span class="cd-label">MINS</span>
          </div>
          <span class="cd-sep">:</span>

          <div class="cd-unit secs">
            <span class="cd-digit" id="dig-secs">00</span>
            <span class="cd-label">SECS</span>
          </div>
        </div>

        <!-- Insert coin prompt -->
        <p id="cd-insert">👾 TAP ANYWHERE · INSERT COIN 👾</p>

        <!-- Instant Dev / Preview Unlock Button -->
        <button id="cd-dev-unlock-btn" style="
          background: linear-gradient(135deg, #ffd93b, #c07020);
          border: 2px solid #fff;
          border-radius: 8px;
          color: #1a0a2e;
          font-family: inherit;
          font-size: clamp(0.35rem, 2.5vw, 0.45rem);
          padding: 10px 18px;
          cursor: pointer;
          margin-top: 6px;
          box-shadow: 0 0 16px rgba(255,217,59,0.6);
          letter-spacing: 0.04em;
        ">
          🔓 ENTER ARCADE (TEST / PREVIEW) ▶
        </button>

      </div>

      <!-- 5. Mute button (always visible) -->
      <button id="cd-mute" aria-label="Toggle sound">
        ${getMuted() ? '🔇' : '🔊'}
      </button>

    </div>
  `;

  // ── Star particles ────────────────────────────────────────────────────────
  const stopStars = startStars(document.getElementById('cd-stars'));

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const muteBtn = document.getElementById('cd-mute');
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = !getMuted();
    setMuted(next);
    muteBtn.textContent = next ? '🔇' : '🔊';
  });

  // ── Dev / Preview Instant Unlock ──────────────────────────────────────────
  document.getElementById('cd-dev-unlock-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.setItem('muski_dev_unlocked', 'true');
    cleanup();
    onUnlock();
  });

  // ── Tap feedback on screen ────────────────────────────────────────────────
  document.getElementById('cd-screen').addEventListener('click', (e) => {
    if (e.target === muteBtn) return;
    tapPop(e.clientX, e.clientY);
  });

  // ── Easter eggs ───────────────────────────────────────────────────────────
  checkEggs();

  // ── Cake 7× tap Easter egg (vault trigger) ───────────────────────────────
  // Tracked in egg system; boot screen implements the actual tap detection
  // (the image shows a cake/panda in the bottom area — vault trigger will
  //  be moved here in Phase 6 when vault is built)

  // ── Tick loop ─────────────────────────────────────────────────────────────
  let _raf;
  let _unlockFired = false;

  function tick() {
    const ms = msUntilUnlock();

    if (ms <= 0 && !_unlockFired) {
      _unlockFired = true;
      // Force all digits to 00:00:00:00
      ['dig-days','dig-hours','dig-mins','dig-secs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      cleanup();
      onUnlock();
      return;
    }

    const { days, hours, mins, secs } = decompose(ms);
    setDigit('dig-days',  days);
    setDigit('dig-hours', hours);
    setDigit('dig-mins',  mins);
    setDigit('dig-secs',  secs);

    _raf = requestAnimationFrame(tick);
  }
  _raf = requestAnimationFrame(tick);

  // ── Tab sleep re-sync ─────────────────────────────────────────────────────
  function onVisible() {
    if (document.visibilityState === 'visible') {
      fetchCountdown().catch(console.warn);
    }
  }
  document.addEventListener('visibilitychange', onVisible);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  function cleanup() {
    cancelAnimationFrame(_raf);
    stopStars();
    document.removeEventListener('visibilitychange', onVisible);
  }
}
