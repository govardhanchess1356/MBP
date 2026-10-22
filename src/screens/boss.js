/**
 * screens/boss.js — "Getting Older" 3-Phase Boss Fight ⚔️
 *
 * An epic retro boss battle where Muski takes on "GETTING OLDER"!
 * Phase 1: Dodge the Clocks of Adulting & collect birthday cupcakes
 * Phase 2: Giant 19-Candle Titan shoots candle spark lasers & frosting bombs
 * Phase 3: Charge the ULTIMATE 19TH BIRTHDAY SUPER WISH! Tap rapidly to beam!
 *
 * Victory triggers confetti explosion and mounts the Finale Screen.
 */

import { SFX } from '@/engine/sound.js';
import { drawAvatar } from '@/ui/avatar.js';

function injectCSS() {
  if (document.getElementById('boss-css')) return;
  const s = document.createElement('style');
  s.id = 'boss-css';
  s.textContent = /* css */`
    #boss-screen {
      position: fixed; inset: 0;
      background: #080214;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Press Start 2P', monospace;
      overflow: hidden;
      touch-action: none;
    }

    #boss-hud {
      position: absolute; top: 10px; left: 10px; right: 10px;
      display: flex; justify-content: space-between; align-items: center;
      z-index: 20;
    }
    .boss-hud-pill {
      background: rgba(69,9,32,0.85);
      border: 1.5px solid #ff6eb4;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.32rem;
      color: #ffd93b;
    }

    #boss-health-bar {
      position: absolute; top: 46px; left: 20px; right: 20px;
      height: 14px;
      background: #2a0a20;
      border: 2px solid #ff3366;
      border-radius: 8px;
      overflow: hidden;
      z-index: 20;
    }
    #boss-health-fill {
      width: 100%; height: 100%;
      background: linear-gradient(90deg, #ff3366, #ffd93b);
      transition: width 0.2s ease-out;
    }

    #boss-canvas {
      width: 100%; height: 100%;
      max-width: 360px; max-height: 640px;
      background: radial-gradient(circle at center, #1f082e 0%, #080214 100%);
      image-rendering: pixelated;
    }

    #boss-phase-banner {
      position: absolute;
      top: 35%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.55rem;
      color: #ffd93b;
      text-align: center;
      text-shadow: 0 0 16px rgba(255,217,59,0.8);
      line-height: 1.8;
      pointer-events: none;
      z-index: 30;
      animation: banner-pop 2s ease forwards;
    }
    @keyframes banner-pop {
      0% { opacity:0; transform:translate(-50%,-50%) scale(0.6); }
      20%,80% { opacity:1; transform:translate(-50%,-50%) scale(1.1); }
      100% { opacity:0; transform:translate(-50%,-50%) scale(1.4); }
    }
  `;
  document.head.appendChild(s);
}

export function mountBoss(container, state = {}, onComplete) {
  injectCSS();

  container.innerHTML = /* html */`
    <div id="boss-screen">
      <div id="boss-hud">
        <div class="boss-hud-pill">👑 MUSKI HP: <span id="player-hp">❤️❤️❤️</span></div>
        <div class="boss-hud-pill" id="boss-phase-indicator">PHASE 1/3</div>
      </div>

      <div id="boss-health-bar">
        <div id="boss-health-fill"></div>
      </div>

      <canvas id="boss-canvas" width="360" height="640"></canvas>
      <div id="boss-phase-banner">⚠️ BOSS APPEARS:<br>GETTING OLDER!</div>
    </div>
  `;

  const canvas = document.getElementById('boss-canvas');
  const ctx = canvas.getContext('2d');
  const W = 360, H = 640;

  let player = { x: W / 2, y: H - 70, r: 16, hp: 3, invuln: 0 };
  let boss = { x: W / 2, y: 140, r: 42, maxHp: 100, hp: 100, phase: 1, vx: 2 };
  let bullets = [];
  let bossProjectiles = [];
  let pickups = [];
  let confetti = [];
  let wishCharge = 0;
  let isVictorious = false;
  let animId = null;

  // Touch / Drag input for player movement
  function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const clientX = touch.clientX - rect.left;
    const scaleX = W / rect.width;
    player.x = Math.max(player.r + 10, Math.min(W - player.r - 10, clientX * scaleX));

    // In Phase 3: tap anywhere to charge wish
    if (boss.phase === 3) {
      wishCharge = Math.min(100, wishCharge + 10);
      SFX.coin();
    }
  }

  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });
  canvas.addEventListener('mousemove', handleInput);
  canvas.addEventListener('mousedown', handleInput);

  // Keyboard controls for PC
  const keys = { left: false, right: false };
  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
    if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'enter') {
      if (boss.phase === 3) {
        wishCharge = Math.min(100, wishCharge + 10);
        SFX.coin();
      }
    }
  }
  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let lastShoot = 0;
  let lastBossAttack = 0;

  function update(time) {
    if (isVictorious) {
      renderVictory();
      animId = requestAnimationFrame(update);
      return;
    }

    if (player.invuln > 0) player.invuln -= 16;

    // Keyboard player movement
    if (keys.left) player.x = Math.max(player.r + 10, player.x - 6);
    if (keys.right) player.x = Math.min(W - player.r - 10, player.x + 6);

    // Boss movement
    boss.x += boss.vx;
    if (boss.x > W - 60 || boss.x < 60) boss.vx *= -1;

    // Auto-fire player confetti shots
    if (time - lastShoot > 240 && boss.phase < 3) {
      bullets.push({ x: player.x - 6, y: player.y - 20, vy: -7 });
      bullets.push({ x: player.x + 6, y: player.y - 20, vy: -7 });
      SFX.shoot();
      lastShoot = time;
    }

    // Boss attacks
    if (time - lastBossAttack > (boss.phase === 1 ? 900 : 600) && boss.phase < 3) {
      lastBossAttack = time;
      if (boss.phase === 1) {
        // Falling alarm clocks
        bossProjectiles.push({ x: Math.random() * (W - 40) + 20, y: 150, vy: 3.5, type: 'clock' });
      } else {
        // Spark lasers & frosting bombs
        bossProjectiles.push({ x: boss.x, y: boss.y + 30, vx: (Math.random() - 0.5) * 4, vy: 4.5, type: 'spark' });
      }
      SFX.flap();
    }

    // Update bullets
    bullets.forEach(b => { b.y += b.vy; });
    bullets = bullets.filter(b => b.y > 0);

    // Update boss projectiles
    bossProjectiles.forEach(p => {
      p.y += p.vy;
      if (p.vx) p.x += p.vx;
    });

    // Bullet-Boss Collision
    bullets.forEach(b => {
      const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
      if (dist < boss.r + 10) {
        b.hit = true;
        boss.hp = Math.max(0, boss.hp - 2.5);
        SFX.hit();
        updateHealthBar();
      }
    });
    bullets = bullets.filter(b => !b.hit);

    // Projectile-Player Collision
    bossProjectiles.forEach(p => {
      const dist = Math.hypot(p.x - player.x, p.y - player.y);
      if (dist < player.r + 12 && player.invuln <= 0) {
        p.hit = true;
        player.hp = Math.max(0, player.hp - 1);
        player.invuln = 1200;
        SFX.hit();
        document.getElementById('player-hp').textContent = '❤️'.repeat(player.hp);
        if (player.hp <= 0) {
          // Soft continue: Muski is invincible on her birthday!
          player.hp = 3;
          document.getElementById('player-hp').textContent = '❤️❤️❤️';
        }
      }
    });
    bossProjectiles = bossProjectiles.filter(p => !p.hit && p.y < H + 20);

    // Phase Transitions
    if (boss.hp <= 66 && boss.phase === 1) {
      boss.phase = 2;
      showBanner('PHASE 2:<br>CANDLE TITAN STRIKES! 🔥');
      document.getElementById('boss-phase-indicator').textContent = 'PHASE 2/3';
    } else if (boss.hp <= 33 && boss.phase === 2) {
      boss.phase = 3;
      showBanner('PHASE 3: CHARGE THE 19TH WISH!<br>TAP RAPIDLY! 💫');
      document.getElementById('boss-phase-indicator').textContent = 'PHASE 3/3';
    }

    // Phase 3 victory trigger
    if (boss.phase === 3 && wishCharge >= 100 && !isVictorious) {
      triggerVictory();
    }

    render();
    animId = requestAnimationFrame(update);
  }

  function showBanner(text) {
    const el = document.getElementById('boss-phase-banner');
    if (el) {
      el.innerHTML = text;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'banner-pop 2.5s ease forwards';
    }
  }

  function updateHealthBar() {
    const fill = document.getElementById('boss-health-fill');
    if (fill) fill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
  }

  function triggerVictory() {
    isVictorious = true;
    SFX.unlock();
    for (let i = 0; i < 90; i++) {
      confetti.push({
        x: W / 2, y: H / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        color: ['#ffd93b','#ff6eb4','#5ee0ff','#5effa3','#DA627D'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
      });
    }
    setTimeout(() => {
      cancelAnimationFrame(animId);
      onComplete?.();
    }, 3200);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // Background Stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 37) % W, (i * 53) % H, 2, 2);
    }

    // Draw Boss
    ctx.save();
    ctx.translate(boss.x, boss.y);
    if (boss.phase === 1) {
      // Clock of Getting Older
      ctx.fillStyle = '#ff3366';
      ctx.beginPath(); ctx.arc(0, 0, boss.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '28px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⏰', 0, 0);
    } else if (boss.phase === 2) {
      // Giant 19 Cake
      ctx.fillStyle = '#ffd93b';
      ctx.beginPath(); ctx.arc(0, 0, boss.r + 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '34px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🎂', 0, 0);
    } else {
      // Cosmic Disco Orb
      ctx.fillStyle = `hsl(${Date.now() % 360}, 80%, 60%)`;
      ctx.beginPath(); ctx.arc(0, 0, boss.r + Math.sin(Date.now() * 0.01) * 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '36px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪩', 0, 0);
    }
    ctx.restore();

    // Draw Bullets
    ctx.fillStyle = '#ffd93b';
    bullets.forEach(b => {
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    });

    // Draw Boss Projectiles
    bossProjectiles.forEach(p => {
      ctx.font = '18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'clock' ? '⏱️' : '🔥', p.x, p.y);
    });

    // Draw Player (Muski avatar)
    ctx.save();
    if (player.invuln > 0 && Math.floor(Date.now() / 80) % 2 === 0) ctx.globalAlpha = 0.4;
    drawAvatar(ctx, player.x, player.y - 12, 14, boss.phase === 3 ? 'happy' : 'default');
    ctx.restore();

    // In Phase 3: Wish Charge Beam
    if (boss.phase === 3) {
      ctx.fillStyle = 'rgba(255,217,59,0.85)';
      ctx.fillRect(40, H - 40, (W - 80) * (wishCharge / 100), 12);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(40, H - 40, W - 80, 12);
      ctx.font = '9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(`WISH CHARGE: ${Math.floor(wishCharge)}% - TAP!`, W / 2, H - 22);

      if (wishCharge > 70) {
        // Golden beam to boss
        ctx.fillStyle = 'rgba(255, 230, 80, 0.7)';
        ctx.fillRect(player.x - 12, boss.y, 24, player.y - boss.y);
      }
    }
  }

  function renderVictory() {
    ctx.clearRect(0, 0, W, H);
    confetti.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.2;
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size);
    });
    ctx.font = 'bold 16px monospace'; ctx.fillStyle = '#ffd93b'; ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', W / 2, H / 2 - 20);
    ctx.font = '11px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText('YOU DEFEATED GETTING OLDER! 🎉', W / 2, H / 2 + 10);
  }

  animId = requestAnimationFrame(update);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
}
