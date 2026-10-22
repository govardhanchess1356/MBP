/**
 * games/dino/sprites.js — All canvas draw functions for Birthday Run
 * Pure draw calls, no game state.
 */

import { drawAvatar } from '@/ui/avatar.js';

export const GROUND_Y = 520;

// ─── Sky + parallax ──────────────────────────────────────────────────────────
export function drawBackground(ctx, scrollX) {
  const W = 360, H = 640;

  // Sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0,   '#0d0525');
  g.addColorStop(0.55,'#2d0a45');
  g.addColorStop(1,   '#450920');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Slow-parallax stars
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  const stars = [
    [22,28],[85,18],[155,42],[225,12],[305,36],[348,58],
    [52,82],[118,68],[195,88],[268,62],[332,92],
    [38,140],[110,155],[185,135],[255,162],[318,138],
  ];
  for (const [bx, by] of stars) {
    const sx = ((bx - scrollX * 0.018) % W + W) % W;
    ctx.fillRect(sx, by, 2, 2);
  }

  // Parallax clouds (medium speed)
  ctx.fillStyle = 'rgba(165,56,96,0.18)';
  const cloudXs = [0, 80, 160, 260, 340, 430, 510];
  for (const cx of cloudXs) {
    const sx = ((cx - scrollX * 0.12) % (W + 120) + W + 120) % (W + 120) - 60;
    ctx.beginPath();
    ctx.ellipse(sx, 80, 55, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 30, 90, 38, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Ground ──────────────────────────────────────────────────────────────────
export function drawGround(ctx, scrollX) {
  const W = 360;
  const STRIPE = 26;

  ctx.fillStyle = '#200730';
  ctx.fillRect(0, GROUND_Y, W, 640 - GROUND_Y);

  // Top edge
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(0, GROUND_Y, W, 3);

  // Scrolling dashes
  ctx.fillStyle = 'rgba(255,110,180,0.28)';
  const off = (scrollX * 0.5) % (STRIPE * 2);
  for (let x = -STRIPE + off; x < W + STRIPE; x += STRIPE * 2) {
    ctx.fillRect(x, GROUND_Y + 9, STRIPE, 2);
  }

  // Pixel pebbles
  ctx.fillStyle = '#A53860';
  const pebbles = [[60,5],[145,4],[250,5],[330,3],[410,4],[500,5]];
  for (const [rx, rh] of pebbles) {
    const sx = ((rx - scrollX * 0.38) % (W * 1.6) + W * 1.6) % (W * 1.6);
    ctx.fillRect(sx, GROUND_Y - rh, rh * 2, rh);
  }
}

// ─── Runner (Muski) ──────────────────────────────────────────────────────────
export function drawRunner(ctx, player) {
  const { x, y, state, animFrame } = player;
  ctx.save();

  if (state === 'ducking') {
    // Squished body, head forward
    drawAvatar(ctx, x + 8, y - 16, 13, 'grumpy');
    ctx.fillStyle = '#DA627D';
    ctx.fillRect(x - 12, y - 14, 28, 12);
    ctx.fillStyle = '#ffd93b';
    ctx.fillRect(x - 12, y - 14, 28, 4);
    ctx.fillStyle = '#450920';
    ctx.fillRect(x - 14, y - 4, 14, 6);
    ctx.fillRect(x + 2, y - 4, 14, 6);
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(x - 18, y - 4, 8, 4);
    ctx.fillRect(x + 10, y - 4, 8, 4);
  } else {
    const expr = state === 'jumping' ? 'happy' : 'default';
    const HEAD_R = 14;
    const bodyTop = y - 46;

    // Head
    drawAvatar(ctx, x, bodyTop + HEAD_R, HEAD_R, expr);

    // Shirt
    ctx.fillStyle = '#DA627D';
    ctx.fillRect(x - 9, bodyTop + HEAD_R * 2, 18, 16);

    // Collar detail
    ctx.fillStyle = '#ffd93b';
    ctx.fillRect(x - 9, bodyTop + HEAD_R * 2, 18, 4);

    // Pants
    ctx.fillStyle = '#450920';
    ctx.fillRect(x - 9, bodyTop + HEAD_R * 2 + 16, 18, 10);

    // Running legs — 2-frame cycle
    const swing = (animFrame % 2 === 0) ? 5 : -5;
    ctx.fillStyle = '#450920';
    ctx.fillRect(x - 8,  y - 14, 6, 14 + swing);
    ctx.fillRect(x + 2,  y - 14, 6, 14 - swing);

    // Shoes
    ctx.fillStyle = '#1a0a0a';
    const lOff = swing > 0 ? 2 : 0;
    const rOff = swing < 0 ? 2 : 0;
    ctx.fillRect(x - 12 + lOff, y - 4, 10, 5);
    ctx.fillRect(x + 2 + rOff,  y - 4, 10, 5);
  }

  ctx.restore();
}

// ─── Cactus (styled as spiky birthday candles) ───────────────────────────────
export function drawCactus(ctx, obs) {
  const { x, height, ctype } = obs;
  const mainX = x + (ctype === 'double' ? 16 : 5);
  const W = 14;

  // Main trunk
  ctx.fillStyle = '#A53860';
  ctx.fillRect(mainX - W / 2, GROUND_Y - height, W, height);

  // Trunk highlight
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(mainX - W / 2 + 2, GROUND_Y - height + 4, 3, height - 8);

  // Top pip
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(mainX - 4, GROUND_Y - height - 9, 8, 9);

  // Candle flame on top
  ctx.fillStyle = '#ffd93b';
  ctx.beginPath();
  ctx.arc(mainX, GROUND_Y - height - 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.arc(mainX, GROUND_Y - height - 10, 3, 0, Math.PI * 2);
  ctx.fill();

  // Arms if tall enough
  if (height > 42) {
    ctx.fillStyle = '#A53860';
    ctx.fillRect(mainX - 24, GROUND_Y - height + 12, 13, 6);
    ctx.fillRect(mainX - 20, GROUND_Y - height + 6, 6, 12);
    ctx.fillRect(mainX + 11, GROUND_Y - height + 12, 13, 6);
    ctx.fillRect(mainX + 14, GROUND_Y - height + 6, 6, 12);
  }

  // Second cactus (double type)
  if (ctype === 'double') {
    const h2 = height * 0.7;
    ctx.fillStyle = '#A53860';
    ctx.fillRect(x, GROUND_Y - h2, 10, h2);
    ctx.fillStyle = '#ffd93b';
    ctx.beginPath();
    ctx.arc(x + 5, GROUND_Y - h2 - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Bird obstacle ────────────────────────────────────────────────────────────
export function drawBird(ctx, obs) {
  const { x, y, wingPhase } = obs;
  const wingsUp = wingPhase < 0.5;

  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = '#ff6eb4';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = '#c9a0ff';
  if (wingsUp) {
    ctx.fillRect(-20, -12, 18, 10);
    ctx.fillRect(2,  -12, 18, 10);
  } else {
    ctx.fillRect(-20, 2, 18, 10);
    ctx.fillRect(2,   2, 18, 10);
  }

  // Beak
  ctx.fillStyle = '#ffd93b';
  ctx.fillRect(14, -3, 9, 5);

  // Eye
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(8, -4, 5, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, -3, 2, 2);

  ctx.restore();
}

// ─── HUD ────────────────────────────────────────────────────────────────────
export function drawDistanceHUD(ctx, distance, target) {
  ctx.save();
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(`${distance}/${target}m`, 332, 42);
  ctx.fillStyle = '#ffd93b';
  ctx.fillText(`${distance}/${target}m`, 330, 40);
  ctx.restore();
}

export function drawReadyHint(ctx) {
  ctx.save();
  const a = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
  ctx.globalAlpha = a;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F9DBBD';
  ctx.fillText('TAP TO RUN!', 180, 440);
  ctx.fillText('SWIPE ↓ TO DUCK', 180, 460);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawDeadFlash(ctx, alpha) {
  ctx.fillStyle = `rgba(255,50,50,${alpha * 0.35})`;
  ctx.fillRect(0, 0, 360, 640);
}
