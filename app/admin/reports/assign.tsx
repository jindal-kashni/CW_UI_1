import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button } from '@/src/components';
import { assets, locationById } from '@/src/data';
import { adminUsers } from '@/src/data/admin';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import type { Assessor, AuditAssignment } from '@/src/types/models';

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

  const locationOptions = React.useMemo(() => {
    const options = Object.values(locationById).map((location) => ({
      value: location.id,
      label: location.name,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const activeAuditors = React.useMemo(
    () => adminUsers.filter((user) => user.role === 'Auditor' && user.status === 'Active'),
    []
  );

  const [selectedLocationId, setSelectedLocationId] = React.useState<string>(locationOptions[0]?.value ?? '');
  const [selectedUserId, setSelectedUserId] = React.useState<string>(activeAuditors[0]?.id ?? '');
  const [pickerField, setPickerField] = React.useState<PickerField>(null);
  const [pickerDraftValue, setPickerDraftValue] = React.useState<string>('');
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);

  const assetsInLocation = React.useMemo(
    () => assets.filter((asset) => asset.location_id === selectedLocationId),
    [selectedLocationId]
  );

  React.useEffect(() => {
    setSelectedAssetIds([]);
  }, [selectedLocationId]);

  const selectedLocationName = locationById[selectedLocationId]?.name ?? '';
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

  const onAssign = () => {
    const user = activeAuditors.find((item) => item.id === selectedUserId);
    if (!user || selectedAssetIds.length === 0) return;

    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueAt = due.toISOString().slice(0, 10);

    const newAssignments: AuditAssignment[] = selectedAssetIds.map((assetId) => {
      const asset = assets.find((item) => item.id === assetId)!;
      const location = locationById[asset.location_id];
      return {
        id: `aud-assign-${asset.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Condition Report Task · ${asset.asset_code}`,
        dueAt,
        locationScope: { precincts: [location?.precinct ?? 'Central Precinct'] },
        assetId: asset.id,
        status: 'Assigned',
        progressPct: 0,
        assignedTo: toAssessor(user),
        summary: `Condition report for ${asset.name} (${asset.asset_code}). Assigned by admin.`,
      };
    });

    setAssignments((prev) => {
      const openStates: AuditAssignment['status'][] = ['Assigned', 'InProgress', 'DraftSaved'];
      const selectedSet = new Set(selectedAssetIds);
      const untouched = prev.filter((assignment) => !(selectedSet.has(assignment.assetId) && openStates.includes(assignment.status)));
      return [...untouched, ...newAssignments];
    });

    router.replace('/admin/reports/assign' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Assign report"
        userName="Admin"
        onPressBack={() => router.replace('/admin/reports/assign' as any)}
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
          placeholder="Select auditor"
          onPress={() => {
            setPickerDraftValue(selectedUserId);
            setPickerField('user');
          }}
        />

        <Text style={t.text.caption}>
          {selectedAssetIds.length} asset{selectedAssetIds.length === 1 ? '' : 's'} selected
        </Text>

        <Button
          label="Assign report"
          onPress={onAssign}
          disabled={selectedAssetIds.length === 0 || !selectedUserId}
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
