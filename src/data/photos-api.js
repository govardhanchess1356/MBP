import { supabase } from './supabase.js';

/**
 * Fetch all approved photos post-unlock.
 * RLS enforces the time-lock server-side.
 *
 * @param {'muski'|'friend'|'admin'|undefined} role  filter by role; omit for all
 * @returns {Promise<Array>}
 */
export async function fetchApprovedPhotos(role) {
  let query = supabase
    .from('photos')
    .select('id, storage_path, role, label')
    .eq('status', 'approved');

  if (role) query = query.eq('role', role);

  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Get a short-lived signed URL for a photo.
 *
 * @param {string} storagePath
 * @param {number} expiresIn    seconds (default 30 min)
 * @returns {Promise<string>}
 */
export async function getPhotoUrl(storagePath, expiresIn = 1800) {
  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Validate a contributor token.
 * Called by the contribute form on page load.
 *
 * @param {string} rawToken
 * @returns {Promise<{contributor_id: string, name: string}|null>}
 */
export async function validateContributorToken(rawToken) {
  const { data, error } = await supabase.rpc('validate_contributor_token', {
    p_token: rawToken,
  });

  // RPC returns null on invalid token (no throw)
  if (error) throw error;
  return data ?? null;
}

/**
 * Submit a corner item (generic for all corners including sticker book).
 *
 * @param {string} rawToken
 * @param {string} cornerId   e.g. 'sticker_book'
 * @param {object} payload    must conform to the corner's JSON schema
 * @returns {Promise<string>} new item UUID
 */
export async function submitCornerItem(rawToken, cornerId, payload) {
  const { data, error } = await supabase.rpc('submit_corner_item', {
    p_token:     rawToken,
    p_corner_id: cornerId,
    p_payload:   payload,
  });

  if (error) throw error;
  return data;
}
