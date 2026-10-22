/**
 * games/flappy/sprites.js — All drawable sprites for Balloon Flap
 * Drawn entirely in canvas code. No image files.
 */

import { drawAvatar } from '@/ui/avatar.js';

// ── Sky gradient background ────────────────────────────────────────────────────
export function drawBackground(ctx, W = 360, H = 640) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#1a0a3d');
  grad.addColorStop(0.5, '#2d1060');
  grad.addColorStop(1,   '#450920');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Star field (pixel stars)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const stars = [
    [30,40],[80,25],[140,60],[200,30],[270,55],[320,20],[350,80],
    [50,100],[110,90],[180,110],[240,85],[300,100],
    [20,150],[90,170],[160,140],[230,160],[310,145],
  ];
  for (const [sx, sy] of stars) {
    ctx.fillRect(sx, sy, 2, 2);
  }
}

// ── Pixel cloud ───────────────────────────────────────────────────────────────
export function drawCloud(ctx, cloud) {
  ctx.fillStyle = 'rgba(200, 160, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(cloud.x, cloud.y, cloud.w * 0.5, cloud.h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cloud.x - cloud.w * 0.25, cloud.y + cloud.h * 0.1, cloud.w * 0.32, cloud.h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cloud.x + cloud.w * 0.28, cloud.y + cloud.h * 0.05, cloud.w * 0.28, cloud.h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ── Pipe / column ─────────────────────────────────────────────────────────────
const PIPE_COLOR_BODY = '#A53860';
const PIPE_COLOR_DARK = '#450920';
const PIPE_COLOR_CAP  = '#DA627D';
const PIPE_COLOR_SHINE= '#FFA5AB';
const CAP_H = 14;
const CAP_EXTRA = 6;   // cap is wider than the pipe

export function drawPipe(ctx, pipe, W = 360, H = 640) {
  const pw    = pipe.width;
  const x     = pipe.x;
  const gapY  = pipe.gapY;
  const gap   = pipe.gap;

  // ── Top pipe ──────────────────────────────────────────────────────────────
  const topH = gapY;
  if (topH > 0) {
    // Body
    ctx.fillStyle = PIPE_COLOR_BODY;
    ctx.fillRect(x, 0, pw, topH);
    // Dark left edge
    ctx.fillStyle = PIPE_COLOR_DARK;
    ctx.fillRect(x, 0, 4, topH);
    // Light right edge
    ctx.fillStyle = PIPE_COLOR_SHINE;
    ctx.fillRect(x + pw - 3, 0, 3, topH);
    // Cap
    ctx.fillStyle = PIPE_COLOR_CAP;
    ctx.fillRect(x - CAP_EXTRA / 2, topH - CAP_H, pw + CAP_EXTRA, CAP_H);
    ctx.fillStyle = PIPE_COLOR_DARK;
    ctx.fillRect(x - CAP_EXTRA / 2, topH - CAP_H, 4, CAP_H);
    ctx.fillStyle = PIPE_COLOR_SHINE;
    ctx.fillRect(x + pw + CAP_EXTRA / 2 - 3, topH - CAP_H, 3, CAP_H);
  }

  // ── Bottom pipe ───────────────────────────────────────────────────────────
  const botY = gapY + gap;
  const botH = H - botY;
  if (botH > 0) {
    // Cap
    ctx.fillStyle = PIPE_COLOR_CAP;
    ctx.fillRect(x - CAP_EXTRA / 2, botY, pw + CAP_EXTRA, CAP_H);
    ctx.fillStyle = PIPE_COLOR_DARK;
    ctx.fillRect(x - CAP_EXTRA / 2, botY, 4, CAP_H);
    ctx.fillStyle = PIPE_COLOR_SHINE;
    ctx.fillRect(x + pw + CAP_EXTRA / 2 - 3, botY, 3, CAP_H);
    // Body
    ctx.fillStyle = PIPE_COLOR_BODY;
    ctx.fillRect(x, botY + CAP_H, pw, botH);
    ctx.fillStyle = PIPE_COLOR_DARK;
    ctx.fillRect(x, botY + CAP_H, 4, botH);
    ctx.fillStyle = PIPE_COLOR_SHINE;
    ctx.fillRect(x + pw - 3, botY + CAP_H, 3, botH);
  }
}

// ── Ground strip ──────────────────────────────────────────────────────────────
export function drawGround(ctx, W = 360, groundY = 615) {
  ctx.fillStyle = '#450920';
  ctx.fillRect(0, groundY, W, 25);
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(0, groundY, W, 3);
}

// ── Score HUD ─────────────────────────────────────────────────────────────────
export function drawScoreHUD(ctx, score, target) {
  ctx.save();
  ctx.font = '14px "Press Start 2P"';
  ctx.textAlign = 'center';

  // Score shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(`${score}/${target}`, 181, 51);

  // Score text
  ctx.fillStyle = '#ffd93b';
  ctx.fillText(`${score}/${target}`, 180, 50);

  ctx.restore();
}

// ── Ready hint text ───────────────────────────────────────────────────────────
export function drawReadyHint(ctx) {
  ctx.save();
  const alpha = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
  ctx.globalAlpha = alpha;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F9DBBD';
  ctx.fillText('TAP TO FLAP!', 180, 430);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Bird (balloon + face) ─────────────────────────────────────────────────────
export function drawBird(ctx, bird, expression = 'default') {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate((bird.rotation * Math.PI) / 180);

  // ── Balloon ────────────────────────────────────────────────────────────────
  const BALLOON_Y = -32;
  // String from face to balloon
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(4, -26, 0, BALLOON_Y + 14);
  ctx.strokeStyle = '#c9a0ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Balloon body
  const bGrad = ctx.createRadialGradient(-4, BALLOON_Y - 4, 2, 0, BALLOON_Y, 14);
  bGrad.addColorStop(0, '#FFA5AB');
  bGrad.addColorStop(1, '#A53860');
  ctx.beginPath();
  ctx.ellipse(0, BALLOON_Y, 12, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = bGrad;
  ctx.fill();

  // Balloon highlight
  ctx.beginPath();
  ctx.ellipse(-4, BALLOON_Y - 4, 4, 5, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();

  // Balloon knot
  ctx.beginPath();
  ctx.arc(0, BALLOON_Y + 14, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#DA627D';
  ctx.fill();

  // ── Face ───────────────────────────────────────────────────────────────────
  const faceR = 18;
  drawAvatar(ctx, 0, 0, faceR, expression);

  ctx.restore();
}

// ── Coin icon (HUD/collectible) ───────────────────────────────────────────────
export function drawCoin(ctx, x, y, r = 8) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd93b';
  ctx.fill();
  ctx.strokeStyle = '#ffb340';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `${Math.round(r * 1.1)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff8800';
  ctx.fillText('$', x, y);
  ctx.restore();
}

// ── "PASSED!" mini pop (shown at bird position when a pipe is passed) ─────────
export function drawPassedPop(ctx, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '7px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5effa3';
  ctx.fillText('+1', x, y - 30);
  ctx.restore();
}

// ── Dead (red flash overlay) ──────────────────────────────────────────────────
export function drawDeadFlash(ctx, alpha, W = 360, H = 640) {
  ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.35})`;
  ctx.fillRect(0, 0, W, H);
}
