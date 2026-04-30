import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { AdminUserRecord } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import {
  createAdminUserAccount,
  deleteAdminUserAccount,
  fetchAdminUsers,
  updateAdminUserRole,
} from '@/src/services/users';
import { fetchLocations, type LocationRecord } from '@/src/services/referenceData';
import { resolveDepartmentNames } from '@/src/services/lookups';
import { useWorkspace } from '@/src/state/WorkspaceProvider';

export default function AdminUsersPage() {
  const t = useTheme();
  const { user: signedInUser } = useWorkspace();
  const [activeSection, setActiveSection] = React.useState<'users' | 'locations'>('users');
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageTone, setMessageTone] = React.useState<'success' | 'error'>('success');
  const [users, setUsers] = React.useState<AdminUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [loadingLocations, setLoadingLocations] = React.useState(true);
  const [departmentNamesById, setDepartmentNamesById] = React.useState<Record<string, string>>({});
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<'Admin' | 'Auditor'>('Auditor');
  const [creating, setCreating] = React.useState(false);
  const [userPendingDelete, setUserPendingDelete] = React.useState<AdminUserRecord | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [userPendingRoleEdit, setUserPendingRoleEdit] = React.useState<AdminUserRecord | null>(null);
  const [roleDraft, setRoleDraft] = React.useState<'Admin' | 'Auditor'>('Auditor');
  const [updatingRole, setUpdatingRole] = React.useState(false);
  const messageTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTimedMessage = React.useCallback((text: string, tone: 'success' | 'error') => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setMessageTone(tone);
    setMessage(text);
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, 3000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      const data = await fetchAdminUsers();
      setUsers(data);
      setLoadingUsers(false);
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      const rows = await fetchLocations();
      setLocations(rows);
      const deptIds = Array.from(new Set(rows.map((row) => row.departmentId).filter(Boolean)));
      if (deptIds.length > 0) {
        const names = await resolveDepartmentNames(deptIds);
        setDepartmentNamesById(names);
      }
      setLoadingLocations(false);
    })();
  }, []);

  const onCreateUser = async () => {
    const email = newUserEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      showTimedMessage('Please enter a valid email.', 'error');
      return;
    }
    setShowAddUserModal(false);
    setNewUserEmail('');
    setNewUserRole('Auditor');
    setCreating(true);
    const result = await createAdminUserAccount({
      email,
      role: newUserRole,
      password: 'Currumbin2026!',
    });
    setCreating(false);
    if (!result.ok) {
      showTimedMessage(result.error, 'error');
      return;
    }
    const data = await fetchAdminUsers();
    if (data.length > 0) setUsers(data);
    showTimedMessage(`${email} added successfully`, 'success');
  };

  const onDeleteUser = async () => {
    if (!userPendingDelete) return;
    const email = userPendingDelete.email;
    setUserPendingDelete(null);
    setDeleting(true);
    const result = await deleteAdminUserAccount({ userId: userPendingDelete.id });
    setDeleting(false);
    if (!result.ok) {
      showTimedMessage(result.error, 'error');
      return;
    }
    setUsers((prev) => prev.filter((user) => user.id !== userPendingDelete.id));
    showTimedMessage(`${email} deleted successfully`, 'success');
  };

  const onOpenRoleEdit = (user: AdminUserRecord) => {
    setUserPendingRoleEdit(user);
    setRoleDraft(user.role);
  };

  const onSaveRole = async () => {
    if (!userPendingRoleEdit) return;
    const email = userPendingRoleEdit.email;
    setUserPendingRoleEdit(null);
    setUpdatingRole(true);
    const result = await updateAdminUserRole({ userId: userPendingRoleEdit.id, role: roleDraft });
    setUpdatingRole(false);
    if (!result.ok) {
      showTimedMessage(result.error, 'error');
      return;
    }
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userPendingRoleEdit.id ? { ...user, role: roleDraft, lastActive: new Date().toISOString() } : user
      )
    );
    showTimedMessage(`${email} role updated to ${roleDraft}`, 'success');
  };

  return (
    <AdminScreenScaffold title="Users">
      <View>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Manage core admin datasets for users and locations.
        </Text>
      </View>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.sm }}>
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Admin management</Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {[
            { key: 'users', label: 'Users' as const },
            { key: 'locations', label: 'Locations' as const },
          ].map((item) => {
            const selected = activeSection === item.key;
            return (
            <Pressable
              key={item.key}
              onPress={() => setActiveSection(item.key)}
              style={({ pressed }) => [
                {
                  minHeight: 36,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                  backgroundColor: selected ? '#2F6B4B' : pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
                  justifyContent: 'center',
                },
              ]}>
              <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{item.label}</Text>
            </Pressable>
          );
          })}
        </View>
      </View>
      <View style={{ height: t.spacing.md }} />
      {message ? (
        <View
          style={{
            marginBottom: t.spacing.sm,
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: messageTone === 'success' ? 'rgba(47,107,75,0.35)' : 'rgba(182,62,52,0.35)',
            backgroundColor: messageTone === 'success' ? 'rgba(47,107,75,0.10)' : 'rgba(182,62,52,0.10)',
          }}>
          <Text style={[t.text.caption, { color: messageTone === 'success' ? '#2F5B45' : '#B63E34' }]}>{message}</Text>
        </View>
      ) : null}
      <View style={{ gap: t.spacing.md }}>
        {activeSection === 'users' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>All users</Text>
            <Pressable
              onPress={() => {
                setMessage(null);
                setShowAddUserModal(true);
              }}
              style={t.button.secondary}>
              <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add user</Text>
            </Pressable>
          </View>
        )}
        {activeSection === 'users' && loadingUsers ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading users...</Text>
          </View>
        ) : null}
        {activeSection === 'users' && !loadingUsers && users.length === 0 ? (
          <Text style={t.text.caption}>No users found yet.</Text>
        ) : activeSection === 'users' && !loadingUsers ? (
          users.map((user) => {
            const isSelf = signedInUser?.id === user.id;
            return (
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[t.text.body, { fontWeight: '700' }]}>{user.name}</Text>
                    {isSelf ? (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: 'rgba(47,107,75,0.35)',
                          backgroundColor: 'rgba(47,107,75,0.10)',
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}>
                        <Text style={[t.text.caption, { color: '#2F5B45', fontWeight: '700' }]}>You</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[t.text.caption, { color: user.status === 'Active' ? '#2F6B4B' : '#B63E34' }]}>
                    {user.status}
                  </Text>
                </View>
                <Text style={t.text.caption}>
                  {user.email} · {user.role}
                </Text>
                <Text style={t.text.caption}>Last active: {formatDateDDMMYYYY(user.lastActive)}</Text>
                {!isSelf ? (
                  <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                    <Pressable onPress={() => onOpenRoleEdit(user)}>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                        Edit role
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => showTimedMessage(`Password reset sent for ${user.email}`, 'success')}>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                        Reset password
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setUserPendingDelete(user)}>
                      <Text style={[t.text.caption, { color: '#B63E34', fontWeight: '700' }]}>Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : null}
        {activeSection === 'locations' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>All locations</Text>
            <Pressable onPress={() => router.push('/admin/locations' as any)} style={t.button.secondary}>
              <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Manage locations</Text>
            </Pressable>
          </View>
        )}
        {activeSection === 'locations' && loadingLocations ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading locations...</Text>
          </View>
        ) : null}
        {activeSection === 'locations' && !loadingLocations && locations.length === 0 ? (
          <Text style={t.text.caption}>No locations found yet.</Text>
        ) : activeSection === 'locations' && !loadingLocations ? (
          locations.map((location) => (
            <View
              key={location.id}
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.card.surface,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.md,
                gap: 6,
              }}>
              <Text style={[t.text.body, { fontWeight: '700' }]}>{location.name}</Text>
              <Text style={t.text.caption}>
                {location.type || 'Location'} · {location.siteZone || 'No zone'} ·{' '}
                {departmentNamesById[location.departmentId] ?? 'Unknown department'}
              </Text>
            </View>
          ))
        ) : null}
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
      <Modal
        visible={Boolean(userPendingRoleEdit)}
        transparent
        animationType="fade"
        onRequestClose={() => setUserPendingRoleEdit(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable
            onPress={() => setUserPendingRoleEdit(null)}
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
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Edit role</Text>
            <Text style={t.text.caption}>
              Update role for <Text style={{ fontWeight: '800' }}>{userPendingRoleEdit?.email}</Text>.
            </Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              {(['Admin', 'Auditor'] as const).map((role) => {
                const selected = roleDraft === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => setRoleDraft(role)}
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
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setUserPendingRoleEdit(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={updatingRole ? undefined : onSaveRole}
                style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{updatingRole ? 'Saving...' : 'Save role'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(userPendingDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setUserPendingDelete(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable
            onPress={() => setUserPendingDelete(null)}
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
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete user?</Text>
            <Text style={t.text.caption}>
              This will permanently remove{' '}
              <Text style={{ fontWeight: '800' }}>{userPendingDelete?.email}</Text> from Auth and user profile data.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setUserPendingDelete(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={deleting ? undefined : onDeleteUser}
                style={[t.button.secondary, { backgroundColor: '#9C3D37', borderColor: '#9C3D37' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{deleting ? 'Deleting...' : 'Confirm delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}

