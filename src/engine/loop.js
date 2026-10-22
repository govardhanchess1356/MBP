/**
 * engine/loop.js — requestAnimationFrame game loop
 * Fixed 60fps-target with delta-time cap to prevent spiral-of-death.
 * Pause/resume preserve the loop but skip update/render.
 */

const MAX_DT = 50; // ms — cap prevents huge jumps after tab sleep

/**
 * @param {(dt: number, now: number) => void} onTick
 */
export function createLoop(onTick) {
  let _rafId    = null;
  let _lastTime = null;
  let _paused   = false;

  function frame(now) {
    _rafId = requestAnimationFrame(frame);

    if (_paused) return;

    const dt = _lastTime === null
      ? 16                              // first frame → assume 60fps
      : Math.min(now - _lastTime, MAX_DT);
    _lastTime = now;

    onTick(dt, now);
  }

  return {
    start() {
      if (_rafId !== null) return;
      _lastTime = null;
      _rafId = requestAnimationFrame(frame);
    },
    stop() {
      if (_rafId !== null) cancelAnimationFrame(_rafId);
      _rafId    = null;
      _lastTime = null;
    },
    pause()    { _paused = true;  _lastTime = null; },
    resume()   { _paused = false; _lastTime = null; },
    isPaused() { return _paused; },
  };
}
