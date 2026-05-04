import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { AdminUserRecord } from '@/src/data/admin';
import { SearchInput } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import {
  createAdminUserAccount,
  deleteAdminUserAccount,
  fetchAdminUsers,
  updateAdminUserRole,
} from '@/src/services/users';
import {
  createLocation,
  createRoom,
  deleteLocation,
  deleteRoom,
  fetchLocations,
  fetchRooms,
  fetchDepartments,
  updateLocation,
  updateRoom,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';
import { resolveDepartmentNames, resolveLocationNames } from '@/src/services/lookups';
import { useWorkspace } from '@/src/state/WorkspaceProvider';

type AdminSection = 'users' | 'locations' | 'rooms';

type LocationDraft = {
  id: string;
  name: string;
  type: 'building' | 'open_habitat' | 'enclosed_habitat';
  siteZone: string;
  departmentId: string;
  starRating: string;
  evacuationPlanStatus: string;
  heritageListed: boolean;
  iconic: boolean;
  socialSignificance: string;
  culturalHeritage: string;
  communityAttachment: string;
  governmentCommitment: string;
  inspectionDate: string;
  inspectorName: string;
  assessorComments: string;
};

type RoomDraft = {
  id: string;
  name: string;
  locationId: string;
  roomNumber: string;
  floorLevel: string;
  notes: string;
};

type AdminFilterKey =
  | 'locationDepartment'
  | 'locationSiteZone'
  | 'locationType'
  | 'roomLocation';

type FilterOption = {
  label: string;
  value: string;
};

const emptyLocationDraft = (): LocationDraft => ({
  id: '',
  name: '',
  type: 'building',
  siteZone: '',
  departmentId: '',
  starRating: '3',
  evacuationPlanStatus: '',
  heritageListed: false,
  iconic: false,
  socialSignificance: '',
  culturalHeritage: '',
  communityAttachment: '',
  governmentCommitment: '',
  inspectionDate: '',
  inspectorName: '',
  assessorComments: '',
});

const emptyRoomDraft = (): RoomDraft => ({
  id: '',
  name: '',
  locationId: '',
  roomNumber: '',
  floorLevel: '',
  notes: '',
});

const SITE_ZONE_OPTIONS = ['East', 'West', 'Hospital/Research', 'Offsite'];

const EVACUATION_OPTIONS = [
  { label: 'Null', value: '' },
  { label: 'Not required', value: 'Not required' },
  { label: 'Required and available', value: 'Required and available' },
  { label: 'Required to be done', value: 'Required to be done' },
];

const STAR_RATING_OPTIONS = ['1', '2', '3', '4', '5'];

export default function AdminUsersPage() {
  const t = useTheme();
  const { user: signedInUser } = useWorkspace();

  const [activeSection, setActiveSection] = React.useState<AdminSection>('users');

  const [message, setMessage] = React.useState<string | null>(null);
  const [messageTone, setMessageTone] = React.useState<'success' | 'error'>('success');

  const [users, setUsers] = React.useState<AdminUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  const [departments, setDepartments] = React.useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [loadingLocations, setLoadingLocations] = React.useState(true);
  const [locationQuery, setLocationQuery] = React.useState('');
  const [locationDepartmentFilter, setLocationDepartmentFilter] = React.useState('');
  const [locationSiteZoneFilter, setLocationSiteZoneFilter] = React.useState('');
  const [locationTypeFilter, setLocationTypeFilter] = React.useState('');
  const [departmentNamesById, setDepartmentNamesById] = React.useState<Record<string, string>>({});
  const [locationDraft, setLocationDraft] = React.useState<LocationDraft>(emptyLocationDraft());
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [locationPendingDelete, setLocationPendingDelete] = React.useState<LocationRecord | null>(null);
  const [savingLocation, setSavingLocation] = React.useState(false);
  const [deletingLocation, setDeletingLocation] = React.useState(false);

  const [rooms, setRooms] = React.useState<RoomRecord[]>([]);
  const [loadingRooms, setLoadingRooms] = React.useState(true);
  const [roomQuery, setRoomQuery] = React.useState('');
  const [roomLocationFilter, setRoomLocationFilter] = React.useState('');
  const [locationNamesById, setLocationNamesById] = React.useState<Record<string, string>>({});
  const [roomDraft, setRoomDraft] = React.useState<RoomDraft>(emptyRoomDraft());
  const [showRoomModal, setShowRoomModal] = React.useState(false);
  const [roomPendingDelete, setRoomPendingDelete] = React.useState<RoomRecord | null>(null);
  const [savingRoom, setSavingRoom] = React.useState(false);
  const [deletingRoom, setDeletingRoom] = React.useState(false);

  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<'Admin' | 'Auditor'>('Auditor');
  const [creating, setCreating] = React.useState(false);
  const [userPendingDelete, setUserPendingDelete] = React.useState<AdminUserRecord | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [userPendingRoleEdit, setUserPendingRoleEdit] = React.useState<AdminUserRecord | null>(null);
  const [roleDraft, setRoleDraft] = React.useState<'Admin' | 'Auditor'>('Auditor');
  const [updatingRole, setUpdatingRole] = React.useState(false);
  const [expandedLocationId, setExpandedLocationId] = React.useState<string | null>(null);

  const [filterPickerOpen, setFilterPickerOpen] = React.useState<AdminFilterKey | null>(null);
  const [filterPickerDraftValue, setFilterPickerDraftValue] = React.useState('');

  const messageTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTimedMessage = React.useCallback((text: string, tone: 'success' | 'error') => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
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

  const refreshUsers = React.useCallback(async () => {
    const data = await fetchAdminUsers();
    setUsers(data);
    setLoadingUsers(false);
  }, []);

  const refreshLocations = React.useCallback(async () => {
    const rows = await fetchLocations();
    setLocations(rows);
    const deptIds = Array.from(new Set(rows.map((row) => row.departmentId).filter(Boolean)));
    if (deptIds.length > 0) {
      const names = await resolveDepartmentNames(deptIds);
      setDepartmentNamesById(names);
    } else {
      setDepartmentNamesById({});
    }
    setLoadingLocations(false);
  }, []);

  const refreshRooms = React.useCallback(async () => {
    const rows = await fetchRooms();
    setRooms(rows);
    const locationIds = Array.from(new Set(rows.map((row) => row.locationId).filter(Boolean)));
    if (locationIds.length > 0) {
      const names = await resolveLocationNames(locationIds);
      setLocationNamesById(names);
    } else {
      setLocationNamesById({});
    }
    setLoadingRooms(false);
  }, []);

  React.useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        refreshUsers(),
        refreshLocations(),
        refreshRooms(),
      ]);

      const deptRows = await fetchDepartments();
      setDepartments(deptRows);
    };

    loadAll();
  }, [refreshUsers, refreshLocations, refreshRooms]);

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

    await refreshUsers();
    showTimedMessage(`${email} added successfully`, 'success');
  };

  const onDeleteUser = async () => {
    if (!userPendingDelete) return;

    const email = userPendingDelete.email;
    const userId = userPendingDelete.id;

    setUserPendingDelete(null);
    setDeleting(true);

    const result = await deleteAdminUserAccount({ userId });

    setDeleting(false);

    if (!result.ok) {
      showTimedMessage(result.error, 'error');
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId));
    showTimedMessage(`${email} deleted successfully`, 'success');
  };

  const onOpenRoleEdit = (user: AdminUserRecord) => {
    setUserPendingRoleEdit(user);
    setRoleDraft(user.role);
  };

  const onSaveRole = async () => {
    if (!userPendingRoleEdit) return;

    const email = userPendingRoleEdit.email;
    const userId = userPendingRoleEdit.id;

    setUserPendingRoleEdit(null);
    setUpdatingRole(true);

    const result = await updateAdminUserRole({ userId, role: roleDraft });

    setUpdatingRole(false);

    if (!result.ok) {
      showTimedMessage(result.error, 'error');
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: roleDraft, lastActive: new Date().toISOString() } : user
      )
    );

    showTimedMessage(`${email} role updated to ${roleDraft}`, 'success');
  };

  const openCreateLocation = () => {
    setLocationDraft(emptyLocationDraft());
    setShowLocationModal(true);
  };

  const openEditLocation = (location: LocationRecord) => {
    setLocationDraft({
      id: location.id,
      name: location.name,
      type:
        location.type === 'open_habitat' || location.type === 'enclosed_habitat'
          ? location.type
          : 'building',
      siteZone: location.siteZone || '',
      departmentId: location.departmentId || '',
      starRating: String(location.starRating ?? 3),
      evacuationPlanStatus: location.evacuationPlanStatus || '',
      heritageListed: Boolean(location.heritageListed),
      iconic: Boolean(location.iconic),
      socialSignificance: location.socialSignificance || '',
      culturalHeritage: location.culturalHeritage || '',
      communityAttachment: location.communityAttachment || '',
      governmentCommitment: location.governmentCommitment || '',
      inspectionDate: location.inspectionDate || '',
      inspectorName: location.inspectorName || '',
      assessorComments: location.assessorComments || '',
    });
    setShowLocationModal(true);
  };

  const saveLocation = async () => {
    if (!locationDraft.name.trim()) {
      showTimedMessage('Location name is required.', 'error');
      return;
    }

    setSavingLocation(true);

    try {
      const payload = {
        name: locationDraft.name,
        type: locationDraft.type,
        siteZone: locationDraft.siteZone,
        departmentId: locationDraft.departmentId || undefined,
        starRating: Number(locationDraft.starRating) || 3,
        evacuationPlanStatus: locationDraft.evacuationPlanStatus || undefined,
        heritageListed: locationDraft.heritageListed,
        iconic: locationDraft.iconic,
        socialSignificance: locationDraft.socialSignificance || undefined,
        culturalHeritage: locationDraft.culturalHeritage || undefined,
        communityAttachment: locationDraft.communityAttachment || undefined,
        governmentCommitment: locationDraft.governmentCommitment || undefined,
        inspectionDate: locationDraft.inspectionDate || undefined,
        inspectorName: locationDraft.inspectorName || undefined,
        assessorComments: locationDraft.assessorComments || undefined,
      };

      if (locationDraft.id) {
        await updateLocation(locationDraft.id, payload);
        showTimedMessage('Location updated successfully.', 'success');
      } else {
        await createLocation(payload);
        showTimedMessage('Location created successfully.', 'success');
      }

      setShowLocationModal(false);
      await refreshLocations();
      await refreshRooms();
    } catch (error: any) {
      showTimedMessage(error?.message ?? 'Could not save location.', 'error');
    } finally {
      setSavingLocation(false);
    }
  };

  const onDeleteLocation = async () => {
    if (!locationPendingDelete) return;

    setDeletingLocation(true);

    try {
      await deleteLocation(locationPendingDelete.id);
      setLocationPendingDelete(null);
      showTimedMessage('Location deleted successfully.', 'success');
      await refreshLocations();
      await refreshRooms();
    } catch (error: any) {
      showTimedMessage(error?.message ?? 'Could not delete location.', 'error');
    } finally {
      setDeletingLocation(false);
    }
  };

  const openCreateRoom = () => {
    setRoomDraft({
      ...emptyRoomDraft(),
      locationId: locations[0]?.id ?? '',
    });
    setShowRoomModal(true);
  };

  const openEditRoom = (room: RoomRecord) => {
    setRoomDraft({
      id: room.id,
      name: room.name,
      locationId: room.locationId,
      roomNumber: room.roomNumber,
      floorLevel: room.floorLevel,
      notes: room.notes,
    });
    setShowRoomModal(true);
  };

  const saveRoom = async () => {
    if (!roomDraft.name.trim()) {
      showTimedMessage('Room name is required.', 'error');
      return;
    }

    if (!roomDraft.locationId) {
      showTimedMessage('Please select a location for this room.', 'error');
      return;
    }

    setSavingRoom(true);

    try {
      const payload = {
        name: roomDraft.name,
        locationId: roomDraft.locationId,
        roomNumber: roomDraft.roomNumber || undefined,
        floorLevel: roomDraft.floorLevel || undefined,
        notes: roomDraft.notes || undefined,
      };

      if (roomDraft.id) {
        await updateRoom(roomDraft.id, payload);
        showTimedMessage('Room updated successfully.', 'success');
      } else {
        await createRoom(payload);
        showTimedMessage('Room created successfully.', 'success');
      }

      setShowRoomModal(false);
      await refreshRooms();
    } catch (error: any) {
      showTimedMessage(error?.message ?? 'Could not save room.', 'error');
    } finally {
      setSavingRoom(false);
    }
  };

  const onDeleteRoom = async () => {
    if (!roomPendingDelete) return;

    setDeletingRoom(true);

    try {
      await deleteRoom(roomPendingDelete.id);
      setRoomPendingDelete(null);
      showTimedMessage('Room deleted successfully.', 'success');
      await refreshRooms();
    } catch (error: any) {
      showTimedMessage(error?.message ?? 'Could not delete room.', 'error');
    } finally {
      setDeletingRoom(false);
    }
  };

  const makeOptions = (values: string[]): FilterOption[] =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));

  const filterLabels: Record<AdminFilterKey, string> = {
    locationDepartment: 'Department',
    locationSiteZone: 'Site zone',
    locationType: 'Location type',
    roomLocation: 'Location',
  };

  const filterValues: Record<AdminFilterKey, string> = {
    locationDepartment: locationDepartmentFilter,
    locationSiteZone: locationSiteZoneFilter,
    locationType: locationTypeFilter,
    roomLocation: roomLocationFilter,
  };

  const filterOptions: Record<AdminFilterKey, FilterOption[]> = {
    locationDepartment: makeOptions(departments.map((dept) => dept.name)),
    locationSiteZone: makeOptions(locations.map((location) => location.siteZone)),
    locationType: makeOptions(locations.map((location) => location.type)),
    roomLocation: makeOptions(locations.map((location) => location.name)),
  };

  const setFilterValue = (key: AdminFilterKey, value: string) => {
    if (key === 'locationDepartment') setLocationDepartmentFilter(value);
    if (key === 'locationSiteZone') setLocationSiteZoneFilter(value);
    if (key === 'locationType') setLocationTypeFilter(value);
    if (key === 'roomLocation') setRoomLocationFilter(value);
  };

  const openFilterPicker = (key: AdminFilterKey) => {
    setFilterPickerOpen(key);
    setFilterPickerDraftValue(filterValues[key]);
  };

  const clearAdminFilters = () => {
    setLocationQuery('');
    setRoomQuery('');
    setLocationDepartmentFilter('');
    setLocationSiteZoneFilter('');
    setLocationTypeFilter('');
    setRoomLocationFilter('');
  };

  const hasAdminFilters =
    Boolean(locationQuery) ||
    Boolean(roomQuery) ||
    Boolean(locationDepartmentFilter) ||
    Boolean(locationSiteZoneFilter) ||
    Boolean(locationTypeFilter) ||
    Boolean(roomLocationFilter);

  const filteredLocations = locations
    .filter((location) => {
      const department = departmentNamesById[location.departmentId] ?? '';

      if (locationDepartmentFilter && department !== locationDepartmentFilter) return false;
      if (locationSiteZoneFilter && location.siteZone !== locationSiteZoneFilter) return false;
      if (locationTypeFilter && location.type !== locationTypeFilter) return false;

      if (!locationQuery.trim()) return true;

      const q = locationQuery.toLowerCase();

      return `${location.name} ${location.siteZone} ${location.type} ${department}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredRooms = rooms
    .filter((room) => {
      const locationName = locationNamesById[room.locationId] ?? '';

      if (roomLocationFilter && locationName !== roomLocationFilter) return false;

      if (!roomQuery.trim()) return true;

      const q = roomQuery.toLowerCase();

      return `${room.name} ${room.roomNumber} ${room.floorLevel} ${locationName} ${room.notes}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const inputStyle = {
    minHeight: 46,
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.card.surfaceAlt,
    color: t.colors.text.primary,
    paddingHorizontal: t.spacing.md,
    fontSize: 15,
  };

  const AdminDropdownField = ({ fieldKey }: { fieldKey: AdminFilterKey }) => (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{filterLabels[fieldKey]}</Text>

      <Pressable
        onPress={() => openFilterPicker(fieldKey)}
        style={({ pressed }) => [
          {
            minHeight: 52,
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.card.surface,
            paddingHorizontal: t.spacing.md,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            opacity: pressed ? 0.96 : 1,
          },
        ]}
      >
        <Text style={[t.text.body, { color: filterValues[fieldKey] ? t.colors.text.primary : t.colors.text.muted }]}>
          {filterValues[fieldKey] || 'Select an option'}
        </Text>
        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );

  return (
    <AdminScreenScaffold title="Users">
      <View>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Manage core admin datasets for users, locations and rooms.
        </Text>
      </View>

      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Admin management</Text>

        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {[
            { key: 'users', label: 'Users' },
            { key: 'locations', label: 'Locations' },
            { key: 'rooms', label: 'Rooms' },
          ].map((item) => {
            const selected = activeSection === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setActiveSection(item.key as AdminSection);
                  setMessage(null);
                }}
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
                ]}
              >
                <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>
                  {item.label}
                </Text>
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
          }}
        >
          <Text style={[t.text.caption, { color: messageTone === 'success' ? '#2F5B45' : '#B63E34' }]}>
            {message}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: t.spacing.md }}>
        {activeSection === 'users' ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>All users</Text>
              <Pressable
                onPress={() => {
                  setMessage(null);
                  setShowAddUserModal(true);
                }}
                style={t.button.secondary}
              >
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add user</Text>
              </Pressable>
            </View>

            {loadingUsers ? (
              <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={t.colors.brand.forest} />
                <Text style={t.text.caption}>Loading users...</Text>
              </View>
            ) : null}

            {!loadingUsers && users.length === 0 ? (
              <Text style={t.text.caption}>No users found yet.</Text>
            ) : !loadingUsers ? (
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
                    }}
                  >
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
                            }}
                          >
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
          </>
        ) : null}

        {activeSection === 'locations' ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>All locations</Text>
              <Pressable onPress={openCreateLocation} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add location</Text>
              </Pressable>
            </View>

            <SearchInput
              value={locationQuery}
              onChangeText={setLocationQuery}
              placeholder="Search by location name, type, zone or department..."
            />

            <View style={{ gap: t.spacing.md }}>
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <AdminDropdownField fieldKey="locationDepartment" />
                <AdminDropdownField fieldKey="locationSiteZone" />
              </View>

              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <AdminDropdownField fieldKey="locationType" />
                <View style={{ flex: 1 }} />
              </View>
            </View>

            {hasAdminFilters ? (
            <View style={{ alignItems: 'flex-start' }}>
              <Pressable
                onPress={clearAdminFilters}
                style={({ pressed }) => [
                  {
                    minHeight: 40,
                    borderWidth: 1,
                    borderColor: 'rgba(0,74,38,0.42)',
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    backgroundColor: pressed ? 'rgba(0,74,38,0.20)' : 'rgba(0,74,38,0.14)',
                  },
                ]}
              >
                <Text style={[t.text.caption, { fontWeight: '800', color: '#0F4A31', fontSize: 15 }]}>
                  Reset filters
                </Text>
              </Pressable>
            </View>
          ) : null}

            {loadingLocations ? (
              <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={t.colors.brand.forest} />
                <Text style={t.text.caption}>Loading locations...</Text>
              </View>
            ) : null}

            {!loadingLocations && filteredLocations.length === 0 ? (
              <Text style={t.text.caption}>No locations found yet.</Text>
            ) : !loadingLocations ? (
              filteredLocations.map((location) => {
                const expanded = expandedLocationId === location.id;

                return (
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
                    }}
                  >
                    <Text style={[t.text.body, { fontWeight: '700' }]}>{location.name}</Text>

                    <Text style={t.text.caption}>
                      {location.type || 'Location'} · {location.siteZone || 'No zone'} ·{' '}
                      {departmentNamesById[location.departmentId] ?? 'Unknown department'}
                    </Text>

                    {expanded ? (
                      <View
                        style={{
                          marginTop: t.spacing.sm,
                          borderTopWidth: 1,
                          borderTopColor: t.colors.border.subtle,
                          paddingTop: t.spacing.sm,
                          gap: 4,
                        }}
                      >
                        <Text style={t.text.caption}>Location ID: {location.id}</Text>
                        <Text style={t.text.caption}>Name: {location.name || '—'}</Text>
                        <Text style={t.text.caption}>Type: {location.type || '—'}</Text>
                        <Text style={t.text.caption}>Site zone: {location.siteZone || '—'}</Text>
                        <Text style={t.text.caption}>
                          Department: {departmentNamesById[location.departmentId] ?? '—'}
                        </Text>
                        <Text style={t.text.caption}>Department ID: {location.departmentId || '—'}</Text>
                        <Text style={t.text.caption}>Star rating: {location.starRating ?? '—'}</Text>
                        <Text style={t.text.caption}>
                          Evacuation plan: {location.evacuationPlanStatus || '—'}
                        </Text>
                        <Text style={t.text.caption}>
                          Heritage listed: {location.heritageListed ? 'Yes' : 'No'}
                        </Text>
                        <Text style={t.text.caption}>Iconic: {location.iconic ? 'Yes' : 'No'}</Text>
                        <Text style={t.text.caption}>
                          Social significance: {location.socialSignificance || '—'}
                        </Text>
                        <Text style={t.text.caption}>
                          Cultural heritage: {location.culturalHeritage || '—'}
                        </Text>
                        <Text style={t.text.caption}>
                          Community attachment: {location.communityAttachment || '—'}
                        </Text>
                        <Text style={t.text.caption}>
                          Government commitment: {location.governmentCommitment || '—'}
                        </Text>
                        <Text style={t.text.caption}>Inspection date: {location.inspectionDate || '—'}</Text>
                        <Text style={t.text.caption}>Inspector name: {location.inspectorName || '—'}</Text>
                        <Text style={t.text.caption}>
                          Assessor comments: {location.assessorComments || '—'}
                        </Text>
                      </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                      <Pressable
                        onPress={() =>
                          setExpandedLocationId((current) => (current === location.id ? null : location.id))
                        }
                      >
                        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                          {expanded ? 'Hide details' : 'View details'}
                        </Text>
                      </Pressable>

                      <Pressable onPress={() => openEditLocation(location)}>
                        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                          Edit
                        </Text>
                      </Pressable>

                      <Pressable onPress={() => setLocationPendingDelete(location)}>
                        <Text style={[t.text.caption, { color: '#B63E34', fontWeight: '700' }]}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            ) : null}
          </>
        ) : null}

        {activeSection === 'rooms' ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>All rooms</Text>
              <Pressable onPress={openCreateRoom} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add room</Text>
              </Pressable>
            </View>

            <SearchInput
              value={roomQuery}
              onChangeText={setRoomQuery}
              placeholder="Search by room name, number, floor, location or notes..."
            />

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <AdminDropdownField fieldKey="roomLocation" />
              <View style={{ flex: 1 }} />
            </View>

            {hasAdminFilters ? (
            <View style={{ alignItems: 'flex-start' }}>
              <Pressable
                onPress={clearAdminFilters}
                style={({ pressed }) => [
                  {
                    minHeight: 40,
                    borderWidth: 1,
                    borderColor: 'rgba(0,74,38,0.42)',
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    backgroundColor: pressed ? 'rgba(0,74,38,0.20)' : 'rgba(0,74,38,0.14)',
                  },
                ]}
              >
                <Text style={[t.text.caption, { fontWeight: '800', color: '#0F4A31', fontSize: 15 }]}>
                  Reset filters
                </Text>
              </Pressable>
            </View>
          ) : null}

            {loadingRooms ? (
              <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={t.colors.brand.forest} />
                <Text style={t.text.caption}>Loading rooms...</Text>
              </View>
            ) : null}

            {!loadingRooms && filteredRooms.length === 0 ? (
              <Text style={t.text.caption}>No rooms found yet.</Text>
            ) : !loadingRooms ? (
              filteredRooms.map((room) => (
                <View
                  key={room.id}
                  style={{
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                    borderRadius: t.radius.lg,
                    backgroundColor: t.colors.card.surface,
                    paddingHorizontal: t.spacing.md,
                    paddingVertical: t.spacing.md,
                    gap: 6,
                  }}
                >
                  <Text style={[t.text.body, { fontWeight: '700' }]}>{room.name || room.id}</Text>

                  <Text style={t.text.caption}>
                    {room.roomNumber || 'No room number'} · {room.floorLevel || 'No floor'} ·{' '}
                    {locationNamesById[room.locationId] ?? 'Unknown location'}
                  </Text>

                  <Text style={t.text.caption}>{room.notes || 'No notes'}</Text>

                  <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                    <Pressable onPress={() => openEditRoom(room)}>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => setRoomPendingDelete(room)}>
                      <Text style={[t.text.caption, { color: '#B63E34', fontWeight: '700' }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : null}
          </>
        ) : null}
      </View>

      <Modal visible={showAddUserModal} transparent animationType="fade" onRequestClose={() => setShowAddUserModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.spacing.xl }}>
          <Pressable onPress={() => setShowAddUserModal(false)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

          <View style={{ width: '100%', maxWidth: 560, borderWidth: 1, borderColor: t.colors.border.subtle, borderRadius: t.radius.lg, backgroundColor: t.colors.card.surface, padding: t.spacing.lg, gap: t.spacing.md }}>
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
                style={inputStyle}
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
                      }}
                    >
                      <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{role}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ borderWidth: 1, borderColor: 'rgba(47,107,75,0.28)', backgroundColor: 'rgba(47,107,75,0.10)', borderRadius: 10, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm }}>
              <Text style={[t.text.caption, { color: '#2F5B45' }]}>
                Temporary password: <Text style={{ fontWeight: '800' }}>Currumbin2026!</Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setShowAddUserModal(false)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable onPress={creating ? undefined : onCreateUser} style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{creating ? 'Creating...' : 'Create user'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(userPendingRoleEdit)} transparent animationType="fade" onRequestClose={() => setUserPendingRoleEdit(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.spacing.xl }}>
          <Pressable onPress={() => setUserPendingRoleEdit(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

          <View style={{ width: '100%', maxWidth: 560, borderWidth: 1, borderColor: t.colors.border.subtle, borderRadius: t.radius.lg, backgroundColor: t.colors.card.surface, padding: t.spacing.lg, gap: t.spacing.md }}>
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
                    }}
                  >
                    <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{role}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setUserPendingRoleEdit(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable onPress={updatingRole ? undefined : onSaveRole} style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{updatingRole ? 'Saving...' : 'Save role'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(userPendingDelete)} transparent animationType="fade" onRequestClose={() => setUserPendingDelete(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.spacing.xl }}>
          <Pressable onPress={() => setUserPendingDelete(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

          <View style={{ width: '100%', maxWidth: 560, borderWidth: 1, borderColor: t.colors.border.subtle, borderRadius: t.radius.lg, backgroundColor: t.colors.card.surface, padding: t.spacing.lg, gap: t.spacing.md }}>
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete user?</Text>
            <Text style={t.text.caption}>
              This will permanently remove <Text style={{ fontWeight: '800' }}>{userPendingDelete?.email}</Text> from Auth and user profile data.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setUserPendingDelete(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable onPress={deleting ? undefined : onDeleteUser} style={[t.button.secondary, { backgroundColor: '#9C3D37', borderColor: '#9C3D37' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{deleting ? 'Deleting...' : 'Confirm delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLocationModal} transparent animationType="fade" onRequestClose={() => setShowLocationModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
            paddingVertical: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setShowLocationModal(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '92%',
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                padding: t.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}
            >
              <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>
                {locationDraft.id ? 'Edit location' : 'Create location'}
              </Text>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: t.spacing.lg,
                gap: t.spacing.md,
              }}
              showsVerticalScrollIndicator
            >
              <TextInput
                value={locationDraft.name}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, name: value }))}
                placeholder="Location name"
                placeholderTextColor={t.colors.text.muted}
                style={inputStyle}
              />

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Location type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {[
                  { label: 'Building', value: 'building' },
                  { label: 'Open habitat', value: 'open_habitat' },
                  { label: 'Enclosed habitat', value: 'enclosed_habitat' },
                ].map((item) => {
                  const selected = locationDraft.type === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setLocationDraft((prev) => ({ ...prev, type: item.value as LocationDraft['type'] }))}
                      style={[
                        t.button.secondary,
                        {
                          backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                          borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Site zone</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {['East', 'West', 'Hospital/Research', 'Offsite'].map((zone) => {
                  const selected = locationDraft.siteZone === zone;

                  return (
                    <Pressable
                      key={zone}
                      onPress={() => setLocationDraft((prev) => ({ ...prev, siteZone: zone }))}
                      style={[
                        t.button.secondary,
                        {
                          backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                          borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{zone}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Department</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {/* None option */}
                <Pressable
                  onPress={() => setLocationDraft((prev) => ({ ...prev, departmentId: '' }))}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor:
                      locationDraft.departmentId === '' ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                    backgroundColor:
                      locationDraft.departmentId === '' ? '#2F6B4B' : t.colors.card.surface,
                  }}
                >
                  <Text
                    style={{
                      color: locationDraft.departmentId === '' ? '#fff' : '#2F5B45',
                      fontWeight: '700',
                    }}
                  >
                    None
                  </Text>
                </Pressable>

                {departments.map((dept) => {
                  const selected = locationDraft.departmentId === dept.id;

                  return (
                    <Pressable
                      key={dept.id}
                      onPress={() =>
                        setLocationDraft((prev) => ({ ...prev, departmentId: dept.id }))
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                        backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? '#fff' : '#2F5B45',
                          fontWeight: '700',
                        }}
                      >
                        {dept.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Star rating</Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                {['1', '2', '3', '4', '5'].map((rating) => {
                  const selected = locationDraft.starRating === rating;

                  return (
                    <Pressable
                      key={rating}
                      onPress={() => setLocationDraft((prev) => ({ ...prev, starRating: rating }))}
                      style={[
                        t.button.secondary,
                        {
                          flex: 1,
                          backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                          borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? '#fff' : '#2F5B45', textAlign: 'center', fontWeight: '700' }}>
                        {rating}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Evacuation plan</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {[
                  { label: 'Null', value: '' },
                  { label: 'Not Required', value: 'Not required' },
                  { label: 'Required and Available', value: 'Required and available' },
                  { label: 'Required to be done', value: 'Required to be done' },
                ].map((opt) => {
                  const selected = locationDraft.evacuationPlanStatus === opt.value;

                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => setLocationDraft((prev) => ({ ...prev, evacuationPlanStatus: opt.value }))}
                      style={[
                        t.button.secondary,
                        {
                          backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                          borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }}>
                <Pressable
                  onPress={() => setLocationDraft((prev) => ({ ...prev, heritageListed: !prev.heritageListed }))}
                  style={t.button.secondary}
                >
                  <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                    Heritage listed: {locationDraft.heritageListed ? 'Yes' : 'No'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setLocationDraft((prev) => ({ ...prev, iconic: !prev.iconic }))}
                  style={t.button.secondary}
                >
                  <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                    Iconic: {locationDraft.iconic ? 'Yes' : 'No'}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                value={locationDraft.socialSignificance}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, socialSignificance: value }))}
                placeholder="Social significance"
                placeholderTextColor={t.colors.text.muted}
                multiline
                style={[inputStyle, { minHeight: 72, paddingVertical: 10, textAlignVertical: 'top' }]}
              />

              <TextInput
                value={locationDraft.culturalHeritage}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, culturalHeritage: value }))}
                placeholder="Cultural heritage"
                placeholderTextColor={t.colors.text.muted}
                multiline
                style={[inputStyle, { minHeight: 72, paddingVertical: 10, textAlignVertical: 'top' }]}
              />

              <TextInput
                value={locationDraft.communityAttachment}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, communityAttachment: value }))}
                placeholder="Community attachment"
                placeholderTextColor={t.colors.text.muted}
                multiline
                style={[inputStyle, { minHeight: 72, paddingVertical: 10, textAlignVertical: 'top' }]}
              />

              <TextInput
                value={locationDraft.governmentCommitment}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, governmentCommitment: value }))}
                placeholder="Government commitment"
                placeholderTextColor={t.colors.text.muted}
                multiline
                style={[inputStyle, { minHeight: 72, paddingVertical: 10, textAlignVertical: 'top' }]}
              />

              <TextInput
                value={locationDraft.inspectionDate}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, inspectionDate: value }))}
                placeholder="Inspection date (YYYY-MM-DD)"
                placeholderTextColor={t.colors.text.muted}
                style={inputStyle}
              />

              <TextInput
                value={locationDraft.inspectorName}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, inspectorName: value }))}
                placeholder="Inspector name"
                placeholderTextColor={t.colors.text.muted}
                style={inputStyle}
              />

              <TextInput
                value={locationDraft.assessorComments}
                onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, assessorComments: value }))}
                placeholder="Assessor comments"
                placeholderTextColor={t.colors.text.muted}
                multiline
                style={[inputStyle, { minHeight: 88, paddingVertical: 10, textAlignVertical: 'top' }]}
              />
            </ScrollView>

            <View
              style={{
                padding: t.spacing.lg,
                borderTopWidth: 1,
                borderTopColor: t.colors.border.subtle,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: t.spacing.sm,
              }}
            >
              <Pressable onPress={() => setShowLocationModal(false)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={savingLocation ? undefined : saveLocation}
                style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {savingLocation ? 'Saving...' : 'Save location'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(locationPendingDelete)} transparent animationType="fade" onRequestClose={() => setLocationPendingDelete(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.spacing.xl }}>
          <Pressable onPress={() => setLocationPendingDelete(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

          <View style={{ width: '100%', maxWidth: 560, borderWidth: 1, borderColor: t.colors.border.subtle, borderRadius: t.radius.lg, backgroundColor: t.colors.card.surface, padding: t.spacing.lg, gap: t.spacing.md }}>
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete location?</Text>
            <Text style={t.text.caption}>
              This will permanently remove <Text style={{ fontWeight: '800' }}>{locationPendingDelete?.name}</Text>.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setLocationPendingDelete(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable onPress={deletingLocation ? undefined : onDeleteLocation} style={[t.button.secondary, { backgroundColor: '#9C3D37', borderColor: '#9C3D37' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{deletingLocation ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRoomModal} transparent animationType="fade" onRequestClose={() => setShowRoomModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
            paddingVertical: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setShowRoomModal(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '92%',
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                padding: t.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}
            >
              <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>
                {roomDraft.id ? 'Edit room' : 'Create room'}
              </Text>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: t.spacing.lg,
                gap: t.spacing.md,
              }}
              showsVerticalScrollIndicator
            >
              <TextInput
                value={roomDraft.name}
                onChangeText={(value) => setRoomDraft((prev) => ({ ...prev, name: value }))}
                placeholder="Room name"
                placeholderTextColor={t.colors.text.muted}
                style={inputStyle}
              />

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Location</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {locations.map((location) => {
                  const selected = roomDraft.locationId === location.id;

                  return (
                    <Pressable
                      key={location.id}
                      onPress={() => setRoomDraft((prev) => ({ ...prev, locationId: location.id }))}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.22)',
                        backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? '#fff' : '#2F5B45',
                          fontWeight: '700',
                        }}
                      >
                        {location.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={roomDraft.roomNumber}
                onChangeText={(value) => setRoomDraft((prev) => ({ ...prev, roomNumber: value }))}
                placeholder="Room number"
                placeholderTextColor={t.colors.text.muted}
                style={inputStyle}
              />

              <TextInput
                value={roomDraft.floorLevel}
                onChangeText={(value) => setRoomDraft((prev) => ({ ...prev, floorLevel: value }))}
                placeholder="Floor level"
                placeholderTextColor={t.colors.text.muted}
                keyboardType="numeric"
                style={inputStyle}
              />

              <TextInput
                value={roomDraft.notes}
                onChangeText={(value) => setRoomDraft((prev) => ({ ...prev, notes: value }))}
                placeholder="Notes"
                placeholderTextColor={t.colors.text.muted}
                multiline
                style={[inputStyle, { minHeight: 88, paddingVertical: 10, textAlignVertical: 'top' }]}
              />
            </ScrollView>

            <View
              style={{
                padding: t.spacing.lg,
                borderTopWidth: 1,
                borderTopColor: t.colors.border.subtle,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: t.spacing.sm,
              }}
            >
              <Pressable onPress={() => setShowRoomModal(false)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={savingRoom ? undefined : saveRoom}
                style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {savingRoom ? 'Saving...' : 'Save room'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(roomPendingDelete)} transparent animationType="fade" onRequestClose={() => setRoomPendingDelete(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.spacing.xl }}>
          <Pressable onPress={() => setRoomPendingDelete(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

          <View style={{ width: '100%', maxWidth: 560, borderWidth: 1, borderColor: t.colors.border.subtle, borderRadius: t.radius.lg, backgroundColor: t.colors.card.surface, padding: t.spacing.lg, gap: t.spacing.md }}>
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete room?</Text>
            <Text style={t.text.caption}>
              This will permanently remove <Text style={{ fontWeight: '800' }}>{roomPendingDelete?.name}</Text>.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setRoomPendingDelete(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Pressable onPress={deletingRoom ? undefined : onDeleteRoom} style={[t.button.secondary, { backgroundColor: '#9C3D37', borderColor: '#9C3D37' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{deletingRoom ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(filterPickerOpen)}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterPickerOpen(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setFilterPickerOpen(null)}
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
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                minHeight: 46,
                paddingHorizontal: t.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}
            >
              <Pressable onPress={() => setFilterPickerOpen(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>
                {filterPickerOpen ? filterLabels[filterPickerOpen] : 'Select option'}
              </Text>

              <Pressable
                onPress={() => {
                  if (filterPickerOpen) setFilterValue(filterPickerOpen, filterPickerDraftValue);
                  setFilterPickerOpen(null);
                }}
              >
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>

            <Picker
              selectedValue={filterPickerDraftValue}
              onValueChange={(value) => setFilterPickerDraftValue(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}
            >
              <Picker.Item label="All" value="" />
              {filterPickerOpen
                ? filterOptions[filterPickerOpen].map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))
                : null}
            </Picker>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}