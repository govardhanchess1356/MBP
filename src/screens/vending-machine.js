/**
 * src/screens/vending-machine.js — Muski's Prize Machine 🎰
 *
 * A full-screen retro vending machine UI.
 * Slots: 3 columns (1–3) × 4 rows (A–D) = 12 slots.
 *
 * Flow:
 *   1. Tap a row letter (A-D) → tap a column number (1-3) → slot highlights.
 *   2. Tap VEND → deducts CARD_COST_COINS coins.
 *   3. Coil animation → item drops → flap opens → item appears.
 *   4. Tap dispensed item → calls onCardDispensed(slotId).
 *
 * Phase 5: onCardDispensed opens the scratch-card viewer.
 * For now it shows a shiny placeholder card.
 */

import { getCoins, addCoins, unlockCard } from '@/data/local-state.js';
import { CARD_COST_COINS }                 from '@/config/constants.js';
import { triggerEgg }                      from '@/eggs/eggs.js';
import { EGG_IDS }                         from '@/config/constants.js';
import { showScratchCard }                 from '@/ui/scratch-card.js';
import { getAllCards }                     from '@/data/contribute-store.js';

// Slot labels
const ROWS = ['A','B','C','D'];
const COLS = ['1','2','3'];

// Placeholder slot data (real cards come from Supabase in Phase 5)
const SLOT_THEME_COLORS = [
  '#DA627D','#ff6eb4','#A53860',
  '#c9a0ff','#5ee0ff','#5effa3',
  '#ffd93b','#ffb340','#FFA5AB',
  '#DA627D','#c9a0ff','#ff6eb4',
];

const SLOT_EMOJIS = ['🌸','🎂','⭐','🎁','🎈','🪄','🦋','🌙','💎','🎀','🌺','✨'];

// Konami-style combo Easter egg: select A1 → B2 → C3
let _comboSequence = [];
const VENDING_COMBO = ['A1','B2','C3'];

// ─── CSS ─────────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('vm-css')) return;
  const s = document.createElement('style');
  s.id = 'vm-css';
  s.textContent = /* css */`
    #vm-screen {
      position: fixed; inset: 0;
      background: #06021a;
      display: flex; flex-direction: column; align-items: center;
      overflow: hidden;
      font-family: 'Press Start 2P', monospace;
    }

    /* ── Machine shell ─────────────────────────────────────────── */
    #vm-machine {
      width: 100%; max-width: 360px;
      height: 100%;
      display: flex; flex-direction: column;
      position: relative;
    }

    /* ── Neon sign top ─────────────────────────────────────────── */
    #vm-sign {
      background: linear-gradient(90deg, #12063a, #1e0850, #12063a);
      border-bottom: 3px solid #c9a0ff;
      padding: 12px 10px 10px;
      padding-top: max(12px, env(safe-area-inset-top,12px));
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
      gap: 8px;
    }
    #vm-sign-text {
      font-size: clamp(0.35rem, 2.5vw, 0.48rem);
      color: #c9a0ff;
      letter-spacing: 0.06em;
      line-height: 1.6;
      animation: vm-neon-flicker 3s ease-in-out infinite;
      text-shadow: 0 0 10px rgba(200,160,255,0.8);
    }
    @keyframes vm-neon-flicker {
      0%,90%,100% { opacity:1; }
      91%,93%,95% { opacity:0.5; }
      92%,94%     { opacity:1; }
    }
    .vm-top-btn {
      background: rgba(69,9,32,0.75); border: 1.5px solid #A53860;
      border-radius: 6px; width: 36px; height: 36px; min-width: 36px;
      font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    .vm-top-btn:active { transform: scale(0.88); }

    /* ── Glass case ────────────────────────────────────────────── */
    #vm-glass-area {
      flex: 1; overflow: hidden;
      background: linear-gradient(160deg,#0f0630 0%,#1a0845 50%,#0a0325 100%);
      border-left: 4px solid #3a2266;
      border-right: 4px solid #3a2266;
      position: relative;
      min-height: 0;
    }
    /* Inner glass shine */
    #vm-glass-area::before {
      content:'';
      position:absolute; inset:0;
      background: linear-gradient(110deg,
        rgba(200,160,255,0.06) 0%,
        transparent 45%,
        rgba(200,160,255,0.03) 100%);
      pointer-events: none; z-index:5;
    }

    #vm-slots-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      padding: 10px 10px 6px;
      height: 100%;
      box-sizing: border-box;
    }

    /* ── Individual slot ───────────────────────────────────────── */
    .vm-slot {
      background: rgba(6,2,26,0.85);
      border: 2px solid rgba(165,56,96,0.45);
      border-radius: 8px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 4px;
      position: relative;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      min-height: 0;
      overflow: hidden;
    }
    .vm-slot.selected {
      border-color: #ffd93b;
      background: rgba(255,217,59,0.1);
      box-shadow: 0 0 12px rgba(255,217,59,0.3);
    }
    .vm-slot.dispensing {
      animation: vm-dispense-shake 0.3s ease-in-out;
    }
    @keyframes vm-dispense-shake {
      0%,100% { transform: translateX(0); }
      25%  { transform: translateX(-3px); }
      75%  { transform: translateX(3px); }
    }

    .vm-slot-emoji {
      font-size: clamp(1.1rem, 5vw, 1.5rem);
      transition: transform 0.3s;
    }
    .vm-slot.dispensing .vm-slot-emoji {
      animation: vm-drop 0.5s ease-in forwards;
    }
    @keyframes vm-drop {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(60px) rotate(15deg); opacity: 0; }
    }

    .vm-slot-label {
      font-size: 0.26rem;
      color: rgba(200,160,255,0.6);
      letter-spacing: 0.04em;
    }
    .vm-slot-price {
      font-size: 0.22rem;
      color: #ffd93b;
    }

    /* Coil/spring under item */
    .vm-slot-coil {
      width: 100%; height: 4px;
      background: repeating-linear-gradient(90deg,
        #5a3a5a 0px, #5a3a5a 3px, transparent 3px, transparent 6px);
      position: absolute; bottom: 14px;
    }

    /* ── Controls bar ──────────────────────────────────────────── */
    #vm-controls {
      background: linear-gradient(to bottom, #0f0425, #06021a);
      border-top: 3px solid #3a2266;
      border-left: 4px solid #3a2266;
      border-right: 4px solid #3a2266;
      padding: 10px 12px;
      flex-shrink: 0;
      display: flex; flex-direction: column; gap: 8px;
    }

    /* Display readout */
    #vm-display {
      background: #001a00;
      border: 2px solid #003300;
      border-radius: 4px;
      padding: 6px 10px;
      display: flex; justify-content: space-between; align-items: center;
      gap: 8px;
    }
    #vm-readout {
      font-size: 0.45rem;
      color: #5effa3;
      letter-spacing: 0.1em;
      text-shadow: 0 0 6px rgba(94,255,163,0.6);
      min-width: 3ch;
    }
    #vm-coin-display {
      font-size: 0.38rem;
      color: #ffd93b;
      text-shadow: 0 0 6px rgba(255,217,59,0.5);
    }

    /* Keypad */
    #vm-keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .vm-key {
      padding: 9px 4px;
      background: linear-gradient(to bottom, #2a1240, #1a0830);
      border: 2px solid #5a3a8a;
      border-bottom-width: 4px;
      border-radius: 6px;
      color: #c9a0ff;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.38rem;
      text-align: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .vm-key:active, .vm-key.pressed {
      border-bottom-width: 2px;
      transform: translateY(2px);
      background: rgba(200,160,255,0.15);
      color: #ffd93b;
    }
    .vm-key.row-key  { color: #ff6eb4; border-color: #8a3a6a; }
    .vm-key.col-key  { color: #5ee0ff; border-color: #2a6a8a; }

    /* Vend + clear row */
    #vm-action-row {
      display: flex; gap: 8px;
    }
    #vm-clear-btn {
      flex: 0 0 auto;
      padding: 10px 14px;
      background: rgba(69,9,32,0.75);
      border: 2px solid #A53860;
      border-bottom-width: 3px;
      border-radius: 6px;
      color: #FFA5AB;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.32rem;
      cursor: pointer;
    }
    #vm-clear-btn:active { transform: translateY(2px); border-bottom-width: 1px; }

    #vm-vend-btn {
      flex: 1;
      padding: 12px;
      background: linear-gradient(135deg, #7a4010 0%, #c07020 50%, #7a4010 100%);
      border: 2px solid #f5d78e;
      border-bottom-width: 4px;
      border-radius: 6px;
      color: #ffd93b;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.42rem;
      cursor: pointer;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
      box-shadow: 0 0 12px rgba(255,180,40,0.25);
      -webkit-tap-highlight-color: transparent;
    }
    #vm-vend-btn:active  { transform: translateY(3px); border-bottom-width: 1px; }
    #vm-vend-btn:disabled{
      opacity: 0.45; cursor: default; box-shadow: none;
    }

    /* ── Flap / pickup area ────────────────────────────────────── */
    #vm-flap-area {
      background: linear-gradient(to bottom, #12063a, #0a0325);
      border: 3px solid #3a2266;
      border-top: none;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      padding: 8px 12px;
      padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
      display: flex; align-items: center; justify-content: center;
      min-height: 58px;
      flex-shrink: 0;
      position: relative;
    }
    #vm-flap-label {
      font-size: 0.28rem; color: rgba(165,56,96,0.55);
    }

    #vm-dispensed-item {
      display: none;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 6px;
      animation: vm-item-appear 0.4s ease;
      cursor: pointer;
    }
    #vm-dispensed-item.visible { display: flex; }
    @keyframes vm-item-appear {
      from { transform: translateY(-20px); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }
    #vm-dispensed-emoji { font-size: 2rem; }
    #vm-dispensed-label {
      font-size: 0.3rem; color: #ffd93b; text-align: center; line-height: 1.7;
    }

    /* Coin error shake */
    .vm-shake {
      animation: vm-err-shake 0.35s ease-in-out;
    }
    @keyframes vm-err-shake {
      0%,100% { transform: translateX(0); }
      20%  { transform: translateX(-6px); }
      40%  { transform: translateX(6px); }
      60%  { transform: translateX(-4px); }
      80%  { transform: translateX(4px); }
    }

    /* Coin pop */
    .vm-coin-pop {
      position: fixed; pointer-events: none; z-index: 300;
      font-size: 1.1rem;
      animation: vm-coin-float 0.9s ease-out forwards;
    }
    @keyframes vm-coin-float {
      0%   { opacity: 1; transform: translateY(0);     }
      100% { opacity: 0; transform: translateY(-60px); }
    }

    /* Screen in */
    #vm-screen { animation: vm-in 0.35s ease; }
    @keyframes vm-in { from { opacity:0; } to { opacity:1; } }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function coinPop(x, y) {
  const el = document.createElement('div');
  el.className = 'vm-coin-pop';
  el.textContent = '🪙';
  el.style.cssText = `left:${x - 14}px; top:${y - 14}px;`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function flashKey(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('pressed');
  setTimeout(() => el.classList.remove('pressed'), 180);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
/**
 * @param {HTMLElement} container
 * @param {{ onHome: Function, onCardDispensed?: (slotId: string) => void }} opts
 */
export function mountVendingMachine(container, opts = {}) {
  injectCSS();

  let selectedRow = null;  // 'A'–'D'
  let selectedCol = null;  // '1'–'3'
  let dispensing  = false;

  // Build slot HTML
  const slotsHTML = [];
  let idx = 0;
  for (const row of ROWS) {
    for (const col of COLS) {
      const sid   = `${row}${col}`;
      const color = SLOT_THEME_COLORS[idx];
      const emoji = SLOT_EMOJIS[idx];
      slotsHTML.push(/* html */`
        <div class="vm-slot" id="slot-${sid}" data-slot="${sid}"
             style="background:rgba(6,2,26,0.85); border-color: rgba(${hexToRgb(color)},0.5);">
          <div class="vm-slot-emoji" style="color:${color}">${emoji}</div>
          <div class="vm-slot-label">${sid}</div>
          <div class="vm-slot-price">🪙${CARD_COST_COINS}</div>
          <div class="vm-slot-coil"></div>
        </div>
      `);
      idx++;
    }
  }

  container.innerHTML = /* html */`
    <div id="vm-screen">
      <div id="vm-machine">

        <!-- Sign / top bar -->
        <div id="vm-sign">
          <div id="vm-sign-text">🎰 MUSKI'S<br>PRIZE MACHINE</div>
          <button class="vm-top-btn" id="vm-home-btn" aria-label="Back">🏠</button>
        </div>

        <!-- Glass case -->
        <div id="vm-glass-area">
          <div id="vm-slots-grid">
            ${slotsHTML.join('')}
          </div>
        </div>

        <!-- Controls -->
        <div id="vm-controls">
          <!-- Display readout -->
          <div id="vm-display">
            <div id="vm-readout">--</div>
            <div id="vm-coin-display">🪙 <span id="vm-coins">${getCoins()}</span></div>
          </div>

          <!-- Keypad: rows A-D + cols 1-3 -->
          <div id="vm-keypad">
            ${ROWS.map(r => `<button class="vm-key row-key" id="key-${r}" data-row="${r}">${r}</button>`).join('')
            }
            ${COLS.map(c => `<button class="vm-key col-key" id="key-${c}" data-col="${c}">${c}</button>`).join('')}
          </div>

          <!-- Vend + Clear -->
          <div id="vm-action-row">
            <button id="vm-clear-btn">✕ CLR</button>
            <button id="vm-vend-btn" disabled>🪙 VEND</button>
          </div>
        </div>

        <!-- Flap / pickup area -->
        <div id="vm-flap-area">
          <div id="vm-flap-label">← PICKUP SLOT →</div>
          <div id="vm-dispensed-item">
            <div id="vm-dispensed-emoji">🎁</div>
            <div id="vm-dispensed-label">TAP TO OPEN!</div>
          </div>
        </div>

      </div>
    </div>
  `;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const readout    = document.getElementById('vm-readout');
  const coinDisplay= document.getElementById('vm-coins');
  const vendBtn    = document.getElementById('vm-vend-btn');
  const flapLabel  = document.getElementById('vm-flap-label');
  const dispensedEl= document.getElementById('vm-dispensed-item');
  const dispensedEmoji= document.getElementById('vm-dispensed-emoji');

  function updateReadout() {
    const r = selectedRow ?? '-';
    const c = selectedCol ?? '-';
    readout.textContent = `${r}${c}`;
    const hasSlot = selectedRow && selectedCol;
    vendBtn.disabled = !hasSlot;

    // Highlight selected slot
    document.querySelectorAll('.vm-slot').forEach(el => el.classList.remove('selected'));
    if (hasSlot) {
      document.getElementById(`slot-${selectedRow}${selectedCol}`)?.classList.add('selected');
    }
  }

  function refreshCoins() {
    coinDisplay.textContent = getCoins();
  }

  // ── Keypad: row selection ─────────────────────────────────────────────────
  for (const row of ROWS) {
    document.getElementById(`key-${row}`)?.addEventListener('click', () => {
      if (dispensing) return;
      selectedRow = row;
      selectedCol = null;
      flashKey(`key-${row}`);
      updateReadout();
    });
  }

  // ── Keypad: col selection ─────────────────────────────────────────────────
  for (const col of COLS) {
    document.getElementById(`key-${col}`)?.addEventListener('click', () => {
      if (dispensing) return;
      if (!selectedRow) return; // must pick row first
      selectedCol = col;
      flashKey(`key-${col}`);
      updateReadout();

      // Check Easter egg combo
      _comboSequence.push(`${selectedRow}${selectedCol}`);
      if (_comboSequence.length > VENDING_COMBO.length) _comboSequence.shift();
      if (_comboSequence.join(',') === VENDING_COMBO.join(',')) {
        triggerEgg(EGG_IDS.VENDING_COMBO);
        addCoins(5);
        refreshCoins();
        _comboSequence = [];
      }
    });
  }

  // ── Slot tap (direct selection shortcut) ──────────────────────────────────
  document.getElementById('vm-slots-grid')?.addEventListener('click', (e) => {
    if (dispensing) return;
    const slot = e.target.closest('.vm-slot');
    if (!slot) return;
    const sid = slot.dataset.slot;
    selectedRow = sid[0];
    selectedCol = sid[1];
    flashKey(`key-${selectedRow}`);
    flashKey(`key-${selectedCol}`);
    updateReadout();
  });

  // ── Clear ─────────────────────────────────────────────────────────────────
  document.getElementById('vm-clear-btn')?.addEventListener('click', () => {
    if (dispensing) return;
    selectedRow = null;
    selectedCol = null;
    updateReadout();
  });

  // ── VEND ──────────────────────────────────────────────────────────────────
  vendBtn.addEventListener('click', async (e) => {
    if (dispensing || !selectedRow || !selectedCol) return;

    const coins = getCoins();
    if (coins < CARD_COST_COINS) {
      // Not enough coins
      document.getElementById('vm-controls')?.classList.add('vm-shake');
      setTimeout(() => document.getElementById('vm-controls')?.classList.remove('vm-shake'), 400);
      readout.textContent = 'NO 🪙';
      setTimeout(() => updateReadout(), 1200);
      return;
    }

    dispensing = true;
    vendBtn.disabled = true;

    const slotId  = `${selectedRow}${selectedCol}`;
    const slotEl  = document.getElementById(`slot-${slotId}`);
    const slotIdx = ROWS.indexOf(selectedRow) * 3 + COLS.indexOf(selectedCol);
    const emoji   = SLOT_EMOJIS[slotIdx];

    // Deduct coins
    addCoins(-CARD_COST_COINS);
    refreshCoins();
    coinPop(e.clientX, e.clientY);

    // Dispensing animation
    slotEl?.classList.add('dispensing');
    readout.textContent = '...';

    await delay(500);

    // Drop item + open flap
    flapLabel.style.display = 'none';
    dispensedEl.classList.remove('visible');
    dispensedEmoji.textContent = emoji;

    await delay(200);

    dispensedEl.classList.add('visible');

    slotEl?.classList.remove('dispensing');
    // Clear slot selection
    document.querySelectorAll('.vm-slot').forEach(el => el.classList.remove('selected'));
    selectedRow = null;
    selectedCol = null;
    readout.textContent = 'TAKE IT!';

    dispensing = false;

    // Tap dispensed item → show scratch card → unlock in album
    const onTap = () => {
      dispensedEl.removeEventListener('click', onTap);
      dispensedEl.classList.remove('visible');
      flapLabel.style.display = '';
      readout.textContent = '--';
      vendBtn.disabled = true;

      // Find card definition for this slot or random from extended/contributor pool
      const pool = getAllCards();
      const cardDef = pool.find(c => c.slotId === slotId) || pool[Math.floor(Math.random() * pool.length)] || {
        slotId, emoji, title: 'BIRTHDAY CARD!',
        description: 'A prize from Muski\'s machine!',
        rarity: 'COMMON', color: '#DA627D',
        bg: 'linear-gradient(135deg,#450920,#A53860)',
      };

      // Unlock card in localStorage
      unlockCard(cardDef.slotId || cardDef.id || slotId);

      // Show scratch card overlay
      showScratchCard(container, cardDef, (revealed) => {
        opts.onCardDispensed?.(cardDef.slotId || slotId);
      });
    };
    dispensedEl.addEventListener('click', onTap, { once: true });
  });

  // ── Home ──────────────────────────────────────────────────────────────────
  document.getElementById('vm-home-btn')?.addEventListener('click', () => opts.onHome?.());

  // Refresh coins every 2s (in case they change from another tab)
  const timer = setInterval(refreshCoins, 2000);

  return () => clearInterval(timer);
}

// ─── Util ─────────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
}
