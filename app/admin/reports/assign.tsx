import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset } from '@/src/types/models';
import { fetchAssets } from '@/src/services/assets';
import { fetchAdminUsers } from '@/src/services/users';
import { createReportWithAssets } from '@/src/services/reports';
import type { AdminUserRecord } from '@/src/data/admin';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import { resolveLocationNames } from '@/src/services/lookups';

type PickerField = 'location' | 'user' | null;

export default function AdminAssignReportPage() {
  const t = useTheme();

  const [assetRows, setAssetRows] = React.useState<Asset[]>([]);
  const [users, setUsers] = React.useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const [selectedLocationId, setSelectedLocationId] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [assetSearch, setAssetSearch] = React.useState('');

  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [description, setDescription] = React.useState('');

  const [pickerField, setPickerField] = React.useState<PickerField>(null);
  const [pickerDraftValue, setPickerDraftValue] = React.useState('');
  const [showDueDatePicker, setShowDueDatePicker] = React.useState(false);
  const [selectedDueDate, setSelectedDueDate] = React.useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due;
  });

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const [assetsData, usersData] = await Promise.all([fetchAssets({ limit: 5000 }), fetchAdminUsers()]);
      if (!mounted) return;

      setAssetRows(assetsData);
      setUsers(usersData);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      const ids = Array.from(
        new Set(assetRows.map((asset) => asset.location_id).filter((id): id is string => Boolean(id)))
      );

      if (ids.length === 0) return;

      const names = await resolveLocationNames(ids);
      setLocationNameById(names);
    })();
  }, [assetRows]);

  const locationOptions = React.useMemo(() => {
    const seen = new Set<string>();

    return assetRows
      .map((asset) => asset.location_id)
      .filter((id): id is string => {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => ({ value: id, label: locationNameById[id] ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [assetRows, locationNameById]);

  const activeAuditors = React.useMemo(
    () => users.filter((user) => user.role === 'Auditor' && user.status === 'Active'),
    [users]
  );

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

  React.useEffect(() => {
    setSelectedAssetIds([]);
    setAssetSearch('');
  }, [selectedLocationId]);

  const assetsInLocation = React.useMemo(
    () => assetRows.filter((asset) => asset.location_id === selectedLocationId),
    [assetRows, selectedLocationId]
  );

  const filteredAssets = React.useMemo(() => {
    if (!assetSearch.trim()) return assetsInLocation;

    const q = assetSearch.toLowerCase();

    return assetsInLocation.filter((asset) =>
      `${asset.name} ${asset.asset_code} ${asset.category} ${asset.sub_category ?? ''} ${asset.condition} ${asset.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [assetsInLocation, assetSearch]);

  const selectedLocationName = locationNameById[selectedLocationId] ?? '';
  const selectedUser = activeAuditors.find((user) => user.id === selectedUserId);
  const allFilteredSelected =
    filteredAssets.length > 0 && filteredAssets.every((asset) => selectedAssetIds.includes(asset.id));

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

  const toggleSelectFiltered = () => {
    const filteredIds = filteredAssets.map((asset) => asset.id);

    if (allFilteredSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const defaultTitle = React.useMemo(() => {
    if (!selectedLocationName) return '';
    return `${selectedLocationName} Audit`;
  }, [selectedLocationName]);

  const onCreateReport = async () => {
    setMessage(null);

    if (!selectedUserId) {
      setMessage('Please select an active auditor.');
      return;
    }

    if (selectedAssetIds.length === 0) {
      setMessage('Please select at least one asset.');
      return;
    }

    const finalTitle = title.trim() || defaultTitle || 'New Asset Audit Report';

    setCreating(true);

    const result = await createReportWithAssets({
      title: finalTitle,
      description: description.trim() || undefined,
      summary: summary.trim() || undefined,
      locationId: selectedLocationId || undefined,
      assignedUserId: selectedUserId,
      assetIds: selectedAssetIds,
      dueAt: selectedDueDate.toISOString(),
      status: 'Assigned',
    });

    setCreating(false);

    if (!result.ok) {
      setMessage(result.error ?? 'Could not create report.');
      return;
    }

    setMessage('Report created successfully.');
    setSelectedAssetIds([]);
    router.replace('/admin/reports' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Create report"
        userName="Admin"
        onPressBack={() => router.replace('/admin/reports' as any)}
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
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Create Report</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Create one audit report, select the included assets, and assign it to an auditor.
          </Text>
        </View>

        <View style={{ marginTop: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        {loading ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading report setup data...</Text>
          </View>
        ) : null}

        {!loading ? (
          <>
            <SelectionField
              label="Location"
              value={selectedLocationName}
              placeholder="Select location"
              onPress={() => {
                setPickerDraftValue(selectedLocationId);
                setPickerField('location');
              }}
            />

            <InputField
              label="Report title"
              value={title}
              placeholder={defaultTitle || 'Enter report title'}
              onChangeText={setTitle}
            />

            <InputField
              label="Summary"
              value={summary}
              placeholder="Brief summary of the audit report"
              onChangeText={setSummary}
            />

            <InputField
              label="Description"
              value={description}
              placeholder="Optional extra detail for the auditor"
              onChangeText={setDescription}
              multiline
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
                  paddingVertical: t.spacing.sm,
                  gap: t.spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: t.colors.border.subtle,
                  backgroundColor: t.colors.card.surfaceAlt,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={[t.text.body, { fontWeight: '700' }]}>
                    Assets in {selectedLocationName || 'selected location'} ({assetsInLocation.length})
                  </Text>

                  <Pressable onPress={toggleSelectFiltered} style={t.button.secondary}>
                    <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                      {allFilteredSelected ? 'Clear shown' : 'Select shown'}
                    </Text>
                  </Pressable>
                </View>

                <TextInput
                  value={assetSearch}
                  onChangeText={setAssetSearch}
                  placeholder="Search assets in this location..."
                  placeholderTextColor={t.colors.text.muted}
                  style={{
                    minHeight: 42,
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                    borderRadius: t.radius.md,
                    paddingHorizontal: t.spacing.md,
                    backgroundColor: t.colors.card.surface,
                    color: t.colors.text.primary,
                  }}
                />
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

              {filteredAssets.length === 0 ? (
                <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.md }}>
                  <Text style={t.text.caption}>No assets found for this location.</Text>
                </View>
              ) : (
                filteredAssets.map((asset, index) => {
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
                          borderBottomWidth: index === filteredAssets.length - 1 ? 0 : 1,
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
              label="Assign to auditor"
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
              <Text style={[t.text.caption, { color: message.includes('success') ? '#2F5B45' : '#B63E34' }]}>
                {message}
              </Text>
            ) : null}

            <Button
              label={creating ? 'Creating...' : 'Create report'}
              onPress={onCreateReport}
              disabled={creating}
            />
          </>
        ) : null}
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
          <Pressable
            onPress={() => setPickerField(null)}
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

function InputField({
  label,
  value,
  placeholder,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  const t = useTheme();

  return (
    <View style={{ gap: 6 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.text.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          minHeight: multiline ? 96 : 52,
          borderWidth: 1,
          borderColor: t.colors.border.subtle,
          borderRadius: t.radius.lg,
          backgroundColor: t.colors.card.surface,
          paddingHorizontal: t.spacing.md,
          paddingVertical: multiline ? t.spacing.md : 0,
          color: t.colors.text.primary,
        }}
      />
    </View>
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