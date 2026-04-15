import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FormField } from '@/src/components';
import { ScreenContainer, TopBar } from '@/src/layout';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { useTheme } from '@/src/theme';

export default function AdminProfileTabScreen() {
  const t = useTheme();
  const { logout } = useWorkspace();
  const [displayName, setDisplayName] = React.useState('Admin');
  const [email, setEmail] = React.useState('admin@currumbinsanctuary.internal');
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
      <TopBar title="Profile" userName="Admin" onPressBack={() => router.replace('/(admin)/more' as any)} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
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
              <Text style={{ color: t.colors.brand.forest, fontWeight: '800', fontSize: 34 }}>A</Text>
              <Pressable
                onPress={() => {}}
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
            <FormField label="Email" value={email} onChangeText={setEmail} />
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
                <Pressable onPress={() => router.push('/admin/update-password' as any)} hitSlop={8}>
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
                <Text style={{ color: t.colors.text.muted, fontSize: 16 }}>Admin (Admin managed)</Text>
              </View>
            </View>
          </View>
        </View>

        <SectionDivider />

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

