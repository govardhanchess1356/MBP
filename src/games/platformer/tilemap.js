/**
 * src/games/platformer/tilemap.js — Pre-designed level layouts for Super Muski
 *
 * Each level returns:
 *   { platforms:[{x,y,w}], coins:[{x,y}], enemies:[{x,y,dir,patrol}], finishX }
 *
 * World coords: x = world-space pixels. y = screen-space (top of platform surface).
 * Ground level = y:520. Raised platforms at y:440, y:380.
 */

function makeCoins(platforms, extraAir = []) {
  const coins = [];
  for (const p of platforms) {
    // 3 coins spread along each platform, above the surface
    const spacing = Math.max(24, p.w / 4);
    for (let i = 1; i <= 3 && spacing * i < p.w - 10; i++) {
      coins.push({ x: p.x + spacing * i, y: p.y - 28, collected: false });
    }
  }
  for (const c of extraAir) coins.push({ ...c, collected: false });
  return coins;
}

function makeEnemies(specs) {
  return specs.map(s => ({
    x: s.x, y: s.y,
    vx: s.dir || 1,          // 1 = right, -1 = left
    patrolMin: s.x - (s.patrol || 50),
    patrolMax: s.x + (s.patrol || 50),
    alive: true,
    animFrame: 0, animTimer: 0,
  }));
}

// ─── Level 1 ──────────────────────────────────────────────────────────────────
export function generateLevel1() {
  const platforms = [
    // ground chunks (y=520), separated by gaps
    { x:   0, y: 520, w: 220 },
    { x: 280, y: 520, w: 150 },
    { x: 480, y: 520, w:  90 },
    { x: 620, y: 520, w: 180 },
    { x: 850, y: 520, w: 160 },
    { x: 1060, y: 520, w: 120 },
    { x: 1230, y: 520, w: 140 },
    { x: 1420, y: 520, w: 160 },
    { x: 1630, y: 520, w: 190 },
    { x: 1870, y: 520, w: 130 },
    { x: 2050, y: 520, w: 380 }, // long finish platform
    // raised platforms (stepping stones over wider gaps)
    { x: 445, y: 445, w:  70 },  // bridge between chunks 2-3
    { x: 800, y: 440, w:  70 },  // bridge between chunks 4-5
    { x: 1000, y: 440, w: 70 },  // bridge between chunks 5-6
    { x: 1340, y: 430, w: 60 },  // bridge 6-7
    { x: 1560, y: 450, w: 70 },  // bridge 7-8
    { x: 1790, y: 440, w: 80 },  // bridge 8-9
    { x: 1970, y: 440, w: 80 },  // bridge 9-10
  ];

  const coins = makeCoins(
    platforms.filter(p => p.y === 520).slice(0, 9),
    [
      { x: 460, y: 415 }, { x: 484, y: 415 }, { x: 508, y: 415 },
      { x: 816, y: 410 }, { x: 840, y: 410 },
      { x: 1015, y: 410 }, { x: 1039, y: 410 },
    ]
  );

  const enemies = makeEnemies([
    { x: 130, y: 510, dir:  1, patrol: 60 },
    { x: 350, y: 510, dir: -1, patrol: 55 },
    { x: 700, y: 510, dir:  1, patrol: 65 },
    { x: 1130, y: 510, dir: -1, patrol: 45 },
    { x: 1750, y: 510, dir:  1, patrol: 70 },
  ]);

  return { platforms, coins, enemies, finishX: 2390 };
}

// ─── Level 2 ──────────────────────────────────────────────────────────────────
export function generateLevel2() {
  const platforms = [
    { x:   0, y: 520, w: 180 },
    { x: 250, y: 520, w: 120 },
    { x: 440, y: 520, w:  80 },
    { x: 600, y: 520, w: 130 },
    { x: 800, y: 520, w: 100 },
    { x: 970, y: 520, w: 120 },
    { x: 1160, y: 520, w: 130 },
    { x: 1360, y: 520, w: 110 },
    { x: 1540, y: 520, w: 140 },
    { x: 1750, y: 520, w: 120 },
    { x: 1940, y: 520, w: 130 },
    { x: 2140, y: 520, w: 120 },
    { x: 2330, y: 520, w: 130 },
    { x: 2530, y: 520, w: 140 },
    { x: 2740, y: 520, w: 120 },
    { x: 2930, y: 520, w: 130 },
    { x: 3130, y: 520, w: 120 },
    { x: 3320, y: 520, w: 140 },
    { x: 3530, y: 520, w: 130 },
    { x: 3730, y: 520, w: 120 },
    { x: 3920, y: 520, w: 500 }, // finish
    // raised platforms
    { x: 210,  y: 445, w: 60 },
    { x: 400,  y: 440, w: 55 },
    { x: 558,  y: 435, w: 55 },
    { x: 760,  y: 445, w: 60 },
    { x: 930,  y: 440, w: 55 },
    { x: 1120, y: 435, w: 55 },
    { x: 1310, y: 445, w: 55 },
    { x: 1500, y: 440, w: 55 },
    { x: 1710, y: 445, w: 55 },
    { x: 1900, y: 440, w: 55 },
    { x: 2100, y: 380, w: 55 }, // high platform (need tall jump)
    { x: 2295, y: 380, w: 55 },
    // + many more skip for brevity, pattern continues
    { x: 2490, y: 440, w: 55 },
    { x: 2700, y: 445, w: 55 },
    { x: 2890, y: 440, w: 55 },
    { x: 3090, y: 435, w: 55 },
    { x: 3280, y: 445, w: 55 },
    { x: 3490, y: 440, w: 55 },
    { x: 3690, y: 445, w: 55 },
    { x: 3880, y: 440, w: 55 },
  ];

  const coins = makeCoins(platforms.filter(p => p.y === 520).slice(0, 18));

  const enemies = makeEnemies([
    { x: 290, y: 510, dir:  1, patrol: 50 },
    { x: 490, y: 510, dir: -1, patrol: 30 },
    { x: 660, y: 510, dir:  1, patrol: 50 },
    { x: 840, y: 510, dir: -1, patrol: 40 },
    { x: 1025, y: 510, dir: 1, patrol: 50 },
    { x: 1220, y: 510, dir: -1, patrol: 50 },
    { x: 1420, y: 510, dir: 1, patrol: 45 },
    { x: 1600, y: 510, dir: -1, patrol: 55 },
    { x: 1810, y: 510, dir: 1, patrol: 50 },
    { x: 2000, y: 510, dir: -1, patrol: 50 },
  ]);

  return { platforms, coins, enemies, finishX: 4380 };
}
