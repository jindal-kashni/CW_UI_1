import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SearchInput } from '@/src/components';
import { adminUsers as seedUsers, type AdminUserRecord } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { createAdminUserAccount, fetchAdminUsers } from '@/src/services/users';

export default function AdminUsersPage() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<AdminUserRecord[]>(seedUsers);
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<'Admin' | 'Auditor'>('Auditor');
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const data = await fetchAdminUsers();
      setUsers(data);
    })();
  }, []);

  const rows = users.filter((user) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(q);
  });

  const onCreateUser = async () => {
    const email = newUserEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setMessage('Please enter a valid email.');
      return;
    }
    setCreating(true);
    const result = await createAdminUserAccount({
      email,
      role: newUserRole,
      password: 'Currumbin2026!',
    });
    setCreating(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    const data = await fetchAdminUsers();
    if (data.length > 0) setUsers(data);
    setShowAddUserModal(false);
    setNewUserEmail('');
    setNewUserRole('Auditor');
    setMessage('accepted');
  };

  return (
    <AdminScreenScaffold title="Users">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Users</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Manage admin and auditor platform users.
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setMessage(null);
            setShowAddUserModal(true);
          }}
          style={t.button.secondary}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add user</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search by name, email, role or status..." />
      <View style={{ height: t.spacing.lg }} />
      {message ? <Text style={[t.text.caption, { color: '#2F5B45', marginBottom: t.spacing.sm }]}>{message}</Text> : null}
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
      <Modal
        visible={showAddUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddUserModal(false);
        }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable
            onPress={() => setShowAddUserModal(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            style={{
              width: '100%',
              maxWidth: 560,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}>
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Add user</Text>
            <Text style={t.text.caption}>Fill in the user details below.</Text>

            <View style={{ gap: 6 }}>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>Email</Text>
              <TextInput
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                placeholder="name@currumbin.com.au"
                placeholderTextColor={t.colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  minHeight: 46,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.md,
                  backgroundColor: t.colors.card.surfaceAlt,
                  color: t.colors.text.primary,
                  paddingHorizontal: t.spacing.md,
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>Role</Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                {(['Admin', 'Auditor'] as const).map((role) => {
                  const selected = newUserRole === role;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setNewUserRole(role)}
                      style={{
                        flex: 1,
                        minHeight: 40,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                        backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{role}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(47,107,75,0.28)',
                backgroundColor: 'rgba(47,107,75,0.10)',
                borderRadius: 10,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
              }}>
              <Text style={[t.text.caption, { color: '#2F5B45' }]}>
                Temporary password: <Text style={{ fontWeight: '800' }}>Currumbin2026!</Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable
                onPress={() => setShowAddUserModal(false)}
                style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={creating ? undefined : onCreateUser}
                style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{creating ? 'Creating...' : 'Create user'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}

