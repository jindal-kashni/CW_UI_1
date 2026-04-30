import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, usePathname, useSegments } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { fetchUserProfile } from '@/src/services/auth';
import { useTheme } from '@/src/theme';
import { UserChip } from './UserChip';

const cachedNameByUserId = new Map<string, string>();

export function TopBar({
  title,
  userName,
  onPressUser,
  onPressBack,
  hideActions = false,
}: {
  title: string;
  userName: string;
  onPressUser?: () => void;
  onPressBack?: () => void;
  hideActions?: boolean;
}) {
  const t = useTheme();
  const { alerts, alertsHydrated } = useDemoState();
  const { user, role, auditorSettings, auditorSettingsReady } = useWorkspace();
  const pathname = usePathname();
  const segments = useSegments();
  const inAdminWorkspace = segments[0] === 'admin';
  const inAlerts =
    pathname === '/admin/alerts' ||
    pathname.startsWith('/admin/alerts/') ||
    pathname === '/alerts' ||
    pathname.startsWith('/alerts/');
  const inProfile = pathname === '/profile';
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [resolvedUserName, setResolvedUserName] = React.useState<string>(() => {
    if (user?.id && cachedNameByUserId.has(user.id)) {
      return cachedNameByUserId.get(user.id) as string;
    }
    const first = typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : '';
    const last = typeof user?.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : '';
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    if (typeof user?.user_metadata?.name === 'string' && user.user_metadata.name.trim()) {
      return user.user_metadata.name.trim();
    }
    return userName;
  });
  const unreadCount =
    pushEnabled && alertsHydrated ? alerts.filter((a) => !a.read && !a.completedAt).length : 0;
  const effectiveUserName = resolvedUserName;

  React.useEffect(() => {
    if (role !== 'auditor') {
      setPushEnabled(true);
      return;
    }
    if (!auditorSettingsReady) return;
    setPushEnabled(auditorSettings.pushNotifications);
  }, [auditorSettings.pushNotifications, auditorSettingsReady, role]);

  React.useEffect(() => {
    let mounted = true;
    if (!user) {
      setResolvedUserName(userName);
      return;
    }
    (async () => {
      const profile = await fetchUserProfile(user);
      if (!mounted) return;
      const profileName = profile?.name?.trim();
      if (profileName) {
        if (user.id) cachedNameByUserId.set(user.id, profileName);
        setResolvedUserName(profileName);
        return;
      }
      const first = typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : '';
      const last = typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : '';
      const combined = `${first} ${last}`.trim();
      const fallback = combined || userName;
      if (user.id && fallback) cachedNameByUserId.set(user.id, fallback);
      setResolvedUserName(fallback);
    })();
    return () => {
      mounted = false;
    };
  }, [user, userName]);

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#004A26' }}>
      <View
        style={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.sm,
          paddingBottom: t.spacing.md,
          backgroundColor: '#004A26',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.16)',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          {onPressBack ? (
            <Pressable
              onPress={onPressBack}
              hitSlop={10}
              style={({ pressed }) => [
                {
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                },
              ]}>
              <FontAwesome name="chevron-left" size={16} color="#F6F4EC" />
            </Pressable>
          ) : null}
          <View pointerEvents="none">
            <Image
              source={require('../../assets/images/CWSLogoWhite.png')}
              accessibilityLabel={title}
              style={{
                width: 240,
                height: 60,
                marginLeft: onPressBack ? -64 : -t.spacing.xl,
              }}
              resizeMode="contain"
            />
          </View>
        </View>
        {hideActions ? <View style={{ width: 40 }} /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <Pressable
              onPress={
                inAlerts
                  ? undefined
                  : () => router.push((inAdminWorkspace ? '/admin/alerts' : '/alerts') as any)
              }
              disabled={inAlerts}
              hitSlop={10}
              style={({ pressed }) => [
                {
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : 'transparent',
                  opacity: inAlerts ? 0.55 : 1,
                },
              ]}>
              <View>
                <FontAwesome name="inbox" size={18} color="#F6F4EC" />
                {unreadCount > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: -8,
                      top: -8,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      paddingHorizontal: 5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#B63E34',
                    }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
            <UserChip
              name={effectiveUserName}
              onPress={inProfile ? undefined : onPressUser ?? (() => router.push('/profile' as any))}
              disabled={inProfile}
              tone="lightOnDark"
            />
          </View>
        )}
        </View>
      </View>
    </SafeAreaView>
  );
}

