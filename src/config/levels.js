/**
 * LEVELS config — single source of truth for all game parameters.
 *
 * Structure: LEVELS[gameId][levelIndex] = { ...params }
 *
 * Rules:
 *  - Every number that controls difficulty lives here.
 *  - Games read this config in init() and NEVER hard-code values.
 *  - Adding a level = adding one entry to the array.
 *  - easyMode overrides are applied automatically by the engine
 *    after EASY_MODE_LOSS_THRESHOLD losses.
 */
export const LEVELS = {

  // ── Flappy: "Balloon Flap" ──────────────────────────────────────────────
  flappy: [
    {
      gameId:       'flappy',
      levelIndex:   0,
      label:        'Birthday Breeze',
      speed:        2.0,         // px per frame at 60fps
      gap:          180,         // px gap between top & bottom pipe
      target:       8,           // pipes to pass to win
      coinReward:   3,
      easyMode:     { speed: 1.4, gap: 220 },
    },
    {
      gameId:       'flappy',
      levelIndex:   1,
      label:        'Party Storm',
      speed:        3.0,
      gap:          145,
      target:       15,
      coinReward:   5,
      easyMode:     { speed: 2.2, gap: 180 },
    },
  ],

  // ── Dino Run: "Birthday Run" ────────────────────────────────────────────
  dino: [
    {
      gameId:       'dino',
      levelIndex:   0,
      label:        'Birthday Dash',
      speed:        3.5,          // px per frame at 60fps
      distance:     400,          // metres to run to win
      birdsEnabled: false,
      coinReward:   3,
      easyMode:     { speed: 2.5 },
    },
    {
      gameId:       'dino',
      levelIndex:   1,
      label:        'Sprint to 19!',
      speed:        5.2,
      distance:     800,
      birdsEnabled: true,
      coinReward:   5,
      easyMode:     { speed: 3.5, birdsEnabled: false },
    },
  ],

  // ── Asteroids: "Cake Defender" ──────────────────────────────────────────
  asteroids: [
    {
      gameId:         'asteroids',
      levelIndex:     0,
      label:          'Cupcake Cannon',
      target:         10,
      rockSpeedScale: 1.0,
      rockSpawnRate:  0.55,
      splitOnDestroy: false,
      coinReward:     3,
      easyMode:       { rockSpeedScale: 0.65, rockSpawnRate: 0.35 },
    },
    {
      gameId:         'asteroids',
      levelIndex:     1,
      label:          'Gift Box Blitz',
      target:         20,
      rockSpeedScale: 1.6,
      rockSpawnRate:  0.85,
      splitOnDestroy: true,
      coinReward:     5,
      easyMode:       { rockSpeedScale: 1.1, rockSpawnRate: 0.55, splitOnDestroy: false },
    },
  ],

  // ── Jetpack: "Jet Pack Party" ───────────────────────────────────────────
  jetpack: [
    {
      gameId:       'jetpack',
      levelIndex:   0,
      label:        'Jetpack Joy',
      distance:     500,
      coinDensity:  0.6,
      laserEnabled: false,
      scrollSpeed:  4.0,          // px per frame at 60fps
      coinReward:   3,
      easyMode:     { scrollSpeed: 2.8, coinDensity: 0.8 },
    },
    {
      gameId:       'jetpack',
      levelIndex:   1,
      label:        'Laser Fiesta',
      distance:     1000,
      coinDensity:  0.8,
      laserEnabled: true,
      scrollSpeed:  6.0,
      coinReward:   5,
      easyMode:     { scrollSpeed: 4.2, laserEnabled: false },
    },
  ],

  // ── Platformer: "Super Muski" ───────────────────────────────────────────
  platformer: [
    {
      gameId:      'platformer',
      levelIndex:  0,
      label:       'Super Muski Begins',
      mapLength:   2400,
      enemyCount:  5,
      gapWidth:    60,
      scrollSpeed: 2.5,           // px per frame at 60fps
      coinReward:  3,
      easyMode:    { gapWidth: 40, enemyCount: 2, scrollSpeed: 1.8 },
    },
    {
      gameId:      'platformer',
      levelIndex:  1,
      label:       'The Final World',
      mapLength:   4800,
      enemyCount:  10,
      gapWidth:    90,
      scrollSpeed: 3.5,
      coinReward:  5,
      easyMode:    { gapWidth: 60, enemyCount: 5, scrollSpeed: 2.5 },
    },
  ],
};

/**
 * Helper: get a level config, merging easyMode overrides when active.
 * @param {string}  gameId     e.g. 'flappy'
 * @param {number}  levelIndex 0-based
 * @param {boolean} easyMode
 * @returns {object} merged config
 */
export function getLevelConfig(gameId, levelIndex, easyMode = false) {
  const base = LEVELS[gameId]?.[levelIndex];
  if (!base) throw new Error(`Unknown level: ${gameId}[${levelIndex}]`);
  return easyMode && base.easyMode
    ? { ...base, ...base.easyMode }
    : { ...base };
}
