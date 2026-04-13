import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SearchInput } from '@/src/components';
import { adminUsers } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminUsersPage() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');

  const rows = adminUsers.filter((user) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(q);
  });

  return (
    <AdminScreenScaffold title="Users">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Users</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Manage admin and auditor platform users.
          </Text>
        </View>
        <Pressable onPress={() => {}} style={t.button.secondary}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add user</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search by name, email, role or status..." />
      <View style={{ height: t.spacing.lg }} />
      <View style={{ gap: t.spacing.md }}>
        {rows.map((user) => (
          <View
            key={user.id}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
              gap: 6,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[t.text.body, { fontWeight: '700' }]}>{user.name}</Text>
              <Text style={[t.text.caption, { color: user.status === 'Active' ? '#2F6B4B' : '#B63E34' }]}>
                {user.status}
              </Text>
            </View>
            <Text style={t.text.caption}>
              {user.email} · {user.role}
            </Text>
            <Text style={t.text.caption}>Last active: {new Date(user.lastActive).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Pressable><Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Edit role</Text></Pressable>
              <Pressable><Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Reset password</Text></Pressable>
              <Pressable><Text style={[t.text.caption, { color: '#B63E34', fontWeight: '700' }]}>Deactivate</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

