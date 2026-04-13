import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FormField } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminProfilePage() {
  const t = useTheme();
  return (
    <AdminScreenScaffold title="Profile">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin Profile</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>Your account details and profile controls.</Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.lg }}>
        <FormField label="Name" value="Admin" onChangeText={() => {}} />
        <FormField label="Role" value="Admin" onChangeText={() => {}} editable={false} />
        <FormField label="Email" value="admin@currumbin.com.au" onChangeText={() => {}} />
        <Pressable onPress={() => router.push('/admin/update-password' as any)} style={t.button.secondary}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Update password</Text>
        </Pressable>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        <Pressable
          style={{
            minHeight: 44,
            borderRadius: t.radius.lg,
            backgroundColor: '#B63E34',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Sign out</Text>
        </Pressable>
      </View>
    </AdminScreenScaffold>
  );
}

