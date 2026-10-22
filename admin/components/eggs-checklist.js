/**
 * admin/components/eggs-checklist.js — Easter egg admin checklist
 * Phase 8: shows all 11 Easter eggs, which have been triggered
 *          in the current session (via the 'eggTriggered' CustomEvent),
 *          and which phase implements each one.
 */
import { getAllEggs } from '@/eggs/eggs.js';

// TODO Phase 8: make this reactive (listen to 'eggTriggered' events)
export function mountEggsChecklist(container) {
  const eggs = getAllEggs();
  container.innerHTML = `
    <div style="font-family:'VT323',monospace;font-size:1.1rem;color:#F9DBBD;padding:1rem;line-height:1.8;">
      <div style="font-family:'Press Start 2P',monospace;font-size:.5rem;color:#DA627D;margin-bottom:1rem;">
        EASTER EGG CHECKLIST
      </div>
      ${eggs.map(e => `
        <div style="display:flex;gap:1rem;align-items:flex-start;border-bottom:1px solid #450920;padding:.4rem 0;">
          <span style="color:${e.triggered ? '#FFA5AB' : '#A53860'};min-width:1.2rem;">
            ${e.triggered ? '✓' : '○'}
          </span>
          <div>
            <div style="color:#DA627D;font-family:'Press Start 2P',monospace;font-size:.35rem;">${e.id}</div>
            <div style="color:#F9DBBD;font-size:.95rem;">${e.trigger}</div>
            <div style="color:#A53860;font-size:.9rem;">→ ${e.effect}</div>
            <div style="color:#450920;font-size:.8rem;">Phase ${e.phase}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
