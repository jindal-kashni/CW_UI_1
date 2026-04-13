import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

const items = [
  { label: 'Locations', href: '/admin/locations' },
  { label: 'Rooms', href: '/admin/rooms' },
  { label: 'Departments', href: '/admin/departments' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Settings', href: '/(admin-tabs)/settings' },
  { label: 'Profile', href: '/admin/profile' },
  { label: 'Sync Status', href: '/admin/sync-status' },
  { label: 'Reference Data', href: '/admin/reference-data' },
] as const;

export default function AdminMorePage() {
  const t = useTheme();
  return (
    <AdminScreenScaffold title="More">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>More</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Access system structure and administration pages.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.md }}>
        {items.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as any)}
            style={({ pressed }) => [
              {
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : t.colors.card.surface,
                paddingHorizontal: t.spacing.lg,
                minHeight: 58,
                justifyContent: 'center',
              },
            ]}>
            <Text style={[t.text.body, { fontWeight: '700', color: t.colors.brand.forest }]}>
              {item.label} →
            </Text>
          </Pressable>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

