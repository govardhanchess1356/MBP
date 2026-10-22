/**
 * src/data/local-state.js — localStorage-backed game progress
 * Phase 2: coins, cards, muted state.
 * Phase 3 formalises the full state machine.
 */

export function getCoins() {
  return parseInt(localStorage.getItem('muski_coins') ?? '0', 10);
}
export function addCoins(n) {
  const next = getCoins() + n;
  localStorage.setItem('muski_coins', next);
  return next;
}
export function spendCoins(n) {
  const next = Math.max(0, getCoins() - n);
  localStorage.setItem('muski_coins', next);
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
