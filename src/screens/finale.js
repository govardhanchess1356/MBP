/**
 * screens/finale.js — Final Letter + Level 19 Unlocked 👑
 *
 * Heartfelt personal letter to Muski celebrating her 19th Birthday!
 * Displays glowing "LEVEL 19 UNLOCKED" banner, photo polaroids,
 * and a button to view the Credits Roll.
 */

import { SFX } from '@/engine/sound.js';
import { BIRTHDAY_NAME } from '@/config/constants.js';

function injectCSS() {
  if (document.getElementById('finale-css')) return;
  const s = document.createElement('style');
  s.id = 'finale-css';
  s.textContent = /* css */`
    #finale-screen {
      position: fixed; inset: 0;
      background: radial-gradient(circle at top, #2e0828 0%, #0d0214 100%);
      display: flex; flex-direction: column;
      align-items: center;
      font-family: 'Press Start 2P', monospace;
      overflow-y: auto;
      padding: 20px 16px 40px;
      animation: finale-fade 0.5s ease;
      box-sizing: border-box;
    }
    @keyframes finale-fade { from { opacity:0; } to { opacity:1; } }

    #finale-banner {
      margin-top: max(16px, env(safe-area-inset-top, 16px));
      text-align: center;
      padding: 18px 24px;
      background: linear-gradient(135deg, rgba(165,56,96,0.8), rgba(69,9,32,0.9));
      border: 3px solid #ffd93b;
      border-radius: 12px;
      box-shadow: 0 0 35px rgba(255,217,59,0.5);
      animation: banner-glow 2s infinite alternate;
    }
    @keyframes banner-glow {
      from { box-shadow: 0 0 20px rgba(255,217,59,0.4); }
      to   { box-shadow: 0 0 45px rgba(255,217,59,0.8); }
    }

    #finale-title {
      font-size: clamp(0.7rem, 4.5vw, 1.1rem);
      color: #ffd93b;
      line-height: 1.8;
      letter-spacing: 0.08em;
      text-shadow: 0 2px 10px rgba(0,0,0,0.6);
    }
    #finale-sub {
      font-size: 0.38rem;
      color: #FFA5AB;
      margin-top: 6px;
      line-height: 1.7;
    }

    /* Letter scroll card */
    #finale-letter {
      margin-top: 24px;
      width: 100%; max-width: 460px;
      background: linear-gradient(145deg, #fff3e6, #fde4ce);
      color: #450920;
      border: 4px solid #A53860;
      border-radius: 14px;
      padding: 24px 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      display: flex; flex-direction: column;
      gap: 16px;
    }

    .letter-greeting {
      font-size: 0.52rem;
      color: #780000;
      line-height: 1.6;
      border-bottom: 2px dashed rgba(165,56,96,0.4);
      padding-bottom: 10px;
    }

    .letter-body {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.32rem;
      line-height: 2.2;
      color: #3b0619;
      text-align: justify;
    }

    .letter-polaroid {
      background: #fff;
      padding: 10px 10px 16px;
      border-radius: 4px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      transform: rotate(-1.5deg);
      display: flex; flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 10px 0;
    }
    .letter-polaroid img {
      width: 100%;
      border-radius: 2px;
      max-height: 220px;
      object-fit: cover;
    }
    .letter-polaroid-caption {
      font-size: 0.28rem;
      color: #A53860;
      text-align: center;
    }

    .letter-signoff {
      margin-top: 8px;
      font-size: 0.36rem;
      color: #780000;
      line-height: 1.8;
      text-align: right;
    }

    #finale-credits-btn {
      margin-top: 24px;
      background: linear-gradient(135deg, #ffd93b, #c07020);
      color: #1a0a2e;
      border: 2px solid #fff;
      border-radius: 8px;
      font-family: inherit;
      font-size: clamp(0.48rem, 3.2vw, 0.65rem);
      padding: 16px 28px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(255,217,59,0.5);
      letter-spacing: 0.05em;
    }
    #finale-credits-btn:active { transform: scale(0.96); }
  `;
  document.head.appendChild(s);
}

export function mountFinale(container, onComplete) {
  injectCSS();
  SFX.unlock();

  container.innerHTML = /* html */`
    <div id="finale-screen">
      <div id="finale-banner">
        <div id="finale-title">👑 LEVEL 19 UNLOCKED! 👑</div>
        <div id="finale-sub">HAPPY 19TH BIRTHDAY, ${BIRTHDAY_NAME.toUpperCase()}! 🎂✨</div>
      </div>

      <div id="finale-letter">
        <div class="letter-greeting">Dearest Muski,</div>

        <div class="letter-body">
          Happy 19th Birthday! 🌸 Today marks the start of an extraordinary new chapter in your life.
        </div>

        <div class="letter-body">
          From all the quiet milestones to the loudest laughs, watching you grow into who you are has been the greatest gift. You carry so much warmth, resilience, and genuine brightness that lifts everyone lucky enough to be around you.
        </div>

        <div class="letter-polaroid">
          <img src="/images/gallery/muski-portrait.jpg" alt="Muski Birthday Portrait" />
          <div class="letter-polaroid-caption">Muski · Official Level 19 Unlocked 📸👑</div>
        </div>

        <div class="letter-body">
          No matter how fast time flies or where life leads, always remember: you have a whole army of family and friends cheering you on in every single adventure. Dream without limits, laugh without holding back, and never stop being your authentic, wonderful self.
        </div>

        <div class="letter-signoff">
          With endless love & pride,<br>
          Your Brother & Everyone Who Loves You ❤️
        </div>
      </div>

      <button id="finale-credits-btn">
        ROLL CREDITS ▶
      </button>
    </div>
  `;

  document.getElementById('finale-credits-btn')?.addEventListener('click', () => {
    onComplete?.();
  });
}
