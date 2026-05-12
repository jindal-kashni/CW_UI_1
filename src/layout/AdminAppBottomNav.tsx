import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: 'tachometer', href: '/admin' },
  { key: 'reports', label: 'Reports', icon: 'file-text-o', href: '/admin/reports' },
  { key: 'assets', label: 'Assets', icon: 'cubes', href: '/admin/assets' },
  { key: 'more', label: 'Admin', icon: 'sliders', href: '/admin/users' },
  { key: 'settings', label: 'Settings', icon: 'cog', href: '/admin/settings' },
] as const;

function isActive(pathname: string, key: (typeof items)[number]['key']) {
  if (key === 'dashboard') return pathname === '/admin' || pathname === '/admin/index';
  if (key === 'reports') return pathname.includes('/admin/reports');
  if (key === 'assets') return pathname.includes('/assets') || pathname.includes('/admin/assets');
  if (key === 'settings') return pathname.includes('/settings');
  if (key === 'more') {
    return (
      pathname.includes('/more') ||
      pathname.includes('/admin/users') ||
      pathname.includes('/admin/locations') ||
      pathname.includes('/admin/rooms') ||
      pathname.includes('/admin/departments') ||
      pathname.includes('/admin/profile') ||
      pathname.includes('/admin/sync-status') ||
      pathname.includes('/admin/reference-data')
    );
  }
  return false;
}

export function AdminAppBottomNav() {
  const t = useTheme();
  const pathname = usePathname();
  const headerGreen = '#004A26';

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#F7F6F2' }}>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,74,38,0.16)',
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.sm,
          paddingBottom: t.spacing.md,
        }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {items.map((item) => {
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
                      ? 'rgba(0,74,38,0.12)'
                      : pressed
                        ? 'rgba(0,74,38,0.07)'
                        : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? 'rgba(0,74,38,0.30)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: t.spacing.sm,
                  },
                ]}>
                <FontAwesome
                  name={item.icon as any}
                  size={20}
                  color={active ? headerGreen : 'rgba(0,74,38,0.72)'}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: active ? '800' : '700',
                    color: active ? headerGreen : 'rgba(0,74,38,0.72)',
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