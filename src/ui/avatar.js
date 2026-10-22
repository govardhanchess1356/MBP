/**
 * src/ui/avatar.js — Custom Cartoon Avatar Engine & Renderer
 *
 * Implements:
 * 1. Customized cartoon avatar sprites modeled after Muski's real photos:
 *    - 'default': Sweet gentle smile, dark wavy locks, teal collar, gold earrings (Photo 1)
 *    - 'happy': Big joyful smile, blushing cheeks, sparkling eyes & 19th birthday tiara
 *    - 'cool': Beige cap, aviator sunglasses with shine sheen, confident smirk (Photo 2)
 *    - 'grumpy': Pressure cooker hat with handle & hissing steam, red flushed pout (Photo 3 Meme)
 *    - 'surprised': Round transparent glasses, cute puffed balloon cheeks, pursed lips (Photo 4)
 *    - 'wink': Playful winking eye with star sparkle & smirk
 *    - 'laugh': Big laughing expression with golden party sparkles
 *    - 'star_eyes': Golden star anime eyes with celebratory victory glow
 * 2. High-performance caching & image preloading
 * 3. Fallback: Detailed canvas vector cartoon face matching the exact photo themes
 * 4. User customization: Photo upload with retro pixel palette quantization
 */

export const EXPRESSION_SLOTS = [
  { id: 'default',   label: 'Normal',    desc: 'Sweet smile portrait (Real photo 🌸)' },
  { id: 'happy',     label: 'Happy',     desc: 'Celebration smile (Real photo 💖)' },
  { id: 'cool',      label: 'Cool',      desc: 'Cap & aviator sunglasses (Real photo 😎)' },
  { id: 'grumpy',    label: 'Grumpy',    desc: 'Pressure cooker meme face (Real photo ♨️)' },
  { id: 'surprised', label: 'Surprised', desc: 'Round glasses & puffed cheeks (Real photo 🥺)' },
  { id: 'wink',      label: 'Wink',      desc: 'Cap & sunglasses smirk (Real photo ✨)' },
  { id: 'laugh',     label: 'Laughing',  desc: 'Joyful celebration smile (Real photo 🥳)' },
  { id: 'star_eyes', label: 'Star Eyes', desc: 'Victory celebration (Real photo 🌟)' },
];

export const RETRO_PALETTE_HEX = [
  '#F9DBBD', '#FFA5AB', '#DA627D', '#A53860', '#450920',
  '#ff6eb4', '#ffb340', '#5effa3', '#5ee0ff', '#ffd93b',
  '#c9a0ff', '#2a1a0a', '#f5c5a3', '#ffffff', '#06021a',
  '#1a1033', '#35e0ff', '#780000', '#1b4332', '#d8b4e2'
];

export const BUILTIN_CARTOON_AVATARS = {
  default:   '/images/faces/avatar-default.png?v=nobg_v3',
  happy:     '/images/faces/avatar-happy.png?v=nobg_v3',
  cool:      '/images/faces/avatar-cool.png?v=nobg_v3',
  grumpy:    '/images/faces/avatar-grumpy.png?v=nobg_v3',
  surprised: '/images/faces/avatar-surprised.png?v=nobg_v3',
  wink:      '/images/faces/avatar-wink.png?v=nobg_v3',
  laugh:     '/images/faces/avatar-laugh.png?v=nobg_v3',
  star_eyes: '/images/faces/avatar-star_eyes.png?v=nobg_v3',
};

// Convert hex palette to RGB triplets for Euclidean distance color quantization
function parseHex(h) {
  const clean = h.replace('#', '');
  const n = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return [255, 255, 255];
}

const PALETTE_RGB = RETRO_PALETTE_HEX.map(parseHex);

function nearestPaletteColor(r, g, b) {
  let best = PALETTE_RGB[0];
  let minD = Infinity;
  for (const c of PALETTE_RGB) {
    const dr = r - c[0];
    const dg = g - c[1];
    const db = b - c[2];
    const d = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
    if (d < minD) {
      minD = d;
      best = c;
    }
  }
  return best;
}

// ── In-memory sprite cache ───────────────────────────────────────────────────
const _spriteCache = new Map();
const _builtinImageCache = new Map();

// Preload builtin cartoon avatars
if (typeof window !== 'undefined') {
  Object.entries(BUILTIN_CARTOON_AVATARS).forEach(([slot, src]) => {
    const img = new Image();
    img.src = src;
    _builtinImageCache.set(slot, img);
  });
}

/**
 * Pixelate an image file/blob or URL into a 32x32 retro circular sprite.
 */
export async function pixelatePhoto(source, targetSize = 32) {
  const img = await loadImage(source);

  const minDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const sx = ((img.naturalWidth || img.width) - minDim) / 2;
  const sy = ((img.naturalHeight || img.height) - minDim) / 2;

  const oc = document.createElement('canvas');
  oc.width = targetSize;
  oc.height = targetSize;
  const octx = oc.getContext('2d', { willReadFrequently: true });

  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

  const imgData = octx.getImageData(0, 0, targetSize, targetSize);
  const data = imgData.data;
  const center = targetSize / 2;
  const radius = targetSize / 2;
  const radiusSq = radius * radius;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const idx = (y * targetSize + x) * 4;
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      const distSq = dx * dx + dy * dy;

      if (distSq > radiusSq) {
        data[idx + 3] = 0;
      } else {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 64) {
          data[idx + 3] = 0;
        } else {
          const [nr, ng, nb] = nearestPaletteColor(r, g, b);
          data[idx]     = nr;
          data[idx + 1] = ng;
          data[idx + 2] = nb;
          data[idx + 3] = 255;
        }
      }
    }
  }

  octx.putImageData(imgData, 0, 0);

  octx.save();
  octx.beginPath();
  octx.arc(center, center, radius - 0.75, 0, Math.PI * 2);
  octx.strokeStyle = '#DA627D';
  octx.lineWidth = 1;
  octx.stroke();
  octx.restore();

  return oc.toDataURL('image/png');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete) {
      resolve(src);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for avatar processing'));

    if (src instanceof Blob || src instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(src);
    } else if (typeof src === 'string') {
      img.src = src;
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

// ── Storage and retrieval ───────────────────────────────────────────────────

export function saveAvatar(slotId, dataUrl) {
  try {
    localStorage.setItem(`muski_avatar_${slotId}`, dataUrl);
    _spriteCache.delete(slotId);
    return true;
  } catch (err) {
    console.error('[avatar] Failed to save avatar to localStorage:', err);
    return false;
  }
}

export function getSavedAvatarDataUrl(slotId) {
  try {
    return localStorage.getItem(`muski_avatar_${slotId}`) || null;
  } catch {
    return null;
  }
}

export function removeAvatar(slotId) {
  try {
    localStorage.removeItem(`muski_avatar_${slotId}`);
  } catch {
    // ignore
  }
  _spriteCache.delete(slotId);
}

/**
 * Get active sprite image element for given slot.
 * Returns custom uploaded photo if saved, otherwise returns custom cartoon avatar image.
 */
export function getCustomAvatarSprite(slotId = 'default') {
  if (_spriteCache.has(slotId)) {
    return _spriteCache.get(slotId);
  }

  // 1. User uploaded image from localStorage
  const savedDataUrl = getSavedAvatarDataUrl(slotId);
  if (savedDataUrl) {
    const img = new Image();
    img.src = savedDataUrl;
    _spriteCache.set(slotId, img);
    return img;
  }

  // 2. Custom cartoon avatar image for this expression
  if (_builtinImageCache.has(slotId)) {
    const img = _builtinImageCache.get(slotId);
    if (img && img.complete && img.naturalWidth > 0) return img;
  }

  // 3. Fallback to default custom cartoon avatar
  if (_builtinImageCache.has('default')) {
    const defImg = _builtinImageCache.get('default');
    if (defImg && defImg.complete && defImg.naturalWidth > 0) return defImg;
  }

  return null;
}

// ─── Universal Draw Function ────────────────────────────────────────────────
/**
 * Draw avatar at (cx, cy) with radius r.
 * Uses high-res custom cartoon avatar image, with fallback to vector cartoon renderer.
 */
export function drawAvatar(ctx, cx, cy, r, expression = 'default') {
  const sprite = getCustomAvatarSprite(expression);

  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    ctx.save();

    // 1. Soft glowing pastel badge disk behind the cutout face
    const diskGrad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    if (expression === 'grumpy') {
      diskGrad.addColorStop(0, '#fff0f0');
      diskGrad.addColorStop(0.85, '#ffccd0');
      diskGrad.addColorStop(1, '#ff99a0');
    } else if (expression === 'cool' || expression === 'wink') {
      diskGrad.addColorStop(0, '#f0faff');
      diskGrad.addColorStop(0.85, '#cceeff');
      diskGrad.addColorStop(1, '#99ddff');
    } else {
      diskGrad.addColorStop(0, '#fff5f8');
      diskGrad.addColorStop(0.85, '#ffe0eb');
      diskGrad.addColorStop(1, '#ffa5ab');
    }
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw the transparent cutout face with circular clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // 3. Polished gold rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd93b';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.stroke();

    // 4. Subtle inner highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(0.75, r * 0.035);
    ctx.stroke();

    ctx.restore();
  } else {
    // Draw vector handcrafted cartoon avatar matching Muski's photos
    drawFallbackAvatar(ctx, cx, cy, r, expression);
  }
}

// ─── Handcrafted Vector Cartoon Face ─────────────────────────────────────────
export function drawFallbackAvatar(ctx, cx, cy, r, expression = 'default') {
  ctx.save();
  const s = r / 16;

  // Background disk / skin tone
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f3c7a5'; // warm wheat skin tone
  ctx.fill();

  // Wavy Dark Brown / Black Hair (Back volume)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#1c100b';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 0.62);

  // Soft wavy bangs & side tresses
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 0.3);
  ctx.quadraticCurveTo(cx - r * 0.45, cy - r * 0.05, cx - r * 0.1, cy - r * 0.3);
  ctx.quadraticCurveTo(cx + r * 0.35, cy - r * 0.05, cx + r, cy - r * 0.35);
  ctx.lineTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy - r);
  ctx.closePath();
  ctx.fillStyle = '#1c100b';
  ctx.fill();

  // Left hair lock falling forward over shoulder
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.65, cy + r * 0.35, s * 4, s * 9, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // ── EXPRESSION SPECIFICS ──

  // PHOTO 3: PRESSURE COOKER HAT (Grumpy / Hit)
  if (expression === 'grumpy') {
    // Silver pressure cooker hat
    ctx.save();
    const cookerW = r * 1.5;
    const cookerH = r * 0.5;
    const cookerY = cy - r * 0.85;

    // Cooker body gradient
    const grad = ctx.createLinearGradient(cx - cookerW / 2, 0, cx + cookerW / 2, 0);
    grad.addColorStop(0, '#8e939d');
    grad.addColorStop(0.3, '#d8dbe2');
    grad.addColorStop(0.7, '#ffffff');
    grad.addColorStop(1, '#686d76');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cx - cookerW / 2, cookerY, cookerW, cookerH, [8, 8, 3, 3]);
    ctx.fill();
    ctx.strokeStyle = '#2b2d35';
    ctx.lineWidth = s * 1.2;
    ctx.stroke();

    // Black bakelite handle sticking out right
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.roundRect(cx + cookerW * 0.45, cookerY + cookerH * 0.2, r * 0.7, s * 4, 3);
    ctx.fill();

    // Whistle weight on top
    ctx.fillStyle = '#d8dbe2';
    ctx.beginPath();
    ctx.roundRect(cx - s * 2, cookerY - s * 6, s * 4, s * 6, 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2d35';
    ctx.lineWidth = s * 0.8;
    ctx.stroke();

    // Steam puffs
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx - s * 5, cookerY - s * 9, s * 3, 0, Math.PI * 2);
    ctx.arc(cx + s * 6, cookerY - s * 10, s * 3.5, 0, Math.PI * 2);
    ctx.arc(cx, cookerY - s * 12, s * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lower face flushed bright red heat
    const flushGrad = ctx.createRadialGradient(cx, cy + r * 0.35, s * 2, cx, cy + r * 0.35, r * 0.7);
    flushGrad.addColorStop(0, 'rgba(255, 50, 70, 0.8)');
    flushGrad.addColorStop(1, 'rgba(255, 50, 70, 0)');
    ctx.fillStyle = flushGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.35, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Spectacles frame
    ctx.strokeStyle = '#5a5e6b';
    ctx.lineWidth = s * 1.4;
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.52, cy - r * 0.18, s * 8, s * 6, 3);
    ctx.roundRect(cx + r * 0.12, cy - r * 0.18, s * 8, s * 6, 3);
    ctx.moveTo(cx - r * 0.12, cy - r * 0.05);
    ctx.lineTo(cx + r * 0.12, cy - r * 0.05);
    ctx.stroke();

    // Grumpy teardrop anime eyes
    ctx.fillStyle = '#1c100b';
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.05, s * 2.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.32, cy - r * 0.05, s * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5ee0ff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy + s * 2.5, s * 1.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.32, cy + s * 2.5, s * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Exaggerated red pouty lips
    ctx.fillStyle = '#d90429';
    ctx.strokeStyle = '#780000';
    ctx.lineWidth = s * 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.42, s * 7, s * 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 5, cy + r * 0.42);
    ctx.quadraticCurveTo(cx, cy + r * 0.36, cx + s * 5, cy + r * 0.42);
    ctx.stroke();

  // PHOTO 2: COOL SUNGLASSES + CAP
  } else if (expression === 'cool') {
    // Beige sun cap
    ctx.fillStyle = '#dcd3be';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.4, r * 0.78, Math.PI, 0);
    ctx.fill();
    // Cap visor brim
    ctx.fillStyle = '#c4b99f';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.35, r * 0.88, s * 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8d8065';
    ctx.lineWidth = s * 1.2;
    ctx.stroke();

    // Dark aviator sunglasses with glossy diagonal sheen
    ctx.fillStyle = '#14141c';
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.58, cy - r * 0.16, s * 9, s * 7, 4);
    ctx.roundRect(cx + r * 0.12, cy - r * 0.16, s * 9, s * 7, 4);
    ctx.fill();
    ctx.strokeStyle = '#ffd93b';
    ctx.lineWidth = s * 1.2;
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(cx - s * 2, cy - r * 0.08);
    ctx.lineTo(cx + s * 2, cy - r * 0.08);
    ctx.stroke();

    // White diagonal reflection glare
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = s * 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy - r * 0.12);
    ctx.lineTo(cx - r * 0.25, cy + r * 0.12);
    ctx.moveTo(cx + r * 0.25, cy - r * 0.12);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.12);
    ctx.stroke();

    // Confident smirk
    ctx.strokeStyle = '#780000';
    ctx.lineWidth = s * 1.8;
    ctx.beginPath();
    ctx.arc(cx + s * 2, cy + r * 0.35, s * 5, 0.2, Math.PI * 0.8);
    ctx.stroke();

  // PHOTO 4: ROUND WIREFRAME GLASSES + PUFFED FISH-FACE CHEEKS (Surprised)
  } else if (expression === 'surprised') {
    // Puffed round cheeks
    ctx.fillStyle = 'rgba(255, 120, 160, 0.55)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.45, cy + r * 0.2, s * 4.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.45, cy + r * 0.2, s * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Big round transparent glasses
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = s * 1.5;
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.06, s * 6, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.32, cy - r * 0.06, s * 6, 0, Math.PI * 2);
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(cx - s * 2, cy - r * 0.06);
    ctx.lineTo(cx + s * 2, cy - r * 0.06);
    ctx.stroke();

    // Wide curious eyes
    ctx.fillStyle = '#1c100b';
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.06, s * 3.2, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.32, cy - r * 0.06, s * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.09, s * 1.4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.29, cy - r * 0.09, s * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Green glass reflection sheen
    ctx.fillStyle = 'rgba(94, 224, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(cx + r * 0.38, cy - r * 0.12, s * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Pursed little button lips pressed in center
    ctx.fillStyle = '#ff4d79';
    ctx.strokeStyle = '#780000';
    ctx.lineWidth = s * 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.38, s * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  // PHOTO 1: HAPPY (Birthday Tiara & Open Smile)
  } else if (expression === 'happy' || expression === 'laugh') {
    // Golden Princess Tiara
    ctx.fillStyle = '#ffd93b';
    ctx.strokeStyle = '#c07020';
    ctx.lineWidth = s * 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.58);
    ctx.lineTo(cx - r * 0.38, cy - r * 0.95);
    ctx.lineTo(cx, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.38, cy - r * 0.95);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Pink ruby gem
    ctx.fillStyle = '#ff1493';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.72, s * 2, 0, Math.PI * 2);
    ctx.fill();

    // Rosy blushing cheeks
    ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.46, cy + r * 0.16, s * 4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.46, cy + r * 0.16, s * 4, 0, Math.PI * 2);
    ctx.fill();

    // Crescent laughing / happy eyes ^_^
    ctx.strokeStyle = '#1c100b';
    ctx.lineWidth = s * 2.4;
    ctx.beginPath();
    ctx.arc(cx - r * 0.33, cy + s * 1.5, s * 4.2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(cx + r * 0.33, cy + s * 1.5, s * 4.2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Big happy smile showing pearly white teeth
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.3, r * 0.36, 0.1, Math.PI - 0.1);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#780000';
    ctx.lineWidth = s * 1.6;
    ctx.stroke();

  // WINK
  } else if (expression === 'wink') {
    // Left eye cute anime sparkle
    ctx.fillStyle = '#1c100b';
    ctx.beginPath(); ctx.arc(cx - r * 0.33, cy - r * 0.05, s * 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.08, s * 1.4, 0, Math.PI * 2); ctx.fill();
    // Right eye winking curve
    ctx.strokeStyle = '#1c100b';
    ctx.lineWidth = s * 2.2;
    ctx.beginPath();
    ctx.arc(cx + r * 0.33, cy + s * 1.5, s * 4, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Cheerful smile
    ctx.strokeStyle = '#780000';
    ctx.lineWidth = s * 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.32, r * 0.28, 0.15, Math.PI - 0.15);
    ctx.stroke();

  // DEFAULT (Sweet Gentle Smile & Almond Eyes)
  } else {
    // Rosy blushing cheeks
    ctx.fillStyle = 'rgba(255, 110, 150, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.46, cy + r * 0.16, s * 3.8, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.46, cy + r * 0.16, s * 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Arched dark eyebrows
    ctx.strokeStyle = '#1c100b';
    ctx.lineWidth = s * 1.6;
    ctx.beginPath();
    ctx.arc(cx - r * 0.33, cy - r * 0.22, s * 4.5, Math.PI * 1.2, Math.PI * 1.8);
    ctx.arc(cx + r * 0.33, cy - r * 0.22, s * 4.5, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();

    // Big pretty almond eyes with double white sparkle
    ctx.fillStyle = '#1c100b';
    ctx.beginPath();
    ctx.arc(cx - r * 0.33, cy - r * 0.05, s * 3.4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.33, cy - r * 0.05, s * 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.36, cy - r * 0.08, s * 1.5, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.31, cy - r * 0.02, s * 0.8, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.30, cy - r * 0.08, s * 1.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy - r * 0.02, s * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Sweet gentle closed smile
    ctx.strokeStyle = '#8b1e3f';
    ctx.lineWidth = s * 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.32, r * 0.28, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Golden Dangler Earrings (Visible on all expressions)
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(cx - r * 0.88, cy + r * 0.12, s * 2, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.88, cy + r * 0.12, s * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb703';
  ctx.beginPath();
  ctx.arc(cx - r * 0.88, cy + r * 0.12 + s * 3, s * 1.6, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.88, cy + r * 0.12 + s * 3, s * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Outer Golden Ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd93b';
  ctx.lineWidth = Math.max(1.5, s * 1.6);
  ctx.stroke();

  ctx.restore();
}

/** Pre-rendered offscreen fallback canvas cache */
const _fallbackCache = {};
export function getFallbackCanvas(size = 32, expression = 'default') {
  const key = `${size}_${expression}`;
  if (_fallbackCache[key]) return _fallbackCache[key];

  const oc  = document.createElement('canvas');
  oc.width  = size;
  oc.height = size;
  const ctx = oc.getContext('2d');
  drawAvatar(ctx, size / 2, size / 2, size / 2 - 1, expression);
  _fallbackCache[key] = oc;
  return oc;
}
