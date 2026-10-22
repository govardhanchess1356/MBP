/**
 * games/dino/index.js — "Birthday Run" game plug-in
 *
 * Controls:
 *   Tap            → jump (hold for extra height)
 *   Swipe down / hold lower half while running → duck
 *
 * Level config shape:
 *   { speed, distance, birdsEnabled, coinReward, easyMode }
 */

import {
  GROUND_Y,
  drawBackground, drawGround, drawRunner,
  drawCactus, drawBird,
  drawDistanceHUD, drawReadyHint, drawDeadFlash,
} from './sprites.js';
import { triggerEgg } from '@/eggs/eggs.js';
import { EGG_IDS }    from '@/config/constants.js';

const W = 360;
const GRAVITY      = 0.46;
const JUMP_VY      = -12;
const HELD_GRAVITY  = GRAVITY * 0.38; // reduced gravity while holding during ascent
const HELD_MAX_MS  = 230;             // ms of extended jump

// ── State ─────────────────────────────────────────────────────────────────────
let _st;   // 'ready' | 'running' | 'dead' | 'won' | 'done'
let _player, _obstacles, _scrollX, _distance;
let _speed, _spawnDist, _nextSpawn;
let _deadTimer, _deadFlash;
let _config;

// ── Init ──────────────────────────────────────────────────────────────────────
function init(_ctx, config) {
  _config    = config;
  _st        = 'ready';
  _scrollX   = 0;
  _distance  = 0;
  _speed     = config.speed;
  _spawnDist = 0;
  _nextSpawn = 180;
  _deadTimer = 0;
  _deadFlash = 0;
  _obstacles = [];

  _player = {
    x: 70, y: GROUND_Y,
    vy: 0,
    state:        'running', // 'running' | 'jumping' | 'ducking'
    jumpHeld:     false,
    jumpHeldMs:   0,
    animFrame:    0,
    animTimer:    0,
  };
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt, input, engine) {
  const f = dt / 16.67;

  // Always animate legs
  _player.animTimer += dt;
  if (_player.animTimer > 110) {
    _player.animTimer = 0;
    _player.animFrame = (_player.animFrame + 1) % 4;
  }

  // ── READY ──────────────────────────────────────────────────────────────────
  if (_st === 'ready') {
    _player.y = GROUND_Y + Math.sin(Date.now() * 0.003) * 3;
    if (input.tapped) _st = 'running';
    return;
  }

  // ── WON / DONE ─────────────────────────────────────────────────────────────
  if (_st === 'won' || _st === 'done') return;

  // ── DEAD ───────────────────────────────────────────────────────────────────
  if (_st === 'dead') {
    _deadTimer += dt;
    _deadFlash  = Math.max(0, 1 - _deadTimer / 600);
    if (_deadTimer > 900) {
      _st = 'done';
      engine.lose();
    }
    return;
  }

  // ── RUNNING ────────────────────────────────────────────────────────────────

  // Speed ramp
  _speed = _config.speed + Math.min(_scrollX * 0.0015, _config.speed * 0.45);
  const dx = _speed * f;
  _scrollX += dx;
  _distance = Math.min(_config.distance, Math.floor(_scrollX * 0.148));

  // Easter Egg #8: Dino 19m cake
  if (_distance === 19) {
    triggerEgg(EGG_IDS.DINO_19M);
  }

  if (_distance >= _config.distance) {
    _st = 'won';
    engine.win(_distance);
    return;
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  // Duck: hold touch in lower half of screen while grounded, or press Down / S
  const touchInLower = (input.held && input.heldY > GROUND_Y - 60) || Boolean(input.keys?.down);

  if (_player.state === 'running') {
    if (touchInLower) {
      _player.state = 'ducking';
    } else if (input.tapped) {
      _player.state    = 'jumping';
      _player.vy       = JUMP_VY;
      _player.jumpHeld = true;
      _player.jumpHeldMs = 0;
      engine.SFX.jump();
      engine.particles.burst(_player.x - 5, _player.y - 20, {
        count: 5, colors: ['#DA627D','#FFA5AB','#ffd93b'], speed: 2.5, size: 3,
      });
    }
  } else if (_player.state === 'ducking') {
    if (!touchInLower && !input.held) _player.state = 'running';
  } else if (_player.state === 'jumping') {
    // Track held
    _player.jumpHeld = input.held;
    if (_player.jumpHeld) _player.jumpHeldMs += dt;

    // Fast-fall on swipe down
    if (input.swipeDir === 'down') _player.vy = Math.max(_player.vy, 6);

    // Apply gravity
    const grav = (_player.jumpHeld && _player.vy < 0 && _player.jumpHeldMs < HELD_MAX_MS)
      ? HELD_GRAVITY
      : GRAVITY;
    _player.vy += grav * f;
    _player.y  += _player.vy * f;

    if (_player.y >= GROUND_Y) {
      _player.y  = GROUND_Y;
      _player.vy = 0;
      _player.state    = 'running';
      _player.jumpHeld = false;
      _player.jumpHeldMs = 0;
    }
  }

  // ── Spawn obstacles ────────────────────────────────────────────────────────
  _spawnDist += dx;
  if (_spawnDist >= _nextSpawn) {
    _spawnDist = 0;
    _nextSpawn = 130 + Math.random() * 110;

    const isBird = _config.birdsEnabled && Math.random() < 0.28;
    if (isBird) {
      // Bird height: jumps reach ~y=380; birds at 415–455 force duck-or-jump decision
      const birdY = GROUND_Y - 95 - Math.random() * 55;
      _obstacles.push({
        type: 'bird', x: W + 20, y: birdY,
        width: 44, height: 24,
        wingPhase: 0, wingTimer: 0,
      });
    } else {
      const h    = 34 + Math.random() * 28;
      const ctype = Math.random() < 0.42 ? 'double' : 'single';
      _obstacles.push({
        type: 'cactus', x: W + 10,
        y: GROUND_Y, width: ctype === 'double' ? 48 : 24,
        height: h, ctype,
      });
    }
  }

  // Move obstacles + animate birds
  for (const o of _obstacles) {
    o.x -= dx;
    if (o.type === 'bird') {
      o.wingTimer += dt;
      o.wingPhase  = (o.wingTimer % 380) / 380;
    }
  }
  _obstacles = _obstacles.filter(o => o.x + o.width > -20);

  // ── Collision ──────────────────────────────────────────────────────────────
  for (const o of _obstacles) {
    if (hitTest(_player, o)) {
      _st        = 'dead';
      _deadTimer = 0;
      _deadFlash = 1;
      engine.shake.shake(8, 380);
      engine.SFX.hit();
      return;
    }
  }
}

function hitTest(p, o) {
  // Player hitbox (shrunk for fairness)
  let px, py, pw, ph;
  if (p.state === 'ducking') {
    px = p.x - 11; py = p.y - 18; pw = 26; ph = 18;
  } else {
    px = p.x - 9;  py = p.y - 46; pw = 18; ph = 44;
  }
  px += 3; py += 5; pw -= 6; ph -= 8; // inner shrink

  let ox, oy, ow, oh;
  if (o.type === 'cactus') {
    ox = o.x + 3; oy = o.y - o.height + 4; ow = o.width - 6; oh = o.height - 4;
  } else {
    ox = o.x + 5; oy = o.y - 12; ow = o.width - 10; oh = 18;
  }

  return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(ctx) {
  drawBackground(ctx, _scrollX);
  drawGround(ctx, _scrollX);

  for (const o of _obstacles) {
    if (o.type === 'cactus') drawCactus(ctx, o);
    else drawBird(ctx, o);
  }

  drawRunner(ctx, _player);

  // Easter egg #8: Floating 19m cake
  if (_distance >= 18 && _distance <= 21) {
    ctx.font = '26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎂', W / 2, GROUND_Y - 90);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ffd93b';
    ctx.fillText('19M SECRET CAKE! ✨', W / 2, GROUND_Y - 120);
  }

  if (_deadFlash > 0) drawDeadFlash(ctx, _deadFlash);

  if (_st === 'ready')   drawReadyHint(ctx);
  if (_st === 'running') drawDistanceHUD(ctx, _distance, _config.distance);
  if (_st === 'won')     drawDistanceHUD(ctx, _distance, _config.distance);
}

export default { init, update, render };
