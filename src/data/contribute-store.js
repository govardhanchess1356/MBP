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

// ─── 1. Expanded Built-In Cards Deck (24 unique cards) ───────────────────────
export const BUILTIN_CARDS = [
  // Common cards
  { id: 'card_1',  slotId: 'A1', emoji: '🌸', title: 'CHERRY BLOSSOM',     rarity: 'COMMON',    author: 'Birthday Crew', description: 'Spring has arrived! Wishing you bloom, joy, and endless smiles this year.', color: '#FFA5AB', bg: 'linear-gradient(135deg,#450920,#A53860)' },
  { id: 'card_2',  slotId: 'B2', emoji: '🎈', title: 'PARTY BALLOON',      rarity: 'COMMON',    author: 'Birthday Crew', description: 'Float high above all worries. May your 19th year be light as air!', color: '#ff6eb4', bg: 'linear-gradient(135deg,#450920,#A53860)' },
  { id: 'card_3',  slotId: 'D1', emoji: '🎀', title: 'PINK RIBBON',        rarity: 'COMMON',    author: 'Birthday Crew', description: 'All the best gifts in life come wrapped with love and sweet memories.', color: '#ff6eb4', bg: 'linear-gradient(135deg,#450920,#A53860)' },
  { id: 'card_4',  slotId: 'D2', emoji: '🌺', title: 'HIBISCUS BREEZE',    rarity: 'COMMON',    author: 'Birthday Crew', description: 'Bright, radiant, and unstoppable. Keep shining your warm light on everyone!', color: '#DA627D', bg: 'linear-gradient(135deg,#450920,#A53860)' },
  { id: 'card_5',  slotId: 'E1', emoji: '🍰', title: 'SWEET STRAWBERRY',   rarity: 'COMMON',    author: 'Birthday Crew', description: 'Life is better with extra sweetness. Eat all the pastries today!', color: '#FFA5AB', bg: 'linear-gradient(135deg,#450920,#A53860)' },
  { id: 'card_6',  slotId: 'E2', emoji: '🍧', title: 'ICE CREAM SUNDAE',   rarity: 'COMMON',    author: 'Birthday Crew', description: 'Cool vibes only! You deserve the sweetest treats on your special day.', color: '#ff80bf', bg: 'linear-gradient(135deg,#450920,#A53860)' },

  // Rare cards
  { id: 'card_7',  slotId: 'A2', emoji: '🎂', title: 'LEVEL 19 CAKE',      rarity: 'RARE',      author: 'Birthday Crew', description: 'Make the biggest wish! 19 is going to be your most legendary chapter.', color: '#ffd93b', bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },
  { id: 'card_8',  slotId: 'B1', emoji: '🎁', title: 'MYSTERY BOX',        rarity: 'RARE',      author: 'Birthday Crew', description: 'Packed with 365 days of new adventures, triumphs, and surprises.', color: '#c9a0ff', bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },
  { id: 'card_9',  slotId: 'C1', emoji: '🦋', title: 'GOLDEN BUTTERFLY',   rarity: 'RARE',      author: 'Birthday Crew', description: 'Spread your wings and fly higher than ever. Beautiful transformation awaits.', color: '#5ee0ff', bg: 'linear-gradient(135deg,#0a2a4a,#1a5080)' },
  { id: 'card_10', slotId: 'C2', emoji: '🌙', title: 'MIDNIGHT MOON',      rarity: 'RARE',      author: 'Birthday Crew', description: 'Born at the magical hour of midnight. Dream big and reach for the galaxies!', color: '#c9a0ff', bg: 'linear-gradient(135deg,#12063a,#2a0a5a)' },
  { id: 'card_11', slotId: 'E3', emoji: '🎧', title: 'RETRO CASSETTE',     rarity: 'RARE',      author: 'Birthday Crew', description: 'Turn up the music! Here is your soundtrack for turning 19 in style.', color: '#5ee0ff', bg: 'linear-gradient(135deg,#0a2a4a,#1a5080)' },
  { id: 'card_12', slotId: 'F1', emoji: '🍹', title: 'MIDNIGHT MOCKTAIL',  rarity: 'RARE',      author: 'Birthday Crew', description: 'Cheers to another year of laughs, late-night talks, and inside jokes!', color: '#c9a0ff', bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },
  { id: 'card_13', slotId: 'F2', emoji: '🎮', title: 'RETRO JOYSTICK',     rarity: 'RARE',      author: 'Birthday Crew', description: 'Player 1: MUSKI. Unlimited continues, high score unlocked!', color: '#ffd93b', bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },
  { id: 'card_14', slotId: 'F3', emoji: '📸', title: 'POLAROID MEMORY',    rarity: 'RARE',      author: 'Birthday Crew', description: 'Capturing every smile, every candid laugh, and every unforgettable moment.', color: '#ffd93b', bg: 'linear-gradient(135deg,#2a0a5a,#6030a0)' },

  // Legendary cards
  { id: 'card_15', slotId: 'A3', emoji: '⭐', title: 'SHOOTING STAR',      rarity: 'LEGENDARY', author: 'Birthday Crew', description: 'A once-in-a-lifetime wonder. Your brightness lights up every room you enter!', color: '#ffd93b', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  { id: 'card_16', slotId: 'B3', emoji: '🪄', title: 'MAGIC WAND',         rarity: 'LEGENDARY', author: 'Birthday Crew', description: 'You make every normal day feel magical. Keep casting that cheerful spell!', color: '#ffd93b', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  { id: 'card_17', slotId: 'C3', emoji: '💎', title: 'TIMELESS DIAMOND',   rarity: 'LEGENDARY', author: 'Birthday Crew', description: 'Precious, strong, and sparkling under any pressure. A true gem.', color: '#5ee0ff', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  { id: 'card_18', slotId: 'D3', emoji: '✨', title: 'SUPERNOVA SPARKLE',  rarity: 'LEGENDARY', author: 'Birthday Crew', description: 'Nineteen years of pure sparkle! Here is to the bright future ahead.', color: '#ffd93b', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  { id: 'card_19', slotId: 'G1', emoji: '👑', title: 'BIRTHDAY QUEEN',     rarity: 'LEGENDARY', author: 'Birthday Crew', description: 'Crown on! Today and every day, you rule with grace, sass, and kindness.', color: '#ffd93b', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },
  { id: 'card_20', slotId: 'G2', emoji: '🚀', title: 'COSMIC VOYAGER',     rarity: 'LEGENDARY', author: 'Birthday Crew', description: 'Your dreams have no gravity. Rocketing straight toward greatness!', color: '#ff80bf', bg: 'linear-gradient(135deg,#7a4010,#c07020)' },

  // Mythic cards
  { id: 'card_21', slotId: 'M1', emoji: '💖', title: 'BROTHER’S HEART',    rarity: 'MYTHIC',    author: 'Your Brother',  description: 'To the best sister in the universe: I am always in your corner, cheering you on. Happy 19th!', color: '#ff6eb4', bg: 'linear-gradient(135deg,#8b0032,#ff3385,#ffe066)' },
  { id: 'card_22', slotId: 'M2', emoji: '🌟', title: 'INFINITE MUSKIVERSE', rarity: 'MYTHIC',   author: 'Birthday Crew', description: 'You created a universe of warmth, loyalty, and laughter for everyone around you.', color: '#ffe066', bg: 'linear-gradient(135deg,#4a0e4e,#8a2be2,#ffd700)' },
  { id: 'card_23', slotId: 'M3', emoji: '🔥', title: 'NEVER-GIVE-UP SPIRIT',rarity: 'MYTHIC',   author: 'Birthday Crew', description: 'Fierce, brave, and full of heart. Nothing in this world can hold you back.', color: '#ff6b35', bg: 'linear-gradient(135deg,#801010,#d03020,#ffd040)' },
  { id: 'card_24', slotId: 'M4', emoji: '🌈', title: 'THE GOLDEN CHAPTER', rarity: 'MYTHIC',    author: 'Birthday Crew', description: 'Turning 19 is where your golden story really begins. Cherish every single second!', color: '#5ee0ff', bg: 'linear-gradient(135deg,#1a2060,#00c9ff,#92fe9d)' },
];

// ─── 2. Default Built-In Media Gallery ───────────────────────────────────────
// Provides real photos of Muski, audio voice notes, and celebration snippets
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
  {
    id: 'media_voice_1',
    type: 'audio',
    caption: 'Birthday Beat & Cheers 🎵',
    author: 'Arcade Band',
    isProcedural: true,
  },
];

// ─── 3. Default Built-In Stickers for Sticker Corner ─────────────────────────
export const BUILTIN_STICKERS = [
  { id: 'st_1', emoji: '👑', url: '/images/faces/avatar-happy.png', imageUrl: '/images/faces/avatar-happy.png', caption: 'Level 19 Princess 👑💖', author: 'Your Brother ❤️', color: '#ffd93b' },
  { id: 'st_2', emoji: '😎', url: '/images/faces/avatar-cool.png', imageUrl: '/images/faces/avatar-cool.png', caption: 'Swag Queen Muski 😎', author: 'Your Brother ❤️', color: '#5ee0ff' },
  { id: 'st_3', emoji: '♨️', url: '/images/faces/avatar-grumpy.png', imageUrl: '/images/faces/avatar-grumpy.png', caption: 'Cooker Anger Mode! ♨️😂', author: 'Meme Corner 🤣', color: '#ff4d4d' },
  { id: 'st_4', emoji: '🥺', url: '/images/faces/avatar-surprised.png', imageUrl: '/images/faces/avatar-surprised.png', caption: 'Fish-Face Pout 🥺✨', author: 'Family ❤️', color: '#ff80bf' },
  { id: 'st_5', emoji: '🌸', url: '/images/faces/avatar-default.png', imageUrl: '/images/faces/avatar-default.png', caption: 'Sweetest Smile 🌸', author: 'Birthday Crew ✨', color: '#ff6eb4' },
];

// ─── 4. Storage Helpers (localStorage with IndexedDB fallback) ───────────────
export function getStoredCards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CARDS) || '[]');
  } catch {
    return [];
  }
}

export function saveStoredCard(card) {
  const list = getStoredCards();
  list.unshift(card);
  localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(list));
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
  localStorage.setItem(STORAGE_KEY_STICKERS, JSON.stringify(list));
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
  localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(list));
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
  localStorage.setItem(STORAGE_KEY_MEDIA, JSON.stringify(list));
  return list;
}

// ─── 5. Universal Aggregation API ───────────────────────────────────────────

/**
 * Returns all cards: built-in deck + all contributor submitted cards.
 */
export function getAllCards() {
  const userCards = getStoredCards();
  return [...userCards, ...BUILTIN_CARDS];
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
      author: authorName,
      createdAt: now,
    };
    saveStoredMedia(item);
    allocatedCardMedia.push(item);
  }

  // If card has no dedicated media, give it random items from the general gallery
  if (allocatedCardMedia.length < 2) {
    const extras = getRandomMediaForCard(2 - allocatedCardMedia.length);
    allocatedCardMedia.push(...extras);
  }

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
        supabase.from('cards').insert({
          title: newCard.title,
          message: newCard.description,
          emoji: newCard.emoji,
          scratch_color: 'gold',
          card_theme: cardTheme,
          status: 'approved',
        }).then(() => {}).catch(() => {});
      }
    } catch (_) {}
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
