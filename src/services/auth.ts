import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

export type WorkspaceRole = 'admin' | 'auditor';

// DB stores capitalized role values: 'Admin' | 'Auditor'.
// App uses lowercase keys for routing/guards. Normalize at the boundary.
function normalizeRole(value: unknown): WorkspaceRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'auditor') return 'auditor';
  return null;
}

export type UserProfile = {
  user_id: string;
  name: string | null;
  email: string | null;
  role: WorkspaceRole | null;
};

function mapProfileRow(data: {
  user_id: string;
  name: string | null;
  email: string | null;
  role: unknown;
}): UserProfile {
  return {
    user_id: data.user_id,
    name: typeof data.name === 'string' ? data.name : null,
    email: typeof data.email === 'string' ? data.email : null,
    role: normalizeRole(data.role),
  };
}

export async function fetchUserProfile(user: User | null): Promise<UserProfile | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('user_profile')
      .select('user_id, name, email, role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!error && data) return mapProfileRow(data);

    // Fallback: recover from historical profile/user_id mismatches by email.
    if (user.email) {
      const { data: byEmail, error: byEmailError } = await supabase
        .from('user_profile')
        .select('user_id, name, email, role')
        .ilike('email', user.email)
        .maybeSingle();
      if (!byEmailError && byEmail) return mapProfileRow(byEmail);
    }

    return null;
  } catch (err) {
    console.warn('Failed to fetch user profile for role resolution.', err);
    return null;
  }
}

export async function resolveRoleForUser(user: User | null): Promise<WorkspaceRole | null> {
  if (!user) return null;

  const profile = await fetchUserProfile(user);
  if (profile?.role) return profile.role;

  const metaRole = normalizeRole(
    user.app_metadata?.role ?? user.user_metadata?.role ?? user.user_metadata?.workspaceRole
  );
  if (metaRole) return metaRole;

  return null;
}

export async function loadSessionAndRole(): Promise<{
  session: Session | null;
  role: WorkspaceRole | null;
}> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const role = await resolveRoleForUser(session?.user ?? null);
  return { session, role };
}

export function toDbRole(role: WorkspaceRole): 'Admin' | 'Auditor' {
  return role === 'admin' ? 'Admin' : 'Auditor';
}
