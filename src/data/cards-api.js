import { supabase } from './supabase.js';

/**
 * Fetch all approved cards (post-unlock only — RLS enforces this server-side).
 * Returns cards ordered by: pinned last, position_hint ordering, then created_at.
 *
 * Ordering strategy: early < middle < final < pinned
 * The pinned card is always last (it's the emotional finale).
 *
 * @returns {Promise<Array>}
 */
export async function fetchApprovedCards() {
  const { data, error } = await supabase
    .from('cards')
    .select(`
      id,
      contributor_id,
      title,
      message,
      photo_path,
      audio_path,
      video_path,
      scratch_color,
      card_theme,
      emoji,
      font_style,
      reveal_effect,
      position_hint,
      is_pinned,
      created_at
    `)
    .eq('status', 'approved')
    // Sort: position_hint asc (early→middle→final), pinned always last
    .order('is_pinned',     { ascending: true  })
    .order('position_hint', { ascending: true  })
    .order('created_at',    { ascending: true  });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get a signed URL for a card's media file.
 * Supabase Storage honours the same RLS unlock check.
 *
 * @param {string} storagePath  e.g. 'cards/uuid/photo.webp'
 * @param {number} expiresIn    seconds until URL expires (default 1 hour)
 * @returns {Promise<string>}   signed URL
 */
export async function getCardMediaUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Submit a card as a contributor.
 * All validation is re-enforced in the DB via submit_card() RPC.
 *
 * @param {string} rawToken   contributor's raw invite token
 * @param {object} card       card fields
 * @returns {Promise<string>} the new card UUID
 */
export async function submitCard(rawToken, card) {
  const { data, error } = await supabase.rpc('submit_card', {
    p_token:         rawToken,
    p_title:         card.title         ?? '',
    p_message:       card.message,
    p_scratch_color: card.scratchColor  ?? 'gold',
    p_card_theme:    card.cardTheme     ?? 'theme1',
    p_emoji:         card.emoji         ?? '🎂',
    p_font_style:    card.fontStyle     ?? 'font1',
    p_reveal_effect: card.revealEffect  ?? 'confetti',
    p_position_hint: card.positionHint  ?? 'middle',
  });

  if (error) throw error;
  return data;  // new card UUID
}

/**
 * Fetch only this contributor's own cards (pending + approved).
 *
 * @param {string} rawToken
 * @returns {Promise<Array>}
 */
export async function fetchMyCards(rawToken) {
  const { data, error } = await supabase.rpc('get_my_cards', {
    p_token: rawToken,
  });

  if (error) throw error;
  return data ?? [];
}

/**
 * Update a pending card (contributors can edit before approval).
 *
 * @param {string} rawToken
 * @param {string} cardId
 * @param {string} title
 * @param {string} message
 * @returns {Promise<boolean>}  true if a row was updated
 */
export async function updateCard(rawToken, cardId, title, message) {
  const { data, error } = await supabase.rpc('update_card', {
    p_token:   rawToken,
    p_card_id: cardId,
    p_title:   title,
    p_message: message,
  });

  if (error) throw error;
  return Boolean(data);
}
