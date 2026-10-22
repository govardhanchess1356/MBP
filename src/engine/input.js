/**
 * engine/input.js — Unified touch + mouse + KEYBOARD input for the game canvas.
 *
 * Fully supports Desktop PC Keyboard controls:
 * - Spacebar / Up Arrow / W / Enter -> Jump / Flap / Thrust / Select
 * - Down Arrow / S -> Duck / Fast-fall
 * - Left Arrow / A -> Move Left
 * - Right Arrow / D -> Move Right
 *
 * Produces a clean, per-frame snapshot via read().
 */

import { CANVAS_W, CANVAS_H } from '@/config/constants.js';

const SWIPE_THRESHOLD = 30; // logical px

/**
 * @param {HTMLCanvasElement} canvas
 */
export function createInput(canvas) {
  // Per-frame state
  let _tapped   = false;
  let _held     = false;
  let _tapX     = CANVAS_W / 2;
  let _tapY     = CANVAS_H / 2;
  let _heldX    = CANVAS_W / 2;
  let _heldY    = CANVAS_H / 2;
  let _startX   = CANVAS_W / 2;
  let _startY   = CANVAS_H / 2;
  let _dragX    = 0;
  let _dragY    = 0;
  let _swipeDir = null;

  // Active keyboard state
  const _keys = {
    up:    false,
    down:  false,
    left:  false,
    right: false,
    space: false,
  };

  // Convert client coords -> logical game coords
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width)  * CANVAS_W,
      y: ((clientY - rect.top)  / rect.height) * CANVAS_H,
    };
  }

  function onDown(clientX, clientY) {
    const { x, y } = toLogical(clientX, clientY);
    _held   = true;
    _heldX  = x;  _heldY  = y;
    _startX = x;  _startY = y;
    _dragX  = 0;  _dragY  = 0;
  }

  function onMove(clientX, clientY) {
    if (!_held) return;
    const { x, y } = toLogical(clientX, clientY);
    _heldX = x; _heldY = y;
    _dragX = x - _startX;
    _dragY = y - _startY;
  }

  function onUp(clientX, clientY) {
    const { x, y } = toLogical(clientX, clientY);
    _tapped = true;
    _tapX   = x;  _tapY = y;
    _held   = false;
    _heldX  = x;  _heldY = y;

    // Detect swipe
    const dx = x - _startX;
    const dy = y - _startY;
    if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      _swipeDir = dy < 0 ? 'up' : 'down';
    } else if (Math.abs(dx) > SWIPE_THRESHOLD) {
      _swipeDir = dx < 0 ? 'left' : 'right';
    } else {
      _swipeDir = null;
    }

    _dragX = 0; _dragY = 0;
  }

  // ── Touch ──────────────────────────────────────────────────────────────────
  const onTouchStart = e => { e.preventDefault(); const t = e.changedTouches[0]; onDown(t.clientX, t.clientY); };
  const onTouchMove  = e => { e.preventDefault(); const t = e.changedTouches[0]; onMove(t.clientX, t.clientY); };
  const onTouchEnd   = e => { e.preventDefault(); const t = e.changedTouches[0]; onUp(t.clientX,   t.clientY); };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
  canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
  canvas.addEventListener('touchcancel',onTouchEnd,   { passive: false });

  // ── Mouse ──────────────────────────────────────────────────────────────────
  const onMouseDown = e => { if (e.button === 0) onDown(e.clientX, e.clientY); };
  const onMouseMove = e => { onMove(e.clientX, e.clientY); };
  const onMouseUp   = e => { if (e.button === 0) onUp(e.clientX, e.clientY); };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup',   onMouseUp);
  window.addEventListener('mouseup',   onMouseUp);

  // ── Full PC Keyboard Controls ──────────────────────────────────────────────
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let _konamiIdx = 0;
  let _konamiDone = false;

  const onKeyDown = (e) => {
    // Avoid interfering when typing in an input or textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Konami
    if (e.key === KONAMI[_konamiIdx]) {
      _konamiIdx++;
      if (_konamiIdx === KONAMI.length) { _konamiDone = true; _konamiIdx = 0; }
    } else {
      _konamiIdx = 0;
    }

    const key = e.key.toLowerCase();
    const code = e.code;

    // Up / Jump / Thrust / Flap
    if (key === ' ' || key === 'arrowup' || key === 'w' || key === 'enter' || code === 'Space') {
      e.preventDefault();
      _tapped = true;
      _held = true;
      _heldY = 100;
      _keys.up = true;
      _keys.space = true;
    }

    // Down / Duck
    if (key === 'arrowdown' || key === 's') {
      e.preventDefault();
      _held = true;
      _heldY = CANVAS_H; // simulates touching bottom half for ducking
      _swipeDir = 'down';
      _keys.down = true;
    }

    // Left
    if (key === 'arrowleft' || key === 'a') {
      e.preventDefault();
      _keys.left = true;
      _heldX = Math.max(20, _heldX - 25);
      _dragX = -25;
    }

    // Right
    if (key === 'arrowright' || key === 'd') {
      e.preventDefault();
      _keys.right = true;
      _heldX = Math.min(CANVAS_W - 20, _heldX + 25);
      _dragX = 25;
    }
  };

  const onKeyUp = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    const code = e.code;

    if (key === ' ' || key === 'arrowup' || key === 'w' || key === 'enter' || code === 'Space') {
      _keys.up = false;
      _keys.space = false;
    }
    if (key === 'arrowdown' || key === 's') {
      _keys.down = false;
    }
    if (key === 'arrowleft' || key === 'a') {
      _keys.left = false;
    }
    if (key === 'arrowright' || key === 'd') {
      _keys.right = false;
    }

    // If no action keys are pressed, release held state
    if (!_keys.up && !_keys.space && !_keys.down) {
      _held = false;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ── Public ─────────────────────────────────────────────────────────────────
  return {
    read() {
      const snap = {
        tapped:    _tapped,
        held:      _held,
        tapX:      _tapX,
        tapY:      _tapY,
        heldX:     _heldX,
        heldY:     _heldY,
        dragX:     _dragX,
        dragY:     _dragY,
        swipeDir:  _swipeDir,
        konamiCode: _konamiDone,
        keys: {
          up:    _keys.up || _keys.space,
          down:  _keys.down,
          left:  _keys.left,
          right: _keys.right,
          space: _keys.space,
        },
      };
      _tapped     = false;
      _swipeDir   = null;
      _konamiDone = false;
      // Decay keyboard dragX
      if (!_keys.left && !_keys.right) _dragX = 0;
      return snap;
    },

    destroy() {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
      canvas.removeEventListener('touchcancel',onTouchEnd);
      canvas.removeEventListener('mousedown',  onMouseDown);
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('mouseup',    onMouseUp);
      window.removeEventListener('mouseup',    onMouseUp);
      window.removeEventListener('keydown',    onKeyDown);
      window.removeEventListener('keyup',      onKeyUp);
    },
  };
}
