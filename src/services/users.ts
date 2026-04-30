import { supabase } from '@/utils/supabase';
import type { AdminUserRecord } from '@/src/data/admin';
import type { AdminRole } from '@/src/data/admin';

type UserProfileRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
};

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function mapProfileRow(row: UserProfileRow): AdminUserRecord {
  const role = (asString(row.role) === 'Admin' ? 'Admin' : 'Auditor') as AdminUserRecord['role'];
  return {
    id: row.user_id,
    name: asString(row.name) || asString(row.email).split('@')[0] || 'User',
    email: asString(row.email),
    role,
    status: 'Active',
    lastActive: row.updated_at ?? row.created_at,
    departmentId: '',
  };
}

export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  const { data, error } = await supabase
    .from('user_profile')
    .select('user_id, name, email, role, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as UserProfileRow[]).map(mapProfileRow);
}

export async function createAdminUserAccount(input: {
  email: string;
  role: AdminRole;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const displayName = email.split('@')[0] || 'User';

  try {
    const created = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        role: input.role,
      },
    });

    if (created.error || !created.data.user) {
      const msg = created.error?.message ?? 'Could not create auth user.';
      if (msg.toLowerCase().includes('not allowed') || msg.toLowerCase().includes('permission')) {
        return {
          ok: false,
          error:
            'Auth user creation is not permitted with the current key. Use a Supabase service-role endpoint for user creation.',
        };
      }
      return { ok: false, error: msg };
    }

    const userId = created.data.user.id;
    const now = new Date().toISOString();
    const { error: profileError } = await supabase.from('user_profile').upsert(
      [
        {
          user_id: userId,
          name: displayName,
          email,
          role: input.role,
          updated_at: now,
        },
      ],
      { onConflict: 'user_id' }
    );

    if (profileError) {
      return { ok: false, error: profileError.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error while creating user.',
    };
  }
}
