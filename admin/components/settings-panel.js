/**
 * admin/components/settings-panel.js — Site settings UI
 * Phase 4: change unlock_at datetime, toggle emergency_unlock,
 *           preview the site as it will appear post-unlock.
 */
// TODO Phase 4
export function mountSettingsPanel(_container) {
  _container.innerHTML = `
    <div style="font-family:'Press Start 2P',monospace;font-size:.5rem;color:#FFA5AB;line-height:2.5;padding:1rem;">
      SETTINGS PANEL — PHASE 4<br>
      Change unlock time and emergency unlock here.
    </div>
  `;
}
