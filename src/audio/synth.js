/**
 * audio/synth.js — Procedural Web Audio API sound generator
 */
import { SFX } from '@/engine/sound.js';

let _ctx = null;
export function getAudioContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

export function synthTap()      { SFX.menu(); }
export function synthCoin()     { SFX.coin(); }
export function synthWin()      { SFX.win(); }
export function synthLose()     { SFX.lose(); }
export function synthScratch()  { SFX.scratch(); }
export function synthDispense() { SFX.coin(); }
export function synthJump()     { SFX.jump(); }
export function synthFlap()     { SFX.flap(); }
export function synthExplode()  { SFX.explosion(); }
export function synthTick()     { SFX.menu(); }
export function synthUnlock()   { SFX.unlock(); }
