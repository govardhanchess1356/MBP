/**
 * eggs/eggs.js — Easter Egg Registry
 * Phase 8 (full implementation), but IDs and structure defined now.
 *
 * Each egg is registered with:
 *   id        — matches EGG_IDS constants
 *   trigger   — how it fires
 *   effect    — what happens
 *   phase     — which phase implements it
 *
 * Admin checklist reads from this registry to show which eggs
 * have been triggered in the current session.
 */
import { EGG_IDS } from '@/config/constants.js';

/** @type {Map<string, {id, trigger, effect, phase, triggered: boolean}>} */
const _eggs = new Map();

/** Register an Easter egg. */
function registerEgg(egg) {
  _eggs.set(egg.id, { ...egg, triggered: false });
}

// ── Register all 11 Easter eggs ─────────────────────────────────────────────
registerEgg({
  id:      EGG_IDS.KONAMI,
  trigger: 'Konami code: ↑↑↓↓←→←→BA (keyboard or swipe pattern)',
  effect:  '+5 coins + full-screen confetti rain',
  phase:   8,
});

registerEgg({
  id:      EGG_IDS.LOGO_TAP,
  trigger: 'Tap the arcade logo 5× on the Arcade Hall screen',
  effect:  '+5 coins + skip button appears',
  phase:   3,
});

registerEgg({
  id:      EGG_IDS.VAULT_TRIGGER,
  trigger: 'Tap the pixel cake 7× within 5 s on the Boot screen',
  effect:  'Opens hidden vault password prompt (no UI hint)',
  phase:   6,
});

registerEgg({
  id:      EGG_IDS.BDAY_KEYBOARD,
  trigger: 'Type "BDAY" on a physical keyboard (any screen)',
  effect:  'Fireworks burst across the screen',
  phase:   8,
});

registerEgg({
  id:      EGG_IDS.PHONE_SHAKE,
  trigger: 'Shake the phone (DeviceMotion acceleration > 20 m/s²)',
  effect:  'Pixel balloons rain down from the top of the screen',
  phase:   8,
});

registerEgg({
  id:      EGG_IDS.HIDDEN_BALLOONS,
  trigger: 'Find and pop all 5 hidden pixel balloons in the Arcade Hall',
  effect:  'Bonus scratch card dispensed',
  phase:   4,
});

registerEgg({
  id:      EGG_IDS.BIRTHDAY_DATE,
  trigger: 'Device date is 2007-10-23 (her actual birthday)',
  effect:  'Extra birthday greeting overlay + gold theme accent',
  phase:   2,
});

registerEgg({
  id:      EGG_IDS.DINO_19M,
  trigger: 'Dino Run: reach exactly 19 m',
  effect:  'Hidden pixel cake appears mid-run for 2 s',
  phase:   5,
});

registerEgg({
  id:      EGG_IDS.VENDING_COMBO,
  trigger: 'Vending machine: enter keypad sequence A1 → B2 → C3',
  effect:  'Secret "cake" prize dispensed regardless of coins',
  phase:   4,
});

registerEgg({
  id:      EGG_IDS.DEVTOOLS_NOTE,
  trigger: 'Opening DevTools (console.log fires on app load)',
  effect:  'Funny birthday note printed in the browser console',
  phase:   1,  // ← Already implemented in main.js!
});

registerEgg({
  id:      EGG_IDS.BIRTH_TIME,
  trigger: 'Server time within ±5 min of midnight IST Oct 23 (her birth time)',
  effect:  '"You were born!" special overlay message',
  phase:   8,
});

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Mark an egg as triggered in the current session.
 * @param {string} eggId  one of EGG_IDS values
 */
export function triggerEgg(eggId) {
  const egg = _eggs.get(eggId);
  if (!egg) { console.warn(`[eggs] Unknown egg id: ${eggId}`); return; }
  if (egg.triggered) return; // already fired this session
  egg.triggered = true;
  console.log(`%c🥚 Easter Egg Unlocked: ${eggId}`, 'color:#DA627D;font-weight:bold;');
  // Phase 8 will dispatch a custom event for the admin checklist to listen to
  window.dispatchEvent(new CustomEvent('eggTriggered', { detail: { eggId } }));
}

/** Get all registered eggs (for admin checklist). */
export function getAllEggs() {
  return Array.from(_eggs.values());
}

/** Check if an egg has been triggered this session. */
export function isEggTriggered(eggId) {
  return _eggs.get(eggId)?.triggered ?? false;
}

/**
 * Initialize all global Easter egg listeners (Konami, BDAY typing, phone shake, etc.)
 */
export function initGlobalEasterEggs() {
  if (typeof window === 'undefined' || window.__eggsInitialized) return;
  window.__eggsInitialized = true;

  // 1. Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
  const konamiSeq = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  let konamiIdx = 0;

  // 2. Keyboard typing "BDAY"
  const bdaySeq = ['b','d','a','y'];
  let bdayIdx = 0;

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();

    // Konami
    if (k === konamiSeq[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === konamiSeq.length) {
        konamiIdx = 0;
        triggerEgg(EGG_IDS.KONAMI);
        import('@/data/local-state.js').then(({ addCoins }) => addCoins(5));
        burstConfettiRain();
      }
    } else {
      konamiIdx = 0;
    }

    // BDAY
    if (k === bdaySeq[bdayIdx]) {
      bdayIdx++;
      if (bdayIdx === bdaySeq.length) {
        bdayIdx = 0;
        triggerEgg(EGG_IDS.BDAY_KEYBOARD);
        burstConfettiRain();
      }
    } else {
      bdayIdx = 0;
    }
  });

  // 3. Phone Shake Detection
  if (window.DeviceMotionEvent) {
    let lastX = 0, lastY = 0, lastZ = 0;
    window.addEventListener('devicemotion', (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
      if (delta > 24) {
        triggerEgg(EGG_IDS.PHONE_SHAKE);
        rainBalloons();
      }
      lastX = acc.x; lastY = acc.y; lastZ = acc.z;
    }, { passive: true });
  }
}

function burstConfettiRain() {
  const area = document.createElement('div');
  area.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(area);
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    const colors = ['#ffd93b','#ff6eb4','#5effa3','#c9a0ff','#5ee0ff','#DA627D'];
    el.style.cssText = `
      position: absolute;
      width: 10px; height: 10px;
      background: ${colors[i % colors.length]};
      left: ${Math.random() * 100}vw;
      top: -15px;
      animation: egg-confetti-fall ${1.5 + Math.random()}s linear forwards;
    `;
    area.appendChild(el);
  }
  setTimeout(() => area.remove(), 3000);
}

function rainBalloons() {
  const area = document.createElement('div');
  area.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(area);
  for (let i = 0; i < 15; i++) {
    const b = document.createElement('div');
    b.textContent = '🎈';
    b.style.cssText = `
      position: absolute;
      font-size: 2rem;
      left: ${Math.random() * 90}vw;
      top: -40px;
      animation: egg-balloon-fall ${2.5 + Math.random()}s ease-in forwards;
    `;
    area.appendChild(b);
  }
  setTimeout(() => area.remove(), 3500);
}
