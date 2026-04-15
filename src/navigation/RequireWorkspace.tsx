import type { ReactNode } from 'react';
import type { WorkspaceRole } from '@/src/state/WorkspaceProvider';
import { useWorkspace } from '@/src/state/WorkspaceProvider';

/**
 * Enforces that the current session matches a workspace role. Used so admin and auditor
 * flows behave like separate apps with no cross-navigation.
 */
export function RequireWorkspace({
  role,
  children,
}: {
  role: WorkspaceRole;
  children: ReactNode;
}) {
  const { role: current } = useWorkspace();
  // Keep this guard side-effect free; parent flows handle navigation.
  if (current !== role) return null;
  return <>{children}</>;
}
