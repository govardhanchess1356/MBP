/**
 * src/screens/card-album.js — Muski's Expanded Multi-Media Card Collection 📖
 *
 * Displays all cards collected by Muski:
 * - 24+ built-in cards + contributor submitted cards
 * - Multi-media details: photos, voice notes, video clips, and heartfelt messages
 */

import { getCardsUnlocked } from '@/data/local-state.js';
import { getAllCards, getRandomMediaForCard } from '@/data/contribute-store.js';

const RARITY_ORDER = { MYTHIC: 0, LEGENDARY: 1, RARE: 2, COMMON: 3 };
const RARITY_LABEL = {
  MYTHIC:    { label: '👑 MYTHIC',    color: '#ff6eb4' },
  LEGENDARY: { label: '✨ LEGENDARY', color: '#ffd93b' },
  RARE:      { label: '💜 RARE',      color: '#c9a0ff' },
  COMMON:    { label: '🌸 COMMON',    color: '#FFA5AB' },
};

function injectCSS() {
  if (document.getElementById('album-full-css')) return;
  const s = document.createElement('style');
  s.id = 'album-full-css';
  s.textContent = /* css */`
    #album-screen {
      position: fixed; inset: 0;
      background: radial-gradient(circle at top, #140628 0%, #06021a 100%);
      display: flex; flex-direction: column;
      font-family: 'Press Start 2P', monospace;
      overflow: hidden;
      animation: album-in 0.3s ease;
    }
    @keyframes album-in { from { opacity:0; } to { opacity:1; } }

    /* Top bar */
    #album-topbar {
      background: linear-gradient(90deg, #12063a, #200840, #12063a);
      border-bottom: 2.5px solid #A53860;
      padding: 12px 14px;
      padding-top: max(12px, env(safe-area-inset-top,12px));
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    #album-back {
      background: rgba(69,9,32,0.8);
      border: 1.5px solid #A53860; border-radius: 6px;
      width: 36px; height: 36px; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    #album-back:active { transform: scale(0.9); }
    #album-title {
      font-size: clamp(0.38rem, 2.8vw, 0.52rem);
      color: #ffd93b;
      letter-spacing: 0.04em;
    }
    #album-count {
      margin-left: auto;
      font-size: 0.34rem;
      color: #c9a0ff;
    }

    /* Stats bar */
    #album-stats {
      background: rgba(18,6,58,0.85);
      border-bottom: 1.5px solid rgba(165,56,96,0.3);
      padding: 8px 12px;
      display: flex; gap: 12px; align-items: center;
      overflow-x: auto;
      flex-shrink: 0;
    }
    .album-stat {
      font-size: 0.26rem; color: rgba(249,219,189,0.7);
      display: flex; gap: 5px; align-items: center;
      white-space: nowrap;
    }
    .album-stat span { color: #ffd93b; font-weight: bold; }

    /* Grid */
    #album-grid {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 12px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      align-content: start;
    }

    /* Card tile */
    .album-card {
      aspect-ratio: 2/3;
      border-radius: 10px;
      border: 2px solid rgba(165,56,96,0.4);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 4px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      padding: 6px 4px;
      text-align: center;
    }
    .album-card:active { transform: scale(0.93); }
    .album-card.collected {
      border-color: rgba(255,217,59,0.5);
      box-shadow: 0 0 12px rgba(255,217,59,0.2);
    }
    .album-card.empty {
      background: rgba(6,2,26,0.95);
      border-color: rgba(165,56,96,0.2);
    }

    .album-card-emoji { font-size: 1.8rem; }
    .album-card.empty .album-card-emoji { filter: grayscale(1) opacity(0.2); }

    .album-card-label {
      font-size: 0.22rem; color: #fff; text-align: center;
      line-height: 1.4;
      max-height: 2.8em;
      overflow: hidden;
    }
    .album-card.empty .album-card-label { color: rgba(255,255,255,0.15); }

    .album-card-author {
      font-size: 0.18rem; color: #ffd93b;
    }

    .album-card-rarity {
      font-size: 0.18rem;
      padding: 2px 4px;
      border-radius: 4px;
      background: rgba(0,0,0,0.4);
      margin-top: 2px;
    }

    .album-lock {
      position: absolute; top: 6px; right: 6px;
      font-size: 0.7rem; opacity: 0.25;
    }

    /* Detail modal */
    #album-detail {
      display: none;
      position: fixed; inset: 0; z-index: 600;
      background: rgba(6,2,26,0.95);
      align-items: center; justify-content: center;
      padding: 16px;
      animation: album-in 0.2s ease;
    }
    #album-detail.visible { display: flex; }
    #album-detail-card {
      width: min(340px, 92vw);
      max-height: 84vh;
      overflow-y: auto;
      border-radius: 16px;
      padding: 20px 16px;
      display: flex; flex-direction: column;
      align-items: center; gap: 12px;
      box-shadow: 0 0 45px rgba(200,160,255,0.4);
      border: 2px solid rgba(255,255,255,0.25);
    }
    #album-detail-emoji { font-size: 3.2rem; }
    #album-detail-title {
      font-size: 0.44rem; color: #fff;
      text-align: center; line-height: 1.6;
    }
    #album-detail-author {
      font-size: 0.28rem; color: #ffd93b;
    }
    #album-detail-desc {
      font-size: 0.32rem; color: rgba(255,255,255,0.9);
      text-align: center; line-height: 1.8;
      background: rgba(0,0,0,0.3);
      padding: 10px;
      border-radius: 8px;
      width: 100%;
    }
    #album-detail-rarity { font-size: 0.28rem; padding: 4px 12px; border-radius: 20px; }

    /* Media Gallery inside modal */
    .album-modal-media {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
    }
    .album-modal-media img {
      width: 100%;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      max-height: 160px;
      object-fit: cover;
    }
    .album-modal-voice {
      background: rgba(0,0,0,0.4);
      border: 1.5px solid #ff6eb4;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #album-detail-close {
      margin-top: 8px;
      background: rgba(69,9,32,0.9);
      border: 1.5px solid #A53860; border-radius: 6px;
      color: #FFA5AB; font-family: 'Press Start 2P', monospace;
      font-size: 0.32rem; padding: 10px 22px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(s);
}

export function mountCardAlbum(container, { onHome } = {}) {
  injectCSS();

  const allCards = getAllCards();
  const collectedIds = new Set(getCardsUnlocked());

  // Sort: collected first, then by rarity
  const sorted = [...allCards].sort((a, b) => {
    const aHas = collectedIds.has(a.slotId || a.id);
    const bHas = collectedIds.has(b.slotId || b.id);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return (RARITY_ORDER[a.rarity] ?? 2) - (RARITY_ORDER[b.rarity] ?? 2);
  });

  const collectedCount = sorted.filter(c => collectedIds.has(c.slotId || c.id)).length;
  const mythicCount    = sorted.filter(c => collectedIds.has(c.slotId || c.id) && c.rarity === 'MYTHIC').length;
  const legendaryCount = sorted.filter(c => collectedIds.has(c.slotId || c.id) && c.rarity === 'LEGENDARY').length;
  const rareCount      = sorted.filter(c => collectedIds.has(c.slotId || c.id) && c.rarity === 'RARE').length;
  const commonCount    = sorted.filter(c => collectedIds.has(c.slotId || c.id) && c.rarity === 'COMMON').length;

  container.innerHTML = /* html */`
    <div id="album-screen">
      <div id="album-topbar">
        <button id="album-back">🏠</button>
        <div id="album-title">📖 CARD ALBUM</div>
        <div id="album-count">${collectedCount}/${allCards.length}</div>
      </div>

      <div id="album-stats">
        <div class="album-stat">👑 MYTHIC <span>${mythicCount}</span></div>
        <div class="album-stat">✨ LEGENDARY <span>${legendaryCount}</span></div>
        <div class="album-stat">💜 RARE <span>${rareCount}</span></div>
        <div class="album-stat">🌸 COMMON <span>${commonCount}</span></div>
      </div>

      <div id="album-grid">
        ${sorted.map(card => {
          const cardKey = card.slotId || card.id;
          const has = collectedIds.has(cardKey);
          const rl = RARITY_LABEL[card.rarity] || RARITY_LABEL.RARE;
          return /* html */`
            <div class="album-card ${has ? 'collected' : 'empty'}" data-card-id="${cardKey}"
                 style="${has ? `background:${card.bg}` : ''}">
              <div class="album-card-emoji">${card.emoji}</div>
              <div class="album-card-label">${has ? card.title : '???'}</div>
              ${has && card.author ? `<div class="album-card-author">${card.author}</div>` : ''}
              ${has ? `<div class="album-card-rarity" style="color:${rl.color}">${rl.label}</div>` : ''}
              ${!has ? '<div class="album-lock">🔒</div>' : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Detail Modal -->
      <div id="album-detail">
        <div id="album-detail-card">
          <div id="album-detail-emoji"></div>
          <div id="album-detail-title"></div>
          <div id="album-detail-author"></div>
          <div id="album-detail-desc"></div>
          <div id="album-detail-rarity"></div>
          <div class="album-modal-media" id="album-modal-media"></div>
          <button id="album-detail-close">← CLOSE</button>
        </div>
      </div>
    </div>
  `;

  // Back
  document.getElementById('album-back')?.addEventListener('click', () => onHome?.());

  // Tap Card → Show Multi-Media Modal
  document.getElementById('album-grid')?.addEventListener('click', (e) => {
    const tile = e.target.closest('.album-card');
    if (!tile || tile.classList.contains('empty')) return;
    const cid = tile.dataset.cardId;
    const card = allCards.find(c => (c.slotId || c.id) === cid);
    if (!card) return;

    const rl = RARITY_LABEL[card.rarity] || RARITY_LABEL.RARE;
    const modal = document.getElementById('album-detail');
    const detailCard = document.getElementById('album-detail-card');
    if (!modal || !detailCard) return;

    detailCard.style.background = card.bg;
    document.getElementById('album-detail-emoji').textContent  = card.emoji;
    document.getElementById('album-detail-title').textContent  = card.title;
    document.getElementById('album-detail-author').textContent = card.author ? `From: ${card.author} 💌` : '';
    document.getElementById('album-detail-desc').textContent   = card.description;

    const rarityEl = document.getElementById('album-detail-rarity');
    rarityEl.textContent = rl.label;
    rarityEl.style.color = rl.color;
    rarityEl.style.background = 'rgba(0,0,0,0.3)';

    // Multi-Media
    const mediaContainer = document.getElementById('album-modal-media');
    let mediaItems = card.mediaItems;
    if (!mediaItems || mediaItems.length === 0) {
      mediaItems = getRandomMediaForCard(2);
    }

    mediaContainer.innerHTML = mediaItems.map((m, idx) => {
      if (m.type === 'audio') {
        return /* html */`
          <div class="album-modal-voice">
            <button type="button" class="sc-play-btn" id="modal-audio-btn-${idx}">▶</button>
            <div style="flex:1">
              <div style="font-size:0.24rem; color:#ffd93b;">🎙️ VOICE WISH</div>
              <div style="font-size:0.2rem; color:#fff;">${m.caption || 'Tap to play'}</div>
            </div>
            ${m.url ? `<audio id="modal-audio-el-${idx}" src="${m.url}"></audio>` : ''}
          </div>
        `;
      }
      if (m.type === 'video') {
        return /* html */`
          <div>
            <video src="${m.url}" controls style="width:100%; border-radius:8px;"></video>
            <div style="font-size:0.22rem; color:rgba(255,255,255,0.7); padding:4px;">${m.caption || ''}</div>
          </div>
        `;
      }
      return /* html */`
        <div>
          <img src="${m.url || '/images/arcade-bg.png'}" alt="Memory" />
          <div style="font-size:0.22rem; color:rgba(255,255,255,0.7); padding:4px;">${m.caption || ''}</div>
        </div>
      `;
    }).join('');

    // Audio handlers
    mediaItems.forEach((m, idx) => {
      if (m.type === 'audio') {
        const btn = document.getElementById(`modal-audio-btn-${idx}`);
        const audioEl = document.getElementById(`modal-audio-el-${idx}`);
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
          }
        });
      }
    });

    modal.classList.add('visible');
  });

  document.getElementById('album-detail-close')?.addEventListener('click', () => {
    document.getElementById('album-detail')?.classList.remove('visible');
  });
  document.getElementById('album-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'album-detail') e.target.classList.remove('visible');
  });
}
