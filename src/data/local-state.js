/**
 * src/data/local-state.js — localStorage-backed game progress
 * Phase 2: coins, cards, muted state.
 * Phase 3 formalises the full state machine.
 */

export function getCoins() {
  const val = parseInt(localStorage.getItem('muski_coins'), 10);
  return Number.isFinite(val) ? Math.max(0, val) : 0;
}
export function addCoins(n) {
  const next = Math.max(0, getCoins() + Number(n));
  localStorage.setItem('muski_coins', String(next));
  return next;
}
export function spendCoins(n) {
  const next = Math.max(0, getCoins() - Number(n));
  localStorage.setItem('muski_coins', String(next));
  return next;
}
export function getCardsUnlocked() {
  try { return JSON.parse(localStorage.getItem('muski_cards') ?? '[]'); }
  catch { return []; }
}
export function unlockCard(id) {
  const cards = getCardsUnlocked();
  if (!cards.includes(id)) {
    cards.push(id);
    localStorage.setItem('muski_cards', JSON.stringify(cards));
  }
  return cards;
}
export function getLevelsCleared() {
  try { return JSON.parse(localStorage.getItem('muski_levels') ?? '{}'); }
  catch { return {}; }
}
export function markLevelCleared(gameId, levelIdx) {
  const levels = getLevelsCleared();
  levels[`${gameId}_${levelIdx}`] = true;
  localStorage.setItem('muski_levels', JSON.stringify(levels));
}
export function getMuted() {
  return localStorage.getItem('muski_muted') === 'true';
}
export function setMuted(on) {
  localStorage.setItem('muski_muted', on ? 'true' : 'false');
}
