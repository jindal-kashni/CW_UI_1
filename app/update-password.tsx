import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FormField, SectionCard } from '@/src/components';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

function UpdatePasswordContent() {
  const t = useTheme();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  return (
    <ScreenContainer>
      <TopBar title="Update Password" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <SectionCard title="Password" subtitle="Prototype-only form. No real password update is performed.">
          <View style={{ gap: t.spacing.lg }}>
            <FormField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
            <FormField label="New password" value={newPassword} onChangeText={setNewPassword} />
            <FormField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
            <Button label="Save password" onPress={() => router.back()} />
          </View>
        </SectionCard>
        <Text style={[t.text.caption, { textAlign: 'center' }]}>
          Admins can enforce password complexity and rotation policies in production.
        </Text>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

export default function UpdatePasswordScreen() {
  return (
    <RequireWorkspace role="auditor">
      <UpdatePasswordContent />
    </RequireWorkspace>
  );
}

