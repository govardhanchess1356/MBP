/**
 * games/asteroids/sprites.js — Canvas draw functions for Cake Defender
 * Ships, gift boxes, cupcakes, bullets, explosions.
 */

import { drawAvatar } from '@/ui/avatar.js';

const W = 360, H = 640;

// ─── Deep-space background ────────────────────────────────────────────────────
export function drawBackground(ctx) {
  const g = ctx.createRadialGradient(180, 320, 0, 180, 320, 370);
  g.addColorStop(0,   '#12063a');
  g.addColorStop(0.6, '#0a0325');
  g.addColorStop(1,   '#06021a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Static stars (drawn once; no scroll needed for space feel)
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const STARS = [
    30,50, 90,30, 160,70, 240,20, 310,55, 345,90,
    55,130,140,110,200,150,280,100,340,180,
    20,220,100,200,185,240,260,195,330,230,
    40,310,125,280,200,330,275,290,348,320,
    60,400,150,370,230,410,300,380,
    35,500,110,470,200,510,280,480,345,530,
    70,590,160,560,240,600,320,570,
  ];
  for (let i = 0; i < STARS.length; i += 2) {
    const r = (i % 6 === 0) ? 2 : 1;
    ctx.fillRect(STARS[i], STARS[i + 1], r, r);
  }
}

// ─── Player ship ──────────────────────────────────────────────────────────────
export function drawShip(ctx, ship) {
  const { x, y, tilt } = ship;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt || 0);

  // Thruster glow
  ctx.fillStyle = 'rgba(255,140,40,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 9, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flame flicker
  const flicker = Math.sin(Date.now() * 0.018) * 4;
  ctx.fillStyle = '#ffb340';
  ctx.beginPath();
  ctx.moveTo(-5, 22);
  ctx.lineTo(0, 32 + flicker);
  ctx.lineTo(5, 22);
  ctx.closePath();
  ctx.fill();

  // Hull body
  ctx.fillStyle = '#A53860';
  ctx.beginPath();
  ctx.ellipse(0, 4, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner hull highlight
  ctx.fillStyle = '#DA627D';
  ctx.beginPath();
  ctx.ellipse(0, 4, 15, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Side fins
  ctx.fillStyle = '#A53860';
  ctx.beginPath();
  ctx.moveTo(-22, 10); ctx.lineTo(-32, 28); ctx.lineTo(-14, 24);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo( 22, 10); ctx.lineTo( 32, 28); ctx.lineTo( 14, 24);
  ctx.fill();

  // Cockpit glass
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -4, 14, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(94,224,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(94,224,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Her face in cockpit
  drawAvatar(ctx, 0, -4, 12, 'cool');

  // Glass shine
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(-5, -10, 4, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Gift box (large rock) ────────────────────────────────────────────────────
export function drawGiftBox(ctx, rock) {
  const { x, y, r, angle, color } = rock;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const s = r * 0.88;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-s + 3, -s + 3, s * 2, s * 2);

  // Box body
  ctx.fillStyle = color;
  ctx.fillRect(-s, -s, s * 2, s * 2);

  // Lid
  ctx.fillStyle = shiftBrightness(color, 40);
  ctx.fillRect(-s, -s, s * 2, s * 0.38);

  // Vertical ribbon
  ctx.fillStyle = '#ffd93b';
  ctx.fillRect(-4, -s, 8, s * 2);

  // Horizontal ribbon
  ctx.fillRect(-s, -4, s * 2, 8);

  // Bow loops
  ctx.fillStyle = '#ffb340';
  ctx.beginPath();
  ctx.ellipse(-10, -s - 5, 9, 6, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse( 10, -s - 5, 9, 6,  0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd93b';
  ctx.beginPath();
  ctx.arc(0, -s - 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Cupcake (medium rock) ────────────────────────────────────────────────────
export function drawCupcake(ctx, rock) {
  const { x, y, r, angle } = rock;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const hr = r * 0.88;

  // Wrapper base
  ctx.fillStyle = '#450920';
  ctx.beginPath();
  ctx.moveTo(-hr, hr * 0.35);
  ctx.lineTo(-hr * 0.72, hr);
  ctx.lineTo( hr * 0.72, hr);
  ctx.lineTo( hr, hr * 0.35);
  ctx.closePath();
  ctx.fill();

  // Wrapper stripes
  ctx.fillStyle = '#DA627D';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(i * (hr * 0.45) - 1, hr * 0.38, 2, hr * 0.6);
  }

  // Frosting mound
  ctx.fillStyle = '#FFA5AB';
  ctx.beginPath();
  ctx.arc(0, -hr * 0.15, hr * 0.88, Math.PI, 0);
  ctx.fill();

  // Frosting swirl peaks
  ctx.fillStyle = '#ff6eb4';
  ctx.beginPath();
  ctx.arc(-hr * 0.38, -hr * 0.45, hr * 0.33, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc( hr * 0.38, -hr * 0.45, hr * 0.33, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -hr * 0.72, hr * 0.28, Math.PI, 0);
  ctx.fill();

  // Sprinkles
  ctx.fillStyle = '#ffd93b'; ctx.fillRect(-hr*0.28, -hr*0.6, 6, 3);
  ctx.fillStyle = '#5effa3'; ctx.fillRect( hr*0.12, -hr*0.5, 4, 3);
  ctx.fillStyle = '#5ee0ff'; ctx.fillRect(-hr*0.08, -hr*0.82, 4, 3);

  // Candle
  ctx.fillStyle = '#ffd93b';
  ctx.fillRect(-3, -hr * 1.3, 6, hr * 0.45);
  ctx.fillStyle = '#ff6eb4';
  ctx.beginPath();
  ctx.arc(0, -hr * 1.3, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Candy (small rock) ───────────────────────────────────────────────────────
export function drawCandy(ctx, rock) {
  const { x, y, r, angle } = rock;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = '#DA627D';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffd93b';
  ctx.lineWidth = r * 0.32;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.52, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.28, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Bullet ───────────────────────────────────────────────────────────────────
export function drawBullet(ctx, bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(bullet.angle);

  ctx.fillStyle = 'rgba(255,110,180,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6eb4';
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Explosion ring ───────────────────────────────────────────────────────────
export function drawExplosion(ctx, exp) {
  const t = exp.life / exp.maxLife;
  const r = exp.r * (1.2 + (1 - t) * 2);

  ctx.save();
  ctx.globalAlpha = t * 0.85;
  ctx.strokeStyle = exp.color;
  ctx.lineWidth   = 3 + (1 - t) * 2;
  ctx.beginPath();
  ctx.arc(exp.x, exp.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = t * 0.25;
  ctx.fillStyle   = exp.color;
  ctx.fill();
  ctx.restore();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
export function drawHUD(ctx, destroyed, target) {
  ctx.save();
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(`${destroyed}/${target}`, 181, 32);
  ctx.fillStyle = '#ffd93b';
  ctx.fillText(`${destroyed}/${target}`, 180, 30);
  ctx.restore();
}

export function drawReadyHint(ctx) {
  ctx.save();
  const a = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
  ctx.globalAlpha = a;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F9DBBD';
  ctx.fillText('HOLD & DRAG TO MOVE', 180, 450);
  ctx.fillText('AUTO-FIRES AT ROCKS!', 180, 470);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Util ─────────────────────────────────────────────────────────────────────
function shiftBrightness(hex, amount) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amount);
  const g = Math.min(255, ((n >> 8) & 255) + amount);
  const b = Math.min(255, (n & 255) + amount);
  return `rgb(${r},${g},${b})`;
}
