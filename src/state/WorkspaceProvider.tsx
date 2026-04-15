import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type WorkspaceRole = 'admin' | 'auditor';

type Ctx = {
  role: WorkspaceRole | null;
  setRole: (role: WorkspaceRole) => void;
  logout: () => void;
  /** Shown once on the login screen after logout; cleared on sign-in or manually. */
  signOutMessage: string | null;
  clearSignOutMessage: () => void;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<WorkspaceRole | null>(null);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);

  const setRole = useCallback((next: WorkspaceRole) => {
    setRoleState(next);
  }, []);

  const clearSignOutMessage = useCallback(() => {
    setSignOutMessage(null);
  }, []);

  const logout = useCallback(() => {
    setRoleState(null);
    setSignOutMessage('Successfully logged out');
  }, []);

  const value = useMemo(
    () => ({ role, setRole, logout, signOutMessage, clearSignOutMessage }),
    [role, setRole, logout, signOutMessage, clearSignOutMessage]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
