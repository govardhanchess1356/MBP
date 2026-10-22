/**
 * ui/pixel-button.js — Retro chunky pixel button component
 * Phase 2: creates a <button> styled with chunky pixel borders,
 *           Press Start 2P font, palette colours, tap sound + shake feedback.
 *           Honours prefers-reduced-motion for the shake.
 *
 * Usage:
 *   const btn = createPixelButton({ label: 'PLAY', onClick: () => {} });
 *   container.appendChild(btn.element);
 *   btn.destroy(); // remove event listeners
 */
// TODO Phase 2
export function createPixelButton({ label: _label, onClick: _onClick, variant: _variant = 'primary' }) {
  const el = document.createElement('button');
  el.textContent = _label ?? 'BUTTON';
  el.style.cssText = `
    font-family: 'Press Start 2P', monospace;
    font-size: 0.55rem;
    padding: 0.75rem 1.25rem;
    background: #A53860;
    color: #F9DBBD;
    border: 3px solid #F9DBBD;
    cursor: pointer;
    letter-spacing: 0.05em;
    line-height: 1.8;
    image-rendering: pixelated;
    box-shadow: 4px 4px 0 #450920;
    transition: transform 0.05s, box-shadow 0.05s;
  `;
  el.addEventListener('click', () => _onClick?.());
  return {
    element: el,
    destroy() { el.replaceWith(el.cloneNode(true)); },
  };
}
