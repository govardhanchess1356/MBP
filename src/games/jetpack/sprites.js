import { drawAvatar } from '@/ui/avatar.js';

export const PLAYER_X = 80;

// ── Background ────────────────────────────────────────────────────────────────
export function drawBackground(ctx, scrollX) {
  // Dark base
  ctx.fillStyle = '#0d0010';
  ctx.fillRect(0, 0, 360, 640);

  // Scrolling grid lines (perspective-ish)
  ctx.save();
  ctx.strokeStyle = 'rgba(165, 56, 96, 0.18)';
  ctx.lineWidth = 1;

  const offset = scrollX % 60;

  // Vertical lines
  for (let x = -offset; x < 360 + 60; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 640);
    ctx.stroke();
  }

  // Horizontal lines converging toward centre
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = t * 640;
    ctx.globalAlpha = 0.08 + t * 0.12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(360, y);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Tunnel ────────────────────────────────────────────────────────────────────
export function drawTunnel(ctx, segments) {
  if (!segments || segments.length === 0) return;

  ctx.save();

  for (const seg of segments) {
    const { x, w, ceilY, floorY } = seg;

    // Ceiling fill
    ctx.fillStyle = '#2a0a3a';
    ctx.fillRect(x, 0, w, ceilY);

    // Floor fill
    ctx.fillStyle = '#2a0a3a';
    ctx.fillRect(x, floorY, w, 640 - floorY);
  }

  // Ceiling edge glow
  ctx.save();
  ctx.shadowColor = '#DA627D';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#DA627D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let first = true;
  for (const seg of segments) {
    if (first) { ctx.moveTo(seg.x, seg.ceilY); first = false; }
    else ctx.lineTo(seg.x, seg.ceilY);
    ctx.lineTo(seg.x + seg.w, seg.ceilY);
  }
  ctx.stroke();
  ctx.restore();

  // Floor edge glow
  ctx.save();
  ctx.shadowColor = '#DA627D';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#DA627D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  first = true;
  for (const seg of segments) {
    if (first) { ctx.moveTo(seg.x, seg.floorY); first = false; }
    else ctx.lineTo(seg.x, seg.floorY);
    ctx.lineTo(seg.x + seg.w, seg.floorY);
  }
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// ── Player ────────────────────────────────────────────────────────────────────
export function drawPlayer(ctx, player) {
  const { x, y, vy, thrusting } = player;

  ctx.save();

  // Jetpack body (#A53860 rectangle, left side of player)
  const jpX = x - 30;
  const jpY = y - 16;
  ctx.fillStyle = '#A53860';
  ctx.beginPath();
  ctx.roundRect(jpX, jpY, 12, 30, 3);
  ctx.fill();

  // Jetpack nozzle
  ctx.fillStyle = '#450920';
  ctx.fillRect(jpX + 2, jpY + 28, 8, 5);

  // Thruster flame
  if (thrusting) {
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      const flicker = Math.sin(now * 0.03 + i * 1.2) * 4;
      ctx.globalAlpha = 0.6 + Math.random() * 0.3;
      ctx.fillStyle = i === 0 ? '#ff9900' : i === 1 ? '#ff4400' : '#ffee00';
      ctx.beginPath();
      ctx.arc(jpX + 6, jpY + 36 + i * 5 + flicker, 5 - i, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Suit body (#DA627D)
  ctx.fillStyle = '#DA627D';
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Suit highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - 5, 6, 9, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Avatar face
  const expr = thrusting ? 'happy' : vy > 4 ? 'grumpy' : 'default';
  drawAvatar(ctx, x, y - 24, 14, expr);

  // Helmet visor (semi-transparent blue arc)
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#5ee0ff';
  ctx.beginPath();
  ctx.arc(x, y - 24, 16, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ── Coin ──────────────────────────────────────────────────────────────────────
export function drawCoin(ctx, coin) {
  const { x, y, phase } = coin;
  const radius = 7 + Math.sin(phase) * 0.3;

  ctx.save();

  // Shadow glow
  ctx.shadowColor = '#ffd93b';
  ctx.shadowBlur = 12;

  // Outer circle
  ctx.fillStyle = '#ffd93b';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner shine
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff8a0';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Laser ─────────────────────────────────────────────────────────────────────
export function drawLaser(ctx, laser) {
  const { x, y, w, active } = laser;
  const h = laser.h || 4;

  ctx.save();

  if (!active) {
    // Faint outline
    ctx.strokeStyle = 'rgba(255,0,102,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  } else {
    const alpha = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(x, y, w, h);

    // Bright core
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffaacc';
    ctx.fillRect(x, y + 1, w, h - 2);
  }

  ctx.restore();
}

// ── HUD ───────────────────────────────────────────────────────────────────────
export function drawHUD(ctx, distance, target, coinsCollected) {
  ctx.save();

  // Semi-transparent pill backgrounds
  ctx.fillStyle = 'rgba(42,10,58,0.7)';
  ctx.beginPath();
  ctx.roundRect(6, 6, 120, 32, 8);
  ctx.fill();

  ctx.fillStyle = 'rgba(42,10,58,0.7)';
  ctx.beginPath();
  ctx.roundRect(234, 6, 120, 32, 8);
  ctx.fill();

  // Coins (top-left)
  ctx.fillStyle = '#ffd93b';
  ctx.font = 'bold 14px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('🪙', 14, 22);
  ctx.fillStyle = '#fff8a0';
  ctx.fillText(`${coinsCollected}`, 36, 22);

  // Distance (top-right)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#5ee0ff';
  ctx.fillText(`${distance}m`, 348, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px sans-serif';
  ctx.fillText(`/ ${target}m`, 348, 34);

  ctx.restore();
}

// ── Ready hint ────────────────────────────────────────────────────────────────
export function drawReadyHint(ctx) {
  const alpha = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff6eb4';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff6eb4';
  ctx.shadowBlur = 14;
  ctx.fillText('HOLD TO FLY!', 180, 500);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#c9a0ff';
  ctx.shadowColor = '#c9a0ff';
  ctx.shadowBlur = 8;
  ctx.fillText('tap & hold anywhere', 180, 528);
  ctx.restore();
}
