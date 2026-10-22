// supabase/functions/get-countdown/index.ts
// Deno Edge Function — backup countdown endpoint.
// The primary path is the Postgres RPC get_countdown() called via supabase-js.
// This function is an alternative entry point that:
//   a) Can be called from environments without supabase-js
//   b) Allows future CORS or rate-limiting customisation at the edge

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only GET and POST allowed
  if (!['GET', 'POST'].includes(req.method)) {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Use service role to bypass RLS (we're inside a trusted Edge Function)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.rpc('get_countdown');

    if (error) {
      console.error('[get-countdown] RPC error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Short cache: browsers can cache for 5s to reduce poll noise,
          // but the client computes its own offset so this is fine.
          'Cache-Control': 'public, max-age=5',
        },
      },
    );
  } catch (err) {
    console.error('[get-countdown] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
