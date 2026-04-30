import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json(200, { ok: true });
  if (req.method !== 'POST') return json(405, { success: false, error: 'Method not allowed.' });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY =
    Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(500, { success: false, error: 'Missing service role environment configuration.' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    if (!userId) return json(400, { success: false, error: 'userId is required.' });

    const { error: profileDeleteError } = await admin.from('user_profile').delete().eq('user_id', userId);
    if (profileDeleteError) {
      if (profileDeleteError.message.toLowerCase().includes('permission denied for table user_profile')) {
        return json(400, {
          success: false,
          error:
            'permission denied for table user_profile. Grant service_role access to public.user_profile in Supabase SQL editor.',
        });
      }
      return json(400, { success: false, error: profileDeleteError.message });
    }

    const { error: settingsDeleteError } = await admin.from('user_settings').delete().eq('user_id', userId);
    if (settingsDeleteError) {
      return json(400, { success: false, error: settingsDeleteError.message });
    }

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return json(400, { success: false, error: authDeleteError.message });
    }

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
});
