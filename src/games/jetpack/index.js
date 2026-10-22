import {
  PLAYER_X,
  drawBackground,
  drawTunnel,
  drawPlayer,
  drawCoin,
  drawLaser,
  drawHUD,
  drawReadyHint,
} from './sprites.js';
import { CANVAS_W, CANVAS_H } from '@/config/constants.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEG_W        = 20;
const SEG_COUNT    = 30;           // segments kept alive
const GRAVITY      = 0.42;
const THRUST_ACCEL = -0.8;
const MAX_VY       = 11;
const PLAYER_R     = 16;           // hitbox radius
const COIN_COLLECT_DIST = 22;

// ── Module-level state ────────────────────────────────────────────────────────
let _state;         // 'ready' | 'playing' | 'dead' | 'won' | 'done'
let _player;
let _segments;
let _coins;
let _lasers;
let _scrollX;
let _waveT;
let _distance;
let _coinsCollected;
let _deadTimer;
let _nextCoinAt;    // look-ahead spawn threshold (in scrollX units)
let _nextLaserAt;
let _config;
let _engine;
let _speed;

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeSegment(x, waveT) {
  const ceilY  = 80  + Math.sin(waveT) * 40;
  const floorY = 520 - Math.sin(waveT * 0.7 + 1) * 40;
  return { x, w: SEG_W, ceilY, floorY };
}

function getSegAtX(x) {
  if (!_segments || _segments.length === 0) return { ceilY: 80, floorY: 520 };
  for (const seg of _segments) {
    if (x >= seg.x && x < seg.x + seg.w) return seg;
  }
  // Fall back to nearest
  return _segments[_segments.length - 1] || { ceilY: 80, floorY: 520 };
}

function spawnCoin(scrollXAhead) {
  const seg = _segments[_segments.length - 1];
  if (!seg) return;
  const safeTop    = seg.ceilY  + 30;
  const safeBottom = seg.floorY - 30;
  if (safeBottom <= safeTop) return;
  const y = safeTop + Math.random() * (safeBottom - safeTop);
  _coins.push({
    x: CANVAS_W + 20 + Math.random() * 60,
    y,
    phase: Math.random() * Math.PI * 2,
  });
}

function spawnLaser() {
  const seg = _segments[_segments.length - 1];
  if (!seg) return;
  const safeTop = seg.ceilY + 20;
  _lasers.push({
    x: CANVAS_W + 20,
    y: safeTop + Math.random() * 60,
    w: 40,
    h: 4,
    active: false,
    timer: Math.random() * 2000,   // phase offset
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init(ctx, config, helpers) {
  _config = config;
  _engine = helpers.engine;

  _speed  = config.scrollSpeed || 4.0;

  _state          = 'ready';
  _scrollX        = 0;
  _waveT          = 0;
  _distance       = 0;
  _coinsCollected = 0;
  _deadTimer      = 0;
  _nextCoinAt     = 200;
  _nextLaserAt    = 400;

  // Player
  _player = {
    x:        PLAYER_X,
    y:        320,
    vy:       0,
    thrusting: false,
  };

  // Tunnel segments
  _segments = [];
  let wt = 0;
  for (let i = 0; i < SEG_COUNT; i++) {
    _segments.push(makeSegment(i * SEG_W, wt));
    wt += SEG_W * 0.0008;
  }
  _waveT = wt;

  // Coins – scatter some initial coins beyond player start
  _coins = [];
  const density     = config.coinDensity || 0.6;
  const totalCoins  = Math.floor(density * (config.distance || 500) * 0.04);
  for (let i = 0; i < totalCoins; i++) {
    const cx = 300 + i * (120 + Math.random() * 80);
    _coins.push({
      x:     cx,
      y:     200 + Math.random() * 240,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Lasers
  _lasers = [];
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt, input, engine) {
  const f = dt / 16.67;

  // ---- READY ----------------------------------------------------------------
  if (_state === 'ready') {
    _player.y = 320 + Math.sin(Date.now() * 0.003) * 15;
    if (input.held || input.tapped) _state = 'playing';
    return;
  }

  // ---- DEAD -----------------------------------------------------------------
  if (_state === 'dead') {
    _deadTimer += dt;
    if (_deadTimer >= 900) {
      _state = 'done';
      engine.lose();
    }
    return;
  }

  // ---- WON / DONE -----------------------------------------------------------
  if (_state === 'won' || _state === 'done') return;

  // ---- PLAYING --------------------------------------------------------------

  // Scroll
  const spd = _speed;
  const dx  = spd * f;
  _scrollX += dx;

  // Advance wave
  _waveT += dt * 0.0008;

  // Move segments
  for (const seg of _segments) seg.x -= dx;

  // Remove off-screen segments (left)
  while (_segments.length > 0 && _segments[0].x + SEG_W < -10) {
    _segments.shift();
  }

  // Add new segments at right end
  while (_segments.length < SEG_COUNT) {
    const lastX = _segments.length > 0
      ? _segments[_segments.length - 1].x + SEG_W
      : 0;
    _segments.push(makeSegment(lastX, _waveT));
    _waveT += SEG_W * 0.0008;
  }

  // ── Player physics ────────────────────────────────────────────────────────
  _player.thrusting = input.held;

  if (input.held) {
    _player.vy += THRUST_ACCEL * f;
  }
  _player.vy += GRAVITY * f;
  _player.vy = Math.max(-MAX_VY, Math.min(MAX_VY, _player.vy));
  _player.y += _player.vy * f;

  // Clamp player X (stays fixed horizontally but guard anyway)
  _player.x = PLAYER_X;

  // ── Collision with tunnel walls (safe ground running & ceiling bounce) ───
  const seg = getSegAtX(_player.x);
  if (_player.y - PLAYER_R < seg.ceilY) {
    _player.y = seg.ceilY + PLAYER_R;
    _player.vy = Math.max(0, _player.vy);
  }
  if (_player.y + PLAYER_R > seg.floorY) {
    _player.y = seg.floorY - PLAYER_R;
    _player.vy = 0;
  }

  // ── Coins ─────────────────────────────────────────────────────────────────
  for (const coin of _coins) {
    coin.x     -= dx;
    coin.phase += dt * 0.004;
  }

  // Collect coins
  for (let i = _coins.length - 1; i >= 0; i--) {
    const c    = _coins[i];
    const ddx  = c.x - _player.x;
    const ddy  = c.y - _player.y;
    if (Math.sqrt(ddx * ddx + ddy * ddy) < COIN_COLLECT_DIST) {
      engine.SFX.coin();
      engine.particles.burst(c.x, c.y, {
        count: 6, colors: ['#ffd93b', '#fff8a0'], speed: 3, size: 4,
      });
      _coinsCollected++;
      _coins.splice(i, 1);
    }
  }

  // Remove off-screen coins
  for (let i = _coins.length - 1; i >= 0; i--) {
    if (_coins[i].x < -30) _coins.splice(i, 1);
  }

  // Look-ahead coin spawning
  if (_scrollX >= _nextCoinAt) {
    const gap = 200 + Math.random() * 200;
    _nextCoinAt = _scrollX + gap;
    spawnCoin(_scrollX);
    // Sometimes a cluster
    if (Math.random() < 0.4) {
      for (let k = 1; k <= 2; k++) {
        const extra = _coins[_coins.length - 1];
        if (extra) {
          _coins.push({ x: extra.x + 30 * k, y: extra.y, phase: Math.random() * Math.PI * 2 });
        }
      }
    }
  }

  // ── Lasers ────────────────────────────────────────────────────────────────
  if (_config.laserEnabled) {
    for (const laser of _lasers) {
      laser.x -= dx;
      laser.timer += dt;
      laser.active = (laser.timer % 2000) < 1000;

      // Collision
      if (laser.active) {
        const lx = laser.x + laser.w * 0.5;
        const ly = laser.y + (laser.h || 4) * 0.5;
        const ddx = lx - _player.x;
        const ddy = ly - _player.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy) < PLAYER_R + 4) {
          _state     = 'dead';
          _deadTimer = 0;
          engine.particles.burst(_player.x, _player.y, {
            count: 20, colors: ['#ff0066', '#ff6eb4', '#fff'], speed: 5, size: 5,
          });
          engine.shake.shake(12, 500);
          engine.SFX.explosion();
          return;
        }
      }
    }

    // Remove off-screen lasers
    for (let i = _lasers.length - 1; i >= 0; i--) {
      if (_lasers[i].x + (_lasers[i].w || 40) < -10) _lasers.splice(i, 1);
    }

    // Spawn new lasers ahead
    if (_scrollX >= _nextLaserAt) {
      _nextLaserAt = _scrollX + 400 + Math.random() * 200;
      spawnLaser();
    }
  }

  // ── Distance & win ────────────────────────────────────────────────────────
  _distance = Math.floor(_scrollX * 0.15);
  if (_distance >= (_config.distance || 500)) {
    _state = 'won';
    engine.particles.burst(180, 320, {
      count: 40, colors: ['#ffd93b', '#ff6eb4', '#5effa3', '#c9a0ff'], speed: 6, size: 7,
    });
    engine.SFX.coin();
    engine.win(_coinsCollected * (_config.coinReward || 3));
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(ctx, engine) {
  // Background
  drawBackground(ctx, _scrollX);

  // Tunnel
  drawTunnel(ctx, _segments);

  // Coins
  for (const coin of _coins) {
    drawCoin(ctx, coin);
  }

  // Lasers
  for (const laser of _lasers) {
    drawLaser(ctx, laser);
  }

  // Player
  drawPlayer(ctx, _player);

  // HUD
  drawHUD(ctx, _distance, _config ? (_config.distance || 500) : 500, _coinsCollected);

  // Ready overlay
  if (_state === 'ready') {
    drawReadyHint(ctx);
  }

  // Dead flash
  if (_state === 'dead') {
    ctx.save();
    const alpha = Math.min(0.5, (_deadTimer / 900) * 0.5);
    ctx.fillStyle = `rgba(255,0,102,${alpha})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }

  // Won flash
  if (_state === 'won') {
    ctx.save();
    ctx.fillStyle = 'rgba(94,255,163,0.15)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffd93b';
    ctx.shadowBlur = 20;
    ctx.fillText('🎉 YOU MADE IT!', CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }
}

// ── Export ────────────────────────────────────────────────────────────────────
export default { init, update, render };
