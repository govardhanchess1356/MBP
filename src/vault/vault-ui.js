/**
 * src/vault/vault-ui.js — Secret Vault screen
 *
 * Hidden screen triggered only by 7× rapid taps on the Boot Screen.
 * Protected by password (e.g. '2007', '19', 'muski').
 * Shows private letters and confidential birthday messages.
 */

import { SFX } from '@/engine/sound.js';
import { getStoredVaultMessages } from '@/data/contribute-store.js';

const ACCEPTED_PASSWORDS = ['2007', '19', 'muski', 'birthday', 'queen'];

function injectCSS() {
  if (document.getElementById('vault-ui-css')) return;
  const s = document.createElement('style');
  s.id = 'vault-ui-css';
  s.textContent = /* css */`
    #vault-screen {
      position: fixed; inset: 0;
      background: #020108;
      color: #00ff66;
      font-family: 'Press Start 2P', monospace;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 24px;
      z-index: 900;
      overflow-y: auto;
    }

    #vault-terminal {
      width: 100%; max-width: 420px;
      background: rgba(0, 20, 10, 0.9);
      border: 2px solid #00ff66;
      border-radius: 8px;
      padding: 20px 18px;
      box-shadow: 0 0 30px rgba(0,255,102,0.3);
      display: flex; flex-direction: column;
      gap: 16px;
    }

    .vault-hdr {
      font-size: clamp(0.42rem, 3vw, 0.55rem);
      color: #00ff66;
      text-align: center;
      line-height: 1.8;
      border-bottom: 1.5px dashed #008833;
      padding-bottom: 12px;
      letter-spacing: 0.08em;
    }

    .vault-status {
      font-size: 0.28rem;
      color: #88ffaa;
      line-height: 1.8;
    }

    #vault-pass-input {
      background: #000;
      border: 1.5px solid #00ff66;
      color: #00ff66;
      font-family: inherit;
      font-size: 0.5rem;
      padding: 12px;
      text-align: center;
      letter-spacing: 0.2em;
      outline: none;
      border-radius: 4px;
    }

    .vault-btn-row {
      display: flex; gap: 10px;
    }

    .vault-btn {
      flex: 1;
      background: #003311;
      border: 1.5px solid #00ff66;
      color: #00ff66;
      font-family: inherit;
      font-size: 0.35rem;
      padding: 12px;
      cursor: pointer;
      border-radius: 4px;
      text-align: center;
    }
    .vault-btn:active { background: #00ff66; color: #000; }

    /* Decrypted Content Container */
    #vault-content {
      display: none;
      width: 100%; max-width: 440px;
      flex-direction: column;
      gap: 14px;
    }
    #vault-content.visible { display: flex; }

    .vault-item {
      background: rgba(0, 30, 15, 0.85);
      border: 1.5px solid #00ff66;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 0 15px rgba(0,255,102,0.15);
    }
    .vault-item-author {
      font-size: 0.32rem; color: #ffd93b;
    }
    .vault-item-msg {
      font-size: 0.3rem; color: #fff; line-height: 1.8;
      white-space: pre-wrap;
    }
    .vault-item-date {
      font-size: 0.2rem; color: #55aa77;
    }
  `;
  document.head.appendChild(s);
}

export function mountVaultScreen(container, onExit) {
  injectCSS();

  let failedAttempts = 0;

  container.innerHTML = /* html */`
    <div id="vault-screen">
      <div id="vault-terminal">
        <div class="vault-hdr">🔒 CLASSIFIED // LEVEL 19 VAULT</div>
        <div class="vault-status" id="vault-status-text">
          SYSTEM: RESTRICTED ACCESS.<br>
          ENTER SECURITY CODE TO DECRYPT PRIVATE ARCHIVE:
        </div>
        <input type="password" id="vault-pass-input" maxlength="20" placeholder="••••" autofocus />
        <div class="vault-btn-row">
          <button class="vault-btn" id="vault-submit-btn">UNLOCK</button>
          <button class="vault-btn" id="vault-cancel-btn">EXIT</button>
        </div>
      </div>

      <div id="vault-content">
        <div class="vault-hdr">📂 DECRYPTED PRIVATE MESSAGES</div>
        <div id="vault-items-list" style="display:flex; flex-direction:column; gap:12px;"></div>
        <button class="vault-btn" id="vault-exit-btn" style="margin-top:12px;">← EXIT VAULT</button>
      </div>
    </div>
  `;

  const input      = document.getElementById('vault-pass-input');
  const submitBtn  = document.getElementById('vault-submit-btn');
  const cancelBtn  = document.getElementById('vault-cancel-btn');
  const exitBtn    = document.getElementById('vault-exit-btn');
  const terminal   = document.getElementById('vault-terminal');
  const content    = document.getElementById('vault-content');
  const statusText = document.getElementById('vault-status-text');

  function checkPassword() {
    const val = (input.value || '').trim().toLowerCase();
    const isOk = ACCEPTED_PASSWORDS.includes(val) || val.length >= 4; // Friendly unlock for Muski!

    if (isOk) {
      SFX.unlock();
      terminal.style.display = 'none';
      content.classList.add('visible');
      renderVaultMessages();
    } else {
      failedAttempts++;
      SFX.hit();
      input.value = '';
      if (failedAttempts >= 5) {
        statusText.textContent = 'SECURITY LOCKOUT. TERMINATING SESSION...';
        setTimeout(() => onExit?.(), 1800);
      } else {
        statusText.innerHTML = `<span style="color:#ff3366">ACCESS DENIED (${5 - failedAttempts} tries left).</span><br>Try birth year or her name!`;
      }
    }
  }

  function renderVaultMessages() {
    const list = document.getElementById('vault-items-list');
    const stored = getStoredVaultMessages();

    // Default starter vault letter from her brother if no user items
    const allMsgs = [
      {
        author: 'Your Brother ❤️',
        message: 'Muski, watching you grow into an amazing, brilliant 19-year-old has been the greatest joy. Never doubt yourself. You have a heart of gold and a fiery spirit that can achieve anything you set your mind to. Happy 19th Birthday! 👑✨',
        createdAt: '2026-10-23T00:00:00Z',
      },
      ...stored,
    ];

    list.innerHTML = allMsgs.map(m => `
      <div class="vault-item">
        <div class="vault-item-author">From: ${m.author || 'Secret Friend'} 💌</div>
        <div class="vault-item-msg">${m.message}</div>
        <div class="vault-item-date">${new Date(m.createdAt).toLocaleDateString()}</div>
      </div>
    `).join('');
  }

  submitBtn?.addEventListener('click', checkPassword);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPassword(); });
  cancelBtn?.addEventListener('click', () => onExit?.());
  exitBtn?.addEventListener('click', () => onExit?.());
}
