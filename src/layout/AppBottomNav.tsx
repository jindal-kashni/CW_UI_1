import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePathname, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

/** Auditor workspace tab bar only (separate from admin app). */
const AUDITOR_BASE = '/audit' as const;
const items = [
  { key: 'audits', label: 'Your Reports', icon: 'check-square-o', href: `${AUDITOR_BASE}/history` },
  { key: 'assets', label: 'Assets', icon: 'th-large', href: `${AUDITOR_BASE}/assets` },
  { key: 'settings', label: 'Settings', icon: 'cog', href: '/profile' },
] as const;

function isActive(pathname: string, key: 'audits' | 'assets' | 'settings') {
  if (key === 'assets') return pathname.includes('/assets') && !pathname.includes('/alerts');
  if (key === 'audits') return pathname.includes('/audit') || pathname.includes('/audits');
  if (key === 'settings') return pathname.includes('/settings') || pathname.includes('/profile');
  return false;
}

export function AppBottomNav() {
  const t = useTheme();
  const pathname = usePathname();
  const navItems = items;
  const headerGreen = '#004A26';
  const navBg = '#F7F6F2';
  const activePill = 'rgba(0,74,38,0.10)';
  const pressedPill = 'rgba(0,74,38,0.08)';
  const activeText = headerGreen;
  const inactiveText = 'rgba(0,74,38,0.72)';

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{
        backgroundColor: navBg,
      }}>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,74,38,0.16)',
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.sm,
          paddingBottom: t.spacing.md,
        }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {navItems.map((item) => {
            const active = isActive(pathname, item.key);
            return (
              <Pressable
                key={item.key}
                onPress={() => router.replace(item.href as any)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 62,
                    borderRadius: 18,
                    paddingVertical: t.spacing.sm,
                    paddingHorizontal: t.spacing.md,
                    backgroundColor: active
                      ? activePill
                      : pressed
                        ? pressedPill
                        : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? 'rgba(0,74,38,0.22)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: t.spacing.sm,
                  },
                ]}>
                <FontAwesome
                  name={item.icon as any}
                  size={20}
                  color={active ? activeText : inactiveText}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: active ? '800' : '700',
                    color: active ? activeText : inactiveText,
                  }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

