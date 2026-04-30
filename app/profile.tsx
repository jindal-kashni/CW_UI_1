import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FormField } from '@/src/components';
import { currentUser } from '@/src/data';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { useTheme } from '@/src/theme';
import { fetchUserProfile } from '@/src/services/auth';
import { supabase } from '@/utils/supabase';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(1, 'A');
}

function AuditorProfileContent() {
  const t = useTheme();
  const { logout, user } = useWorkspace();
  const [displayName, setDisplayName] = React.useState('');
  const [savedDisplayName, setSavedDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [roleLabel, setRoleLabel] = React.useState('Auditor');
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const dirty = displayName.trim() !== savedDisplayName.trim();

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoadingProfile(true);
      const profile = await fetchUserProfile(user ?? null);
      if (!active) return;
      const resolvedName = profile?.name ?? user?.user_metadata?.name ?? currentUser.name;
      const resolvedEmail = profile?.email ?? user?.email ?? '';
      setDisplayName(resolvedName);
      setSavedDisplayName(resolvedName);
      setEmail(resolvedEmail);
      if (profile?.role) setRoleLabel(profile.role === 'admin' ? 'Admin' : 'Auditor');
      setLoadingProfile(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const onSaveProfile = React.useCallback(async () => {
    if (!user?.id) {
      setMessage('Please sign in again.');
      return;
    }
    if (!dirty) {
      setMessage('No changes to save.');
      return;
    }
    setSavingProfile(true);
    setMessage(null);
    const nextName = displayName.trim();
    const { error } = await supabase
      .from('user_profile')
      .update({ name: nextName, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    setSavingProfile(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSavedDisplayName(nextName);
    setDisplayName(nextName);
    setMessage('Profile saved.');
  }, [dirty, displayName, user?.id]);

  const initials = React.useMemo(() => initialsFor(displayName || 'Auditor'), [displayName]);
  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 26, lineHeight: 32, marginBottom: t.spacing.md }]}>{title}</Text>
  );

  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View
        style={{
          height: 1,
          backgroundColor: 'rgba(30,31,28,0.16)',
        }}
      />
    </View>
  );

  return (
    <ScreenContainer>
      <TopBar title="Profile" userName={displayName || currentUser.name} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        {loadingProfile ? (
          <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading profile...</Text>
          </View>
        ) : (
          <>
        <SectionHeading title="Account" />
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
              <Text style={{ color: t.colors.brand.forest, fontWeight: '800', fontSize: 34 }}>
                {initials}
              </Text>
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
            <Text style={[t.text.caption, { marginTop: t.spacing.sm }]}>Profile photo</Text>
          </View>

          <View style={{ flex: 1, gap: t.spacing.md }}>
            <FormField label="Name" value={displayName} onChangeText={setDisplayName} />
            <FormField label="Email" value={email} onChangeText={setEmail} editable={false} />
            <View style={{ gap: 6 }}>
              <Text style={[t.text.caption, { color: t.colors.text.muted }]}>Password</Text>
              <View
                style={{
                  minHeight: 50,
                  borderRadius: t.radius.lg,
                  backgroundColor: t.colors.card.surface,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  paddingHorizontal: t.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <Text style={{ color: t.colors.text.muted, fontSize: 16 }}>************</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Pressable onPress={() => router.push('/update-password' as any)} hitSlop={8}>
                  <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Change password</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[t.text.caption, { color: t.colors.text.muted }]}>Role</Text>
              <View
                style={{
                  borderRadius: t.radius.lg,
                  backgroundColor: 'rgba(30,31,28,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(30,31,28,0.10)',
                  paddingHorizontal: t.spacing.md,
                  minHeight: 50,
                  justifyContent: 'center',
                }}>
                <Text style={{ color: t.colors.text.muted, fontSize: 16 }}>
                  {roleLabel} (Admin managed)
                </Text>
              </View>
            </View>
          </View>
        </View>

        <SectionDivider />
        {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.md }}>
          <Pressable
            onPress={onSaveProfile}
            disabled={savingProfile || !dirty}
            style={({ pressed }) => [
              {
                minHeight: 44,
                minWidth: 120,
                paddingHorizontal: t.spacing.lg,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dirty ? '#2F6B4B' : 'rgba(47,107,75,0.24)',
                borderWidth: 1,
                borderColor: dirty ? '#2F6B4B' : 'rgba(47,107,75,0.28)',
                opacity: pressed || savingProfile ? 0.92 : 1,
              },
            ]}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {savingProfile ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
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
          </>
        )}
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

export default function ProfileScreen() {
  return (
    <RequireWorkspace role="auditor">
      <AuditorProfileContent />
    </RequireWorkspace>
  );
}

