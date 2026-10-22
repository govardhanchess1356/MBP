/**
 * games/flappy/index.js — "Balloon Flap" game plug-in
 *
 * Interface: { init(ctx, config, assets), update(dt, input, engine), render(ctx, engine) }
 * Calls engine.win(score) or engine.lose() to end the game.
 *
 * Level config shape (from src/config/levels.js):
 *   { speed, gap, target, coinReward, easyMode: { speed, gap } }
 *
 * Phase 3: 2 levels. Plug-in only — do NOT modify engine files.
 */

import {
  drawBackground, drawCloud, drawPipe, drawGround,
  drawBird, drawScoreHUD, drawReadyHint, drawDeadFlash, drawPassedPop,
} from './sprites.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const W           = 360;
const H           = 640;
const GROUND_Y    = 615;
const GRAVITY     = 0.38;    // px/frame² at 60fps
const FLAP_FORCE  = -8.2;   // initial vy on tap
const BIRD_X      = 95;     // fixed horizontal position
const BIRD_R      = 18;     // collision radius
const PIPE_W      = 44;
const PIPE_MIN_H  = 70;     // minimum top pipe height
const PIPE_SPAWN_X = W + PIPE_W + 10;  // where new pipes spawn

// ── Module-level game state (reset on each init) ──────────────────────────────
let _state;   // 'ready' | 'playing' | 'dead' | 'won'
let _bird;
let _pipes;
let _clouds;
let _score;
let _pipeProgress;     // how far we've scrolled since last pipe (in pipe-speed units)
let _pipeInterval;     // logical units between pipe spawns
let _deadTimer;
let _popQueue;         // { y, alpha, life } for "+1" floating texts
let _config;
let _deadFlashAlpha;
let _expression;
let _flapCooldown;

// Accumulated time for expression switching (idle animation)
let _idleT = 0;

function makeCloud() {
  return {
    x:     Math.random() * W,
    y:     30  + Math.random() * 180,
    w:     50  + Math.random() * 55,
    h:     20  + Math.random() * 20,
    speed: 0.2 + Math.random() * 0.25,
  };
}

function randomGapY(gap) {
  return PIPE_MIN_H + Math.random() * (GROUND_Y - gap - PIPE_MIN_H - 10);
}

function spawnPipe(gap) {
  return {
    x:      PIPE_SPAWN_X,
    gapY:   randomGapY(gap),
    gap,
    width:  PIPE_W,
    passed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT — called on start and on each retry
// ─────────────────────────────────────────────────────────────────────────────
function init(_ctx, config, { engine }) {
  _config = config;

  _state        = 'ready';
  _score        = 0;
  _pipeProgress = 0;
  // Spawn a pipe every ~200 logical units (tuned per level via speed)
  _pipeInterval = 200;
  _deadTimer    = 0;
  _deadFlashAlpha = 0;
  _flapCooldown = 0;
  _popQueue     = [];
  _expression   = 'default';
  _idleT        = 0;

  _bird = {
    x:        BIRD_X,
    y:        GROUND_Y / 2,
    vy:       0,
    rotation: 0,    // degrees
  };

  _pipes  = [];
  _clouds = Array.from({ length: 5 }, makeCloud);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────
function update(dt, input, engine) {
  const f = dt / 16.67;   // normalise to 60fps
  const speed = _config.speed * f;

  // Sync mute
  engine.SFX.setMuted(false); // respect system mute, don't double-override here

  // ── Move clouds (always) ────────────────────────────────────────────────
  for (const c of _clouds) {
    c.x -= c.speed * f;
    if (c.x + c.w * 0.5 < 0) {
      c.x = W + c.w;
      c.y = 30 + Math.random() * 180;
    }
  }

  // ── Flap cooldown ────────────────────────────────────────────────────────
  _flapCooldown = Math.max(0, _flapCooldown - dt);

  // ── Pop queue ("+1" floaters) ────────────────────────────────────────────
  for (let i = _popQueue.length - 1; i >= 0; i--) {
    const p = _popQueue[i];
    p.life  -= dt;
    p.y     -= 0.6 * f;
    p.alpha  = Math.max(0, p.life / 600);
    if (p.life <= 0) _popQueue.splice(i, 1);
  }

  // ── READY STATE ──────────────────────────────────────────────────────────
  if (_state === 'ready') {
    _idleT += dt;
    _bird.y = GROUND_Y / 2 + Math.sin(_idleT * 0.003) * 8;
    _bird.rotation = Math.sin(_idleT * 0.003) * 6;

    if (input.tapped) {
      _state = 'playing';
      _bird.vy = FLAP_FORCE;
      engine.SFX.flap();
      engine.particles.burst(BIRD_X, _bird.y, {
        count: 6, colors: ['#ff6eb4','#c9a0ff','#ffffff'], speed: 3, size: 4,
      });
    }
    return;
  }

  // ── WON / DEAD: no more game updates ────────────────────────────────────
  if (_state === 'won') return;

  if (_state === 'dead') {
    _deadTimer += dt;
    _bird.y    += 6 * f;  // bird falls after death
    _bird.rotation = Math.min(90, _bird.rotation + 5 * f);
    _deadFlashAlpha = Math.max(0, _deadFlashAlpha - 0.03 * f);
    if (_deadTimer > 900) {
      _state = 'triggering_lose'; // flag so it only fires once
      engine.lose();
    }
    return;
  }

  // ── PLAYING ──────────────────────────────────────────────────────────────

  // Tap → flap
  if (input.tapped && _flapCooldown <= 0) {
    _bird.vy = FLAP_FORCE;
    _flapCooldown = 80; // 80ms between flaps
    _expression = 'happy';
    engine.SFX.flap();
    engine.particles.burst(BIRD_X - 10, _bird.y - 10, {
      count: 5, colors: ['#FFA5AB','#c9a0ff','#ffffff'], speed: 2.5, size: 3,
    });
    setTimeout(() => { _expression = 'default'; }, 300);
  }

  // Physics
  _bird.vy       += GRAVITY * f;
  _bird.y        += _bird.vy * f;
  _bird.rotation  = Math.min(90, Math.max(-25, _bird.vy * 4));

  // Spawn pipes
  _pipeProgress += speed;
  if (_pipeProgress >= _pipeInterval) {
    _pipeProgress -= _pipeInterval;
    _pipes.push(spawnPipe(_config.gap));
  }

  // Move pipes + check scoring
  for (const p of _pipes) {
    p.x -= speed;

    // Score: pipe centre crossed bird
    if (!p.passed && p.x + p.width < BIRD_X - BIRD_R) {
      p.passed = true;
      _score++;
      engine.SFX.coin();
      _popQueue.push({ x: BIRD_X, y: _bird.y - 20, alpha: 1, life: 600 });

      engine.particles.burst(BIRD_X, _bird.y, {
        count: 10, colors: ['#ffd93b','#ffb340','#ffffff'], speed: 4, size: 5,
      });

      // Win condition
      if (_score >= _config.target) {
        _state = 'won';
        engine.win(_score);
        return;
      }
    }
  }

  // Remove pipes that have scrolled off screen
  _pipes = _pipes.filter(p => p.x + p.width > -20);

  // ── Collision ─────────────────────────────────────────────────────────────

  // Ground
  if (_bird.y + BIRD_R > GROUND_Y) {
    _bird.y = GROUND_Y - BIRD_R;
    die(engine);
    return;
  }

  // Ceiling (soft clamp so player doesn't die from jumping high)
  if (_bird.y - BIRD_R < 0) {
    _bird.y = BIRD_R;
    _bird.vy = 0;
  }

  // Pipes (circle vs rects, generous hitbox with padding for fun play)
  for (const p of _pipes) {
    const bLeft  = BIRD_X - BIRD_R + 8;
    const bRight = BIRD_X + BIRD_R - 8;
    const bTop   = _bird.y - BIRD_R + 8;
    const bBot   = _bird.y + BIRD_R - 8;

    const pLeft  = p.x;
    const pRight = p.x + p.width;
    const topBot = p.gapY;
    const botTop = p.gapY + p.gap;

    if (bRight > pLeft && bLeft < pRight) {
      if (bTop < topBot || bBot > botTop) {
        die(engine);
        return;
      }
    }
  }
}

function die(engine) {
  if (_state !== 'playing') return;
  _state = 'dead';
  _deadFlashAlpha = 1;
  _deadTimer = 0;
  _expression = 'grumpy';
  engine.shake.shake(8, 400);
  engine.SFX.hit();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────────────────────
function render(ctx) {
  // Background
  drawBackground(ctx, W, H);

  // Clouds
  for (const c of _clouds) drawCloud(ctx, c);

  // Pipes
  for (const p of _pipes) drawPipe(ctx, p, W, H);

  // Ground
  drawGround(ctx, W, GROUND_Y);

  // Bird (skip after hit + fall off screen)
  if (_bird.y < H + 60) {
    drawBird(ctx, _bird, _expression);
  }

  // Dead flash
  if (_deadFlashAlpha > 0) {
    drawDeadFlash(ctx, _deadFlashAlpha, W, H);
  }

  // "+1" floating texts
  for (const p of _popQueue) {
    drawPassedPop(ctx, p.x, p.y, p.alpha);
  }

  // Score / ready hint
  if (_state === 'ready') {
    drawReadyHint(ctx);
  } else if (_state === 'playing' || _state === 'won') {
    drawScoreHUD(ctx, _score, _config.target);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export plug-in
// ─────────────────────────────────────────────────────────────────────────────
export default { init, update, render };
