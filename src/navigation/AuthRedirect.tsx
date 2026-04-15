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

/**
 * Routes allowed when no workspace role is set (signed out).
 * IMPORTANT: Expo Router's `usePathname()` omits `(group)` segments (see routeInfo.js), so the admin
 * dashboard and login can both report pathname `/`. We must use `useSegments()` to tell them apart.
 */
function isLoggedOutAllowed(pathname: string, segments: readonly string[]) {
  // useSegments() can be undefined before the tree is ready (crashes if we call .includes).
  if (segments.includes('(admin)') || segments.includes('(auditor)')) return false;
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
  const { role } = useWorkspace();
  const pathname = usePathname() ?? '/';
  const segmentsRaw = useSegments();
  // Avoid `?? []` (new array each render when undefined) — it would churn effect deps.
  const segments = useMemo(() => segmentsRaw ?? EMPTY_SEGMENTS, [segmentsRaw]);
  const navState = useRootNavigationState();
  const navigationRef = useNavigationContainerRef();
  const didKickRef = useRef(false);

  useEffect(() => {
    didKickRef.current = false;
  }, [pathname]);

  useEffect(() => {
    const allowed = isLoggedOutAllowed(pathname, segments);
    if (role !== null) return;
    if (!navState?.key) return;
    if (!navigationRef.isReady()) return;
    if (allowed) return;
    if (didKickRef.current) return;
    didKickRef.current = true;
    const target = '/sign-in';
    router.replace(target as any);
  }, [role, pathname, segments, navState?.key, navigationRef]);

  return null;
}
