import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FormField, SectionCard } from '@/src/components';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { supabase } from '@/utils/supabase';

function UpdatePasswordContent() {
  const t = useTheme();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const mismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;

  const onSavePassword = async () => {
    setError(null);
    setMessage(null);
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please complete all fields.');
      return;
    }
    if (mismatch) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email ?? '',
      password: currentPassword,
    });
    if (verifyError) {
      setSaving(false);
      setError('Current password is incorrect.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
        <SectionCard title="Password" subtitle="Update your account password securely.">
          <View style={{ gap: t.spacing.lg }}>
            <FormField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
            <FormField label="New password" value={newPassword} onChangeText={setNewPassword} />
            <FormField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
            {error ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{error}</Text> : null}
            {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}
            <Button label={saving ? 'Saving...' : 'Save password'} onPress={onSavePassword} />
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

