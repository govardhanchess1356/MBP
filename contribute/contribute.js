/**
 * contribute/contribute.js — Open Contributor Portal for Muski's 19th Birthday
 *
 * Anyone with the link gets direct access.
 * Contributors can:
 * 1. Write a personal scratch card message with custom theme & emoji
 * 2. Attach multiple media items (photos, voice notes, video clips)
 * 3. Upload WhatsApp stickers of Muski (directly destined for Muski's Sticker Corner)
 * 4. Leave an optional secret private note for Muski's Secret Vault
 */

import { injectPalette } from '@/config/palette.js';
import { saveContribution } from '@/data/contribute-store.js';

injectPalette();

const root = document.getElementById('contribute-app');

function injectCSS() {
  if (document.getElementById('contrib-full-css')) return;
  const s = document.createElement('style');
  s.id = 'contrib-full-css';
  s.textContent = /* css */`
    :root {
      --c-cream: #F9DBBD;
      --c-blush: #FFA5AB;
      --c-rose: #DA627D;
      --c-magenta: #A53860;
      --c-maroon: #450920;
      --c-gold: #ffd93b;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: radial-gradient(circle at top, #1e082c 0%, #0d0515 100%);
      color: var(--c-cream);
      font-family: 'Press Start 2P', monospace;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 16px 12px 48px;
    }

    #c-container {
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .c-header {
      text-align: center;
      padding: 18px 12px;
      background: linear-gradient(135deg, rgba(69,9,32,0.85), rgba(165,56,96,0.6));
      border: 2px solid var(--c-rose);
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(218,98,125,0.25);
    }
    .c-header h1 {
      font-size: clamp(0.7rem, 4vw, 0.95rem);
      color: var(--c-gold);
      line-height: 1.8;
      letter-spacing: 0.05em;
    }
    .c-header p {
      font-size: 0.36rem;
      color: var(--c-blush);
      margin-top: 8px;
      line-height: 1.8;
    }

    .c-card {
      background: rgba(18, 6, 30, 0.9);
      border: 2px solid var(--c-magenta);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }

    .c-section-title {
      font-size: 0.44rem;
      color: var(--c-blush);
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1.5px dashed rgba(218,98,125,0.4);
      padding-bottom: 8px;
    }

    .c-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .c-label {
      font-size: 0.3rem;
      color: var(--c-cream);
      letter-spacing: 0.04em;
    }
    .c-subtext {
      font-size: 0.24rem;
      color: rgba(249,219,189,0.6);
      line-height: 1.6;
    }

    input[type="text"], textarea, select {
      background: rgba(6, 2, 26, 0.9);
      border: 1.5px solid var(--c-rose);
      border-radius: 6px;
      color: #fff;
      font-family: inherit;
      font-size: 0.38rem;
      padding: 10px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, textarea:focus, select:focus {
      border-color: var(--c-gold);
      box-shadow: 0 0 8px rgba(255,217,59,0.3);
    }
    textarea {
      min-height: 80px;
      resize: vertical;
      line-height: 1.8;
    }

    /* Emoji Picker */
    .c-emoji-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }
    .c-emoji-btn {
      font-size: 1.3rem;
      background: rgba(69,9,32,0.6);
      border: 1.5px solid rgba(165,56,96,0.4);
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      text-align: center;
    }
    .c-emoji-btn.active {
      border-color: var(--c-gold);
      background: rgba(165,56,96,0.9);
      transform: scale(1.1);
    }

    /* Theme Picker */
    .c-theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .c-theme-btn {
      padding: 8px 4px;
      font-size: 0.26rem;
      color: #fff;
      border: 1.5px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      line-height: 1.5;
    }
    .c-theme-btn.active {
      border-color: var(--c-gold);
      box-shadow: 0 0 10px rgba(255,217,59,0.5);
    }

    /* Media Uploader */
    .c-upload-box {
      border: 2px dashed var(--c-rose);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      background: rgba(69,9,32,0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .c-upload-box:hover {
      background: rgba(69,9,32,0.5);
      border-color: var(--c-gold);
    }

    .c-thumb-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .c-thumb {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      border: 1.5px solid var(--c-rose);
      position: relative;
      overflow: hidden;
      background: #000;
    }
    .c-thumb img, .c-thumb video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .c-thumb-remove {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(255,0,0,0.8);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Voice Note Recorder */
    .c-record-btn {
      background: linear-gradient(135deg, #a53860, #450920);
      border: 1.5px solid var(--c-blush);
      border-radius: 6px;
      color: #fff;
      font-family: inherit;
      font-size: 0.32rem;
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .c-record-btn.recording {
      background: red;
      animation: rec-pulse 1s infinite alternate;
    }
    @keyframes rec-pulse {
      from { opacity: 0.7; } to { opacity: 1; }
    }

    /* Submit Button */
    .c-submit-btn {
      background: linear-gradient(135deg, #ffd93b, #c07020);
      color: #1a0a2e;
      border: 2px solid #fff;
      border-radius: 8px;
      font-family: inherit;
      font-size: clamp(0.48rem, 3.2vw, 0.65rem);
      padding: 16px 20px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255,217,59,0.4);
      margin-top: 10px;
      letter-spacing: 0.05em;
    }
    .c-submit-btn:active {
      transform: scale(0.97);
    }

    /* Success Screen */
    #c-success-overlay {
      position: fixed; inset: 0;
      background: rgba(10,4,20,0.95);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      gap: 16px;
      animation: pop-in 0.3s ease;
    }
    @keyframes pop-in { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
  `;
  document.head.appendChild(s);
}

// ─── State ────────────────────────────────────────────────────────────────────
let selectedEmoji = '🎂';
let selectedTheme = 'theme1';
const mediaFiles = [];
const stickerFiles = [];
let audioBlob = null;
let audioRecorder = null;
let recordingTimer = null;
let recordingSeconds = 0;

const EMOJIS = ['🎂', '🌸', '⭐', '🎁', '🎈', '🪄', '🦋', '🌙', '💎', '🎀', '🌺', '✨', '👑', '💖', '🍕', '🎉', '🍧', '🍰'];

const THEMES = [
  { id: 'theme1', label: '🌸 CHERRY BLUSH', bg: 'linear-gradient(135deg,#450920,#A53860)' },
  { id: 'theme2', label: '💜 VIOLET STAR',   bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },
  { id: 'theme3', label: '✨ GOLDEN GLOW',  bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  { id: 'theme4', label: '💖 QUEEN PINK',   bg: 'linear-gradient(135deg,#8b0032,#ff3385)' },
  { id: 'theme5', label: '💎 OCEAN BLUE',   bg: 'linear-gradient(135deg,#0a2a4a,#1a5080)' },
];

function renderForm() {
  injectCSS();
  const params = new URLSearchParams(window.location.search);
  const defaultName = params.get('name') || '';

  root.innerHTML = /* html */`
    <div id="c-container">
      <!-- Header -->
      <div class="c-header">
        <h1>🎁 MUSKI'S 19TH ARCADE</h1>
        <p>DROP YOUR PERSONAL WISHES, PHOTOS, VOICE NOTES & WHATSAPP STICKERS FOR MUSKI!</p>
      </div>

      <!-- 1. Who are you? -->
      <div class="c-card">
        <div class="c-section-title">👤 STEP 1: WHO ARE YOU?</div>
        <div class="c-field">
          <label class="c-label">YOUR NAME / NICKNAME:</label>
          <input type="text" id="c-name" value="${defaultName}" placeholder="e.g. Ayesha / Rahul / Bestie" required />
          <span class="c-subtext">Muski will see this on her scratch cards & sticker board!</span>
        </div>
      </div>

      <!-- 2. Scratch Card Wish -->
      <div class="c-card">
        <div class="c-section-title">🃏 STEP 2: SCRATCH CARD WISH</div>

        <div class="c-field">
          <label class="c-label">CARD TITLE (OPTIONAL):</label>
          <input type="text" id="c-card-title" placeholder="e.g. BEST SISTER EVER / MEMORIES OF 2026" />
        </div>

        <div class="c-field">
          <label class="c-label">BIRTHDAY MESSAGE / WISH:</label>
          <textarea id="c-card-msg" placeholder="Write your heartfelt wish, inside jokes, or memory for Muski..."></textarea>
          <span class="c-subtext">Muski scratches off a silver coating in the Prize Machine to reveal this!</span>
        </div>

        <div class="c-field">
          <label class="c-label">CHOOSE CARD EMOJI:</label>
          <div class="c-emoji-grid" id="c-emoji-picker">
            ${EMOJIS.map(em => `
              <button type="button" class="c-emoji-btn ${em === selectedEmoji ? 'active' : ''}" data-emoji="${em}">${em}</button>
            `).join('')}
          </div>
        </div>

        <div class="c-field">
          <label class="c-label">CARD COLOR THEME:</label>
          <div class="c-theme-grid" id="c-theme-picker">
            ${THEMES.map(th => `
              <button type="button" class="c-theme-btn ${th.id === selectedTheme ? 'active' : ''}" data-theme="${th.id}" style="background:${th.bg}">
                ${th.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 3. Multi-Media Attachment -->
      <div class="c-card">
        <div class="c-section-title">📸 STEP 3: ATTACH PHOTOS, VOICE OR VIDEO</div>
        <span class="c-subtext">Cards in the game can show multiple photos, voice recordings, and video clips!</span>

        <!-- Photos & Videos File Upload -->
        <div class="c-field">
          <label class="c-label">UPLOAD PHOTOS / SHORT CLIPS:</label>
          <div class="c-upload-box" id="c-media-drop">
            <span style="font-size:1.5rem">📷</span>
            <span style="font-size:0.32rem; color:var(--c-blush);">TAP TO BROWSE PHOTOS / VIDEOS</span>
            <input type="file" id="c-media-input" accept="image/*,video/*" multiple style="display:none" />
          </div>
          <div class="c-thumb-strip" id="c-media-thumbs"></div>
        </div>

        <!-- Voice Note Recording -->
        <div class="c-field">
          <label class="c-label">RECORD A VOICE WISH (OPTIONAL):</label>
          <button type="button" class="c-record-btn" id="c-record-btn">
            🎙️ RECORD VOICE NOTE
          </button>
          <div id="c-audio-preview" style="margin-top:6px; display:none;"></div>
        </div>
      </div>

      <!-- 4. WhatsApp Stickers -->
      <div class="c-card">
        <div class="c-section-title">🌸 STEP 4: WHATSAPP STICKERS CORNER</div>
        <span class="c-subtext">Upload transparent WhatsApp stickers or funny stickers of Muski! They will go straight to Muski's STICKER CORNER wall!</span>

        <div class="c-field">
          <div class="c-upload-box" id="c-sticker-drop">
            <span style="font-size:1.5rem">✨</span>
            <span style="font-size:0.32rem; color:var(--c-gold);">TAP TO UPLOAD WHATSAPP STICKERS (PNG/WebP)</span>
            <input type="file" id="c-sticker-input" accept="image/png,image/webp,image/*" multiple style="display:none" />
          </div>
          <div class="c-thumb-strip" id="c-sticker-thumbs"></div>
        </div>
      </div>

      <!-- 5. Secret Vault Note -->
      <div class="c-card">
        <div class="c-section-title">🔒 STEP 5: SECRET VAULT NOTE (OPTIONAL)</div>
        <span class="c-subtext">Only Muski can read this using her secret password in the Hidden Vault!</span>
        <textarea id="c-vault-note" placeholder="Write something personal or confidential just for Muski's eyes..."></textarea>
      </div>

      <!-- Submit -->
      <button type="button" class="c-submit-btn" id="c-submit-btn">
        🚀 SEND BIRTHDAY SURPRISE!
      </button>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  // Emoji Selection
  document.getElementById('c-emoji-picker')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.c-emoji-btn');
    if (!btn) return;
    document.querySelectorAll('.c-emoji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedEmoji = btn.dataset.emoji;
  });

  // Theme Selection
  document.getElementById('c-theme-picker')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.c-theme-btn');
    if (!btn) return;
    document.querySelectorAll('.c-theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTheme = btn.dataset.theme;
  });

  // Media Upload (Photos/Videos)
  const mediaDrop = document.getElementById('c-media-drop');
  const mediaInput = document.getElementById('c-media-input');
  mediaDrop?.addEventListener('click', () => mediaInput?.click());

  mediaInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const isVideo = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = (evt) => {
        mediaFiles.push({
          type: isVideo ? 'video' : 'photo',
          dataUrl: evt.target.result,
          name: file.name,
        });
        updateMediaThumbs();
      };
      reader.readAsDataURL(file);
    }
  });

  // Sticker Upload
  const stickerDrop = document.getElementById('c-sticker-drop');
  const stickerInput = document.getElementById('c-sticker-input');
  stickerDrop?.addEventListener('click', () => stickerInput?.click());

  stickerInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        stickerFiles.push({
          dataUrl: evt.target.result,
          name: file.name,
        });
        updateStickerThumbs();
      };
      reader.readAsDataURL(file);
    }
  });

  // Voice Recording
  const recBtn = document.getElementById('c-record-btn');
  recBtn?.addEventListener('click', toggleRecording);

  // Submit
  document.getElementById('c-submit-btn')?.addEventListener('click', handleSubmit);
}

function updateMediaThumbs() {
  const container = document.getElementById('c-media-thumbs');
  if (!container) return;
  container.innerHTML = mediaFiles.map((m, idx) => `
    <div class="c-thumb">
      ${m.type === 'video'
        ? `<video src="${m.dataUrl}" muted></video>`
        : `<img src="${m.dataUrl}" alt="" />`}
      <button type="button" class="c-thumb-remove" onclick="window.__removeMedia(${idx})">×</button>
    </div>
  `).join('');
}

function updateStickerThumbs() {
  const container = document.getElementById('c-sticker-thumbs');
  if (!container) return;
  container.innerHTML = stickerFiles.map((st, idx) => `
    <div class="c-thumb" style="background:rgba(255,255,255,0.1)">
      <img src="${st.dataUrl}" alt="" style="object-fit:contain" />
      <button type="button" class="c-thumb-remove" onclick="window.__removeSticker(${idx})">×</button>
    </div>
  `).join('');
}

window.__removeMedia = (idx) => {
  mediaFiles.splice(idx, 1);
  updateMediaThumbs();
};

window.__removeSticker = (idx) => {
  stickerFiles.splice(idx, 1);
  updateStickerThumbs();
};

async function toggleRecording() {
  const btn = document.getElementById('c-record-btn');
  if (!btn) return;

  if (audioRecorder && audioRecorder.state === 'recording') {
    audioRecorder.stop();
    btn.classList.remove('recording');
    btn.innerHTML = '🎙️ RECORD AGAIN';
    clearInterval(recordingTimer);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorder = new MediaRecorder(stream);
    const chunks = [];

    audioRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    audioRecorder.onstop = () => {
      audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const preview = document.getElementById('c-audio-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `
          <div style="font-size:0.28rem; color:#ffd93b; margin-bottom:4px;">VOICE NOTE RECORDED (${recordingSeconds}s) ✓</div>
          <audio controls src="${audioUrl}" style="width:100%; height:32px;"></audio>
        `;
      }
      // Also convert to dataUrl for persistence
      const reader = new FileReader();
      reader.onload = (e) => {
        mediaFiles.push({
          type: 'audio',
          dataUrl: e.target.result,
          name: 'voice_note.webm',
        });
        updateMediaThumbs();
      };
      reader.readAsDataURL(audioBlob);
    };

    audioRecorder.start();
    recordingSeconds = 0;
    btn.classList.add('recording');
    btn.innerHTML = '⏹ STOP RECORDING (0s)';
    recordingTimer = setInterval(() => {
      recordingSeconds++;
      btn.innerHTML = `⏹ STOP RECORDING (${recordingSeconds}s)`;
    }, 1000);
  } catch (err) {
    alert('Microphone access is needed to record a voice note. You can also upload audio files!');
  }
}

async function handleSubmit() {
  const name = document.getElementById('c-name')?.value.trim();
  const cardTitle = document.getElementById('c-card-title')?.value.trim();
  const cardMsg = document.getElementById('c-card-msg')?.value.trim();
  const vaultNote = document.getElementById('c-vault-note')?.value.trim();

  if (!name) {
    alert('Please enter your name so Muski knows who this is from!');
    return;
  }

  if (!cardMsg && stickerFiles.length === 0 && !vaultNote) {
    alert('Please add a birthday message, upload a sticker, or write a vault note!');
    return;
  }

  const submitBtn = document.getElementById('c-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'PACKING SURPRISE...';
  }

  try {
    await saveContribution({
      authorName: name,
      cardTitle: cardTitle,
      cardMessage: cardMsg,
      cardEmoji: selectedEmoji,
      cardTheme: selectedTheme,
      mediaFiles: mediaFiles,
      stickers: stickerFiles,
      vaultNote: vaultNote,
    });

    showSuccess(name);
  } catch (err) {
    console.error('Submit error:', err);
    alert('Failed to save. Please try again!');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = '🚀 SEND BIRTHDAY SURPRISE!';
    }
  }
}

function showSuccess(name) {
  const overlay = document.createElement('div');
  overlay.id = 'c-success-overlay';
  overlay.innerHTML = /* html */`
    <div style="font-size:3.5rem;">🎊</div>
    <div style="font-size:0.75rem; color:#ffd93b; line-height:1.8;">THANK YOU, ${name.toUpperCase()}!</div>
    <div style="font-size:0.38rem; color:#FFA5AB; max-width:380px; line-height:2.2;">
      YOUR WISHES, MEMORIES & WHATSAPP STICKERS ARE SAFELY STORED IN THE MUSKIVERSE!<br><br>
      MUSKI WILL SCRATCH & REVEAL THEM ON HER 19TH BIRTHDAY! 🎂✨
    </div>
    <button id="c-more-btn" style="
      margin-top: 14px;
      background: linear-gradient(135deg,#A53860,#450920);
      border: 2px solid #DA627D;
      border-radius: 8px;
      color: #fff;
      font-family: inherit;
      font-size: 0.4rem;
      padding: 12px 24px;
      cursor: pointer;
    ">
      + ADD ANOTHER SURPRISE
    </button>
  `;
  document.body.appendChild(overlay);

  document.getElementById('c-more-btn')?.addEventListener('click', () => {
    overlay.remove();
    mediaFiles.length = 0;
    stickerFiles.length = 0;
    audioBlob = null;
    renderForm();
  });
}

// Initial Boot
renderForm();
