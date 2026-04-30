import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, FormField } from '@/src/components';
import { assets, departments, locationById, locations, roomById, rooms } from '@/src/data';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset } from '@/src/types/models';
import { fetchAssetById, updateAsset } from '@/src/services/assets';
import { formatDateDDMMYYYY } from '@/src/utils/date';

type DropdownKey = 'status' | 'location' | 'room' | 'category' | 'area' | 'department' | 'criticality';

export default function AdminEditAssetPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [name, setName] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [status, setStatus] = React.useState<Asset['status']>('Active');
  const [locationId, setLocationId] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [criticality, setCriticality] = React.useState<Asset['criticality']>('Medium');
  const [wheelFieldKey, setWheelFieldKey] = React.useState<DropdownKey | null>(null);
  const [wheelDraftValue, setWheelDraftValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const row = await fetchAssetById(id);
        setAsset(row);
        if (row) {
          setName(row.name);
          setNotes(row.notes);
          setStatus(row.status);
          setLocationId(row.location_id);
          setRoomId(row.room_id);
          setCategory(row.category);
          setDepartmentId(row.dept_id);
          setCriticality(row.criticality);
          setArea(
            isBackOfHouse(row.location_id, row.dept_id, row.room_id)
              ? 'Back of house'
              : 'Front of house'
          );
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isBackOfHouse = React.useCallback((nextLocationId: string, nextDeptId: string, nextRoomId: string) => {
    const nextLocation = locationById[nextLocationId];
    const nextRoomName = roomById[nextRoomId]?.name?.toLowerCase() ?? '';
    const nextLocationName = nextLocation?.name?.toLowerCase() ?? '';
    const nextPrecinct = nextLocation?.precinct?.toLowerCase() ?? '';
    const nextDepartment = departments.find((d) => d.id === nextDeptId)?.name?.toLowerCase() ?? '';

    return (
      nextPrecinct.includes('operations') ||
      nextLocationName.includes('quarantine') ||
      nextLocationName.includes('veterinary') ||
      nextRoomName.includes('back service') ||
      nextDepartment.includes('operations') ||
      nextDepartment.includes('animal care')
    );
  }, []);

  const [area, setArea] = React.useState<'Front of house' | 'Back of house'>('Front of house');

  const categoryOptions = React.useMemo(
    () => Array.from(new Set(assets.map((item) => item.category))).sort(),
    []
  );
  const statusOptions: Asset['status'][] = [
    'Active',
    'Under repair',
    'Decommissioned',
    'Disposed',
    'Missing',
  ];
  const locationOptions = React.useMemo(
    () =>
      locations.filter((item) =>
        area === 'Back of house'
          ? isBackOfHouse(item.id, departmentId, roomId)
          : !isBackOfHouse(item.id, departmentId, roomId)
      ),
    [area, departmentId, isBackOfHouse, roomId]
  );
  const roomOptions = React.useMemo(
    () => rooms.filter((item) => item.location_id === locationId),
    [locationId]
  );
  const selectedLocation = locationById[locationId];
  const selectedRoom = roomById[roomId];
  const selectedDepartment = departments.find((d) => d.id === departmentId);

  const displayStatus = (value: Asset['status']) => value;

  if (loading) {
    return (
      <ScreenContainer>
        <TopBar
          title="Edit Asset"
          userName="Admin"
          onPressBack={() => router.replace('/admin/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Loading asset...</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Edit Asset"
          userName="Admin"
          onPressBack={() => router.replace('/admin/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const applyWheelSelection = (field: DropdownKey, value: string) => {
    if (field === 'status') {
      setStatus(value as Asset['status']);
      return;
    }
    if (field === 'location') {
      setLocationId(value);
      const firstRoom = rooms.find((item) => item.location_id === value);
      setRoomId(firstRoom?.id ?? '');
      return;
    }
    if (field === 'room') {
      setRoomId(value);
      return;
    }
    if (field === 'category') {
      setCategory(value);
      return;
    }
    if (field === 'area') {
      const nextArea = value as 'Front of house' | 'Back of house';
      setArea(nextArea);
      const matchingLocation = locations.find((item) =>
        nextArea === 'Back of house'
          ? isBackOfHouse(item.id, departmentId, roomId)
          : !isBackOfHouse(item.id, departmentId, roomId)
      );
      if (matchingLocation) {
        setLocationId(matchingLocation.id);
        const matchingRoom = rooms.find((item) => item.location_id === matchingLocation.id);
        if (matchingRoom) setRoomId(matchingRoom.id);
      }
      return;
    }
    if (field === 'department') {
      setDepartmentId(value);
      return;
    }
    setCriticality(value as Asset['criticality']);
  };

  const openPicker = (field: DropdownKey, value: string) => {
    setWheelFieldKey(field);
    setWheelDraftValue(value);
  };

  const pickerConfig = (() => {
    if (!wheelFieldKey) return { label: '', options: [] as { value: string; label: string }[] };
    if (wheelFieldKey === 'status') {
      return {
        label: 'Status',
        options: statusOptions.map((item) => ({ value: item, label: displayStatus(item) })),
      };
    }
    if (wheelFieldKey === 'location') {
      return {
        label: 'Location',
        options: locationOptions.map((item) => ({ value: item.id, label: item.name })),
      };
    }
    if (wheelFieldKey === 'room') {
      return {
        label: 'Room',
        options: roomOptions.map((item) => ({ value: item.id, label: item.name })),
      };
    }
    if (wheelFieldKey === 'category') {
      return {
        label: 'Category',
        options: categoryOptions.map((item) => ({ value: item, label: item })),
      };
    }
    if (wheelFieldKey === 'area') {
      return {
        label: 'Area',
        options: [
          { value: 'Front of house', label: 'Front of house' },
          { value: 'Back of house', label: 'Back of house' },
        ],
      };
    }
    if (wheelFieldKey === 'department') {
      return {
        label: 'Department',
        options: departments.map((item) => ({ value: item.id, label: item.name })),
      };
    }
    return {
      label: 'Criticality',
      options: ['Low', 'Medium', 'High', 'Critical'].map((item) => ({ value: item, label: item })),
    };
  })();

  return (
    <ScreenContainer>
      <TopBar
        title="Edit Asset"
        userName="Admin"
        onPressBack={() => router.replace('/admin/assets' as any)}
        onPressUser={() => router.push('/admin/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{`Edit "${asset.name}"`}</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Update this asset record and save changes to system structure.
        </Text>
        <View style={{ marginTop: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        <FormField label="Asset code" value={asset.asset_code} onChangeText={() => {}} editable={false} />
        <FormField label="Asset name" value={name} onChangeText={setName} />
        <SelectionField
          label="Status"
          value={displayStatus(status)}
          placeholder="Select status"
          onPress={() => openPicker('status', status)}
        />
        <SelectionField
          label="Area (FOH or BOH)"
          value={area}
          placeholder="Select area"
          onPress={() => openPicker('area', area)}
        />
        <SelectionField
          label="Category"
          value={category}
          placeholder="Select category"
          onPress={() => openPicker('category', category)}
        />
        <SelectionField
          label="Department"
          value={selectedDepartment?.name ?? ''}
          placeholder="Select department"
          onPress={() => openPicker('department', departmentId)}
        />
        <SelectionField
          label="Location"
          value={selectedLocation?.name ?? ''}
          placeholder="Select location"
          onPress={() => openPicker('location', locationId)}
        />
        <SelectionField
          label="Room"
          value={selectedRoom?.name ?? ''}
          placeholder={locationId ? 'Select room' : 'Select location first'}
          disabled={!locationId}
          onPress={() => openPicker('room', roomId)}
        />
        <SelectionField
          label="Criticality"
          value={criticality}
          placeholder="Select criticality"
          onPress={() => openPicker('criticality', criticality)}
        />
        <FormField label="Condition" value={asset.condition} onChangeText={() => {}} editable={false} />
        <Text style={[t.text.caption, { marginTop: -8 }]}>
          Condition is read-only here and is driven by the most recent condition report.
        </Text>
        <FormField label="Sub category" value={asset.sub_category} onChangeText={() => {}} editable={false} />
        <FormField label="Description" value={asset.description} onChangeText={() => {}} editable={false} multiline />
        <FormField label="Make / model" value={asset.make_model} onChangeText={() => {}} editable={false} />
        <FormField label="Serial number" value={asset.serial_number} onChangeText={() => {}} editable={false} />
        <FormField
          label="Assigned to"
          value={asset.assigned_to || 'Not assigned'}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Remaining life (years)"
          value={String(asset.remaining_life_years)}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField label="Utilisation" value={asset.utilisation} onChangeText={() => {}} editable={false} />
        <FormField
          label="Compatibility of use"
          value={asset.compatibility_of_use}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Environmental impact"
          value={asset.environmental_impact}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Purchase date"
          value={formatDateDDMMYYYY(asset.purchase_date)}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Purchase cost"
          value={`$${asset.purchase_cost.toLocaleString()}`}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Replacement cost"
          value={`$${asset.replacement_cost.toLocaleString()}`}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Warranty expiry"
          value={formatDateDDMMYYYY(asset.warranty_expiry)}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Last serviced"
          value={formatDateDDMMYYYY(asset.last_serviced_date)}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField
          label="Next service"
          value={formatDateDDMMYYYY(asset.next_service_date)}
          onChangeText={() => {}}
          editable={false}
        />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button
            label={saving ? 'Saving...' : 'Save changes'}
            onPress={async () => {
              setSaving(true);
              try {
                await updateAsset(asset.id, {
                  name: name.trim() || asset.name,
                  status,
                  location_id: locationId,
                  room_id: roomId,
                  category,
                  dept_id: departmentId,
                  criticality,
                  notes,
                });
                router.replace((`/admin/assets/${asset.id}` as any) as any);
              } catch (error) {
                console.log(error);
              } finally {
                setSaving(false);
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            label="Archive asset"
            variant="secondary"
            onPress={async () => {
              setSaving(true);
              try {
                await updateAsset(asset.id, { status: 'Decommissioned' });
                router.replace((`/admin/assets/${asset.id}` as any) as any);
              } catch (error) {
                console.log(error);
              } finally {
                setSaving(false);
              }
            }}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
      <AdminAppBottomNav />

      <Modal
        visible={Boolean(wheelFieldKey)}
        transparent
        animationType="fade"
        onRequestClose={() => setWheelFieldKey(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable onPress={() => setWheelFieldKey(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
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
              <Pressable onPress={() => setWheelFieldKey(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>{pickerConfig.label}</Text>
              <Pressable
                onPress={() => {
                  if (!wheelFieldKey) return;
                  applyWheelSelection(wheelFieldKey, wheelDraftValue);
                  setWheelFieldKey(null);
                }}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={wheelDraftValue}
              onValueChange={(value) => setWheelDraftValue(String(value))}
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
  disabled,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6, opacity: disabled ? 0.6 : 1 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{label}</Text>
      <Pressable
        disabled={disabled}
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

