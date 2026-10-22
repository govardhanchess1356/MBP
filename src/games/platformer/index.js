/**
 * src/games/platformer/index.js — "Super Muski" game plugin
 *
 * Auto-runner platformer. World scrolls right at fixed speed.
 * Tap to jump. L2: double-jump available.
 * Stomp enemies (land on top) for a bounce + coin.
 * Fall in a gap → die. Reach finish cake → win.
 *
 * Level config shape:
 *   { scrollSpeed, mapLength, enemyCount, gapWidth, coinReward, easyMode }
 */

import { generateLevel1, generateLevel2 } from './tilemap.js';
import {
  drawBackground, drawPlatform, drawPlayer,
  drawEnemy, drawCoin, drawFinish,
  drawHUD, drawReadyHint, drawDeadFlash, drawDoublJumpHint,
} from './sprites.js';

const GRAVITY      = 0.5;
const JUMP_VY      = -12.5;
const DBL_JUMP_VY  = -10.5;
const PLAYER_W     = 18;   // hitbox half-width
const PLAYER_H     = 50;   // hitbox height
const SCREEN_X     = 80;   // fixed screen column for player

let _st;
let _player, _cameraX;
let _platforms, _coins, _enemies, _finishX;
let _coinsCollected, _enemiesStomped;
let _deadTimer, _deadAlpha;
let _config;
let _showDblJumpHint, _dblJumpHintTimer;

// ── Init ──────────────────────────────────────────────────────────────────────
function init(_ctx, config) {
  _config = config;
  _st     = 'ready';
  _coinsCollected = 0;
  _enemiesStomped = 0;
  _deadTimer = 0; _deadAlpha = 0;
  _showDblJumpHint = config.levelIndex === 1;
  _dblJumpHintTimer = 3000;

  const level = config.levelIndex === 0 ? generateLevel1() : generateLevel2();
  _platforms = level.platforms;
  _coins     = level.coins;
  _enemies   = level.enemies;
  _finishX   = level.finishX;

  _player = {
    worldX:       SCREEN_X,
    screenX:      SCREEN_X,
    y:            520,
    vy:           0,
    onGround:     true,
    doublejumpUsed: false,
    state:        'running',
    animFrame:    0,
    animTimer:    0,
    prevY:        520,
  };

  _cameraX = 0;
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt, input, engine) {
  const f = dt / 16.67;

  // Animate player legs
  _player.animTimer += dt;
  if (_player.animTimer > 110) { _player.animTimer = 0; _player.animFrame = (_player.animFrame + 1) % 4; }

  // Double-jump hint countdown
  if (_showDblJumpHint) {
    _dblJumpHintTimer -= dt;
    if (_dblJumpHintTimer <= 0) _showDblJumpHint = false;
  }

  // ── READY ──────────────────────────────────────────────────────────────────
  if (_st === 'ready') {
    _player.y = 520 + Math.sin(Date.now() * 0.003) * 4;
    if (input.tapped) {
      _st = 'running';
      _player.vy  = JUMP_VY * 0.5;
      _player.onGround = false;
      _player.state = 'jumping';
    }
    return;
  }

  // ── DEAD ───────────────────────────────────────────────────────────────────
  if (_st === 'dead') {
    _deadTimer += dt;
    _deadAlpha = Math.max(0, 1 - _deadTimer / 500);
    if (_deadTimer > 900) { _st = 'done'; engine.lose(); }
    return;
  }
  if (_st === 'done' || _st === 'won') return;

  // ── RUNNING / JUMPING ──────────────────────────────────────────────────────
  const speed = _config.scrollSpeed;

  // Auto-run
  _player.worldX += speed * f;
  _cameraX = _player.worldX - SCREEN_X;

  // Jump input
  if (input.tapped) {
    if (_player.onGround) {
      _player.vy = JUMP_VY;
      _player.onGround = false;
      _player.doublejumpUsed = false;
      _player.state = 'jumping';
      engine.SFX.jump();
      engine.particles.burst(SCREEN_X, _player.y - 10, {
        count: 6, colors: ['#DA627D','#FFA5AB','#ffd93b'], speed: 2.5, size: 3,
      });
    } else if (_config.levelIndex === 1 && !_player.doublejumpUsed) {
      // Double-jump (L2 only)
      _player.vy = DBL_JUMP_VY;
      _player.doublejumpUsed = true;
      engine.SFX.jump();
      engine.particles.burst(SCREEN_X, _player.y - 10, {
        count: 8, colors: ['#c9a0ff','#ffd93b'], speed: 3, size: 4,
      });
    }
  }

  // Gravity
  _player.prevY = _player.y;
  _player.vy += GRAVITY * f;
  _player.y  += _player.vy * f;
  _player.onGround = false;

  // ── Platform collision ─────────────────────────────────────────────────────
  for (const plat of _platforms) {
    const sx = plat.x - _cameraX;
    if (sx + plat.w < SCREEN_X - PLAYER_W - 4) continue;
    if (sx > SCREEN_X + PLAYER_W + 4)          continue;

    // Landing check: falling down and crossed platform top
    if (_player.vy >= 0 && _player.prevY <= plat.y && _player.y >= plat.y) {
      const px = _player.worldX;
      if (px + PLAYER_W > plat.x && px - PLAYER_W < plat.x + plat.w) {
        _player.y  = plat.y;
        _player.vy = 0;
        _player.onGround = true;
        _player.doublejumpUsed = false;
        _player.state = 'running';
      }
    }
  }

  // ── Fell in a gap ──────────────────────────────────────────────────────────
  if (_player.y > 640) {
    die(engine);
    return;
  }

  // ── Enemy logic ────────────────────────────────────────────────────────────
  for (const enemy of _enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx * 1.2 * f;
    if (enemy.x <= enemy.patrolMin || enemy.x >= enemy.patrolMax) enemy.vx *= -1;

    const ex = enemy.x - _cameraX;
    const ey = enemy.y;

    // Stomp: player falling, center in range, lands on top
    const hx = Math.abs(SCREEN_X - ex) < 26;
    if (hx && _player.vy > 0 && _player.y > ey - 22 && _player.prevY <= ey - 14) {
      enemy.alive = false;
      _player.vy = -8; // bounce
      _enemiesStomped++;
      _coinsCollected++;
      engine.SFX.coin();
      engine.particles.burst(ex, ey, { count: 10, colors: ['#5effa3','#ffd93b'], speed: 4, size: 4 });
    }
    // Side collision
    else if (hx && Math.abs(_player.y - ey) < 22) {
      die(engine);
      return;
    }
  }

  // ── Coin collection ────────────────────────────────────────────────────────
  for (const coin of _coins) {
    if (coin.collected) continue;
    const cx = coin.x - _cameraX;
    const dx = SCREEN_X - cx;
    const dy = _player.y - coin.y;
    if (dx * dx + dy * dy < 22 * 22) {
      coin.collected = true;
      _coinsCollected++;
      engine.SFX.coin();
    }
  }

  // ── Win condition ──────────────────────────────────────────────────────────
  if (_player.worldX >= _finishX) {
    _st = 'won';
    engine.win(_coinsCollected);
  }
}

function die(engine) {
  _st = 'dead';
  _deadTimer = 0;
  _deadAlpha = 1;
  engine.shake.shake(8, 400);
  engine.SFX.hit();
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(ctx) {
  drawBackground(ctx, _cameraX);

  // Platforms (back to front)
  for (const p of _platforms) drawPlatform(ctx, p, _cameraX);

  // Finish cake
  drawFinish(ctx, _finishX, _cameraX);

  // Enemies
  for (const e of _enemies) drawEnemy(ctx, e, _cameraX);

  // Coins
  for (const c of _coins) drawCoin(ctx, c, _cameraX);

  // Player
  drawPlayer(ctx, _player);

  // Overlays
  if (_deadAlpha > 0) drawDeadFlash(ctx, _deadAlpha);
  if (_st === 'ready') drawReadyHint(ctx);
  if (_showDblJumpHint && _st === 'running') drawDoublJumpHint(ctx);
  if (_st !== 'ready') drawHUD(ctx, _coinsCollected, _enemiesStomped);
}

export default { init, update, render };
