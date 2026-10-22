/**
 * src/screens/card-album.js — Muski's Expanded Multi-Media Card Collection 📖
 *
 * Displays all cards collected by Muski:
 * - 24+ built-in cards + contributor submitted cards
 * - Multi-media details: photos, voice notes, video clips, and heartfelt messages
 */

import { getCardsUnlocked } from '@/data/local-state.js';
import { getAllCards, getRandomMediaForCard, syncCloudContributions } from '@/data/contribute-store.js';

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
      width: min(360px, 94vw);
      max-height: 88vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
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
      gap: 12px;
      margin-top: 8px;
    }
    .album-media-header {
      font-size: 0.26rem;
      color: #ffd93b;
      letter-spacing: 0.05em;
      text-align: center;
      padding-bottom: 4px;
      border-bottom: 1px dashed rgba(255,217,59,0.3);
    }
    .album-media-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }
    .album-media-card {
      width: 100%;
      background: rgba(0,0,0,0.5);
      border: 1.5px solid rgba(255,217,59,0.35);
      border-radius: 10px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    }
    .album-media-badge {
      font-size: 0.2rem;
      color: #ffd93b;
      background: rgba(69,9,32,0.85);
      border: 1px solid rgba(255,217,59,0.3);
      border-radius: 4px;
      padding: 2px 6px;
      align-self: flex-start;
    }
    .album-media-photo {
      width: 100%;
      max-height: 380px;
      object-fit: contain;
      border-radius: 6px;
      background: #000;
      cursor: zoom-in;
      display: block;
    }
    .album-modal-voice {
      background: linear-gradient(135deg, #1f0b29, #380d38);
      border: 1.5px solid #ff6eb4;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      user-select: none;
      transition: transform 0.1s, border-color 0.2s;
    }
    .album-modal-voice:active {
      transform: scale(0.98);
    }
    .album-modal-voice.playing {
      border-color: #5effa3;
      box-shadow: 0 0 15px rgba(94,255,163,0.35);
    }

    /* Lightbox Fullscreen Zoom Overlay */
    #album-lightbox {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.92);
      display: none; align-items: center; justify-content: center;
      padding: 12px;
      cursor: zoom-out;
    }
    #album-lightbox.active { display: flex; }
    #album-lightbox img {
      max-width: 96vw; max-height: 94vh;
      object-fit: contain;
      border-radius: 8px;
      border: 2px solid #ffd93b;
      box-shadow: 0 0 30px rgba(255,217,59,0.4);
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

  function renderView() {
    const allCards = getAllCards();
    const collectedIds = new Set(getCardsUnlocked());

    // Automatically ensure all contributor cards are unlocked so Muski can read them!
    allCards.forEach(c => {
      const isContrib = (c.author && c.author !== 'Birthday Crew' && c.author !== 'Secret Admirer') ||
                        c.slotId?.startsWith('C_') || c.slotId?.startsWith('U_');
      if (isContrib) {
        collectedIds.add(c.slotId || c.id);
        if (c.id) collectedIds.add(c.id);
      }
    });

    // Sort: collected first, then by rarity
    const sorted = [...allCards].sort((a, b) => {
      const aKey = a.slotId || a.id;
      const bKey = b.slotId || b.id;
      const aHas = collectedIds.has(aKey) || collectedIds.has(a.id);
      const bHas = collectedIds.has(bKey) || collectedIds.has(b.id);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return (RARITY_ORDER[a.rarity] ?? 2) - (RARITY_ORDER[b.rarity] ?? 2);
    });

    const collectedCount = sorted.filter(c => collectedIds.has(c.slotId || c.id) || collectedIds.has(c.id)).length;
    const mythicCount    = sorted.filter(c => (collectedIds.has(c.slotId || c.id) || collectedIds.has(c.id)) && c.rarity === 'MYTHIC').length;
    const legendaryCount = sorted.filter(c => (collectedIds.has(c.slotId || c.id) || collectedIds.has(c.id)) && c.rarity === 'LEGENDARY').length;
    const rareCount      = sorted.filter(c => (collectedIds.has(c.slotId || c.id) || collectedIds.has(c.id)) && c.rarity === 'RARE').length;
    const commonCount    = sorted.filter(c => (collectedIds.has(c.slotId || c.id) || collectedIds.has(c.id)) && c.rarity === 'COMMON').length;

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
          ${sorted.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align:center; padding: 40px 16px; background: rgba(0,0,0,0.45); border: 2px dashed #ff6eb4; border-radius: 14px; margin-top: 10px;">
              <div style="font-size: 2.8rem; margin-bottom: 12px;">💌</div>
              <div style="font-size: 0.42rem; color: #ffd93b; line-height: 1.8;">WAITING FOR WISHES!</div>
              <div style="font-size: 0.28rem; color: #FFA5AB; line-height: 1.8; margin-top: 8px;">
                Friends & family can write wishes, add photos & voice notes at <strong>/contribute</strong>!
              </div>
            </div>
          ` : sorted.map(card => {
            const cardKey = card.slotId || card.id;
            const isContrib = (card.author && card.author !== 'Birthday Crew' && card.author !== 'Secret Admirer') ||
                              card.slotId?.startsWith('C_') || card.slotId?.startsWith('U_');
            const has = isContrib || collectedIds.has(cardKey) || collectedIds.has(card.id);
            const rl = RARITY_LABEL[card.rarity] || RARITY_LABEL.RARE;
            const isImg = typeof card.emoji === 'string' && (card.emoji.startsWith('data:') || card.emoji.startsWith('http') || card.emoji.startsWith('/'));
            const emojiHtml = isImg
              ? `<img src="${card.emoji}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid #ffd93b;" alt="Badge" />`
              : card.emoji;
            return /* html */`
              <div class="album-card ${has ? 'collected' : 'empty'}" data-card-id="${cardKey}"
                   style="${has ? `background:${card.bg}` : ''}">
                <div class="album-card-emoji">${emojiHtml}</div>
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

        <!-- Fullscreen Zoom Lightbox -->
        <div id="album-lightbox">
          <img id="album-lightbox-img" src="" alt="Zoom" />
        </div>
      </div>
    `;

    bindAlbumEvents();
  }

  function bindAlbumEvents() {
    // Back button
    document.getElementById('album-back')?.addEventListener('click', () => onHome?.());

    // Tap Card → Instant Responsive Feedback (No 5-click delay)
    document.getElementById('album-grid')?.addEventListener('click', (e) => {
      const tile = e.target.closest('.album-card');
      if (!tile) return;
      const cid = tile.dataset.cardId;
      const currentAll = getAllCards();
      const card = currentAll.find(c => (c.slotId || c.id) === cid || c.id === cid);
      if (!card) return;

      const modal = document.getElementById('album-detail');
      const detailCard = document.getElementById('album-detail-card');
      const rarityEl = document.getElementById('album-detail-rarity');
      const mediaContainer = document.getElementById('album-modal-media');
      if (!modal || !detailCard || !rarityEl || !mediaContainer) return;

      const isLocked = tile.classList.contains('empty');

      if (isLocked) {
        // Locked card preview
        detailCard.style.background = 'linear-gradient(135deg, #1f082e, #0c0218)';
        document.getElementById('album-detail-emoji').textContent = '🔒';
        document.getElementById('album-detail-title').textContent = card.title || 'LOCKED REWARD CARD';
        document.getElementById('album-detail-author').textContent = 'Prize Machine Reward';
        document.getElementById('album-detail-desc').textContent = 'Play the arcade games to earn coins, then spin the Slot Machine to unlock this collectible card!';
        rarityEl.textContent = '🔒 LOCKED';
        rarityEl.style.color = '#FFA5AB';
        rarityEl.style.background = 'rgba(0,0,0,0.5)';
        mediaContainer.innerHTML = '';
        modal.classList.add('visible');
        return;
      }

      // Unlocked / Contributor card
      detailCard.style.background = card.bg;
      const detailEmojiEl = document.getElementById('album-detail-emoji');
      if (typeof card.emoji === 'string' && (card.emoji.startsWith('data:') || card.emoji.startsWith('http') || card.emoji.startsWith('/'))) {
        detailEmojiEl.innerHTML = `<img src="${card.emoji}" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:2.5px solid #ffd93b;box-shadow:0 0 14px rgba(255,217,59,0.5);" alt="Badge" />`;
      } else {
        detailEmojiEl.textContent = card.emoji || '🎂';
      }

      document.getElementById('album-detail-title').textContent  = card.title;
      document.getElementById('album-detail-author').textContent = card.author ? `From: ${card.author} 💌` : '';
      document.getElementById('album-detail-desc').textContent   = card.description;

      const rl = RARITY_LABEL[card.rarity] || RARITY_LABEL.RARE;
      rarityEl.textContent = rl.label;
      rarityEl.style.color = rl.color;
      rarityEl.style.background = 'rgba(0,0,0,0.3)';

      // Multi-Media: Strictly render contributor's real photos/voice notes
      const validMedia = (card.mediaItems || []).filter(m => (m.dataUrl || m.url));

      if (validMedia.length === 0) {
        mediaContainer.innerHTML = '';
      } else {
        mediaContainer.innerHTML = /* html */`
          ${validMedia.length > 1 ? `<div class="album-media-header">📸 ATTACHED PHOTOS (${validMedia.length})</div>` : ''}
          <div class="album-media-list">
            ${validMedia.map((m, idx) => {
              const srcUrl = m.dataUrl || m.url;
              if (m.type === 'audio') {
                return /* html */`
                  <div class="album-modal-voice" id="modal-voice-box-${idx}">
                    <button type="button" class="sc-play-btn" id="modal-audio-btn-${idx}">▶</button>
                    <div style="flex:1">
                      <div style="font-size:0.26rem; color:#ffd93b; font-weight:bold;">🎙️ VOICE WISH</div>
                      <div id="modal-audio-sub-${idx}" style="font-size:0.22rem; color:#fff;">${m.caption || 'Tap to play voice note'}</div>
                    </div>
                    <audio id="modal-audio-el-${idx}" src="${srcUrl}" preload="auto"></audio>
                  </div>
                `;
              }
              if (m.type === 'video') {
                return /* html */`
                  <div class="album-media-card">
                    <video src="${srcUrl}" controls style="width:100%; border-radius:8px;"></video>
                    ${m.caption ? `<div style="font-size:0.22rem; color:rgba(255,255,255,0.7); padding:4px;">${m.caption}</div>` : ''}
                  </div>
                `;
              }
              return /* html */`
                <div class="album-media-card">
                  ${validMedia.length > 1 ? `<div class="album-media-badge">PHOTO ${idx + 1} OF ${validMedia.length}</div>` : ''}
                  <img src="${srcUrl}" alt="Photo ${idx + 1}" class="album-media-photo" data-zoom-src="${srcUrl}" />
                  ${m.caption ? `<div style="font-size:0.22rem; color:rgba(255,255,255,0.8); padding:4px;">${m.caption}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      // Audio handlers
      validMedia.forEach((m, idx) => {
        if (m.type === 'audio') {
          const box = document.getElementById(`modal-voice-box-${idx}`);
          const btn = document.getElementById(`modal-audio-btn-${idx}`);
          const audioEl = document.getElementById(`modal-audio-el-${idx}`);
          const sub = document.getElementById(`modal-audio-sub-${idx}`);

          const togglePlay = (e) => {
            e.stopPropagation();
            if (!audioEl) return;
            if (audioEl.paused) {
              document.querySelectorAll('audio').forEach(a => { if (a !== audioEl) a.pause(); });
              document.querySelectorAll('.sc-play-btn').forEach(b => { if (b !== btn) b.textContent = '▶'; });
              document.querySelectorAll('.album-modal-voice').forEach(p => p.classList.remove('playing'));
              audioEl.currentTime = 0;
              audioEl.play().then(() => {
                btn.textContent = '⏸';
                box?.classList.add('playing');
                if (sub) sub.textContent = '🔊 Playing Voice Wish...';
              }).catch(err => {
                console.warn('[audio-play-error]', err);
                btn.textContent = '▶';
                if (sub) sub.textContent = 'Tap to play voice note';
              });
              audioEl.onended = () => {
                btn.textContent = '▶';
                box?.classList.remove('playing');
                if (sub) sub.textContent = m.caption || 'Tap to play again';
              };
            } else {
              audioEl.pause();
              btn.textContent = '▶';
              box?.classList.remove('playing');
              if (sub) sub.textContent = 'Paused (Tap to resume)';
            }
          };

          box?.addEventListener('click', togglePlay);
          btn?.addEventListener('click', togglePlay);
        }
      });

      modal.classList.add('visible');
    });

    // Close modal
    document.getElementById('album-detail-close')?.addEventListener('click', () => {
      document.getElementById('album-detail')?.classList.remove('visible');
    });
    document.getElementById('album-detail')?.addEventListener('click', (e) => {
      if (e.target.id === 'album-detail') e.target.classList.remove('visible');
    });

    // Lightbox zoom handlers
    document.getElementById('album-modal-media')?.addEventListener('click', (e) => {
      const img = e.target.closest('.album-media-photo');
      if (img && img.dataset.zoomSrc) {
        const lb = document.getElementById('album-lightbox');
        const lbImg = document.getElementById('album-lightbox-img');
        if (lb && lbImg) {
          lbImg.src = img.dataset.zoomSrc;
          lb.classList.add('active');
        }
      }
    });

    document.getElementById('album-lightbox')?.addEventListener('click', () => {
      document.getElementById('album-lightbox')?.classList.remove('active');
    });
  }

  // Initial render
  renderView();

  // Background Cloud Sync — seamlessly updates cards when cloud response arrives
  syncCloudContributions().then(() => {
    if (document.getElementById('album-grid')) {
      renderView();
    }
  }).catch(() => {});
}
