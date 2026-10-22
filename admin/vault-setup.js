/**
 * admin/vault-setup.js — One-time RSA keypair generation for the Secret Vault
 * Phase 6: generates RSA-OAEP-4096 keypair in the browser using SubtleCrypto,
 *          encrypts the private key with her password (PBKDF2 → AES-GCM),
 *          stores { public_key_jwk, private_key_ciphertext, iv, salt } in vault_keys.
 *
 * THIS RUNS EXACTLY ONCE. After running, the private key is gone from memory;
 * only the ciphertext remains. Do not run again or contributors' secret drops
 * will be permanently unreadable.
 *
 * Access: /admin — tab only visible to admin, no public link.
 */
// TODO Phase 6
export function mountVaultSetup(container) {
  container.innerHTML = `
    <div style="font-family:'Press Start 2P',monospace;font-size:.5rem;color:#FFA5AB;line-height:2.5;padding:1rem;border:2px solid #A53860;">
      🔐 VAULT SETUP — PHASE 6<br><br>
      <span style="color:#DA627D;font-size:.4rem;line-height:2;">
        This panel will generate the RSA-OAEP keypair for Secret Drops.<br>
        Run ONCE with her chosen password. Cannot be undone.
      </span>
    </div>
  `;
}
