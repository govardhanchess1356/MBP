/**
 * screens/credits.js — Contributor & Birthday Credits Roll 🎬
 *
 * Retro arcade ending credits thanking every contributor, friend, and family member.
 */

import { getCoins, getCardsUnlocked } from '@/data/local-state.js';
import { getAllCards, getAllStickers } from '@/data/contribute-store.js';

function injectCSS() {
  if (document.getElementById('credits-css')) return;
  const s = document.createElement('style');
  s.id = 'credits-css';
  s.textContent = /* css */`
    #credits-screen {
      position: fixed; inset: 0;
      background: #04010a;
      color: #F9DBBD;
      font-family: 'Press Start 2P', monospace;
      overflow: hidden;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }

    #credits-scroll-container {
      width: 100%; max-width: 440px;
      height: 80vh;
      overflow-y: auto;
      text-align: center;
      padding: 40px 16px;
      display: flex; flex-direction: column;
      gap: 32px;
      scrollbar-width: none;
    }
    #credits-scroll-container::-webkit-scrollbar { display: none; }

    .cred-title {
      font-size: clamp(0.7rem, 4vw, 0.95rem);
      color: #ffd93b;
      line-height: 1.8;
      letter-spacing: 0.08em;
    }
    .cred-section {
      display: flex; flex-direction: column; gap: 10px;
    }
    .cred-role {
      font-size: 0.35rem; color: #DA627D; letter-spacing: 0.06em;
    }
    .cred-name {
      font-size: 0.44rem; color: #fff; line-height: 1.7;
    }
    .cred-sub {
      font-size: 0.28rem; color: rgba(249,219,189,0.7); line-height: 1.8;
    }

    .cred-stats-box {
      background: rgba(69,9,32,0.6);
      border: 2px solid #A53860;
      border-radius: 10px;
      padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }

    #credits-back-btn {
      position: absolute; bottom: 16px;
      background: linear-gradient(135deg, #ffd93b, #c07020);
      color: #1a0a2e;
      border: 2px solid #fff;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.4rem;
      padding: 12px 24px;
      cursor: pointer;
      z-index: 20;
    }
    #credits-back-btn:active { transform: scale(0.92); }
  `;
  document.head.appendChild(s);
}

export function mountCredits(container, opts = {}) {
  injectCSS();

  const allCards = getAllCards();
  const allStickers = getAllStickers();
  const coins = getCoins();
  const cardsCount = getCardsUnlocked().length;

  // Gather unique contributor names (real contributions only)
  const contributors = new Set(['Your Brother ❤️', 'Family ❤️']);
  allCards.forEach(c => {
    if (c.author && c.author !== 'Birthday Crew' && c.author !== 'Secret Admirer') {
      contributors.add(c.author);
    }
  });
  allStickers.forEach(s => {
    if (s.author && s.author !== 'Muski Arcade' && s.author !== 'Friend') {
      contributors.add(s.author);
    }
  });

  const contribList = Array.from(contributors);

  container.innerHTML = /* html */`
    <div id="credits-screen">
      <div id="credits-scroll-container">
        <div>
          <div style="font-size:3rem; margin-bottom:12px;">👑</div>
          <div class="cred-title">MUSKI ADVENTURES</div>
          <div class="cred-sub">19TH BIRTHDAY SPECIAL EDITION</div>
        </div>

        <div class="cred-section">
          <div class="cred-role">STARRING</div>
          <div class="cred-name">MUSKI</div>
          <div class="cred-sub">The Birthday Queen & Player 1</div>
        </div>

        <div class="cred-section">
          <div class="cred-role">CREATED WITH LOVE BY</div>
          <div class="cred-name">HER BROTHER</div>
          <div class="cred-sub">Lead Programmer, Secret Architect & #1 Fan</div>
        </div>

        <div class="cred-section">
          <div class="cred-role">CONTRIBUTING FRIENDS & FAMILY</div>
          ${contribList.map(name => `
            <div class="cred-name" style="font-size:0.38rem; color:#ffd93b;">${name}</div>
          `).join('')}
        </div>

        <div class="cred-section">
          <div class="cred-role">GAME HIGHLIGHTS & STATS</div>
          <div class="cred-stats-box">
            <div class="cred-sub">🪙 COINS COLLECTED: ${coins}</div>
            <div class="cred-sub">🃏 SCRATCH CARDS WON: ${cardsCount} / ${allCards.length}</div>
            <div class="cred-sub">🌸 WHATSAPP STICKERS: ${allStickers.length}</div>
          </div>
        </div>

        <div class="cred-section" style="margin-top:20px;">
          <div class="cred-sub">THANK YOU FOR PLAYING!</div>
          <div class="cred-name" style="color:#FFA5AB;">HAPPY 19TH BIRTHDAY, MUSKI! ✨</div>
        </div>
      </div>

      <button id="credits-back-btn">🕹️ RETURN TO ARCADE</button>
    </div>
  `;

  document.getElementById('credits-back-btn')?.addEventListener('click', () => {
    opts.onHome?.();
  });
}
