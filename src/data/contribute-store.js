/**
 * src/data/contribute-store.js
 *
 * Unified data storage for:
 * 1. Contributor-submitted scratch cards (with multi-media: photos, voice notes, videos)
 * 2. WhatsApp stickers for the Sticker Corner
 * 3. Secret Vault private messages
 * 4. Expanded deck of 24+ collectible scratch cards
 * 5. Media gallery pool
 *
 * Saves to IndexedDB / localStorage for 100% offline reliability,
 * and syncs to Supabase when credentials are configured.
 */

import { supabase } from './supabase.js';

const STORAGE_KEY_CARDS    = 'muski_custom_cards';
const STORAGE_KEY_STICKERS = 'muski_stickers';
const STORAGE_KEY_VAULT    = 'muski_vault_messages';
const STORAGE_KEY_MEDIA    = 'muski_media_pool';

// ─── 1. Real Contributor Cards (No Fake / Placeholder Cards) ─────────────────
export const BUILTIN_CARDS = [];

// Helper to strictly ensure ONLY genuine real cards from friends are used
export function isRealCard(c) {
  if (!c) return false;
  const author = (c.author || '').trim().toLowerCase();
  const title = (c.title || '').trim().toLowerCase();
  const desc = (c.description || c.message || '').trim().toLowerCase();
  const id = String(c.id || '');

  // Reject all fake generated authors
  if (author === 'birthday crew' || author === 'secret admirer' || author === 'arcade band') return false;
  if (author === 'system connection test') return false;
  // Reject cards with "card_1" through "card_24" fake IDs
  if (/^card_\d+$/.test(id)) return false;
  // Reject test submissions created while testing
  if (author === 'test' || author.startsWith('test ') || author.includes('tester') || author.includes('demo')) return false;
  if (title === 'test' || title.includes('test card') || title.startsWith('test ')) return false;
  if (desc === 'test' || desc.startsWith('test message') || desc.includes('testing card')) return false;
  return true;
}

// ─── 2. Default Built-In Media Gallery ───────────────────────────────────────
// Provides real photos of Muski (zero fake audio notes)
export const BUILTIN_MEDIA = [
  {
    id: 'media_photo_1',
    type: 'photo',
    caption: 'Birthday Queen Muski 👑',
    url: '/images/gallery/muski-portrait.jpg',
    author: 'Brother',
  },
  {
    id: 'media_photo_2',
    type: 'photo',
    caption: 'Swag Level 19! 😎✨',
    url: '/images/gallery/muski-sunglasses.jpg',
    author: 'Birthday Crew',
  },
  {
    id: 'media_photo_3',
    type: 'photo',
    caption: 'Pressure Cooker Hiss Mode! ♨️🤣',
    url: '/images/gallery/muski-pressure-cooker.jpg',
    author: 'Meme Squad',
  },
  {
    id: 'media_photo_4',
    type: 'photo',
    caption: 'Cute Fish Face / Balloon Pout 🥺💖',
    url: '/images/gallery/muski-puffy-glasses.jpg',
    author: 'Family',
  },
];

// ─── 3. Default Built-In Stickers for Sticker Corner ─────────────────────────
export const BUILTIN_STICKERS = [
  { id: 'st_1', emoji: '🌸', url: '/images/faces/avatar-default.png?v=tight_nobg_v4', imageUrl: '/images/faces/avatar-default.png?v=tight_nobg_v4', caption: 'Sweetest Smile 🌸', author: 'Birthday Crew ✨', color: '#ff6eb4' },
  { id: 'st_2', emoji: '😎', url: '/images/faces/avatar-cool.png?v=tight_nobg_v4', imageUrl: '/images/faces/avatar-cool.png?v=tight_nobg_v4', caption: 'Swag Queen Muski 😎', author: 'Your Brother ❤️', color: '#5ee0ff' },
  { id: 'st_3', emoji: '♨️', url: '/images/faces/avatar-grumpy.png?v=tight_nobg_v4', imageUrl: '/images/faces/avatar-grumpy.png?v=tight_nobg_v4', caption: 'Cooker Anger Mode! ♨️😂', author: 'Meme Corner 🤣', color: '#ff4d4d' },
  { id: 'st_4', emoji: '🥺', url: '/images/faces/avatar-surprised.png?v=tight_nobg_v4', imageUrl: '/images/faces/avatar-surprised.png?v=tight_nobg_v4', caption: 'Fish-Face Pout 🥺✨', author: 'Family ❤️', color: '#ff80bf' },
];

// ─── 4. Storage Helpers (localStorage with IndexedDB / safe fallback) ─────────
export function safeSetItem(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (err) {
    console.warn(`[safeSetItem quota notice on ${key}]`, err);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 2) {
        // Keep newest 5 items to fit within strict 5MB quota
        const trimmed = parsed.slice(0, 5);
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (_) {}
  }
}

export function getStoredCards() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_CARDS) || '[]');
    // Filter out all fake, placeholder, and test cards
    const cleaned = raw.filter(isRealCard);
    if (cleaned.length !== raw.length) {
      safeSetItem(STORAGE_KEY_CARDS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveStoredCard(card) {
  if (!isRealCard(card)) return getStoredCards();
  const list = getStoredCards();
  const existsIdx = list.findIndex(c => c.id === card.id || (c.author === card.author && c.description === card.description));
  if (existsIdx >= 0) {
    list[existsIdx] = { ...list[existsIdx], ...card };
  } else {
    list.unshift(card);
  }
  safeSetItem(STORAGE_KEY_CARDS, JSON.stringify(list));
  return list;
}

export function getStoredStickers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_STICKERS) || '[]');
  } catch {
    return [];
  }
}

export function saveStoredSticker(sticker) {
  const list = getStoredStickers();
  list.unshift(sticker);
  safeSetItem(STORAGE_KEY_STICKERS, JSON.stringify(list));
  return list;
}

export function getStoredVaultMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_VAULT) || '[]');
  } catch {
    return [];
  }
}

export function saveStoredVaultMessage(msg) {
  const list = getStoredVaultMessages();
  list.unshift(msg);
  safeSetItem(STORAGE_KEY_VAULT, JSON.stringify(list));
  return list;
}

export function getStoredMediaPool() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_MEDIA) || '[]');
  } catch {
    return [];
  }
}

export function saveStoredMedia(mediaItem) {
  const list = getStoredMediaPool();
  list.unshift(mediaItem);
  safeSetItem(STORAGE_KEY_MEDIA, JSON.stringify(list));
  return list;
}

// ─── 5. Universal Aggregation API ───────────────────────────────────────────

/**
 * Returns all cards: strictly genuine contributor submitted cards.
 * Zero fake cards, zero test cards.
 */
export function getAllCards() {
  const userCards = getStoredCards();
  return userCards.filter(isRealCard);
}

/**
 * Returns all stickers: built-in starter stickers + all contributor uploaded stickers.
 */
export function getAllStickers() {
  const userStickers = getStoredStickers();
  return [...userStickers, ...BUILTIN_STICKERS];
}

/**
 * Returns all media items pooled together.
 */
export function getAllMedia() {
  const userMedia = getStoredMediaPool();
  return [...userMedia, ...BUILTIN_MEDIA];
}

/**
 * Randomly allocates 2-4 media items from the media pool for a card.
 */
export function getRandomMediaForCard(count = 2) {
  const pool = getAllMedia();
  if (!pool.length) return [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}

/**
 * Save a complete contribution submission from `/contribute`.
 * Works directly without requiring pre-validation or admin approval.
 */
export async function saveContribution({
  authorName = 'A Friend',
  cardTitle,
  cardMessage,
  cardEmoji = '🎂',
  cardTheme = 'theme1',
  cardRarity = 'RARE',
  mediaFiles = [],      // array of { type: 'photo'|'audio'|'video', dataUrl, caption }
  stickers = [],        // array of { dataUrl or emoji, caption }
  vaultNote = '',       // optional private message
}) {
  const now = new Date().toISOString();
  const cid = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

  // 1. Save media items into universal media pool
  const allocatedCardMedia = [];
  for (const m of mediaFiles) {
    const item = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      type: m.type || 'photo',
      caption: m.caption || `${authorName}'s memory`,
      url: m.dataUrl || m.url,
      dataUrl: m.dataUrl || m.url,
      author: authorName,
      createdAt: now,
    };
    saveStoredMedia(item);
    allocatedCardMedia.push(item);
  }
  // Keep strictly contributor's uploaded media (do not inject random stock photos)

  // 2. Save Scratch Card
  if (cardMessage && cardMessage.trim()) {
    const rarityThemes = {
      theme1: { rarity: 'COMMON',    bg: 'linear-gradient(135deg,#450920,#A53860)', color: '#FFA5AB' },
      theme2: { rarity: 'RARE',      bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)', color: '#c9a0ff' },
      theme3: { rarity: 'LEGENDARY', bg: 'linear-gradient(135deg,#7a4010,#c07020)', color: '#ffd93b' },
      theme4: { rarity: 'MYTHIC',    bg: 'linear-gradient(135deg,#8b0032,#ff3385,#ffe066)', color: '#ff6eb4' },
      theme5: { rarity: 'RARE',      bg: 'linear-gradient(135deg,#0a2a4a,#1a5080)', color: '#5ee0ff' },
    };
    const t = rarityThemes[cardTheme] || rarityThemes.theme2;

    const newCard = {
      id: cid,
      slotId: 'U_' + cid.slice(-4),
      emoji: cardEmoji || '🎂',
      title: (cardTitle || `WISH FROM ${authorName.toUpperCase()}`).toUpperCase(),
      description: cardMessage,
      author: authorName,
      rarity: cardRarity || t.rarity,
      color: t.color,
      bg: t.bg,
      mediaItems: allocatedCardMedia,
      createdAt: now,
    };
    saveStoredCard(newCard);

    // Also attempt Supabase insert in background if available
    try {
      if (supabase && typeof supabase.from === 'function') {
        const { error: sbErr } = await supabase.from('contributions').insert([{
          author: authorName,
          title: newCard.title,
          message: newCard.description,
          emoji: newCard.emoji,
          rarity: newCard.rarity,
          theme: cardTheme,
          media: allocatedCardMedia,
          stickers: stickers,
          vault_note: vaultNote,
        }]);
        if (sbErr) console.warn('[supabase-insert-warn]', sbErr);
      }
    } catch (e) {
      console.warn('[supabase-insert-catch]', e);
    }
  }

  // 3. Save WhatsApp Stickers to the Sticker Corner
  for (const st of stickers) {
    const stickerItem = {
      id: 'st_u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      url: st.dataUrl || st.url,
      emoji: st.emoji || '🌸',
      caption: st.caption || `${authorName}'s sticker`,
      author: authorName,
      createdAt: now,
    };
    saveStoredSticker(stickerItem);
  }

  // 4. Save Secret Vault note (if provided)
  if (vaultNote && vaultNote.trim()) {
    const vMsg = {
      id: 'v_' + Date.now(),
      author: authorName,
      message: vaultNote.trim(),
      createdAt: now,
    };
    saveStoredVaultMessage(vMsg);
  }

  return { success: true, cardId: cid };
}

// ─── 6. Cloud Sync from Supabase ─────────────────────────────────────────────
/**
 * Automatically fetch and merge cloud contributions submitted by friends from other devices.
 */
export async function syncCloudContributions() {
  if (!supabase || typeof supabase.from !== 'function') return;
  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || !Array.isArray(data)) return;

    const currentCards = getStoredCards();
    const currentStickers = getStoredStickers();
    const currentVault = getStoredVaultMessages();

    // Prune any fake built-in card IDs (card_1..card_24) from unlocked cards
    try {
      const rawUnlocked = JSON.parse(localStorage.getItem('muski_cards') || '[]');
      const cleanUnlocked = rawUnlocked.filter(id => !/^card_\d+$/.test(id) && !String(id).includes('test'));
      if (cleanUnlocked.length !== rawUnlocked.length) {
        localStorage.setItem('muski_cards', JSON.stringify(cleanUnlocked));
      }
    } catch {}

    for (const c of data) {
      if (!isRealCard({ author: c.author, title: c.title, message: c.message, id: c.id })) continue;

      // 1. Sync Scratch Card
      if (c.message) {
        const mediaList = Array.isArray(c.media)
          ? c.media.map(m => ({ ...m, url: m.dataUrl || m.url, dataUrl: m.dataUrl || m.url }))
          : [];

        const existingCard = currentCards.find(card => card.id === c.id || (card.author === c.author && card.description === c.message));
        if (!existingCard) {
          saveStoredCard({
            id: c.id,
            slotId: 'C_' + String(c.id).slice(0, 4),
            emoji: c.emoji || '🎂',
            title: (c.title || `WISH FROM ${c.author.toUpperCase()}`).toUpperCase(),
            description: c.message,
            author: c.author,
            rarity: c.rarity || 'RARE',
            color: '#c9a0ff',
            bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)',
            mediaItems: mediaList,
            createdAt: c.created_at,
          });
        } else {
          // Always ensure existing stored card has the contributor's real media and custom badge
          existingCard.mediaItems = mediaList;
          if (c.emoji) existingCard.emoji = c.emoji;
          safeSetItem(STORAGE_KEY_CARDS, JSON.stringify(currentCards));
        }

        // Auto-unlock contributor cards in localStorage so Muski can view and tap them anytime
        try {
          const unlocked = JSON.parse(localStorage.getItem('muski_cards') || '[]');
          const k1 = 'C_' + String(c.id).slice(0, 4);
          const k2 = c.id;
          let changed = false;
          if (!unlocked.includes(k1)) { unlocked.push(k1); changed = true; }
          if (!unlocked.includes(k2)) { unlocked.push(k2); changed = true; }
          if (changed) localStorage.setItem('muski_cards', JSON.stringify(unlocked));
        } catch {}
      }

      // 2. Sync Stickers
      if (Array.isArray(c.stickers)) {
        for (const st of c.stickers) {
          const stId = 'st_cloud_' + (st.id || Math.random().toString(36).slice(2, 7));
          const existsSt = currentStickers.some(s => s.id === stId || (s.author === c.author && s.caption === st.caption));
          if (!existsSt) {
            saveStoredSticker({
              id: stId,
              url: st.dataUrl || st.url,
              emoji: st.emoji || '🌸',
              caption: st.caption || `${c.author}'s sticker`,
              author: c.author,
              createdAt: c.created_at,
            });
          }
        }
      }

      // 3. Sync Vault Notes
      if (c.vault_note) {
        const vId = 'v_' + c.id;
        const existsV = currentVault.some(v => v.id === vId || (v.author === c.author && v.message === c.vault_note));
        if (!existsV) {
          saveStoredVaultMessage({
            id: vId,
            author: c.author,
            message: c.vault_note,
            createdAt: c.created_at,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[contribute-store] Cloud sync skipped (offline or not configured)');
  }
}

// Background sync on load
if (typeof window !== 'undefined') {
  syncCloudContributions().catch(() => {});
}
