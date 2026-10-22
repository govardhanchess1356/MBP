/**
 * games/asteroids/index.js — "Cake Defender" game plug-in
 *
 * Drag/hold → ship follows touch.  Auto-fires at nearest rock every 400ms.
 * L1: destroy 10 gift-box rocks, no split.
 * L2: destroy 20, large → 2 medium, medium → 2 small (split on destroy).
 *
 * Level config shape:
 *   { target, rockSpeedScale, rockSpawnRate, splitOnDestroy, coinReward, easyMode }
 */

import {
  drawBackground, drawShip, drawGiftBox, drawCupcake, drawCandy,
  drawBullet, drawExplosion, drawHUD, drawReadyHint,
} from './sprites.js';

const W = 360, H = 640;

// Rock base speeds (px/frame at scale=1)
const BASE_SPEEDS = { large: 1.3, medium: 1.9, small: 2.7 };
const RADII       = { large: 30,  medium: 19,  small: 10  };

const ROCK_COLORS = {
  large:  ['#DA627D','#A53860','#ff6eb4','#c9a0ff'],
  medium: ['#FFA5AB','#ff6eb4','#5ee0ff'],
  small:  ['#DA627D','#ffd93b','#5effa3'],
};

// ── Module state ──────────────────────────────────────────────────────────────
let _st;
let _ship, _targetX, _targetY;
let _rocks, _bullets, _explosions;
let _destroyed, _fireTimer, _spawnTimer, _totalSpawned;
let _config;

// ── Init ──────────────────────────────────────────────────────────────────────
function init(_ctx, config) {
  _config       = config;
  _st           = 'ready';
  _destroyed    = 0;
  _fireTimer    = 0;
  _spawnTimer   = 0;
  _totalSpawned = 0;
  _rocks        = [];
  _bullets      = [];
  _explosions   = [];

  _ship    = { x: W / 2, y: H - 110, tilt: 0 };
  _targetX = W / 2;
  _targetY = H - 110;
}

// ── Rock spawner ──────────────────────────────────────────────────────────────
function spawnRock(size, ox = null, oy = null) {
  let rx = ox, ry = oy;
  if (rx === null) {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: rx = Math.random() * W;  ry = -45; break;
      case 1: rx = W + 45;             ry = Math.random() * H; break;
      case 2: rx = Math.random() * W;  ry = H + 45; break;
      default:rx = -45;                ry = Math.random() * H; break;
    }
  }

  const spread = (Math.random() - 0.5) * 1.1;
  const ang    = Math.atan2(H / 2 - ry, W / 2 - rx) + spread;
  const spd    = BASE_SPEEDS[size] * (_config.rockSpeedScale ?? 1) * (0.7 + Math.random() * 0.55);
  const colors = ROCK_COLORS[size];

  _rocks.push({
    x: rx, y: ry,
    r:  RADII[size],
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    angle: Math.random() * Math.PI * 2,
    av:    (Math.random() - 0.5) * 0.05,
    size,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt, input, engine) {
  const f = dt / 16.67;

  // ── READY ──────────────────────────────────────────────────────────────────
  if (_st === 'ready') {
    if (input.tapped || input.held) _st = 'playing';
    return;
  }
  if (_st !== 'playing') return;

  // ── Ship movement ──────────────────────────────────────────────────────────
  if (input.keys?.left)  { _ship.x -= 7 * f; _targetX = _ship.x; _ship.tilt = -0.28; }
  if (input.keys?.right) { _ship.x += 7 * f; _targetX = _ship.x; _ship.tilt = 0.28; }
  if (input.keys?.up)    { _ship.y -= 7 * f; _targetY = _ship.y; }
  if (input.keys?.down)  { _ship.y += 7 * f; _targetY = _ship.y; }

  if (input.held && !input.keys?.left && !input.keys?.right && !input.keys?.up && !input.keys?.down) {
    _targetX = input.heldX;
    _targetY = input.heldY;
    const sdx  = _targetX - _ship.x;
    const sdy  = _targetY - _ship.y;
    const dist = Math.sqrt(sdx * sdx + sdy * sdy);
    if (dist > 2) {
      const step = Math.min(dist, 7 * f);
      _ship.x += (sdx / dist) * step;
      _ship.y += (sdy / dist) * step;
      _ship.tilt = Math.atan2(sdx, -sdy) * 0.14;
    } else {
      _ship.tilt *= 0.85;
    }
  } else if (!input.keys?.left && !input.keys?.right) {
    _ship.tilt *= 0.85;
  }
  _ship.x = Math.max(28, Math.min(W - 28, _ship.x));
  _ship.y = Math.max(40, Math.min(H - 40, _ship.y));

  // ── Spawn rocks ────────────────────────────────────────────────────────────
  const spawnRate = _config.rockSpawnRate ?? 0.55;
  _spawnTimer += dt / 1000;
  // Limit total spawns so the game doesn't go forever
  if (_spawnTimer >= 1 / spawnRate && _totalSpawned < _config.target * 3) {
    _spawnTimer = 0;
    _totalSpawned++;
    spawnRock('large');
  }

  // ── Move rocks ─────────────────────────────────────────────────────────────
  for (const rock of _rocks) {
    rock.x += rock.vx * f;
    rock.y += rock.vy * f;
    rock.angle += rock.av * f;
  }
  // Despawn rocks that drift far off screen
  _rocks = _rocks.filter(r => {
    const m = r.r + 80;
    return r.x > -m && r.x < W + m && r.y > -m && r.y < H + m;
  });

  // ── Auto-fire ──────────────────────────────────────────────────────────────
  _fireTimer += dt;
  if (_fireTimer >= 380 && _rocks.length > 0) {
    _fireTimer = 0;
    fireAtNearest();
    engine.SFX.shoot();
  }

  // ── Move bullets ───────────────────────────────────────────────────────────
  for (const b of _bullets) {
    b.x += Math.sin(b.angle) * 9 * f;
    b.y -= Math.cos(b.angle) * 9 * f;
    b.life -= dt;
  }
  _bullets = _bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

  // ── Bullet ↔ rock collision ────────────────────────────────────────────────
  outer:
  for (let bi = _bullets.length - 1; bi >= 0; bi--) {
    const b = _bullets[bi];
    for (let ri = _rocks.length - 1; ri >= 0; ri--) {
      const rock = _rocks[ri];
      const dx = b.x - rock.x, dy = b.y - rock.y;
      if (dx * dx + dy * dy < (rock.r + 5) ** 2) {
        _bullets.splice(bi, 1);
        _rocks.splice(ri, 1);

        // Explosion
        _explosions.push({ x: rock.x, y: rock.y, r: rock.r, color: rock.color, life: 420, maxLife: 420 });
        engine.SFX.explosion();
        engine.particles.burst(rock.x, rock.y, {
          count: 10, colors: [rock.color, '#ffd93b', '#ffffff'], speed: 4, size: 5,
        });

        // Split on L2
        if (_config.splitOnDestroy) {
          if (rock.size === 'large') {
            spawnRock('medium', rock.x - 12, rock.y);
            spawnRock('medium', rock.x + 12, rock.y);
          } else if (rock.size === 'medium') {
            spawnRock('small', rock.x - 6, rock.y);
            spawnRock('small', rock.x + 6, rock.y);
          }
        }

        _destroyed++;
        engine.SFX.coin();

        if (_destroyed >= _config.target) {
          _st = 'won';
          engine.win(_destroyed);
          return;
        }
        continue outer;
      }
    }
  }

  // ── Rock ↔ ship collision ──────────────────────────────────────────────────
  for (const rock of _rocks) {
    const dx = _ship.x - rock.x, dy = _ship.y - rock.y;
    if (dx * dx + dy * dy < (rock.r + 17) ** 2) {
      _st = 'dead';
      engine.shake.shake(10, 500);
      engine.SFX.hit();
      _explosions.push({ x: _ship.x, y: _ship.y, r: 30, color: '#ff6eb4', life: 600, maxLife: 600 });
      setTimeout(() => engine.lose(), 800);
      return;
    }
  }

  // Update explosions
  for (const e of _explosions) e.life -= dt;
  _explosions = _explosions.filter(e => e.life > 0);
}

function fireAtNearest() {
  let nearest = null, minD = Infinity;
  for (const rock of _rocks) {
    const dx = rock.x - _ship.x, dy = rock.y - _ship.y;
    const d = dx * dx + dy * dy;
    if (d < minD) { minD = d; nearest = rock; }
  }
  if (!nearest) return;

  const angle = Math.atan2(nearest.x - _ship.x, -(nearest.y - _ship.y));
  _bullets.push({ x: _ship.x, y: _ship.y - 24, angle, life: 900 });
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(ctx) {
  drawBackground(ctx);

  for (const e of _explosions) drawExplosion(ctx, e);
  for (const r of _rocks) {
    if      (r.size === 'large')  drawGiftBox(ctx, r);
    else if (r.size === 'medium') drawCupcake(ctx, r);
    else                          drawCandy(ctx, r);
  }
  for (const b of _bullets)      drawBullet(ctx, b);

  if (_st !== 'dead') drawShip(ctx, _ship);

  if (_st === 'ready')   drawReadyHint(ctx);
  else                   drawHUD(ctx, _destroyed, _config.target);
}

export default { init, update, render };
