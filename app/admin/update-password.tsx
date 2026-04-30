import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, FormField } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { supabase } from '@/utils/supabase';

export default function AdminUpdatePasswordPage() {
  const t = useTheme();
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const mismatch = Boolean(confirm) && next !== confirm;

  const onSave = async () => {
    setError(null);
    setMessage(null);
    if (!current.trim() || !next.trim() || !confirm.trim()) {
      setError('Please complete all fields.');
      return;
    }
    if (mismatch) {
      setError('New passwords do not match.');
      return;
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    const userResult = await supabase.auth.getUser();
    const email = userResult.data.user?.email;
    if (!email) {
      setError('Could not verify current user session.');
      return;
    }

    setSaving(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (verifyError) {
      setSaving(false);
      setError('Current password is incorrect.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setMessage('Password updated successfully.');
  };

  return (
    <AdminScreenScaffold title="Update Password">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Update Password</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>Use your current password then confirm the new one.</Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.lg }}>
        <FormField label="Current password" value={current} onChangeText={setCurrent} />
        <FormField label="New password" value={next} onChangeText={setNext} hasError={mismatch} />
        <FormField label="Confirm password" value={confirm} onChangeText={setConfirm} hasError={mismatch} />
        {mismatch ? <Text style={[t.text.caption, { color: '#B63E34' }]}>New passwords do not match.</Text> : null}
        {error ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{error}</Text> : null}
        {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button
            label={saving ? 'Saving...' : 'Save changes'}
            onPress={!current || !next || !confirm || mismatch || saving ? undefined : onSave}
            variant={!current || !next || !confirm || mismatch || saving ? 'secondary' : 'primary'}
            style={{ flex: 1 }}
          />
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => router.replace('/admin/profile' as any)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </AdminScreenScaffold>
  );
}

