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
      speed:        1.3,         // px per frame at 60fps (gentle, easy pace)
      gap:          240,         // generous gap between pipes
      target:       5,           // quick fun goal
      coinReward:   3,
      easyMode:     { speed: 1.0, gap: 260 },
    },
    {
      gameId:       'flappy',
      levelIndex:   1,
      label:        'Party Storm',
      speed:        1.6,
      gap:          210,
      target:       7,
      coinReward:   5,
      easyMode:     { speed: 1.2, gap: 240 },
    },
  ],

  // ── Dino Run: "Birthday Run" ────────────────────────────────────────────
  dino: [
    {
      gameId:       'dino',
      levelIndex:   0,
      label:        'Birthday Dash',
      speed:        2.0,          // comfortable running pace
      distance:     120,          // short, achievable dash
      birdsEnabled: false,
      coinReward:   3,
      easyMode:     { speed: 1.5 },
    },
    {
      gameId:       'dino',
      levelIndex:   1,
      label:        'Sprint to 19!',
      speed:        2.6,
      distance:     220,
      birdsEnabled: true,
      coinReward:   5,
      easyMode:     { speed: 1.8, birdsEnabled: false },
    },
  ],

  // ── Asteroids: "Cake Defender" ──────────────────────────────────────────
  asteroids: [
    {
      gameId:         'asteroids',
      levelIndex:     0,
      label:          'Cupcake Cannon',
      target:         5,
      rockSpeedScale: 0.5,
      rockSpawnRate:  0.35,
      splitOnDestroy: false,
      coinReward:     3,
      easyMode:       { rockSpeedScale: 0.35, rockSpawnRate: 0.25 },
    },
    {
      gameId:         'asteroids',
      levelIndex:     1,
      label:          'Gift Box Blitz',
      target:         8,
      rockSpeedScale: 0.7,
      rockSpawnRate:  0.45,
      splitOnDestroy: false,
      coinReward:     5,
      easyMode:       { rockSpeedScale: 0.45, rockSpawnRate: 0.3, splitOnDestroy: false },
    },
  ],

  // ── Jetpack: "Jet Pack Party" ───────────────────────────────────────────
  jetpack: [
    {
      gameId:       'jetpack',
      levelIndex:   0,
      label:        'Jetpack Joy',
      distance:     160,
      coinDensity:  0.8,
      laserEnabled: false,
      scrollSpeed:  2.0,
      coinReward:   3,
      easyMode:     { scrollSpeed: 1.5, coinDensity: 0.9 },
    },
    {
      gameId:       'jetpack',
      levelIndex:   1,
      label:        'Laser Fiesta',
      distance:     280,
      coinDensity:  0.9,
      laserEnabled: true,
      scrollSpeed:  2.5,
      coinReward:   5,
      easyMode:     { scrollSpeed: 1.8, laserEnabled: false },
    },
  ],

  // ── Platformer: "Super Muski" ───────────────────────────────────────────
  platformer: [
    {
      gameId:      'platformer',
      levelIndex:  0,
      label:       'Super Muski Begins',
      mapLength:   1000,
      enemyCount:  2,
      gapWidth:    35,
      scrollSpeed: 1.5,
      coinReward:  3,
      easyMode:    { gapWidth: 25, enemyCount: 1, scrollSpeed: 1.2 },
    },
    {
      gameId:      'platformer',
      levelIndex:  1,
      label:       'The Final World',
      mapLength:   1500,
      enemyCount:  3,
      gapWidth:    45,
      scrollSpeed: 1.9,
      coinReward:  5,
      easyMode:    { gapWidth: 30, enemyCount: 1, scrollSpeed: 1.4 },
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
