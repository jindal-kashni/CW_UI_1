import { useEffect, useMemo, useRef } from 'react';
import {
  router,
  useNavigationContainerRef,
  usePathname,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import { useWorkspace } from '@/src/state/WorkspaceProvider';

const EMPTY_SEGMENTS: readonly string[] = [];

/** Routes allowed when no workspace role is set (signed out). */
function isLoggedOutAllowed(pathname: string, segments: readonly string[]) {
  const root = segments[0];
  if (root === 'admin' || root === 'audit') return false;
  if (pathname.startsWith('/sign-in')) return true;
  if (pathname.startsWith('/forgot-password')) return true;
  if (pathname === '' || pathname === '/' || pathname === '/index') return true;
  return false;
}

/**
 * When there is no workspace role, only the login (and forgot-password) routes are valid.
 * Sends everything else to `/` so role-gated layouts never sit on-screen with nothing rendered.
 */
export function AuthRedirect() {
  const { role, initializing } = useWorkspace();
  const pathname = usePathname() ?? '/';
  const segmentsRaw = useSegments();
  // Avoid `?? []` (new array each render when undefined) — it would churn effect deps.
  const segments = useMemo(() => segmentsRaw ?? EMPTY_SEGMENTS, [segmentsRaw]);
  const segmentList = segments as readonly string[];
  const navState = useRootNavigationState();
  const navigationRef = useNavigationContainerRef();
  const didKickRef = useRef(false);

  useEffect(() => {
    didKickRef.current = false;
  }, [pathname]);

  useEffect(() => {
    const allowed = isLoggedOutAllowed(pathname, segmentList);
    if (initializing) return;
    if (role !== null) return;
    if (!navState?.key) return;
    if (!navigationRef.isReady()) return;
    if (allowed) return;
    if (didKickRef.current) return;
    didKickRef.current = true;
    const target = '/sign-in';
    router.replace(target as any);
  }, [initializing, role, pathname, segmentList, navState?.key, navigationRef]);

  useEffect(() => {
    if (initializing) return;
    if (!navState?.key) return;
    if (!navigationRef.isReady()) return;
    if (role === 'admin' && segmentList[0] === 'audit') {
      router.replace('/admin' as any);
      return;
    }
    if (role === 'auditor' && segmentList[0] === 'admin') {
      router.replace('/audit/history' as any);
    }
  }, [initializing, role, segmentList, navState?.key, navigationRef]);

  return null;
}
