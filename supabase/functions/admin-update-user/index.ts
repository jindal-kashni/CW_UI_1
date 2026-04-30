import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Role = 'Admin' | 'Auditor';

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

function isRole(value: unknown): value is Role {
  return value === 'Admin' || value === 'Auditor';
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

  const authHeader = req.headers.get('Authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!accessToken) return json(401, { success: false, error: 'Missing auth token.' });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: requesterData, error: requesterError } = await admin.auth.getUser(accessToken);
    if (requesterError || !requesterData.user) {
      return json(401, { success: false, error: 'Invalid auth token.' });
    }

    const { data: requesterProfile, error: requesterProfileError } = await admin
      .from('user_profile')
      .select('role')
      .eq('user_id', requesterData.user.id)
      .maybeSingle();
    if (requesterProfileError || !requesterProfile || requesterProfile.role !== 'Admin') {
      return json(403, { success: false, error: 'Only admins can update users.' });
    }

    const body = await req.json();
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const role = body?.role;
    if (!userId) return json(400, { success: false, error: 'userId is required.' });
    if (!isRole(role)) return json(400, { success: false, error: 'Role must be Admin or Auditor.' });

    const now = new Date().toISOString();
    const { error: profileError } = await admin
      .from('user_profile')
      .update({ role, updated_at: now })
      .eq('user_id', userId);
    if (profileError) return json(400, { success: false, error: profileError.message });

    const byId = await admin.auth.admin.getUserById(userId);
    if (byId.error || !byId.data.user) {
      return json(400, { success: false, error: byId.error?.message ?? 'Could not load target user.' });
    }
    const existingMeta = byId.data.user.user_metadata ?? {};
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...existingMeta, role },
    });
    if (authUpdateError) return json(400, { success: false, error: authUpdateError.message });

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
});
