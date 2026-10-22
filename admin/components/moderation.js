/**
 * admin/components/moderation.js — Moderation queue UI
 * Phase 4: approve / reject cards, photos, corner items.
 *           Shows media previews, contributor name, submission time.
 */
// TODO Phase 4
export function mountModerationPanel(_container, _onAction) {
  _container.innerHTML = `
    <div style="font-family:'Press Start 2P',monospace;font-size:.5rem;color:#FFA5AB;line-height:2.5;padding:1rem;">
      MODERATION PANEL — PHASE 4<br>
      Will show pending cards, photos, and corner items for approval.
    </div>
  `;
}
