# 🎂 Happy Birthday Muski — Retro Arcade Birthday Site

A mobile-first retro 8-bit arcade birthday website built with **Vite + vanilla JS**, **Supabase** (Postgres + RLS + Storage), and **Canvas 2D**. No React. No audio files. No heavy libraries.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Run migrations in Supabase (see → Supabase Setup below)

# 4. Start dev server
npm run dev
# → http://localhost:5173        public site
# → http://localhost:5173/admin  admin dashboard
```

---

## Supabase Setup (do this once)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project.

### 2. Run the migrations in order
In the Supabase dashboard → **SQL Editor**, run each file:

```
supabase/migrations/001_tables.sql    ← tables + indexes
supabase/migrations/002_rls.sql       ← RLS policies + helper functions
supabase/migrations/003_functions.sql ← all RPC functions
supabase/migrations/004_storage.sql   ← storage buckets + policies
```

> **Important**: run them in order 001 → 002 → 003 → 004. Each migration depends on the previous.

### 3. Copy your API keys
In the Supabase dashboard → **Project Settings → API**:
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon / public key** → `VITE_SUPABASE_ANON_KEY`

Paste both into your `.env.local` file.

### 4. Create your admin account
In Supabase dashboard → **Authentication → Users → Add user**:
- Enter your email and a strong password.
- Note your user UUID (shown in the users table).

### 5. Register as admin (one-time bootstrap)
Visit `http://localhost:5173/admin`, sign in, then click **"Register as Admin"**. This calls the `register_admin()` RPC which sets `settings.admin_uid` to your user ID. It can only be done once.

> After this step, all admin RPCs (`generate_invite_token`, `moderate_item`, `set_unlock_time`, etc.) will work.

---

## Generating Invite Links for Contributors

In the Admin Dashboard → **Token Manager** tab (Phase 4):

```
Admin generates: generate_invite_token('Friend Name', 'optional@email.com')
→ Returns a raw token (shown ONCE, never stored)
→ Share this URL with the contributor:
  https://your-site.netlify.app/contribute?token=RAW_TOKEN
```

Contributors visit the link, fill in their birthday card, and submit. The form works before the site unlocks — they just can't *see* the finished site yet.

---

## Deployment (Netlify)

```bash
npm run build       # outputs to dist/

# Push to GitHub → connect repo to Netlify
# Set environment variables in Netlify dashboard:
#   VITE_SUPABASE_URL      = https://xxx.supabase.co
#   VITE_SUPABASE_ANON_KEY = eyJ...
```

The `netlify.toml` handles all SPA routing and security headers automatically.

### Other platforms

**Vercel**: same env vars, add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/admin/(.*)", "destination": "/admin/index.html" },
    { "source": "/contribute", "destination": "/contribute/index.html" },
    { "source": "/(.*)",       "destination": "/index.html" }
  ]
}
```

**Cloudflare Pages**: set env vars in dashboard, add `_redirects` file in `public/`:
```
/admin/*    /admin/index.html    200
/contribute /contribute/index.html 200
/*          /index.html          200
```

---

## Dev-Only Overrides

In `.env.local`, uncomment to force the site into unlocked mode during development:
```
VITE_DEV_FORCE_UNLOCK=true
```
This bypasses the countdown in dev without touching the DB. **Never set this in production.**

---

## Project Structure

```
src/
  config/         ← constants, palette, levels config (one source of truth)
  data/           ← Supabase API wrappers (read/write)
  engine/         ← shared game engine (rAF loop, canvas, input, HUD, particles)
  games/          ← 5 game plug-ins (flappy, dino, asteroids, jetpack, platformer)
  screens/        ← full-screen UI (boot, arcade-hall, vending-machine, ...)
  countdown/      ← pre-unlock countdown + flip clock + unlock sequence
  audio/          ← Web Audio API synthesis (no audio files)
  ui/             ← shared components (avatar maker, scratch card, pixel button, ...)
  corners/        ← extensible corners system + sticker book
  vault/          ← E2E encrypted secret vault
  eggs/           ← Easter egg registry

admin/            ← admin SPA (separate Vite entry — never in public bundle)
contribute/       ← contributor form (separate Vite entry)
supabase/
  migrations/     ← run these in Supabase SQL Editor in order
  functions/      ← Edge Functions (backup countdown endpoint)
```

---

## How to Add a New Corner

A "Corner" is an extensible section of the site (guestbook, playlist, time capsule, etc.). Each corner gets a door in the Arcade Hall, a contribution form tab, and an admin moderation tab.

### Step 1 — Create the corner module

```
src/corners/my-corner/
  index.js        ← corner component (mounted when user opens the corner)
  contribute.js   ← contribution form (mounted in /contribute)
```

### Step 2 — Register it

```js
// In your corner's index.js or in src/main.js after unlock:
import { registerCorner } from '@/corners/registry.js';
import { MY_SCHEMA }      from './contribute.js';

registerCorner({
  id:    'my_corner',               // matches corner_items.corner_id in DB
  title: "Muski's Playlist",
  icon:  '🎵',
  unlock: 'post_unlock',            // 'always' | 'post_unlock' | 'post_boss'

  component:        () => import('./index.js'),
  contributionForm: () => import('./contribute.js'),

  schema: MY_SCHEMA,    // JSON schema object for payload validation

  moderation: {
    previewFields: ['song_name', 'artist'],  // shown in admin queue
  },
});
```

### Step 3 — Storage
All items automatically go into `corner_items(corner_id = 'my_corner', payload = {...})`. No new DB table needed.

### Available corners so far
| ID | Title | Status |
|----|-------|--------|
| `sticker_book` | Muski's Sticker Book | Phase 7 |

---

## Security Model

### What this protects

| Threat | Protection |
|--------|-----------|
| Birthday girl sees content before unlock | RLS policy `now() >= unlock_at` evaluated in **Postgres**, not the browser. Changing the device clock or DevTools has zero effect. |
| Contributor reads another's pending card | All contributor access goes through `SECURITY DEFINER` RPCs that filter by `contributor_id`. No direct table access. |
| Anyone reverse-engineers an invite token | Only SHA-256 hashes are stored. Even with full DB read access, tokens cannot be recovered. |
| Anyone reads vault messages | Vault stores only AES-GCM ciphertext + salt + IV. Useless without her password. Even the site admin (you) cannot read vault contents without it. |
| Anyone reads RSA-encrypted secret drops | The RSA private key is itself AES-GCM encrypted (same password). Contributors can encrypt but never decrypt. |
| Media accessed before unlock | Storage bucket is **private**. Signed URLs are gated by the same `is_unlocked()` server-side check. |

### What this does NOT protect

| Scenario | Reality |
|----------|---------|
| Supabase project URL | The URL is in the bundle (needed to make API calls). An attacker who finds it still hits RLS walls. |
| Metadata about vault items | Anyone with DB access can see that vault rows exist and who contributed them. The content is encrypted, not the metadata. |
| Insider threat (you, the admin) | You can read all approved cards and photos. You cannot read vault items without her password. This is by design — the vault is for her, not you. |
| Physical device access | If someone has her unlocked phone and knows where to look, they could potentially see in-memory decrypted vault content. This is out of scope. |

### Summary

The security is proportionate to the threat model: **a curious birthday girl peeking before her birthday**. The time-lock is genuinely server-enforced. The vault is genuinely end-to-end encrypted. Everything else is defence-in-depth.

---

## Game Engine Contract

Games are plug-ins. The engine is frozen after Phase 3. To add a game:

```js
// src/games/my-game/index.js
export default {
  /** Called when the level starts or restarts. */
  init(ctx, levelConfig, assets) {},

  /** Called every frame. Update game state. dt is capped at 50 ms. */
  update(dt, input) {},
  // input = { tapped: bool, held: bool, dragX: number, dragY: number, swipeDir: 'up'|'down'|'left'|'right'|null }

  /** Called every frame after update. Draw to ctx. */
  render(ctx) {},
};
// Call engine.win(score) or engine.lose() to end the round.
// DO NOT modify src/engine/* — only add plug-ins.
```

---

## Easter Eggs (admin reference)

| ID | Trigger | Phase |
|----|---------|-------|
| `devtools_note` | Open DevTools console | **1 ✓** |
| `birthday_date` | Device date = Oct 23 | 2 |
| `logo_tap_5` | Tap arcade logo 5× | 3 |
| `hidden_balloons` | Pop all 5 hidden balloons | 4 |
| `vending_combo` | Keypad A1→B2→C3 | 4 |
| `dino_19m_cake` | Reach exactly 19 m in Dino Run | 5 |
| `vault_trigger` | Tap cake 7× on Boot screen | 6 |
| `konami_code` | ↑↑↓↓←→←→BA | 8 |
| `bday_keyboard` | Type "BDAY" on keyboard | 8 |
| `phone_shake` | Shake phone | 8 |
| `birth_time` | Within ±5 min of midnight IST Oct 23 | 8 |

---

## Build Phases

| Phase | Status | What's built |
|-------|--------|-------------|
| **P1** | ✅ **DONE** | Schema, RLS, RPCs, storage policies, project skeleton, Supabase connection, countdown placeholder |
| **P2** | ⏳ Awaiting "go" | Countdown flip clock, unlock sequence, boot screen, CRT overlay, HUD skeleton |
| **P3** | ⏳ | Game engine, Avatar Maker, Flappy Bird (2 levels), coin payout |
| **P4** | ⏳ | Vending machine, scratch cards, contribute form, admin dashboard |
| **P5** | ⏳ | Dino, Jetpack, Asteroids, Platformer (2 levels each) |
| **P6** | ⏳ | Secret Vault (E2E crypto, hidden trigger, secret drops) |
| **P7** | ⏳ | Corners registry + Sticker Book |
| **P8** | ⏳ | Boss, finale, credits, all Easter eggs, polish, deploy guide |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 5 + vanilla JS (ES modules) |
| Graphics | Canvas 2D (all sprites drawn in code) |
| Audio | Web Audio API (all sounds synthesised, no audio files) |
| Backend | Supabase — Postgres 15 + RLS + Storage + Edge Functions |
| Auth | Supabase Auth (admin only) |
| Hosting | Netlify / Vercel / Cloudflare Pages |
| Fonts | Press Start 2P (headings) · VT323 (body) via Google Fonts |
| Crypto | SubtleCrypto / Web Crypto API (PBKDF2 + AES-GCM + RSA-OAEP) |

---

*Made with 💜 for the best 19-year-old.*
