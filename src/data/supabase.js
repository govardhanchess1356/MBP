import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '\n[muski-birthday] Supabase env vars missing in .env.local.\n' +
    'Running in offline/preview mode. Database calls will safely fallback.\n' +
    'To connect Supabase: copy .env.example → .env.local and fill in credentials.\n'
  );
}

const stubClient = {
  rpc: async (fn) => {
    console.warn(`[supabase-stub] rpc called: ${fn} (no Supabase credentials provided)`);
    return { data: null, error: new Error('Supabase not configured in .env.local') };
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: () => ({
      createSignedUrl: async () => ({ data: null, error: new Error('Supabase not configured') }),
      upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  },
};

let realClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    realClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-client': 'muski-birthday-web',
        },
      },
    });
  } catch (err) {
    console.warn('[muski-birthday] Failed to initialize Supabase client:', err);
  }
} else {
  // Retain createClient reference so tree-shaking doesn't break Rollup chunking
  if (typeof createClient !== 'function') {
    console.warn('[muski-birthday] createClient not available');
  }
}

/**
 * Shared Supabase client.
 * If env vars are absent in dev mode, exports a safe stub to prevent the app from crashing on load.
 */
export const supabase = realClient || stubClient;
