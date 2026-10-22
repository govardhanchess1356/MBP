import { supabase } from './supabase.js';

// ─── Admin-only settings API ──────────────────────────────────────────────────
// All functions here require an active admin Supabase Auth session.
// The RPCs enforce is_admin() server-side; a non-admin call will throw.

/**
 * One-time bootstrap: register the current signed-in user as admin.
 * Only works once (when settings.admin_uid IS NULL).
 * Call this from the admin setup page immediately after first sign-in.
 */
export async function registerAdmin() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not signed in');

  const { error } = await supabase.rpc('register_admin', { p_uid: user.id });
  if (error) throw error;
}

/**
 * Generate an invite token for a contributor.
 * Returns the raw token (show once, then share the link).
 *
 * @param {string} name     contributor's display name
 * @param {string} [email]  optional admin reference
 * @returns {Promise<string>} raw token
 */
export async function generateInviteToken(name, email) {
  const { data, error } = await supabase.rpc('generate_invite_token', {
    p_name:  name,
    p_email: email ?? null,
  });
  if (error) throw error;
  return data;
}

/**
 * Approve or reject a card, photo, or corner_item.
 *
 * @param {'cards'|'photos'|'corner_items'} table
 * @param {string} id     row UUID
 * @param {'approved'|'rejected'} status
 */
export async function moderateItem(table, id, status) {
  const { error } = await supabase.rpc('moderate_item', {
    p_table:  table,
    p_id:     id,
    p_status: status,
  });
  if (error) throw error;
}

/**
 * Update the unlock timestamp.
 *
 * @param {Date} unlockAt
 */
export async function setUnlockTime(unlockAt) {
  const { error } = await supabase.rpc('set_unlock_time', {
    p_unlock_at: unlockAt.toISOString(),
  });
  if (error) throw error;
}

/**
 * Toggle the emergency early-unlock switch.
 *
 * @param {boolean} enabled
 */
export async function setEmergencyUnlock(enabled) {
  const { error } = await supabase
    .from('settings')
    .update({ emergency_unlock: enabled })
    .eq('id', 1);
  if (error) throw error;
}

/**
 * Fetch all pending items across cards, photos, and corner_items.
 * Used to populate the admin moderation queue.
 *
 * @returns {Promise<{cards: Array, photos: Array, cornerItems: Array}>}
 */
export async function fetchPendingItems() {
  const [cardsRes, photosRes, cornerRes] = await Promise.all([
    supabase.from('cards').select('*').eq('status', 'pending').order('created_at'),
    supabase.from('photos').select('*').eq('status', 'pending').order('created_at'),
    supabase.from('corner_items').select('*').eq('status', 'pending').order('created_at'),
  ]);

  if (cardsRes.error)  throw cardsRes.error;
  if (photosRes.error) throw photosRes.error;
  if (cornerRes.error) throw cornerRes.error;

  return {
    cards:       cardsRes.data  ?? [],
    photos:      photosRes.data ?? [],
    cornerItems: cornerRes.data ?? [],
  };
}

/**
 * Fetch all contributors (for token management tab).
 *
 * @returns {Promise<Array>}
 */
export async function fetchContributors() {
  const { data, error } = await supabase
    .from('contributors')
    .select('id, name, email, used_at, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Deactivate a contributor token (revoke access).
 *
 * @param {string} contributorId
 */
export async function deactivateContributor(contributorId) {
  const { error } = await supabase
    .from('contributors')
    .update({ is_active: false })
    .eq('id', contributorId);
  if (error) throw error;
}

/**
 * Admin sign-in.
 *
 * @param {string} email
 * @param {string} password
 */
export async function adminSignIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Admin sign-out.
 */
export async function adminSignOut() {
  await supabase.auth.signOut();
}

/**
 * Get current admin auth session (null if not signed in).
 */
export async function getAdminSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
