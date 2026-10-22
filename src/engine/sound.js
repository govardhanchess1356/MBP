/**
 * engine/sound.js — Web Audio API sound synthesis (no audio files).
 *
 * All sounds are synthesized from oscillators and noise buffers.
 * getAudioContext() is lazy so it's only created after a user gesture.
 *
 * Usage:
 *   import { SFX } from '@/engine/sound.js';
 *   SFX.flap();   // play flap sound
 *   SFX.setMuted(true);
 */

let _actx  = null;
let _muted = false;

function getCtx() {
  if (!_actx) {
    _actx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_actx.state === 'suspended') {
    _actx.resume().catch(() => {});
  }
  return _actx;
}

// ── Primitive: single oscillator tone ─────────────────────────────────────────
function tone({ freq = 440, endFreq = null, dur = 0.1, type = 'square', vol = 0.18 }) {
  if (_muted) return;
  try {
    const ctx  = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
    }

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.01);
  } catch (_) { /* AudioContext blocked / unsupported */ }
}

// ── Primitive: white noise burst ──────────────────────────────────────────────
function noise({ dur = 0.2, vol = 0.25, filterFreq = 800 }) {
  if (_muted) return;
  try {
    const ctx     = getCtx();
    const samples = Math.floor(ctx.sampleRate * dur);
    const buf     = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;

    const src    = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();

    src.buffer = buf;
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    src.start();
    src.stop(ctx.currentTime + dur + 0.01);
  } catch (_) {}
}

// ── Primitive: arpeggio (sequence of tones) ───────────────────────────────────
function arpeggio(freqs, stepMs = 90, opts = {}) {
  freqs.forEach((f, i) => setTimeout(() => tone({ freq: f, ...opts }), i * stepMs));
}

// ── All 11 named sounds ───────────────────────────────────────────────────────
export const SFX = {
  /** Wing flap — short upward sweep */
  flap()      { tone({ freq: 380, endFreq: 620, dur: 0.07, type: 'square', vol: 0.16 }); },

  /** Coin collect — bright chime */
  coin()      { tone({ freq: 880, endFreq: 1320, dur: 0.1, type: 'triangle', vol: 0.2 }); },

  /** Collision hit — low buzz */
  hit()       { noise({ dur: 0.18, vol: 0.3, filterFreq: 400 }); },

  /** Level clear — ascending 4-note jingle */
  win()       { arpeggio([523, 659, 784, 1047], 95, { dur: 0.14, type: 'triangle', vol: 0.2 }); },

  /** Game over — descending moan */
  lose()      { tone({ freq: 320, endFreq: 110, dur: 0.5, type: 'sawtooth', vol: 0.22 }); },

  /** Platformer / dino jump — quick chirp */
  jump()      { tone({ freq: 500, endFreq: 750, dur: 0.08, type: 'square', vol: 0.18 }); },

  /** Asteroids auto-fire — zap */
  shoot()     { tone({ freq: 700, endFreq: 200, dur: 0.06, type: 'square', vol: 0.12 }); },

  /** Asteroid/gift box destroyed */
  explosion() { noise({ dur: 0.28, vol: 0.3, filterFreq: 600 }); },

  /** UI menu button tap */
  menu()      { tone({ freq: 660, dur: 0.05, type: 'square', vol: 0.14 }); },

  /** Scratch card scratch texture */
  scratch()   { noise({ dur: 0.08, vol: 0.15, filterFreq: 3000 }); },

  /** Site unlock celebration */
  unlock()    { arpeggio([261, 329, 392, 523, 784, 1047], 80, { dur: 0.18, type: 'triangle', vol: 0.22 }); },

  /** Toggle muted state */
  setMuted(on) {
    _muted = on;
    // Close audio context to release resources when muted for a long time
    if (on && _actx && _actx.state === 'running') {
      _actx.suspend().catch(() => {});
    } else if (!on && _actx && _actx.state === 'suspended') {
      _actx.resume().catch(() => {});
    }
  },

  /** Returns current muted state */
  isMuted() { return _muted; },
};
