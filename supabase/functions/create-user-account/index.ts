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

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const role = body?.role;

    if (!email || !email.includes('@')) return json(400, { success: false, error: 'Valid email is required.' });
    if (!password || password.length < 8) {
      return json(400, { success: false, error: 'Password must be at least 8 characters.' });
    }
    if (!isRole(role)) return json(400, { success: false, error: 'Role must be Admin or Auditor.' });

    const displayName = email.split('@')[0] || 'User';

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, must_reset_password: true },
    });

    if (created.error || !created.data.user) {
      return json(400, {
        success: false,
        error: created.error?.message ?? 'Could not create auth user.',
      });
    }

    const userId = created.data.user.id;
    const now = new Date().toISOString();
    const { error: profileError } = await admin.from('user_profile').upsert(
      [
        {
          user_id: userId,
          name: displayName,
          email,
          role,
          updated_at: now,
        },
      ],
      { onConflict: 'user_id' }
    );

    if (profileError) {
      if (profileError.message.toLowerCase().includes('permission denied for table user_profile')) {
        return json(400, {
          success: false,
          error:
            'permission denied for table user_profile. Grant service_role access to public.user_profile in Supabase SQL editor.',
        });
      }
      return json(400, { success: false, error: profileError.message });
    }

    const { error: settingsError } = await admin.from('user_settings').upsert(
      [
        {
          user_id: userId,
          updated_at: now,
        },
      ],
      { onConflict: 'user_id' }
    );
    if (settingsError) {
      return json(400, {
        success: false,
        error: `User created but settings initialization failed: ${settingsError.message}`,
      });
    }

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
});
