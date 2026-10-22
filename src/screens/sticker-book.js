/**
 * src/screens/sticker-book.js — Muski's WhatsApp Sticker Corner 🌸
 *
 * Displays all WhatsApp stickers and custom stickers uploaded by friends and contributors!
 * Interactive sticker wall with tap zoom, contributor signatures, reactions, and sound effects.
 */

import { getAllStickers } from '@/data/contribute-store.js';
import { SFX } from '@/engine/sound.js';

function injectCSS() {
  if (document.getElementById('sticker-wall-css')) return;
  const s = document.createElement('style');
  s.id = 'sticker-wall-css';
  s.textContent = /* css */`
    #st-screen {
      position: fixed; inset: 0;
      background: radial-gradient(circle at top, #240a35 0%, #0d041c 100%);
      display: flex; flex-direction: column;
      font-family: 'Press Start 2P', monospace;
      overflow: hidden;
      animation: st-in 0.3s ease;
    }
    @keyframes st-in { from { opacity:0; transform:scale(0.98); } to { opacity:1; transform:scale(1); } }

    /* Top bar */
    #st-topbar {
      background: linear-gradient(90deg, #180838, #300a40, #180838);
      border-bottom: 2.5px solid #ff6eb4;
      padding: 12px 14px;
      padding-top: max(12px, env(safe-area-inset-top,12px));
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    #st-back {
      background: rgba(69,9,32,0.8);
      border: 1.5px solid #A53860; border-radius: 6px;
      width: 36px; height: 36px; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    #st-back:active { transform: scale(0.9); }
    #st-title {
      font-size: clamp(0.36rem, 2.7vw, 0.5rem);
      color: #ffd93b;
      letter-spacing: 0.04em;
    }
    #st-add-btn {
      margin-left: auto;
      background: linear-gradient(135deg, #ff6eb4, #a53860);
      border: 1.5px solid #ffd93b;
      border-radius: 6px;
      color: #fff;
      font-family: inherit;
      font-size: 0.28rem;
      padding: 8px 12px;
      cursor: pointer;
      text-decoration: none;
      display: flex; align-items: center; gap: 4px;
    }

    /* Sticker corkboard area */
    #st-board {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px 32px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      align-content: start;
    }

    .st-item {
      background: rgba(255,255,255,0.06);
      border: 2px dashed rgba(255,110,180,0.4);
      border-radius: 12px;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      position: relative;
      transition: transform 0.15s, border-color 0.15s;
      min-height: 110px;
    }
    .st-item:hover, .st-item:active {
      transform: scale(1.05) rotate(-2deg);
      border-color: #ffd93b;
      background: rgba(255,255,255,0.12);
    }

    .st-sticker-img {
      max-width: 72px;
      max-height: 72px;
      object-fit: contain;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    }
    .st-sticker-emoji {
      font-size: 3rem;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    }

    .st-item-caption {
      font-size: 0.22rem;
      color: rgba(255,255,255,0.85);
      text-align: center;
      line-height: 1.4;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-item-author {
      font-size: 0.18rem;
      color: #ffd93b;
    }

    /* Modal for enlarged sticker */
    #st-modal {
      display: none;
      position: fixed; inset: 0; z-index: 600;
      background: rgba(8,3,20,0.92);
      align-items: center; justify-content: center;
      padding: 20px;
    }
    #st-modal.visible { display: flex; }
    #st-modal-card {
      background: linear-gradient(145deg, #2a0b38, #180524);
      border: 3px solid #ffd93b;
      border-radius: 16px;
      padding: 24px 20px;
      max-width: 320px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      text-align: center;
      box-shadow: 0 0 40px rgba(255,110,180,0.4);
    }
    #st-modal-img {
      max-width: 150px;
      max-height: 150px;
      object-fit: contain;
    }
    #st-modal-emoji { font-size: 5rem; }
    #st-modal-caption {
      font-size: 0.38rem;
      color: #fff;
      line-height: 1.6;
    }
    #st-modal-author {
      font-size: 0.28rem;
      color: #ffd93b;
    }

    /* Reaction bar */
    .st-react-bar {
      display: flex; gap: 10px;
      margin-top: 6px;
    }
    .st-react-btn {
      font-size: 1.3rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .st-react-btn:active { transform: scale(1.2); }

    #st-modal-close {
      background: rgba(69,9,32,0.9);
      border: 1.5px solid #A53860;
      border-radius: 6px;
      color: #FFA5AB;
      font-family: inherit;
      font-size: 0.32rem;
      padding: 10px 20px;
      cursor: pointer;
      margin-top: 6px;
    }
  `;
  document.head.appendChild(s);
}

export function mountStickerBook(container, { onHome } = {}) {
  injectCSS();

  const stickers = getAllStickers();

  container.innerHTML = /* html */`
    <div id="st-screen">
      <div id="st-topbar">
        <button id="st-back">🏠</button>
        <div id="st-title">🌸 STICKER CORNER</div>
        <a id="st-add-btn" href="/contribute" target="_blank">+ ADD</a>
      </div>

      <div style="padding:10px 14px 4px; font-size:0.26rem; color:#FFA5AB; line-height:1.7; text-align:center;">
        WhatsApp stickers of Muski from friends & contributors! Tap to pop! ✨
      </div>

      <div id="st-board">
        ${stickers.map((st, idx) => `
          <div class="st-item" data-idx="${idx}">
            ${st.url
              ? `<img class="st-sticker-img" src="${st.url}" alt="${st.caption || 'Sticker'}" />`
              : `<div class="st-sticker-emoji">${st.emoji || '🌸'}</div>`
            }
            <div class="st-item-caption">${st.caption || 'Muski Sticker'}</div>
            <div class="st-item-author">By: ${st.author || 'Friend'}</div>
          </div>
        `).join('')}
      </div>

      <!-- Detail Modal -->
      <div id="st-modal">
        <div id="st-modal-card">
          <div id="st-modal-display"></div>
          <div id="st-modal-caption"></div>
          <div id="st-modal-author"></div>

          <div style="font-size:0.24rem; color:rgba(255,255,255,0.6); margin-top:4px;">REACT:</div>
          <div class="st-react-bar">
            <button class="st-react-btn" data-r="❤️">❤️</button>
            <button class="st-react-btn" data-r="🎂">🎂</button>
            <button class="st-react-btn" data-r="✨">✨</button>
            <button class="st-react-btn" data-r="👑">👑</button>
          </div>

          <button id="st-modal-close">← BACK</button>
        </div>
      </div>
    </div>
  `;

  // Back
  document.getElementById('st-back')?.addEventListener('click', () => onHome?.());

  // Click Sticker → Modal
  document.getElementById('st-board')?.addEventListener('click', (e) => {
    const item = e.target.closest('.st-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    const st = stickers[idx];
    if (!st) return;

    SFX.jump();

    const display = document.getElementById('st-modal-display');
    if (st.url) {
      display.innerHTML = `<img id="st-modal-img" src="${st.url}" alt="" />`;
    } else {
      display.innerHTML = `<div id="st-modal-emoji">${st.emoji || '🌸'}</div>`;
    }

    document.getElementById('st-modal-caption').textContent = st.caption || 'Muski Sticker ✨';
    document.getElementById('st-modal-author').textContent  = `Sent with love by ${st.author || 'Friend'} ❤️`;

    document.getElementById('st-modal').classList.add('visible');
  });

  // Reaction buttons
  document.querySelectorAll('.st-react-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.coin();
      btn.style.transform = 'scale(1.3)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    });
  });

  // Close modal
  document.getElementById('st-modal-close')?.addEventListener('click', () => {
    document.getElementById('st-modal')?.classList.remove('visible');
  });
  document.getElementById('st-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'st-modal') e.target.classList.remove('visible');
  });
}
