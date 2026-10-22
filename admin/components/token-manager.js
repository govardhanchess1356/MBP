/**
 * admin/components/token-manager.js — Invite token generator & revocation
 * Phase 4: create tokens for contributors, copy the /contribute?token= URL,
 *           revoke tokens, see first-use timestamps.
 */
// TODO Phase 4
export function mountTokenManager(_container) {
  _container.innerHTML = `
    <div style="font-family:'Press Start 2P',monospace;font-size:.5rem;color:#FFA5AB;line-height:2.5;padding:1rem;">
      TOKEN MANAGER — PHASE 4<br>
      Generate and revoke contributor invite links here.
    </div>
  `;
}
