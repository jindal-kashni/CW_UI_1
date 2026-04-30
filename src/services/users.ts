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
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      error?: string;
    }>('create-user-account', {
      body: {
        email,
        role: input.role,
        password: input.password,
      },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (error) {
      const functionError = error as unknown as { context?: { json?: () => Promise<{ error?: string }> } };
      if (functionError.context?.json) {
        try {
          const payload = await functionError.context.json();
          if (payload?.error) {
            return { ok: false, error: payload.error };
          }
        } catch {}
      }
      return {
        ok: false,
        error:
          error.message ||
          'Could not reach user creation service. Deploy the `create-user-account` edge function first.',
      };
    }

    if (!data?.success) {
      return { ok: false, error: data?.error ?? 'User creation failed.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error while creating user.',
    };
  }
}

export async function deleteAdminUserAccount(input: {
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      error?: string;
    }>('delete-user-account', {
      body: {
        userId: input.userId,
      },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (error) {
      const functionError = error as unknown as { context?: { json?: () => Promise<{ error?: string }> } };
      if (functionError.context?.json) {
        try {
          const payload = await functionError.context.json();
          if (payload?.error) {
            return { ok: false, error: payload.error };
          }
        } catch {}
      }
      return {
        ok: false,
        error:
          error.message ||
          'Could not reach user deletion service. Deploy the `delete-user-account` edge function first.',
      };
    }

    if (!data?.success) {
      return { ok: false, error: data?.error ?? 'User deletion failed.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error while deleting user.',
    };
  }
}

export async function updateAdminUserRole(input: {
  userId: string;
  role: AdminRole;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      error?: string;
    }>('admin-update-user', {
      body: {
        userId: input.userId,
        role: input.role,
      },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (error) {
      const functionError = error as unknown as { context?: { json?: () => Promise<{ error?: string }> } };
      if (functionError.context?.json) {
        try {
          const payload = await functionError.context.json();
          if (payload?.error) return { ok: false, error: payload.error };
        } catch {}
      }
      return {
        ok: false,
        error:
          error.message ||
          'Could not reach user update service. Deploy the `admin-update-user` edge function first.',
      };
    }

    if (!data?.success) {
      return { ok: false, error: data?.error ?? 'User update failed.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error while updating user.',
    };
  }
}
