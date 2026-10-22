/**
 * src/ui/avatar-maker-modal.js — Interactive Avatar Studio
 *
 * Lets Muski or the Admin:
 * - Pick any of the 8 expression slots
 * - Upload any photo (phone camera / gallery / file)
 * - Live preview: High-res original vs 32x32 retro pixelated sprite
 * - Save directly to the game's active sprite pool
 * - Reset back to handcrafted retro pixel head anytime
 */

import {
  EXPRESSION_SLOTS,
  pixelatePhoto,
  saveAvatar,
  getSavedAvatarDataUrl,
  removeAvatar,
  drawAvatar
} from './avatar.js';

function injectCSS() {
  if (document.getElementById('avatar-modal-css')) return;
  const s = document.createElement('style');
  s.id = 'avatar-modal-css';
  s.textContent = /* css */`
    #avatar-modal-backdrop {
      position: fixed; inset: 0;
      z-index: 1000;
      background: rgba(6, 2, 26, 0.94);
      display: flex; align-items: center; justify-content: center;
      padding: 14px;
      font-family: 'Press Start 2P', monospace;
      animation: av-fadein 0.2s ease;
    }

    #avatar-modal {
      width: 100%; max-width: 420px; max-height: 90vh;
      background: linear-gradient(160deg, #18082e 0%, #250d40 100%);
      border: 3px solid #f5d78e;
      border-radius: 12px;
      box-shadow: 0 0 30px rgba(255, 180, 40, 0.35);
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    .av-header {
      padding: 14px;
      background: rgba(69, 9, 32, 0.85);
      border-bottom: 2px solid #A53860;
      display: flex; justify-content: space-between; align-items: center;
    }
    .av-title {
      font-size: 0.55rem;
      color: #ffd93b;
      letter-spacing: 0.08em;
      text-shadow: 0 0 8px rgba(255,217,59,0.5);
    }
    .av-close {
      background: none; border: none;
      color: #FFA5AB; font-size: 1.1rem;
      cursor: pointer; padding: 2px 6px;
    }

    .av-body {
      padding: 14px;
      overflow-y: auto;
      display: flex; flex-direction: column; gap: 14px;
    }

    /* Slots bar */
    .av-slots-label {
      font-size: 0.35rem; color: #c9a0ff; line-height: 1.6;
    }
    .av-slots-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .av-slot-btn {
      padding: 8px 4px;
      background: rgba(69, 9, 32, 0.6);
      border: 1.5px solid #A53860;
      border-radius: 6px;
      color: #F9DBBD;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.28rem;
      text-align: center;
      cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .av-slot-btn.active {
      border-color: #ffd93b;
      background: rgba(255, 217, 59, 0.2);
      color: #ffd93b;
      box-shadow: 0 0 10px rgba(255, 217, 59, 0.35);
    }

    /* Slot status icon indicator */
    .av-slot-status { font-size: 0.55rem; }

    /* Preview section */
    .av-preview-box {
      background: rgba(6, 2, 26, 0.7);
      border: 2px solid #3a1e70;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .av-preview-canvas {
      width: 96px; height: 96px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      border-radius: 50%;
      background: #06021a;
      box-shadow: 0 0 14px rgba(218, 98, 125, 0.4);
    }
    .av-preview-desc {
      font-size: 0.32rem; color: #FFA5AB; text-align: center; line-height: 1.8;
    }

    /* Action buttons */
    .av-btn-row {
      display: flex; gap: 8px; flex-wrap: wrap;
    }
    .av-upload-label {
      flex: 1;
      padding: 12px;
      background: linear-gradient(135deg, #7a4010 0%, #b05a18 50%, #7a4010 100%);
      border: 2px solid #f5d78e;
      border-radius: 6px;
      color: #ffd93b;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.38rem;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 3px 0 #3a1a04;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .av-upload-label:active { transform: translateY(2px); box-shadow: 0 1px 0 #3a1a04; }

    .av-reset-btn {
      padding: 10px 14px;
      background: rgba(69, 9, 32, 0.75);
      border: 1.5px solid #A53860;
      border-radius: 6px;
      color: #FFA5AB;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.32rem;
      cursor: pointer;
    }
    .av-reset-btn:active { transform: translateY(2px); }

    .av-file-input { display: none; }

    .av-hint {
      font-size: 0.26rem; color: rgba(200, 160, 255, 0.6);
      text-align: center; line-height: 1.8;
    }

    @keyframes av-fadein { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(s);
}

/**
 * Open the Avatar Studio modal.
 * @param {Function} [onSaved] Callback invoked whenever an avatar is updated/reset.
 */
export function openAvatarMaker(onSaved) {
  injectCSS();

  let selectedSlot = 'default';

  const backdrop = document.createElement('div');
  backdrop.id = 'avatar-modal-backdrop';
  backdrop.innerHTML = /* html */`
    <div id="avatar-modal">
      <div class="av-header">
        <div class="av-title">👾 AVATAR STUDIO</div>
        <button class="av-close" id="av-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="av-body">
        <div class="av-slots-label">CHOOSE EXPRESSION (8 SLOTS):</div>
        <div class="av-slots-grid" id="av-slots-grid"></div>

        <div class="av-preview-box">
          <canvas class="av-preview-canvas" id="av-preview-canvas" width="64" height="64"></canvas>
          <div class="av-preview-desc" id="av-preview-desc"></div>
        </div>

        <div class="av-btn-row">
          <label class="av-upload-label" style="width: 100%; justify-content: center;">
            <span>📷</span> UPLOAD PHOTO
            <input type="file" id="av-file-input" class="av-file-input" accept="image/*" />
          </label>
        </div>

        <div class="av-hint">
          * Photos are automatically cropped to circle, quantized to the 20-color retro palette & scaled to 32×32 pixel sprite.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  function renderSlots() {
    const grid = document.getElementById('av-slots-grid');
    if (!grid) return;

    grid.innerHTML = EXPRESSION_SLOTS.map(slot => {
      const isCustom = !!getSavedAvatarDataUrl(slot.id);
      const isActive = slot.id === selectedSlot;
      return /* html */`
        <button class="av-slot-btn ${isActive ? 'active' : ''}" data-slot="${slot.id}">
          <span class="av-slot-status">${isCustom ? '⭐' : '✨'}</span>
          <span>${slot.label}</span>
        </button>
      `;
    }).join('');
  }

  function updatePreview() {
    const canvas = document.getElementById('av-preview-canvas');
    const desc = document.getElementById('av-preview-desc');
    if (!canvas || !desc) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    // Draw using active avatar system
    drawAvatar(ctx, 32, 32, 28, selectedSlot);

    const slotInfo = EXPRESSION_SLOTS.find(s => s.id === selectedSlot);
    const isCustom = !!getSavedAvatarDataUrl(selectedSlot);

    desc.innerHTML = `
      <strong style="color:#ffd93b">${slotInfo?.label?.toUpperCase() || ''}</strong><br>
      ${slotInfo?.desc || ''}<br>
      <span style="color:${isCustom ? '#5effa3' : '#ffd93b'}; font-size:0.28rem;">
        ${isCustom ? '⭐ USER UPLOAD ACTIVE' : '✨ REAL PHOTO AVATAR ACTIVE'}
      </span>
    `;
  }

  // ── Slot click ─────────────────────────────────────────────────────────────
  backdrop.addEventListener('click', (e) => {
    const btn = e.target.closest('.av-slot-btn');
    if (btn) {
      selectedSlot = btn.dataset.slot;
      renderSlots();
      updatePreview();
    }
  });

  // ── Upload Photo ───────────────────────────────────────────────────────────
  const fileInput = document.getElementById('av-file-input');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await pixelatePhoto(file, 32);
      saveAvatar(selectedSlot, dataUrl);
      renderSlots();
      updatePreview();
      onSaved?.(selectedSlot);
    } catch (err) {
      alert('Error processing photo: ' + err.message);
    }
  });


  // ── Close Modal ────────────────────────────────────────────────────────────
  function close() {
    backdrop.remove();
  }
  document.getElementById('av-close-btn').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  renderSlots();
  updatePreview();
}
