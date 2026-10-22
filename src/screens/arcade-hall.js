/**
 * src/screens/arcade-hall.js — Arcade Hall (Enhanced PC & Mobile UI) 🕹️
 *
 * Exclusively displays the 6 playable arcade games in the main floor grid.
 * Non-game destinations (Slot Machine, Card Album, Sticker Corner)
 * are cleanly accessed via the Arcade Lounge Navigation Dock & HUD.
 *
 * Responsive multi-column layout on desktop PC (prevents ultra-wide stretching).
 */

import { getMuted, setMuted, getCoins, getCardsUnlocked } from '@/data/local-state.js';
import { EGG_IDS }                                          from '@/config/constants.js';
import { triggerEgg }                                       from '@/eggs/eggs.js';
import { mountGameScreen }                                  from './game-screen.js';
import { mountSlotMachine }                                 from './slot-machine.js';
import { mountCardAlbum }                                   from './card-album.js';
import { mountStickerBook }                                 from './sticker-book.js';
import { mountBoss }                                        from './boss.js';
import { mountFinale }                                      from './finale.js';
import { mountCredits }                                     from './credits.js';
import { drawAvatar }                                       from '@/ui/avatar.js';
import { openAvatarMaker }                                  from '@/ui/avatar-maker-modal.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function injectCSS() {
  if (document.getElementById('hall-css')) return;
  const s = document.createElement('style');
  s.id = 'hall-css';
  s.textContent = /* css */`
    #hall-screen {
      position: fixed; inset: 0;
      overflow: hidden;
      background: radial-gradient(circle at 50% 10%, #1c0830 0%, #0d0418 60%, #05010a 100%);
      font-family: 'Press Start 2P', monospace;
      display: flex; flex-direction: column;
      align-items: center;
    }

    /* ── Top HUD ───────────────────────────────────────── */
    #hall-hud {
      width: 100%;
      max-width: 980px;
      position: relative; z-index: 20;
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px;
      padding-top: max(10px, env(safe-area-inset-top, 10px));
      background: linear-gradient(to bottom, rgba(6,2,14,0.95) 0%, rgba(6,2,14,0.6) 100%);
      flex-shrink: 0;
      box-sizing: border-box;
    }
    .hall-pill {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.38rem; padding: 6px 12px;
      background: rgba(69,9,32,0.85);
      border: 1.5px solid #A53860; border-radius: 8px;
      color: #ffd93b; text-shadow: 0 0 6px rgba(255,217,59,0.45);
    }
    .hall-pill span { color: #F9DBBD; }
    .hall-hud-r { display: flex; gap: 8px; align-items: center; }
    .hall-icon-btn {
      background: rgba(69,9,32,0.85); border: 1.5px solid #A53860;
      border-radius: 8px; width: 38px; height: 38px;
      font-size: 1.1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.1s;
    }
    .hall-icon-btn:active { transform: scale(0.9); }

    /* ── Arcade Lounge Bar (Quick Nav for Slots, Album, Stickers) ── */
    #arcade-lounge-bar {
      width: 100%;
      max-width: 980px;
      display: flex;
      gap: 10px;
      padding: 8px 16px 4px;
      flex-shrink: 0;
      box-sizing: border-box;
      justify-content: center;
    }
    .lounge-nav-btn {
      flex: 1;
      max-width: 300px;
      background: linear-gradient(135deg, rgba(69,9,32,0.9), rgba(165,56,96,0.7));
      border: 2px solid #DA627D;
      border-radius: 8px;
      padding: 8px 6px;
      color: #fff;
      font-family: inherit;
      font-size: clamp(0.28rem, 2.2vw, 0.36rem);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      gap: 6px;
      box-shadow: 0 3px 0 rgba(69,9,32,0.9), 0 0 12px rgba(218,98,125,0.25);
      letter-spacing: 0.04em;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .lounge-nav-btn:hover {
      border-color: #ffd93b;
      box-shadow: 0 0 16px rgba(255,217,59,0.4);
    }
    .lounge-nav-btn:active {
      transform: translateY(2px);
      box-shadow: 0 1px 0 rgba(69,9,32,0.9);
    }

    /* ── Scrollable Game Floor ──────────────────────────── */
    #hall-scroll {
      width: 100%;
      max-width: 980px;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 16px;
      padding-bottom: max(32px, env(safe-area-inset-bottom, 32px));
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }

    #hall-title {
      font-size: clamp(0.52rem, 3.2vw, 0.72rem);
      color: #ffd93b;
      text-shadow: 0 0 14px rgba(255,217,59,0.6);
      letter-spacing: 0.08em;
      text-align: center;
      margin: 8px 0 16px;
      line-height: 1.8;
    }

    /* Grid of cabinets on PC / Mobile */
    #hall-cabinet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
      width: 100%;
    }

    /* ── Cabinet card ──────────────────────────────────── */
    .cabinet-card {
      width: 100%;
      background: linear-gradient(160deg, #18082e 0%, #250d40 100%);
      border: 3px solid #A53860;
      border-radius: 14px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      box-shadow: 0 6px 0 rgba(40,4,18,0.9), 0 0 24px rgba(165,56,96,0.25);
      transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
      display: flex; flex-direction: column;
    }
    .cabinet-card:hover {
      border-color: #ffd93b;
      box-shadow: 0 6px 0 rgba(40,4,18,0.9), 0 0 30px rgba(255,217,59,0.35);
      transform: translateY(-3px);
    }
    .cabinet-card:active {
      transform: translateY(3px);
      box-shadow: 0 2px 0 rgba(40,4,18,0.9);
    }

    /* Screen canvas area — PROPER RATIO, NEVER STRETCHED */
    .cabinet-screen {
      width: 100%;
      height: 135px;
      display: block;
      background: #06021a;
      image-rendering: pixelated;
      object-fit: contain;
    }

    /* Bezel below screen */
    .cabinet-bezel {
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: linear-gradient(to bottom, #1c0932, #11041c);
      border-top: 2px solid rgba(165,56,96,0.3);
      flex: 1;
    }
    .cabinet-info { flex: 1; }
    .cabinet-name {
      font-size: clamp(0.42rem, 2.5vw, 0.5rem);
      color: #FFA5AB;
      letter-spacing: 0.05em;
      line-height: 1.7;
    }
    .cabinet-sub {
      font-size: clamp(0.26rem, 1.8vw, 0.32rem);
      color: rgba(200,160,255,0.7);
      margin-top: 4px;
      line-height: 1.6;
    }
    .cabinet-badge {
      font-size: 0.32rem;
      padding: 6px 10px;
      border-radius: 6px;
      letter-spacing: 0.05em;
      flex-shrink: 0;
      background: rgba(94,255,163,0.18);
      border: 1.5px solid #5effa3;
      color: #5effa3;
    }

    /* Neon marquee colour bar */
    .cabinet-marquee {
      height: 5px;
      width: 100%;
    }

    /* Coin pop */
    .hall-coin-pop {
      position: fixed; pointer-events: none;
      font-size: 1.2rem; z-index: 50;
      animation: hall-float 0.85s ease-out forwards;
    }
    @keyframes hall-float {
      0%   { opacity: 1; transform: translateY(0) scale(1.1); }
      100% { opacity: 0; transform: translateY(-55px) scale(0.7); }
    }
  `;
  document.head.appendChild(s);
}

// ─── Cabinet Canvas Pixel Art Renderers ────────────────────────────────────────

function drawFlappyCabinet(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a0a3d'); g.addColorStop(1, '#450920');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  [[20,15],[60,8],[100,20],[150,10],[200,18],[250,6],[300,15],[330,22]].forEach(([x,y]) => ctx.fillRect(x, y, 2, 2));
  [{x:40,gapY:40,gap:52},{x:140,gapY:55,gap:52},{x:240,gapY:30,gap:52}].forEach(p => {
    ctx.fillStyle='#A53860'; ctx.fillRect(p.x,0,22,p.gapY); ctx.fillRect(p.x,p.gapY+p.gap,22,H);
    ctx.fillStyle='#DA627D'; ctx.fillRect(p.x-3,p.gapY-10,28,10); ctx.fillRect(p.x-3,p.gapY+p.gap,28,10);
  });
  ctx.fillStyle='#FFA5AB'; ctx.beginPath(); ctx.ellipse(70,65,8,9,0,0,Math.PI*2); ctx.fill();
  drawAvatar(ctx,70,78,11,'default');
  ctx.fillStyle='#ffd93b'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('BALLOON FLAP',W/2,H-8);
}

function drawDinoCabinet(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0f051d'); g.addColorStop(1,'#2d0e3a');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#DA627D'; ctx.fillRect(0,H-22,W,22);
  ctx.fillStyle='#FFA5AB'; ctx.fillRect(0,H-22,W,2);
  ctx.fillStyle='#5effa3'; ctx.fillRect(180,H-48,16,26); ctx.fillRect(174,H-40,8,12); ctx.fillRect(194,H-44,8,14);
  drawAvatar(ctx,70,H-42,12,'happy');
  ctx.fillStyle='#DA627D'; ctx.fillRect(63,H-32,14,14);
  ctx.fillStyle='#ffd93b'; ctx.beginPath(); ctx.arc(260,H-60,7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#5effa3'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('BIRTHDAY RUN',W/2,H-8);
}

function drawAsteroidsCabinet(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle='#06021a'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.6)';
  [[30,20],[80,45],[150,15],[220,50],[290,25],[330,60]].forEach(([x,y])=>ctx.fillRect(x,y,2,2));
  [[120,40,18],[240,30,14],[70,60,10]].forEach(([x,y,r])=>{
    ctx.fillStyle='#A53860'; ctx.fillRect(x-r,y-r,r*2,r*2);
    ctx.fillStyle='#ffd93b'; ctx.fillRect(x-r,y-2,r*2,4); ctx.fillRect(x-2,y-r,4,r*2);
  });
  ctx.fillStyle='#DA627D'; ctx.beginPath(); ctx.moveTo(W/2,H-48); ctx.lineTo(W/2-14,H-24); ctx.lineTo(W/2+14,H-24); ctx.closePath(); ctx.fill();
  drawAvatar(ctx,W/2,H-33,9,'happy');
  ctx.fillStyle='#5ee0ff'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('CAKE DEFENDER',W/2,H-8);
}

function drawJetpackCabinet(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle='#0d0010'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(165,56,96,0.2)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  ctx.fillStyle='#2a0a3a'; ctx.fillRect(0,0,W,18); ctx.fillRect(0,H-18,W,18);
  ctx.fillStyle='#DA627D'; ctx.fillRect(0,16,W,2); ctx.fillRect(0,H-18,W,2);
  drawAvatar(ctx,67,42,12,'happy');
  [[120,38],[170,55],[220,32],[270,50]].forEach(([cx,cy])=>{
    ctx.fillStyle='#ffd93b'; ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle='#ffb340'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('JET PACK PARTY',W/2,H-8);
}

function drawPlatformerCabinet(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0d0525'); g.addColorStop(1,'#1a0838');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#A53860'; ctx.fillRect(0,H-26,W*0.4,8); ctx.fillRect(W*0.5,H-26,W*0.5,8);
  ctx.fillStyle='#DA627D'; ctx.fillRect(0,H-26,W*0.4,3); ctx.fillRect(W*0.5,H-26,W*0.5,3);
  drawAvatar(ctx,60,H-48,12,'happy');
  ctx.fillStyle='#5effa3'; ctx.beginPath(); ctx.arc(220,H-36,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffd93b'; ctx.beginPath(); ctx.arc(150,H-50,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c9a0ff'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('SUPER MUSKI',W/2,H-8);
}

function drawBossCabinet(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#18020a'; ctx.fillRect(0,0,W,H);
  const g = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, 80);
  g.addColorStop(0, '#ff3366'); g.addColorStop(1, '#18020a');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⏰ 💥 🎂', W/2, H/2 - 6);
  ctx.fillStyle = '#ffd93b'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('FINAL BOSS: GETTING OLDER', W/2, H-8);
}

// ─── CABINETS LIST — EXCLUSIVELY GAMES ONLY ──────────────────────────────────
const GAME_CABINETS = [
  {
    id:      'flappy',
    name:    '🎈 BALLOON FLAP',
    sub:     'Tap or SPACE to flap · Pass pipes',
    color:   '#ff6eb4',
    draw:    drawFlappyCabinet,
  },
  {
    id:      'dino',
    name:    '🦕 BIRTHDAY RUN',
    sub:     'SPACE / UP jump · DOWN duck',
    color:   '#5effa3',
    draw:    drawDinoCabinet,
  },
  {
    id:      'asteroids',
    name:    '🎂 CAKE DEFENDER',
    sub:     'ARROWS / WASD / Drag to steer',
    color:   '#5ee0ff',
    draw:    drawAsteroidsCabinet,
  },
  {
    id:      'jetpack',
    name:    '🚀 JET PACK PARTY',
    sub:     'Hold SPACE / UP to fly tunnel',
    color:   '#ffb340',
    draw:    drawJetpackCabinet,
  },
  {
    id:      'platformer',
    name:    '⭐ SUPER MUSKI',
    sub:     'Run · Jump · Double jump in L2',
    color:   '#c9a0ff',
    draw:    drawPlatformerCabinet,
  },
  {
    id:      'boss',
    name:    '⚔️ FINAL BOSS: GETTING OLDER',
    sub:     'Defeat Time · Unlock Level 19! 👑',
    color:   '#ffd93b',
    draw:    drawBossCabinet,
  },
];

function coinPop(x, y) {
  const el = document.createElement('div');
  el.className = 'hall-coin-pop';
  el.textContent = '🪙';
  el.style.cssText = `left:${x-14}px;top:${y-14}px;`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

export function mountArcadeHall(container, opts = {}) {
  injectCSS();

  const coins     = getCoins();
  const cardsDone = getCardsUnlocked().length;
  const muted     = getMuted();

  container.innerHTML = /* html */`
    <div id="hall-screen">

      <!-- Top HUD -->
      <div id="hall-hud">
        <div style="display:flex;gap:8px;">
          <div class="hall-pill">🪙 <span id="hall-coins">${coins}</span></div>
          <div class="hall-pill">🃏 <span id="hall-cards">${cardsDone}</span></div>
        </div>
        <div class="hall-hud-r">
          <button class="hall-icon-btn" id="hall-slots-quick" aria-label="Slot Machine" title="Slot Machine">🎰</button>
          <button class="hall-icon-btn" id="hall-album-quick" aria-label="Card Album" title="Card Album">📖</button>
          <button class="hall-icon-btn" id="hall-stickers-quick" aria-label="Sticker Corner" title="Sticker Corner">🌸</button>
          <button class="hall-icon-btn" id="hall-avatar-btn" aria-label="Avatar Studio" title="Customize Muski">👾</button>
          <button class="hall-icon-btn" id="hall-home-btn" aria-label="Home">🏠</button>
          <button class="hall-icon-btn" id="hall-mute-btn" aria-label="Toggle sound">${muted ? '🔇' : '🔊'}</button>
        </div>
      </div>

      <!-- Quick Nav Lounge Bar -->
      <div id="arcade-lounge-bar">
        <button class="lounge-nav-btn" id="lounge-slots-btn">
          <span>🎰</span> LUCKY SLOTS
        </button>
        <button class="lounge-nav-btn" id="lounge-album-btn">
          <span>📖</span> CARD ALBUM
        </button>
        <button class="lounge-nav-btn" id="lounge-stickers-btn">
          <span>🌸</span> STICKERS
        </button>
      </div>

      <!-- Main Game Floor -->
      <div id="hall-scroll">
        <div id="hall-title">🕹️ ARCADE GAMES FLOOR 🕹️</div>

        <div id="hall-cabinet-grid">
          ${GAME_CABINETS.map(cab => /* html */`
            <div class="cabinet-card"
                 data-game="${cab.id}"
                 role="button"
                 tabindex="0"
                 aria-label="${cab.name}">

              <!-- Neon marquee bar -->
              <div class="cabinet-marquee"
                   style="background:linear-gradient(90deg,transparent,${cab.color},transparent);">
              </div>

              <!-- Pixel art screen -->
              <canvas class="cabinet-screen"
                      id="cab-canvas-${cab.id}"
                      width="360" height="135">
              </canvas>

              <!-- Bezel -->
              <div class="cabinet-bezel">
                <div class="cabinet-info">
                  <div class="cabinet-name" style="color:${cab.color}">${cab.name}</div>
                  <div class="cabinet-sub">${cab.sub}</div>
                </div>
                <div class="cabinet-badge">▶ PLAY</div>
              </div>

            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;

  // Draw cabinet preview screens
  for (const cab of GAME_CABINETS) {
    const canvas = document.getElementById(`cab-canvas-${cab.id}`);
    if (canvas) cab.draw(canvas);
  }

  // ── Navigation to Lounge Features (Slots, Album, Stickers) ─────────────────
  const openSlots = () => {
    mountSlotMachine(container, {
      onHome: () => mountArcadeHall(container, opts),
      onCardDispensed: () => {},
    });
  };

  const openAlbum = () => {
    mountCardAlbum(container, { onHome: () => mountArcadeHall(container, opts) });
  };

  const openStickers = () => {
    mountStickerBook(container, { onHome: () => mountArcadeHall(container, opts) });
  };

  document.getElementById('lounge-slots-btn')?.addEventListener('click', openSlots);
  document.getElementById('hall-slots-quick')?.addEventListener('click', openSlots);

  document.getElementById('lounge-album-btn')?.addEventListener('click', openAlbum);
  document.getElementById('hall-album-quick')?.addEventListener('click', openAlbum);

  document.getElementById('lounge-stickers-btn')?.addEventListener('click', openStickers);
  document.getElementById('hall-stickers-quick')?.addEventListener('click', openStickers);

  // ── HUD Buttons ────────────────────────────────────────────────────────────
  document.getElementById('hall-home-btn')?.addEventListener('click', () => opts.onHome?.());

  document.getElementById('hall-avatar-btn')?.addEventListener('click', () => {
    openAvatarMaker(() => {
      const canvas = document.getElementById('cab-canvas-flappy');
      if (canvas) drawFlappyCabinet(canvas);
    });
  });

  const muteBtn = document.getElementById('hall-mute-btn');
  muteBtn?.addEventListener('click', () => {
    const next = !getMuted();
    setMuted(next);
    muteBtn.textContent = next ? '🔇' : '🔊';
  });

  // ── Click Game Cabinet -> Launch Game ──────────────────────────────────────
  document.getElementById('hall-cabinet-grid')?.addEventListener('click', async (e) => {
    const card = e.target.closest('.cabinet-card');
    if (!card) return;

    const gameId = card.dataset.game;
    coinPop(e.clientX, e.clientY);

    // Final Boss Fight
    if (gameId === 'boss') {
      mountBoss(container, {}, () => {
        mountFinale(container, () => {
          mountCredits(container, { onHome: () => mountArcadeHall(container, opts) });
        });
      });
      return;
    }

    // Launch game screen
    await mountGameScreen(container, {
      gameId,
      levelIndex: 0,
      onHome: () => mountArcadeHall(container, opts),
      onLevelClear: (_score, nextIdx) => {
        mountGameScreen(container, {
          gameId,
          levelIndex: nextIdx,
          onHome:       () => mountArcadeHall(container, opts),
          onLevelClear: () => mountArcadeHall(container, opts),
        });
      },
    });
  });

  // Live HUD coin refresh
  const timer = setInterval(() => {
    const c = document.getElementById('hall-coins');
    const k = document.getElementById('hall-cards');
    if (c) c.textContent = getCoins();
    if (k) k.textContent = getCardsUnlocked().length;
  }, 2000);

  return () => clearInterval(timer);
}
