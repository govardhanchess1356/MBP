/**
 * src/ui/scratch-card.js — Scratch-card reveal overlay with Multi-Media Support
 *
 * Each card can contain multiple media items:
 * - Photos gallery (carousel / zoom)
 * - Voice Note Player (retro cassette player with play/pause and progress)
 * - Video Clips
 * - Contributor signature
 *
 * User drags finger/mouse over the silver layer to scratch it away.
 * When ≥60% is scratched, auto-reveals the rest with celebratory confetti.
 */

import { SFX } from '@/engine/sound.js';
import { getRandomMediaForCard } from '@/data/contribute-store.js';

const RARITIES = {
  MYTHIC:    { label: '👑 MYTHIC',    color: '#ff6eb4', bg: 'linear-gradient(135deg,#8b0032,#ff3385,#ffe066)' },
  LEGENDARY: { label: '✨ LEGENDARY', color: '#ffd93b', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  RARE:      { label: '💜 RARE',      color: '#c9a0ff', bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },
  COMMON:    { label: '🌸 COMMON',    color: '#FFA5AB', bg: 'linear-gradient(135deg,#450920,#A53860)' },
};

function injectCSS() {
  if (document.getElementById('sc-full-css')) return;
  const s = document.createElement('style');
  s.id = 'sc-full-css';
  s.textContent = /* css */`
    #sc-overlay {
      position: fixed; inset: 0; z-index: 500;
      background: rgba(6,2,26,0.94);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 14px;
      animation: sc-fade-in 0.3s ease;
      touch-action: none;
      padding: 16px;
      box-sizing: border-box;
      font-family: 'Press Start 2P', monospace;
    }
    @keyframes sc-fade-in { from { opacity:0; } to { opacity:1; } }

    #sc-hint {
      font-size: 0.36rem;
      color: rgba(249,219,189,0.75);
      text-align: center;
      line-height: 1.8;
      animation: sc-hint-pulse 1.5s ease-in-out infinite;
      user-select: none;
    }
    @keyframes sc-hint-pulse {
      0%,100% { opacity:0.65; transform:scale(0.98); }
      50% { opacity:1; transform:scale(1.02); }
    }

    #sc-wrapper {
      position: relative;
      width: min(320px, 86vw);
      height: min(440px, 68vh);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 0 35px rgba(255,217,59,0.3);
      border: 3px solid rgba(255,255,255,0.2);
    }

    /* Card face (underneath) */
    #sc-face {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center;
      padding: 18px 16px;
      box-sizing: border-box;
      overflow-y: auto;
      gap: 10px;
    }

    #sc-rarity-badge {
      font-size: 0.28rem;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.3);
      background: rgba(0,0,0,0.35);
      letter-spacing: 0.05em;
    }

    #sc-emoji {
      font-size: 3rem;
      text-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }

    #sc-title {
      font-size: clamp(0.42rem, 2.8vw, 0.54rem);
      text-align: center;
      line-height: 1.6;
      color: #fff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    }

    #sc-author {
      font-size: 0.28rem;
      color: #ffd93b;
      margin-top: -4px;
    }

    #sc-desc {
      font-size: 0.32rem;
      color: rgba(255,255,255,0.9);
      text-align: center;
      line-height: 1.9;
      background: rgba(0,0,0,0.25);
      border-radius: 8px;
      padding: 10px;
      width: 100%;
      word-break: break-word;
    }

    /* Multi-Media Container */
    #sc-media-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }

    .sc-media-item {
      background: rgba(0,0,0,0.4);
      border: 1.5px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sc-media-thumb {
      width: 100%;
      max-height: 140px;
      object-fit: cover;
      display: block;
    }

    .sc-media-caption {
      font-size: 0.24rem;
      color: rgba(255,255,255,0.7);
      padding: 6px 8px;
      line-height: 1.5;
    }

    /* Voice Note Player */
    .sc-voice-player {
      background: linear-gradient(135deg, #1f0b29, #380d38);
      border: 1.5px solid #ff6eb4;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sc-play-btn {
      background: #ffd93b;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Scratch canvas (on top) */
    #sc-canvas {
      position: absolute; inset: 0;
      border-radius: 14px;
      cursor: crosshair;
      touch-action: none;
    }

    /* Revealed button */
    #sc-revealed-btn {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.38rem;
      padding: 12px 28px;
      background: linear-gradient(135deg,#7a4010,#c07020);
      border: 2px solid #ffd93b;
      border-bottom-width: 4px;
      border-radius: 8px;
      color: #ffd93b;
      cursor: pointer;
      display: none;
      animation: sc-btn-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes sc-btn-pop {
      from { transform: scale(0.5); opacity:0; }
      to   { transform: scale(1);   opacity:1; }
    }
    #sc-revealed-btn.visible { display: block; }

    #sc-confetti-area {
      position: fixed; inset: 0; pointer-events: none; z-index: 501;
    }
    .sc-confetti-piece {
      position: absolute;
      width: 8px; height: 8px;
      border-radius: 2px;
      animation: sc-confetti-fall linear forwards;
    }
    @keyframes sc-confetti-fall {
      0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
      100% { transform: translateY(750px) rotate(720deg); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}

function burstConfetti() {
  const area = document.createElement('div');
  area.id = 'sc-confetti-area';
  document.body.appendChild(area);
  const colors = ['#ffd93b','#ff6eb4','#5effa3','#c9a0ff','#5ee0ff','#DA627D','#ffffff'];
  for (let i = 0; i < 65; i++) {
    const el = document.createElement('div');
    el.className = 'sc-confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = Math.random() * 100;
    const dur = 1.5 + Math.random() * 1.8;
    const delay = Math.random() * 0.5;
    el.style.cssText = `left:${x}vw; top: -10px; background:${color}; animation-duration:${dur}s; animation-delay:${delay}s;`;
    area.appendChild(el);
  }
  setTimeout(() => area.remove(), 4000);
}

function getScratchedPercent(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) transparent++;
  }
  return transparent / (w * h);
}

/**
 * Show the interactive Scratch Card with Multi-Media
 */
export function showScratchCard(_container, cardData = {}, onDone) {
  injectCSS();

  const emoji  = cardData.emoji       || '🎁';
  const isImgBadge = typeof emoji === 'string' && (emoji.startsWith('data:') || emoji.startsWith('http') || emoji.startsWith('/'));
  const badgeHTML = isImgBadge
    ? `<img src="${emoji}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2.5px solid #ffd93b;box-shadow:0 0 12px rgba(255,217,59,0.5);margin:0 auto;" alt="Card Badge" />`
    : emoji;
  const title  = cardData.title       || 'HAPPY 19TH BIRTHDAY!';
  const desc   = cardData.description || 'Special memory from the Prize Machine ✨';
  const author = cardData.author      || 'Secret Admirer';
  const rarity = RARITIES[cardData.rarity] || RARITIES.RARE;
  const bg     = cardData.bg          || rarity.bg;

  // Only allocate sample media for default built-in cards, keep contributor cards genuine
  let mediaItems = Array.isArray(cardData.mediaItems) ? cardData.mediaItems : [];
  if (mediaItems.length === 0 && (author === 'Birthday Crew' || author === 'Secret Admirer')) {
    mediaItems = getRandomMediaForCard(2);
  }

  const overlay = document.createElement('div');
  overlay.id = 'sc-overlay';
  overlay.innerHTML = /* html */`
    <div id="sc-hint">← SCRATCH THE CARD TO REVEAL →</div>
    <div id="sc-wrapper">
      <div id="sc-face" style="background:${bg}">
        <div id="sc-rarity-badge" style="color:${rarity.color}">${rarity.label}</div>
        <div id="sc-emoji">${badgeHTML}</div>
        <div id="sc-title">${title}</div>
        <div id="sc-author">From: ${author} 💌</div>
        <div id="sc-desc">${desc}</div>

        <!-- Multi-Media Gallery Box -->
        <div id="sc-media-box">
          ${mediaItems.map((m, idx) => {
            const srcUrl = m.dataUrl || m.url;
            if (!srcUrl) return '';
            if (m.type === 'audio') {
              return /* html */`
                <div class="sc-voice-player">
                  <button type="button" class="sc-play-btn" id="sc-audio-btn-${idx}">▶</button>
                  <div style="flex:1">
                    <div style="font-size:0.26rem; color:#ffd93b;">🎙️ VOICE WISH</div>
                    <div style="font-size:0.22rem; color:#fff;">${m.caption || 'Tap to play voice note'}</div>
                  </div>
                  <audio id="sc-audio-el-${idx}" src="${srcUrl}"></audio>
                </div>
              `;
            }
            if (m.type === 'video') {
              return /* html */`
                <div class="sc-media-item">
                  <video class="sc-media-thumb" src="${srcUrl}" controls></video>
                  <div class="sc-media-caption">${m.caption || 'Video memory 🎥'}</div>
                </div>
              `;
            }
            return /* html */`
              <div class="sc-media-item">
                <img class="sc-media-thumb" src="${srcUrl}" alt="Memory" />
                <div class="sc-media-caption">${m.caption || (mediaItems.length > 1 ? `Photo ${idx + 1}` : 'Birthday photo 📸')}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <canvas id="sc-canvas"></canvas>
    </div>

    <button id="sc-revealed-btn">✨ COLLECT TO ALBUM</button>
  `;
  document.body.appendChild(overlay);

  // Bind audio players
  mediaItems.forEach((m, idx) => {
    if (m.type === 'audio') {
      const btn = document.getElementById(`sc-audio-btn-${idx}`);
      const audioEl = document.getElementById(`sc-audio-el-${idx}`);
      btn?.addEventListener('click', () => {
        if (audioEl) {
          if (audioEl.paused) {
            audioEl.play();
            btn.textContent = '⏸';
            audioEl.onended = () => { btn.textContent = '▶'; };
          } else {
            audioEl.pause();
            btn.textContent = '▶';
          }
        } else {
          // Play celebratory sound if procedural
          SFX.coin();
          btn.textContent = '🎵';
          setTimeout(() => { btn.textContent = '▶'; }, 1500);
        }
      });
    }
  });

  // Setup Scratch Canvas
  const canvas = document.getElementById('sc-canvas');
  const CARD_W = canvas.parentElement.clientWidth || 300;
  const CARD_H = canvas.parentElement.clientHeight || 420;
  canvas.width  = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  // Fill with shimmering metallic silver scratch layer
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0,   '#8a8a8a');
  grad.addColorStop(0.25,'#d6d6d6');
  grad.addColorStop(0.5, '#b0b0b0');
  grad.addColorStop(0.75,'#cfcfcf');
  grad.addColorStop(1,   '#828282');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Scratch texture specks
  ctx.fillStyle = 'rgba(60,60,60,0.1)';
  for (let i = 0; i < 900; i++) {
    ctx.beginPath();
    ctx.arc(Math.random()*CARD_W, Math.random()*CARD_H, Math.random()*2, 0, Math.PI*2);
    ctx.fill();
  }

  // Glitter stars on scratch surface
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(Math.random()*CARD_W, Math.random()*CARD_H, 2, 2);
  }

  // "SCRATCH HERE" banner
  ctx.fillStyle = 'rgba(40,40,40,0.3)';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SCRATCH TO REVEAL ✨', CARD_W/2, CARD_H/2 + 5);

  ctx.globalCompositeOperation = 'destination-out';

  let isScratching = false;
  let revealed = false;
  const SCRATCH_R = 26;

  function scratch(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_R, 0, Math.PI * 2);
    ctx.fill();
    SFX.scratch();
  }

  function checkReveal() {
    if (revealed) return;
    const pct = getScratchedPercent(ctx, CARD_W, CARD_H);
    if (pct >= 0.58) fullReveal();
  }

  function fullReveal() {
    revealed = true;
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    const hint = document.getElementById('sc-hint');
    if (hint) hint.style.display = 'none';
    const btn = document.getElementById('sc-revealed-btn');
    if (btn) btn.classList.add('visible');
    SFX.unlock();
    burstConfetti();
  }

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); isScratching = true;
    const r = canvas.getBoundingClientRect();
    scratch(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isScratching) return;
    const r = canvas.getBoundingClientRect();
    for (const t of e.touches) {
      scratch(t.clientX - r.left, t.clientY - r.top);
    }
    checkReveal();
  }, { passive: false });

  canvas.addEventListener('touchend', () => { isScratching = false; });

  // Mouse
  canvas.addEventListener('mousedown', (e) => {
    isScratching = true;
    const r = canvas.getBoundingClientRect();
    scratch(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!isScratching) return;
    const r = canvas.getBoundingClientRect();
    scratch(e.clientX - r.left, e.clientY - r.top);
    checkReveal();
  });
  canvas.addEventListener('mouseup', () => { isScratching = false; });

  // Double tap to reveal fallback
  overlay.addEventListener('dblclick', fullReveal);

  // Done button
  document.getElementById('sc-revealed-btn')?.addEventListener('click', () => {
    overlay.remove();
    onDone?.(cardData);
  });
}
