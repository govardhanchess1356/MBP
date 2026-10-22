/**
 * src/games/platformer/sprites.js — Canvas draw functions for Super Muski
 */

import { drawAvatar } from '@/ui/avatar.js';

const W = 360, H = 640;

// ─── Background (parallax city/night) ────────────────────────────────────────
export function drawBackground(ctx, cameraX) {
  // Sky
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  g.addColorStop(0,   '#0d0525');
  g.addColorStop(0.6, '#1a0838');
  g.addColorStop(1,   '#2d0a45');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars (static)
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const STARS = [
    15,25, 55,15, 110,35, 165,10, 220,28, 275,18, 330,32, 355,8,
    30,80, 95,65, 145,85, 200,55, 260,75, 310,60, 348,82,
  ];
  for (let i = 0; i < STARS.length; i += 2) ctx.fillRect(STARS[i], STARS[i+1], 2, 2);

  // Distant buildings — very slow parallax (layer 1)
  const off1 = (cameraX * 0.08) % (W + 160);
  ctx.fillStyle = '#1a0a3d';
  const buildings1 = [
    {x:0,w:40,h:120},{x:50,w:30,h:90},{x:90,w:50,h:140},{x:150,w:35,h:100},
    {x:195,w:45,h:130},{x:250,w:30,h:80},{x:290,w:55,h:150},{x:355,w:40,h:110},
    {x:405,w:30,h:90},{x:445,w:50,h:130},{x:505,w:35,h:100},
  ];
  for (const b of buildings1) {
    const bx = ((b.x - off1) % (W + 160) + W + 160) % (W + 160) - 80;
    ctx.fillRect(bx, H * 0.55 - b.h, b.w, b.h + 10);
    // Windows
    ctx.fillStyle = 'rgba(255,217,59,0.15)';
    for (let wy = H * 0.55 - b.h + 10; wy < H * 0.55 - 10; wy += 18) {
      for (let wx = bx + 5; wx < bx + b.w - 6; wx += 12) {
        if (Math.random() < 0.55) ctx.fillRect(wx, wy, 6, 8);
      }
    }
    ctx.fillStyle = '#1a0a3d';
  }

  // Nearer buildings — medium parallax (layer 2)
  const off2 = (cameraX * 0.2) % (W + 200);
  ctx.fillStyle = '#0f0530';
  const buildings2 = [
    {x:0,w:50,h:160},{x:60,w:40,h:110},{x:110,w:60,h:180},{x:180,w:45,h:130},
    {x:235,w:55,h:160},{x:300,w:40,h:100},{x:350,w:65,h:190},{x:425,w:50,h:140},
  ];
  for (const b of buildings2) {
    const bx = ((b.x - off2) % (W + 200) + W + 200) % (W + 200) - 100;
    ctx.fillRect(bx, H * 0.65 - b.h, b.w, b.h + 10);
    // Neon-lit top edge
    ctx.fillStyle = '#DA627D';
    ctx.fillRect(bx, H * 0.65 - b.h, b.w, 3);
    ctx.fillStyle = '#0f0530';
  }
}

// ─── Platform ─────────────────────────────────────────────────────────────────
export function drawPlatform(ctx, plat, cameraX) {
  const sx = plat.x - cameraX;
  if (sx + plat.w < -10 || sx > W + 10) return; // cull

  const top = plat.y;
  const isRaised = plat.y < 500;

  // Platform top face
  ctx.fillStyle = isRaised ? '#DA627D' : '#A53860';
  ctx.fillRect(sx, top - 12, plat.w, 12);

  // Pixel highlight on top edge
  ctx.fillStyle = isRaised ? '#FFA5AB' : '#DA627D';
  ctx.fillRect(sx, top - 12, plat.w, 3);

  // Front face (3D depth)
  ctx.fillStyle = isRaised ? '#7a2040' : '#45091a';
  ctx.fillRect(sx, top, plat.w, 8);

  // Bottom strip
  ctx.fillStyle = '#2d0a1e';
  ctx.fillRect(sx, top + 8, plat.w, 3);

  // Ground below
  if (!isRaised) {
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(sx, top + 11, plat.w, H - top - 11);
  }
}

// ─── Player (Muski with cape) ─────────────────────────────────────────────────
export function drawPlayer(ctx, player) {
  const { screenX: x, y, vy, state, animFrame } = player;
  const jumping = state === 'jumping';
  const t = Date.now();

  ctx.save();

  // Cape — flaps more when jumping
  const capeSwing = jumping
    ? Math.sin(t * 0.018) * 8
    : Math.sin(t * 0.009) * 3;
  ctx.fillStyle = '#c9a0ff';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 30);
  ctx.lineTo(x - 10 + capeSwing, y + 2);
  ctx.lineTo(x - 18 + capeSwing, y + 10);
  ctx.lineTo(x - 20, y - 28);
  ctx.closePath();
  ctx.fill();

  // Body suit
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(x - 9, y - 28, 18, 18);

  // Belt detail
  ctx.fillStyle = '#ffd93b';
  ctx.fillRect(x - 9, y - 14, 18, 4);

  // Pants
  ctx.fillStyle = '#450920';
  ctx.fillRect(x - 9, y - 10, 18, 10);

  // Running legs
  const legSwing = jumping ? 4 : (animFrame % 2 === 0 ? 5 : -5);
  ctx.fillStyle = '#450920';
  ctx.fillRect(x - 8, y - 2, 6, 12 + legSwing * 0.5);
  ctx.fillRect(x + 2, y - 2, 6, 12 - legSwing * 0.5);
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(x - 10, y + 10 + Math.abs(legSwing * 0.3), 10, 5);
  ctx.fillRect(x + 2, y + 10 + Math.abs(legSwing * 0.3), 10, 5);

  // Head / face
  const expr = jumping ? (vy < -4 ? 'happy' : 'surprised') : 'default';
  drawAvatar(ctx, x, y - 40, 14, expr);

  ctx.restore();
}

// ─── Enemy (mint blob) ────────────────────────────────────────────────────────
export function drawEnemy(ctx, enemy, cameraX) {
  if (!enemy.alive) return;
  const sx = enemy.x - cameraX;
  if (sx < -30 || sx > W + 30) return;

  const t = Date.now();
  const bob = Math.sin(t * 0.006 + enemy.x * 0.01) * 2;

  ctx.save();
  ctx.translate(sx, enemy.y + bob);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#5effa3';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  // Face
  const facing = enemy.vx > 0 ? 1 : -1;

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(facing * 3, -5, 5, 5);
  ctx.fillRect(facing * -4, -5, 4, 4);

  // Angry brows
  ctx.fillStyle = '#c9a0ff';
  ctx.fillRect(facing * 3 - 1, -8, 7, 2);
  ctx.fillRect(facing * -5, -7, 6, 2);

  // Mouth — zig-zag
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-5, 4, 3, 2);
  ctx.fillRect(-2, 6, 3, 2);
  ctx.fillRect(1, 4, 3, 2);
  ctx.fillRect(4, 6, 2, 2);

  // Stubby feet
  ctx.fillStyle = '#3acc80';
  ctx.fillRect(-12, 12, 8, 5);
  ctx.fillRect(4, 12, 8, 5);

  ctx.restore();
}

// ─── Coin ─────────────────────────────────────────────────────────────────────
export function drawCoin(ctx, coin, cameraX) {
  if (coin.collected) return;
  const sx = coin.x - cameraX;
  if (sx < -20 || sx > W + 20) return;

  const bob = Math.sin(Date.now() * 0.006 + coin.x * 0.02) * 3;

  ctx.save();
  ctx.translate(sx, coin.y + bob);
  ctx.fillStyle = '#ffd93b';
  ctx.shadowBlur = 8; ctx.shadowColor = '#ffd93b';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffb340';
  ctx.beginPath();
  ctx.arc(-2, -2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Finish (Birthday Cake) ───────────────────────────────────────────────────
export function drawFinish(ctx, finishX, cameraX) {
  const sx = finishX - cameraX;
  if (sx < -80 || sx > W + 80) return;

  ctx.save();
  ctx.translate(sx, 520);

  // Base tier
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(-44, -50, 88, 50);
  ctx.fillStyle = '#FFA5AB';
  ctx.fillRect(-44, -50, 88, 12); // frosting stripe

  // Middle tier
  ctx.fillStyle = '#A53860';
  ctx.fillRect(-30, -90, 60, 40);
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(-30, -90, 60, 10);

  // Top tier
  ctx.fillStyle = '#DA627D';
  ctx.fillRect(-18, -122, 36, 32);
  ctx.fillStyle = '#FFA5AB';
  ctx.fillRect(-18, -122, 36, 8);

  // Candles
  const CANDLE_X = [-12, -4, 4, 12];
  for (const cx of CANDLE_X) {
    ctx.fillStyle = '#ffd93b';
    ctx.fillRect(cx - 2, -134, 4, 12);
    ctx.fillStyle = '#ff6eb4';
    ctx.beginPath();
    ctx.arc(cx, -136, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb340';
    ctx.beginPath();
    ctx.arc(cx, -134, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // "19" on front
  ctx.fillStyle = '#ffd93b';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('19', 0, -22);

  // Sprinkles
  const SPRINKLE_COLORS = ['#5effa3','#5ee0ff','#c9a0ff','#ffd93b'];
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = SPRINKLE_COLORS[i % 4];
    ctx.fillRect(-38 + i * 7 + (i % 3 * 2), -45 + (i % 5 * 5), 5, 2);
  }

  // FINISH banner
  ctx.fillStyle = '#ffd93b';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('FINISH!', 0, -155);

  ctx.restore();
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
export function drawHUD(ctx, coinsCollected, enemiesStomped) {
  ctx.save();
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(`🪙${coinsCollected}`, 11, 42);
  ctx.fillStyle = '#ffd93b';
  ctx.fillText(`🪙${coinsCollected}`, 10, 40);
  if (enemiesStomped > 0) {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText(`💥${enemiesStomped}`, 351, 42);
    ctx.fillStyle = '#5effa3';
    ctx.fillText(`💥${enemiesStomped}`, 350, 40);
  }
  ctx.restore();
}

export function drawReadyHint(ctx) {
  ctx.save();
  const a = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
  ctx.globalAlpha = a;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F9DBBD';
  ctx.fillText('TAP TO RUN!', 180, 430);
  ctx.fillText('TAP AGAIN TO JUMP', 180, 450);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawDeadFlash(ctx, alpha) {
  ctx.fillStyle = `rgba(255,50,50,${alpha * 0.35})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawDoublJumpHint(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.font = '6px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c9a0ff';
  ctx.fillText('DOUBLE JUMP UNLOCKED! ✨', 180, 60);
  ctx.restore();
}
