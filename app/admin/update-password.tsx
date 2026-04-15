import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, FormField } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminUpdatePasswordPage() {
  const t = useTheme();
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const mismatch = Boolean(confirm) && next !== confirm;

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
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button
            label="Save changes"
            onPress={
              !current || !next || !confirm || mismatch
                ? undefined
                : () => router.replace('/(admin)/profile' as any)
            }
            variant={!current || !next || !confirm || mismatch ? 'secondary' : 'primary'}
            style={{ flex: 1 }}
          />
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => router.replace('/(admin)/profile' as any)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </AdminScreenScaffold>
  );
}

