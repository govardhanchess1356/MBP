/**
 * admin/admin.js — Admin Dashboard entry point
 *
 * Phase 4 implements this fully.
 * Phase 1: basic sign-in + register_admin() bootstrap flow.
 */
import { supabase }                           from '@/data/supabase.js';
import { injectPalette }                       from '@/config/palette.js';
import { adminSignIn, adminSignOut,
         registerAdmin, getAdminSession }      from '@/data/settings-api.js';

injectPalette();

const root = document.getElementById('admin-app');

function render(html) { root.innerHTML = html; }

function showLogin() {
  render(`
    <div style="max-width:400px;margin:4rem auto;padding:2rem;font-family:'Press Start 2P',monospace;color:#F9DBBD;">
      <h1 style="font-size:.8rem;color:#DA627D;margin-bottom:2rem;line-height:2;">ADMIN LOGIN</h1>
      <input id="email" type="email" placeholder="admin@email.com"
        style="width:100%;padding:.75rem;margin-bottom:1rem;background:#450920;border:2px solid #A53860;color:#F9DBBD;font-family:'VT323',monospace;font-size:1.2rem;" />
      <input id="pass" type="password" placeholder="password"
        style="width:100%;padding:.75rem;margin-bottom:1.5rem;background:#450920;border:2px solid #A53860;color:#F9DBBD;font-family:'VT323',monospace;font-size:1.2rem;" />
      <button id="loginBtn"
        style="width:100%;padding:1rem;background:#A53860;color:#F9DBBD;border:none;font-family:'Press Start 2P',monospace;font-size:.6rem;cursor:pointer;">
        SIGN IN
      </button>
      <p id="err" style="color:#FFA5AB;font-size:.5rem;margin-top:1rem;line-height:2;"></p>
    </div>
  `);

  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const pass  = document.getElementById('pass').value;
    try {
      await adminSignIn(email, pass);
      boot();
    } catch (e) {
      document.getElementById('err').textContent = e.message;
    }
  });
}

async function showDashboard(user) {
  render(`
    <div style="font-family:'Press Start 2P',monospace;color:#F9DBBD;padding:2rem;max-width:900px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
        <h1 style="font-size:.7rem;color:#DA627D;">ADMIN DASHBOARD</h1>
        <button id="signOutBtn" style="background:transparent;border:1px solid #A53860;color:#FFA5AB;padding:.5rem;font-family:'Press Start 2P',monospace;font-size:.4rem;cursor:pointer;">SIGN OUT</button>
      </div>
      <p style="font-size:.45rem;color:#A53860;line-height:2;">SIGNED IN AS: ${user.email}</p>
      <hr style="border-color:#450920;margin:1.5rem 0;" />
      <p style="font-size:.5rem;color:#FFA5AB;line-height:2.5;">
        ── PHASE 4 WILL BUILD: ──<br>
        • Moderation queue (approve / reject cards, photos, stickers)<br>
        • Token manager (generate / revoke invite links)<br>
        • Settings panel (unlock time, emergency unlock)<br>
        • Easter egg checklist<br>
        • Vault setup page (one-time RSA keypair generation)
      </p>
      <hr style="border-color:#450920;margin:1.5rem 0;" />
      <div id="bootstrap-section"></div>
    </div>
  `);

  document.getElementById('signOutBtn').addEventListener('click', async () => {
    await adminSignOut();
    showLogin();
  });

  // Show register_admin() bootstrap button if admin_uid not yet set
  const { data: settings } = await supabase.from('settings').select('admin_uid').single();
  if (!settings?.admin_uid) {
    document.getElementById('bootstrap-section').innerHTML = `
      <div style="border:2px solid #DA627D;padding:1.5rem;margin-top:1rem;">
        <p style="font-size:.5rem;color:#FFA5AB;line-height:2.2;margin-bottom:1rem;">
          ⚠ ADMIN NOT YET REGISTERED<br>
          Click below to register your account as the site admin.<br>
          This can only be done ONCE.
        </p>
        <button id="registerBtn" style="background:#A53860;color:#F9DBBD;border:none;padding:.75rem 1.5rem;font-family:'Press Start 2P',monospace;font-size:.5rem;cursor:pointer;">
          REGISTER AS ADMIN
        </button>
        <p id="reg-result" style="font-size:.45rem;margin-top:1rem;line-height:2;"></p>
      </div>
    `;
    document.getElementById('registerBtn').addEventListener('click', async () => {
      try {
        await registerAdmin();
        document.getElementById('reg-result').style.color = '#FFA5AB';
        document.getElementById('reg-result').textContent  = '✓ Admin registered! Reload to confirm.';
      } catch (e) {
        document.getElementById('reg-result').style.color  = '#DA627D';
        document.getElementById('reg-result').textContent   = e.message;
      }
    });
  }
}

async function boot() {
  const session = await getAdminSession();
  if (session?.user) {
    await showDashboard(session.user);
  } else {
    showLogin();
  }
}

boot();
