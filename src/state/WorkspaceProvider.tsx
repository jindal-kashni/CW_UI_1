import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { loadSessionAndRole, resolveRoleForUser, type WorkspaceRole } from '@/src/services/auth';
import { supabase } from '@/utils/supabase';
import { clearSessionCache } from '@/src/state/sessionCache';
import {
  defaultAuditorSettings,
  fetchAuditorSettings,
  saveAuditorSettings,
  type AuditorSettings,
} from '@/src/services/settings';
export type { WorkspaceRole } from '@/src/services/auth';

type Ctx = {
  initializing: boolean;
  session: Session | null;
  user: User | null;
  role: WorkspaceRole | null;
  setRole: (role: WorkspaceRole) => void;
  logout: () => Promise<void>;
  signOutMessage: string | null;
  clearSignOutMessage: () => void;
  auditorSettings: AuditorSettings;
  auditorSettingsReady: boolean;
  refreshAuditorSettings: () => Promise<void>;
  persistAuditorSettings: (
    next: AuditorSettings
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<WorkspaceRole | null>(null);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);
  const [auditorSettings, setAuditorSettings] = useState<AuditorSettings>(defaultAuditorSettings);
  const [auditorSettingsReady, setAuditorSettingsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const boot = await loadSessionAndRole();
        if (!mounted) return;
        setSession(boot.session);
        setUser(boot.session?.user ?? null);
        setRoleState(boot.role);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: unknown, nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setRoleState(null);
        return;
      }
      resolveRoleForUser(nextSession.user).then((nextRole) => {
        setRoleState(nextRole);
      });
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setRole = useCallback((next: WorkspaceRole) => {
    setRoleState(next);
  }, []);

  const clearSignOutMessage = useCallback(() => {
    setSignOutMessage(null);
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log('SIGN OUT ERROR:', error);
    }

    setRoleState(null);
    clearSessionCache();
    setAuditorSettings(defaultAuditorSettings);
    setAuditorSettingsReady(false);
    setSignOutMessage('Successfully logged out');
  }, []);

  const refreshAuditorSettings = useCallback(async () => {
    if (!user?.id || role !== 'auditor') {
      setAuditorSettings(defaultAuditorSettings);
      setAuditorSettingsReady(true);
      return;
    }
    const settings = await fetchAuditorSettings(user.id);
    setAuditorSettings(settings);
    setAuditorSettingsReady(true);
  }, [role, user?.id]);

  const persistAuditorSettings = useCallback(
    async (next: AuditorSettings) => {
      setAuditorSettings(next);
      if (!user?.id || role !== 'auditor') {
        return { ok: false as const, error: 'Please sign in again.' };
      }
      const result = await saveAuditorSettings(user.id, next);
      return result;
    },
    [role, user?.id]
  );

  useEffect(() => {
    setAuditorSettingsReady(false);
    refreshAuditorSettings().catch(() => {
      setAuditorSettings(defaultAuditorSettings);
      setAuditorSettingsReady(true);
    });
  }, [refreshAuditorSettings]);

  const value = useMemo(
    () => ({
      initializing,
      session,
      user,
      role,
      setRole,
      logout,
      signOutMessage,
      clearSignOutMessage,
      auditorSettings,
      auditorSettingsReady,
      refreshAuditorSettings,
      persistAuditorSettings,
    }),
    [
      initializing,
      session,
      user,
      role,
      setRole,
      logout,
      signOutMessage,
      clearSignOutMessage,
      auditorSettings,
      auditorSettingsReady,
      refreshAuditorSettings,
      persistAuditorSettings,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}