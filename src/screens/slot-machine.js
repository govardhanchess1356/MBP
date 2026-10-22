/**
 * src/screens/slot-machine.js — Muski's Lucky 19 Slot Machine 🎰
 *
 * Replaces the old vending machine with a classic retro arcade slot machine:
 * - 3 spinning mechanical reels
 * - Golden pull lever + arcade SPIN button
 * - Sound effects, reel deceleration, match celebrations
 * - Dispenses multi-media Scratch Cards on every spin!
 */

import { getCoins, addCoins, unlockCard } from '@/data/local-state.js';
import { SFX } from '@/engine/sound.js';
import { getAllCards } from '@/data/contribute-store.js';
import { showScratchCard } from '@/ui/scratch-card.js';

const SPIN_COST = 5;

const SYMBOLS = [
  { emoji: '👑', label: 'QUEEN',    weight: 1, val: 50 },
  { emoji: '7️⃣', label: 'SEVEN',    weight: 2, val: 35 },
  { emoji: '💎', label: 'DIAMOND',  weight: 3, val: 25 },
  { emoji: '🎂', label: 'CAKE',     weight: 4, val: 20 },
  { emoji: '⭐', label: 'STAR',     weight: 5, val: 15 },
  { emoji: '🌸', label: 'FLOWER',   weight: 6, val: 10 },
  { emoji: '🎁', label: 'GIFT',     weight: 6, val: 10 },
];

function injectCSS() {
  if (document.getElementById('slot-css')) return;
  const s = document.createElement('style');
  s.id = 'slot-css';
  s.textContent = /* css */`
    #slot-screen {
      position: fixed; inset: 0;
      background: radial-gradient(circle at center, #1e0628 0%, #060214 100%);
      font-family: 'Press Start 2P', monospace;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 14px;
      overflow-y: auto;
    }

    #slot-cabinet {
      width: 100%; max-width: 420px;
      background: linear-gradient(145deg, #2c0838, #180324);
      border: 4px solid #ffd93b;
      border-radius: 18px;
      padding: 20px 16px 24px;
      box-shadow: 0 0 50px rgba(255,217,59,0.35), inset 0 0 20px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .slot-marquee {
      text-align: center;
      padding: 10px 14px;
      background: linear-gradient(90deg, #450920, #a53860, #450920);
      border: 2px solid #ff6eb4;
      border-radius: 8px;
      width: 100%;
    }
    .slot-marquee h1 {
      font-size: clamp(0.5rem, 3.5vw, 0.68rem);
      color: #ffd93b;
      letter-spacing: 0.08em;
      line-height: 1.6;
      text-shadow: 0 0 10px rgba(255,217,59,0.8);
    }
    .slot-marquee p {
      font-size: 0.28rem; color: #FFA5AB; margin-top: 4px;
    }

    /* Reels container */
    #slot-reels-box {
      display: flex;
      gap: 12px;
      background: #020108;
      border: 3px solid #ff6eb4;
      border-radius: 12px;
      padding: 14px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
      width: 100%;
      justify-content: center;
    }

    .slot-reel {
      flex: 1;
      height: 110px;
      background: linear-gradient(180deg, #110520 0%, #ffffff 40%, #ffffff 60%, #110520 100%);
      border: 2px solid #ffd93b;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 3.2rem;
      user-select: none;
      box-shadow: inset 0 6px 12px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.6);
      transition: transform 0.1s;
    }
    .slot-reel.spinning {
      filter: blur(2px);
      animation: reel-blur 0.12s infinite linear alternate;
    }
    @keyframes reel-blur {
      from { transform: translateY(-4px); }
      to   { transform: translateY(4px); }
    }

    /* Payout / Status Readout */
    #slot-readout {
      font-size: 0.36rem;
      color: #ffd93b;
      text-align: center;
      min-height: 2.2em;
      line-height: 1.8;
      letter-spacing: 0.05em;
    }

    /* Controls */
    .slot-controls {
      display: flex;
      gap: 14px;
      width: 100%;
      align-items: center;
      justify-content: center;
    }

    #slot-spin-btn {
      flex: 1;
      background: linear-gradient(135deg, #ffd93b, #c07020);
      color: #1a0a2e;
      border: 2px solid #fff;
      border-radius: 8px;
      font-family: inherit;
      font-size: clamp(0.48rem, 3.5vw, 0.65rem);
      padding: 16px 12px;
      cursor: pointer;
      box-shadow: 0 5px 0 #7a4010, 0 0 25px rgba(255,217,59,0.5);
      letter-spacing: 0.06em;
    }
    #slot-spin-btn:active {
      transform: translateY(4px);
      box-shadow: 0 1px 0 #7a4010;
    }
    #slot-spin-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    #slot-back-btn {
      background: rgba(69,9,32,0.85);
      border: 1.5px solid #A53860;
      border-radius: 8px;
      color: #FFA5AB;
      font-family: inherit;
      font-size: 0.32rem;
      padding: 16px 14px;
      cursor: pointer;
    }

    /* HUD Strip */
    #slot-hud {
      display: flex; justify-content: space-between; width: 100%;
      font-size: 0.32rem; color: #FFA5AB;
      padding: 4px 6px;
    }
    #slot-coins-display { color: #ffd93b; font-weight: bold; }
  `;
  document.head.appendChild(s);
}

export function mountSlotMachine(container, opts = {}) {
  injectCSS();

  let coins = getCoins();
  let isSpinning = false;

  container.innerHTML = /* html */`
    <div id="slot-screen">
      <div id="slot-cabinet">
        <div id="slot-hud">
          <div>🎰 LUCKY SLOTS</div>
          <div>🪙 COINS: <span id="slot-coins-display">${coins}</span></div>
        </div>

        <div class="slot-marquee">
          <h1>⭐ LUCKY 19 SPINS ⭐</h1>
          <p>MATCH 3 FOR JACKPOT! · WIN CARDS & COINS!</p>
        </div>

        <div id="slot-reels-box">
          <div class="slot-reel" id="reel-1">🎂</div>
          <div class="slot-reel" id="reel-2">👑</div>
          <div class="slot-reel" id="reel-3">💎</div>
        </div>

        <div id="slot-readout">SPEND 🪙 ${SPIN_COST} TO PULL THE REELS!</div>

        <div class="slot-controls">
          <button id="slot-spin-btn">🎰 SPIN! (🪙 ${SPIN_COST})</button>
          <button id="slot-back-btn">← BACK</button>
        </div>
      </div>
    </div>
  `;

  const r1 = document.getElementById('reel-1');
  const r2 = document.getElementById('reel-2');
  const r3 = document.getElementById('reel-3');
  const spinBtn = document.getElementById('slot-spin-btn');
  const readout = document.getElementById('slot-readout');
  const coinsDisplay = document.getElementById('slot-coins-display');

  function updateCoins() {
    coins = getCoins();
    if (coinsDisplay) coinsDisplay.textContent = coins;
    if (spinBtn) spinBtn.disabled = coins < SPIN_COST || isSpinning;
  }

  updateCoins();

  async function spin() {
    if (isSpinning) return;
    if (getCoins() < SPIN_COST) {
      readout.textContent = 'NOT ENOUGH COINS! PLAY GAMES TO WIN MORE 🪙';
      SFX.lose();
      return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    addCoins(-SPIN_COST);
    updateCoins();
    SFX.coin();

    readout.textContent = 'SPINNING THE REELS... 🍀';
    r1.classList.add('spinning');
    r2.classList.add('spinning');
    r3.classList.add('spinning');

    // Reel spin flicker
    const spinInterval = setInterval(() => {
      r1.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji;
      r2.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji;
      r3.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji;
      SFX.scratch();
    }, 90);

    // Stop Reel 1 after 900ms
    await delay(900);
    const sym1 = getRandomSymbol();
    r1.classList.remove('spinning');
    r1.textContent = sym1.emoji;
    SFX.jump();

    // Stop Reel 2 after 1400ms
    await delay(500);
    const sym2 = getRandomSymbol();
    r2.classList.remove('spinning');
    r2.textContent = sym2.emoji;
    SFX.jump();

    // Stop Reel 3 after 1900ms
    await delay(500);
    clearInterval(spinInterval);
    const sym3 = getRandomSymbol();
    r3.classList.remove('spinning');
    r3.textContent = sym3.emoji;
    SFX.jump();

    // Evaluate Win
    await delay(300);
    evaluateResult(sym1, sym2, sym3);
    isSpinning = false;
    updateCoins();
  }

  function getRandomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function evaluateResult(s1, s2, s3) {
    let winCoins = 0;
    let cardRarity = 'COMMON';

    if (s1.emoji === s2.emoji && s2.emoji === s3.emoji) {
      // 3 of a kind: JACKPOT!
      winCoins = s1.val * 2;
      cardRarity = 'MYTHIC';
      readout.innerHTML = `🎉 JACKPOT! 3x ${s1.emoji}!<br>+${winCoins} COINS + MYTHIC CARD!`;
      SFX.win();
      burstConfetti();
    } else if (s1.emoji === s2.emoji || s2.emoji === s3.emoji || s1.emoji === s3.emoji) {
      // 2 of a kind
      const match = s1.emoji === s2.emoji ? s1 : (s2.emoji === s3.emoji ? s2 : s1);
      winCoins = 10;
      cardRarity = 'RARE';
      readout.innerHTML = `✨ LUCKY MATCH! 2x ${match.emoji}!<br>+${winCoins} COINS + RARE CARD!`;
      SFX.unlock();
    } else {
      // Consolation
      cardRarity = 'COMMON';
      readout.innerHTML = `LUCKY SPIN! YOU WON A PRIZE CARD! 🎁`;
      SFX.coin();
    }

    if (winCoins > 0) {
      addCoins(winCoins);
      updateCoins();
    }

    // Pick card from expanded pool
    setTimeout(() => {
      const cards = getAllCards();
      const matchingCards = cards.filter(c => c.rarity === cardRarity);
      const chosen = matchingCards.length ? matchingCards[Math.floor(Math.random() * matchingCards.length)] : cards[Math.floor(Math.random() * cards.length)];

      unlockCard(chosen.slotId || chosen.id);

      showScratchCard(container, chosen, () => {
        opts.onCardDispensed?.(chosen.slotId || chosen.id);
      });
    }, 1200);
  }

  function burstConfetti() {
    const area = document.createElement('div');
    area.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999;';
    document.body.appendChild(area);
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      const colors = ['#ffd93b','#ff6eb4','#5ee0ff','#5effa3'];
      el.style.cssText = `position:absolute;width:10px;height:10px;background:${colors[i%4]};left:${Math.random()*100}vw;top:-10px;animation:sc-confetti-fall ${1.5+Math.random()}s linear forwards;`;
      area.appendChild(el);
    }
    setTimeout(() => area.remove(), 3000);
  }

  spinBtn?.addEventListener('click', spin);
  document.getElementById('slot-back-btn')?.addEventListener('click', () => {
    opts.onHome?.();
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));
