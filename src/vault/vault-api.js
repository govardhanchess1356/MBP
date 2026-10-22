/**
 * vault/vault-api.js — Vault data access
 * Phase 6: fetch vault items (admin-gated via Supabase Auth),
 *           submit encrypted secret drops (contributor flow).
 */
import { supabase } from '@/data/supabase.js';

/**
 * Fetch all vault items (requires admin session).
 * Returns raw ciphertext rows — decryption happens client-side.
 */
export async function fetchVaultItems() {
  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch the RSA public key for secret drops (publicly readable).
 * @returns {Promise<object>} JWK object
 */
export async function fetchVaultPublicKey() {
  const { data, error } = await supabase
    .from('vault_keys')
    .select('public_key_jwk')
    .single();
  if (error) throw error;
  return data.public_key_jwk;
}

/**
 * Fetch the encrypted RSA private key (publicly readable ciphertext).
 * Birthday girl decrypts it client-side using her password.
 * @returns {Promise<{private_key_ciphertext: string, private_key_iv: string, private_key_salt: string}>}
 */
export async function fetchVaultPrivateKeyBundle() {
  const { data, error } = await supabase
    .from('vault_keys')
    .select('private_key_ciphertext, private_key_iv, private_key_salt')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Submit an RSA-OAEP encrypted secret drop as a contributor.
 * @param {string} rawToken      contributor invite token
 * @param {string} ciphertext    base64url RSA-OAEP encrypted message
 * @returns {Promise<string>}    new vault item UUID
 */
export async function submitSecretDrop(rawToken, ciphertext) {
  // TODO Phase 6: call a submit_vault_item RPC (to be added in Phase 6 migration)
  throw new Error('submitSecretDrop not implemented — Phase 6');
}

/**
 * Store the generated RSA keypair (admin vault-setup flow, one-time only).
 * @param {object} payload  { public_key_jwk, private_key_ciphertext, private_key_iv, private_key_salt }
 */
export async function storeVaultKeys(payload) {
  const { error } = await supabase
    .from('vault_keys')
    .upsert({ id: 1, ...payload });
  if (error) throw error;
}
