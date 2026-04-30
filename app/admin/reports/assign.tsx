import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import type { Assessor, AuditAssignment } from '@/src/types/models';
import type { Asset } from '@/src/types/models';
import { fetchAssets } from '@/src/services/assets';
import { fetchAdminUsers } from '@/src/services/users';
import { createAuditAssignmentsBulk, fetchAuditAssignments } from '@/src/services/reports';
import type { AdminUserRecord } from '@/src/data/admin';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import { resolveLocationNames } from '@/src/services/lookups';

type PickerField = 'location' | 'user' | null;

function toAssessor(user: { id: string; name: string }): Assessor {
  return {
    id: user.id,
    name: user.name,
    role: 'Auditor',
    org: 'Currumbin Wildlife Sanctuary',
  };
}

export default function AdminAssignReportPage() {
  const t = useTheme();
  const { setAssignments } = useDemoState();
  const [assetRows, setAssetRows] = React.useState<Asset[]>([]);
  const [users, setUsers] = React.useState<AdminUserRecord[]>([]);
  const [assigning, setAssigning] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const [assetsData, usersData] = await Promise.all([fetchAssets({ limit: 5000 }), fetchAdminUsers()]);
      if (!mounted) return;
      setAssetRows(assetsData);
      setUsers(usersData);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      const ids = Array.from(new Set(assetRows.map((asset) => asset.location_id).filter(Boolean)));
      if (ids.length === 0) return;
      const names = await resolveLocationNames(ids);
      setLocationNameById(names);
    })();
  }, [assetRows]);

  const locationOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const options = assetRows
      .map((asset) => asset.location_id)
      .filter((id) => {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => ({ value: id, label: locationNameById[id] ?? id }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [assetRows, locationNameById]);

  const activeAuditors = React.useMemo(
    () => users.filter((user) => user.role === 'Auditor' && user.status === 'Active'),
    [users]
  );

  const [selectedLocationId, setSelectedLocationId] = React.useState<string>(locationOptions[0]?.value ?? '');
  const [selectedUserId, setSelectedUserId] = React.useState<string>(activeAuditors[0]?.id ?? '');
  const [pickerField, setPickerField] = React.useState<PickerField>(null);
  const [pickerDraftValue, setPickerDraftValue] = React.useState<string>('');
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [showDueDatePicker, setShowDueDatePicker] = React.useState(false);
  const [selectedDueDate, setSelectedDueDate] = React.useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due;
  });

  React.useEffect(() => {
    if (!selectedLocationId && locationOptions[0]?.value) {
      setSelectedLocationId(locationOptions[0].value);
    }
  }, [locationOptions, selectedLocationId]);

  React.useEffect(() => {
    if (!selectedUserId && activeAuditors[0]?.id) {
      setSelectedUserId(activeAuditors[0].id);
    }
  }, [activeAuditors, selectedUserId]);

  const assetsInLocation = React.useMemo(
    () => assetRows.filter((asset) => asset.location_id === selectedLocationId),
    [assetRows, selectedLocationId]
  );

  React.useEffect(() => {
    setSelectedAssetIds([]);
  }, [selectedLocationId]);

  const selectedLocationName = locationNameById[selectedLocationId] ?? '';
  const selectedUser = activeAuditors.find((user) => user.id === selectedUserId);
  const allSelected = assetsInLocation.length > 0 && selectedAssetIds.length === assetsInLocation.length;

  const pickerConfig = React.useMemo(() => {
    if (pickerField === 'location') return { label: 'Location', options: locationOptions };
    if (pickerField === 'user') {
      return {
        label: 'Delegate to',
        options: activeAuditors.map((user) => ({ value: user.id, label: user.name })),
      };
    }
    return { label: '', options: [] as { value: string; label: string }[] };
  }, [pickerField, locationOptions, activeAuditors]);

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedAssetIds([]);
      return;
    }
    setSelectedAssetIds(assetsInLocation.map((asset) => asset.id));
  };

  const onAssign = async () => {
    setMessage(null);
    const user = activeAuditors.find((item) => item.id === selectedUserId);
    if (!user) {
      setMessage('Please select an active Auditor to assign reports.');
      return;
    }
    if (selectedAssetIds.length === 0) return;
    setAssigning(true);
    const result = await createAuditAssignmentsBulk({
      assignedUserId: user.id,
      assetIds: selectedAssetIds,
      dueAt: selectedDueDate.toISOString(),
    });
    if (!result.ok) {
      setAssigning(false);
      setMessage(result.error ?? 'Could not assign reports.');
      return;
    }
    const refreshed = await fetchAuditAssignments();
    if (refreshed.length > 0) {
      setAssignments(refreshed);
    } else if (result.created) {
      const newAssignments: AuditAssignment[] = result.created.map((assignment) => ({
        ...assignment,
        assignedTo: toAssessor(user),
      }));
      setAssignments((prev) => [...prev, ...newAssignments]);
    }
    setAssigning(false);
    setSelectedAssetIds([]);
    setMessage(
      `${result.created?.length ?? selectedAssetIds.length} report assignments created and sent to auditor notifications.`
    );
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Assign report"
        userName="Admin"
        onPressUser={() => router.push('/admin/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Assign report</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Select a location, choose assets to include in the audit, then delegate to an active auditor.
        </Text>
        <View style={{ marginTop: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        <SelectionField
          label="Location"
          value={selectedLocationName}
          placeholder="Select location"
          onPress={() => {
            setPickerDraftValue(selectedLocationId);
            setPickerField('location');
          }}
        />

        <View
          style={{
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.lg,
            overflow: 'hidden',
            backgroundColor: t.colors.card.surface,
          }}>
          <View
            style={{
              minHeight: 44,
              paddingHorizontal: t.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: t.colors.border.subtle,
              backgroundColor: t.colors.card.surfaceAlt,
            }}>
            <Text style={[t.text.body, { fontWeight: '700' }]}>
              Assets in {selectedLocationName || 'selected location'} ({assetsInLocation.length})
            </Text>
            <Pressable onPress={toggleSelectAll} style={t.button.secondary}>
              <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                {allSelected ? 'Clear all' : 'Select all'}
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: t.colors.border.subtle,
              backgroundColor: t.colors.card.surfaceAlt,
            }}>
            <Text style={[t.text.caption, { width: 38, fontWeight: '700' }]}>Pick</Text>
            <Text style={[t.text.caption, { flex: 2.1, fontWeight: '700' }]}>Asset</Text>
            <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700' }]}>Category</Text>
            <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Condition</Text>
            <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Status</Text>
          </View>

          {assetsInLocation.length === 0 ? (
            <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.md }}>
              <Text style={t.text.caption}>No assets found for this location.</Text>
            </View>
          ) : (
            assetsInLocation.map((asset, index) => {
              const checked = selectedAssetIds.includes(asset.id);
              return (
                <Pressable
                  key={asset.id}
                  onPress={() => toggleAsset(asset.id)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.md,
                      borderBottomWidth: index === assetsInLocation.length - 1 ? 0 : 1,
                      borderBottomColor: t.colors.border.subtle,
                      backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : 'transparent',
                    },
                  ]}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: checked ? t.colors.brand.forest : t.colors.border.subtle,
                      backgroundColor: checked ? 'rgba(47,107,75,0.16)' : t.colors.card.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: t.spacing.md,
                    }}>
                    <Text style={{ color: t.colors.brand.forest, fontWeight: '800', fontSize: 12 }}>
                      {checked ? '✓' : ''}
                    </Text>
                  </View>
                  <View style={{ flex: 2.1, paddingRight: t.spacing.md }}>
                    <Text style={[t.text.body, { fontWeight: '700' }]} numberOfLines={1}>
                      {asset.name}
                    </Text>
                    <Text style={t.text.caption}>{asset.asset_code}</Text>
                  </View>
                  <Text style={[t.text.caption, { flex: 1.1 }]} numberOfLines={1}>
                    {asset.category}
                  </Text>
                  <Text style={[t.text.caption, { flex: 1 }]} numberOfLines={1}>
                    {asset.condition}
                  </Text>
                  <Text style={[t.text.caption, { flex: 1 }]} numberOfLines={1}>
                    {asset.status}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        <SelectionField
          label="Delegate to"
          value={selectedUser?.name ?? ''}
          placeholder={activeAuditors.length === 0 ? 'No active auditors available' : 'Select auditor'}
          onPress={() => {
            if (activeAuditors.length === 0) return;
            setPickerDraftValue(selectedUserId);
            setPickerField('user');
          }}
        />
        <SelectionField
          label="Due date"
          value={formatDateDDMMYYYY(selectedDueDate.toISOString())}
          placeholder="Select due date"
          onPress={() => setShowDueDatePicker(true)}
        />

        <Text style={t.text.caption}>
          {selectedAssetIds.length} asset{selectedAssetIds.length === 1 ? '' : 's'} selected
        </Text>
        {message ? (
          <Text style={[t.text.caption, { color: message.includes('created') ? '#2F5B45' : '#B63E34' }]}>
            {message}
          </Text>
        ) : null}

        <Button
          label={assigning ? 'Assigning...' : 'Assign report'}
          onPress={onAssign}
          disabled={assigning || selectedAssetIds.length === 0 || !selectedUserId || activeAuditors.length === 0}
        />
      </ScrollView>
      <AdminAppBottomNav />

      <Modal visible={Boolean(pickerField)} transparent animationType="fade" onRequestClose={() => setPickerField(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable onPress={() => setPickerField(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View
            style={{
              width: '100%',
              maxWidth: 560,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              overflow: 'hidden',
            }}>
            <View
              style={{
                minHeight: 46,
                paddingHorizontal: t.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}>
              <Pressable onPress={() => setPickerField(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>{pickerConfig.label}</Text>
              <Pressable
                onPress={() => {
                  if (pickerField === 'location') setSelectedLocationId(pickerDraftValue);
                  if (pickerField === 'user') setSelectedUserId(pickerDraftValue);
                  setPickerField(null);
                }}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={pickerDraftValue}
              onValueChange={(value) => setPickerDraftValue(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}>
              {pickerConfig.options.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
      {showDueDatePicker ? (
        <DateTimePicker
          value={selectedDueDate}
          mode="date"
          display="default"
          onChange={(_event, date) => {
            setShowDueDatePicker(false);
            if (!date) return;
            setSelectedDueDate(date);
          }}
        />
      ) : null}
    </ScreenContainer>
  );
}

function SelectionField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{label}</Text>
      <Pressable
        onPress={onPress}
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
        ]}>
        <Text style={[t.text.body, { color: value ? t.colors.text.primary : t.colors.text.muted }]}>
          {value || placeholder}
        </Text>
        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );
}
