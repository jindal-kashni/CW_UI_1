import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FormField } from '@/src/components';
import { ScreenContainer, TopBar } from '@/src/layout';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { useTheme } from '@/src/theme';
import { fetchUserProfile } from '@/src/services/auth';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(1, 'A');
}

export default function AdminProfilePage() {
  const t = useTheme();
  const { logout, user } = useWorkspace();
  const [displayName, setDisplayName] = React.useState<string>('Admin');
  const [email, setEmail] = React.useState<string>(user?.email ?? '');
  const [roleLabel, setRoleLabel] = React.useState('Admin');
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const profile = await fetchUserProfile(user ?? null);
      if (!active) return;
      if (profile?.name) setDisplayName(profile.name);
      if (profile?.email) setEmail(profile.email);
      if (profile?.role) setRoleLabel(profile.role === 'admin' ? 'Admin' : 'Auditor');
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const initials = React.useMemo(() => initialsFor(displayName || 'Admin'), [displayName]);

  return (
    <ScreenContainer>
      <TopBar title="Profile" userName={displayName || 'Admin'} onPressBack={() => router.replace('/admin/settings' as any)} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Text style={[t.text.title, { fontSize: 26, lineHeight: 32, marginBottom: t.spacing.md }]}>Account</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.xl }}>
          <View style={{ width: 132, alignItems: 'center' }}>
            <View
              style={{
                width: 116,
                height: 116,
                borderRadius: 999,
                backgroundColor: 'rgba(31,59,44,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(31,59,44,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: t.colors.brand.forest, fontWeight: '800', fontSize: 34 }}>{initials}</Text>
              <Pressable
                onPress={() => setMessage('Profile photo upload is enabled in production environment.')}
                style={({ pressed }) => [
                  {
                    position: 'absolute',
                    right: 2,
                    bottom: 2,
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? '#2A4B39' : t.colors.brand.forest,
                  },
                ]}>
                <FontAwesome name="pencil" size={12} color="#F8F7F3" />
              </Pressable>
            </View>
          </View>

          <View style={{ flex: 1, gap: t.spacing.md }}>
            <FormField label="Name" value={displayName} onChangeText={setDisplayName} />
            <FormField label="Email" value={email} onChangeText={setEmail} />
            <View style={{ alignItems: 'flex-end' }}>
              <Pressable onPress={() => router.push('/admin/update-password' as any)} hitSlop={8}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Change password</Text>
              </Pressable>
            </View>
            <Text style={[t.text.caption, { color: t.colors.text.muted }]}>{roleLabel} (Admin managed)</Text>
          </View>
        </View>

        {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => logout()}
            style={({ pressed }) => [
              {
                minHeight: 44,
                minWidth: 120,
                paddingHorizontal: t.spacing.lg,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(198, 90, 82, 0.14)',
                borderWidth: 1,
                borderColor: 'rgba(198, 90, 82, 0.30)',
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <Text style={{ color: '#B14F47', fontWeight: '700', fontSize: 15 }}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

