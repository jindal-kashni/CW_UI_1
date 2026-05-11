import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { Button, FormField } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset, Criticality, FohBoh, InspectionFrequency } from '@/src/types/models';
import { fetchAssetById, updateAsset } from '@/src/services/assets';
import {
  fetchDepartments,
  fetchLocations,
  fetchRooms,
  type DepartmentRecord,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';

type DropdownKey =
  | 'status'
  | 'location'
  | 'room'
  | 'category'
  | 'subCategory'
  | 'fohBoh'
  | 'department'
  | 'criticality'
  | 'inspectionFrequency';

type Option = {
  label: string;
  value: string;
};

const CATEGORY_OPTIONS = [
  'Electrical Equipment',
  'HVAC / Refrigeration',
  'Vehicles & Mobile Machinery',
  'Furniture & External Fixtures',
  'WHS & Safety Equipment',
  'Interior Infrastructure',
  'Exterior Infrastructure',
  'Playground Assets',
  'Grounds & Maintenance Equipment',
  'Other / Miscellaneous',
];

const SUB_CATEGORY_OPTIONS: Record<string, string[]> = {
  'Electrical Equipment': [
    'Appliance',
    'Kitchen Equipment',
    'Workshop Equipment',
    'Pump',
    'Motor',
    'Generator',
    'Lighting Equipment',
    'Battery System',
    'Charging Station',
    'Electrical Cabinet',
    'Switchboard',
    'Portable Equipment',
    'Other Electrical',
  ],
  'HVAC / Refrigeration': [
    'Air Conditioner',
    'Split System',
    'Ducted System',
    'Exhaust Fan',
    'Ventilation System',
    'Freezer',
    'Fridge',
    'Cool Room',
    'Compressor',
    'Dehumidifier',
    'Other HVAC',
  ],
  'Vehicles & Mobile Machinery': [
    'Car',
    'Truck',
    'Buggy',
    'Forklift',
    'Trailer',
    'Ride-on Mower',
    'Excavator',
    'Scissor Lift',
    'Mobile Plant',
    'Other Vehicle',
  ],
  'Furniture & External Fixtures': [
    'Bench',
    'Outdoor Table',
    'Bin',
    'Shade Umbrella',
    'Picnic Setting',
    'Display Unit',
    'Barrier',
    'Queue Rail',
    'Storage Cabinet',
    'Shelving',
    'External Seating',
    'Other Fixture',
  ],
  'WHS & Safety Equipment': [
    'Fire Extinguisher',
    'Fire Blanket',
    'First Aid Kit',
    'Spill Kit',
    'Emergency Lighting',
    'Exit Sign',
    'Smoke Detector',
    'Eyewash Station',
    'PPE Station',
    'Safety Barrier',
    'Defibrillator',
    'Other WHS',
  ],
  'Interior Infrastructure': [
    'Paint',
    'Flooring',
    'Ceiling',
    'Internal Wall',
    'Lighting',
    'Plumbing Fixture',
    'Door',
    'Window',
    'Cabinetry',
    'Tiling',
    'Internal Signage',
    'Handrail',
    'Partition',
    'Other Interior',
  ],
  'Exterior Infrastructure': [
    'Roof',
    'Gutter',
    'External Wall',
    'Fence',
    'Gate',
    'Pathway',
    'Decking',
    'Drainage',
    'Outdoor Signage',
    'Shade Structure',
    'Retaining Wall',
    'Kerbing',
    'Stairs',
    'Ramp',
    'Bridge',
    'Other Exterior',
  ],
  'Playground Assets': [
    'Play Structure',
    'Swing',
    'Slide',
    'Climbing Equipment',
    'Soft Fall Surface',
    'Shade Sail',
    'Playground Fence',
    'Playground Gate',
    'Playground Signage',
    'Interactive Equipment',
    'Other Playground',
  ],
  'Grounds & Maintenance Equipment': [
    'Power Tool',
    'Garden Tool',
    'Lawn Equipment',
    'Chainsaw',
    'Leaf Blower',
    'Whipper Snipper',
    'Maintenance Cart',
    'Pressure Cleaner',
    'Pump Equipment',
    'Cleaning Equipment',
    'Workshop Tool',
    'Other Grounds Equipment',
  ],
  'Other / Miscellaneous': [
    'Miscellaneous',
    'Temporary Asset',
    'Unclassified',
    'Specialty Item',
    'Other',
  ],
};

const STATUS_OPTIONS = ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'];
const CRITICALITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const FOH_BOH_OPTIONS = ['FOH', 'BOH', 'Mixed'];

const INSPECTION_FREQUENCY_OPTIONS = [
  'Monthly',
  'Quarterly',
  '6-monthly',
  'Annually',
  'Every 2 years',
  'Every 3 years',
  'Every 5 years',
  'As required',
];

function isValidDate(value: string) {
  return value.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isValidNumber(value: string) {
  return value.trim() === '' || !Number.isNaN(Number(value));
}

function formatMoneyInput(value: number | null | undefined) {
  return typeof value === 'number' ? String(value) : '';
}

function formatDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

export default function AdminEditAssetPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [rooms, setRooms] = React.useState<RoomRecord[]>([]);

  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [subCategory, setSubCategory] = React.useState('');
  const [description, setDescription] = React.useState('');

  const [status, setStatus] = React.useState<Asset['status']>('Active');
  const [locationId, setLocationId] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [fohBoh, setFohBoh] = React.useState<FohBoh | ''>('');
  const [criticality, setCriticality] = React.useState<Criticality | ''>('');
  const [inspectionFrequency, setInspectionFrequency] = React.useState<InspectionFrequency | ''>('');

  const [makeModel, setMakeModel] = React.useState('');
  const [serialNumber, setSerialNumber] = React.useState('');

  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [purchaseCost, setPurchaseCost] = React.useState('');
  const [replacementCost, setReplacementCost] = React.useState('');
  const [warrantyExpiry, setWarrantyExpiry] = React.useState('');

  const [wheelFieldKey, setWheelFieldKey] = React.useState<DropdownKey | null>(null);
  const [wheelDraftValue, setWheelDraftValue] = React.useState('');

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [assetRow, nextDepartments, nextLocations, nextRooms] = await Promise.all([
          fetchAssetById(id),
          fetchDepartments(),
          fetchLocations(),
          fetchRooms(),
        ]);

        setDepartments(nextDepartments);
        setLocations(nextLocations);
        setRooms(nextRooms);

        setAsset(assetRow);

        if (assetRow) {
          setName(assetRow.name ?? '');
          setCategory(String(assetRow.category ?? ''));
          setSubCategory(assetRow.sub_category ?? '');
          setDescription(assetRow.description ?? '');

          setStatus(assetRow.status ?? 'Active');
          setLocationId(assetRow.location_id ?? '');
          setRoomId(assetRow.room_id ?? '');
          setDepartmentId(assetRow.dept_id ?? '');
          setFohBoh((assetRow.foh_boh ?? '') as FohBoh | '');
          setCriticality((assetRow.criticality ?? '') as Criticality | '');
          setInspectionFrequency((assetRow.inspection_frequency ?? '') as InspectionFrequency | '');

          setMakeModel(assetRow.make_model ?? '');
          setSerialNumber(assetRow.serial_number ?? '');

          setPurchaseDate(formatDateInput(assetRow.purchase_date));
          setPurchaseCost(formatMoneyInput(assetRow.purchase_cost));
          setReplacementCost(formatMoneyInput(assetRow.replacement_cost));
          setWarrantyExpiry(formatDateInput(assetRow.warranty_expiry));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load asset.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const subCategoryOptions = React.useMemo(
    () => (category ? SUB_CATEGORY_OPTIONS[category] ?? [] : []),
    [category]
  );

  const roomOptions = React.useMemo(
    () => rooms.filter((item) => item.locationId === locationId),
    [rooms, locationId]
  );

  const dropdownOptions: Record<DropdownKey, Option[]> = {
    status: STATUS_OPTIONS.map((item) => ({ value: item, label: item })),
    location: locations.map((item) => ({ value: item.id, label: item.name })),
    room: roomOptions.map((item) => ({ value: item.id, label: item.name })),
    category: CATEGORY_OPTIONS.map((item) => ({ value: item, label: item })),
    subCategory: subCategoryOptions.map((item) => ({ value: item, label: item })),
    fohBoh: FOH_BOH_OPTIONS.map((item) => ({ value: item, label: item })),
    department: departments.map((item) => ({ value: item.id, label: item.name })),
    criticality: CRITICALITY_OPTIONS.map((item) => ({ value: item, label: item })),
    inspectionFrequency: INSPECTION_FREQUENCY_OPTIONS.map((item) => ({ value: item, label: item })),
  };

  const dropdownLabels: Record<DropdownKey, string> = {
    status: 'Status',
    location: 'Location',
    room: 'Room',
    category: 'Category',
    subCategory: 'Sub-category',
    fohBoh: 'FOH / BOH',
    department: 'Department',
    criticality: 'Criticality',
    inspectionFrequency: 'Inspection frequency',
  };

  const dropdownValues: Record<DropdownKey, string> = {
    status,
    location: locationId,
    room: roomId,
    category,
    subCategory,
    fohBoh,
    department: departmentId,
    criticality,
    inspectionFrequency,
  };

  const selectedLabel = (key: DropdownKey) => {
    const value = dropdownValues[key];
    return dropdownOptions[key].find((option) => option.value === value)?.label ?? '';
  };

  const applyWheelSelection = (field: DropdownKey, value: string) => {
    if (field === 'status') setStatus(value as Asset['status']);

    if (field === 'location') {
      setLocationId(value);
      setRoomId('');
    }

    if (field === 'room') setRoomId(value);

    if (field === 'category') {
      setCategory(value);
      setSubCategory('');
    }

    if (field === 'subCategory') setSubCategory(value);
    if (field === 'fohBoh') setFohBoh(value as FohBoh | '');
    if (field === 'department') setDepartmentId(value);
    if (field === 'criticality') setCriticality(value as Criticality | '');
    if (field === 'inspectionFrequency') setInspectionFrequency(value as InspectionFrequency | '');
  };

  const openPicker = (field: DropdownKey) => {
    setWheelFieldKey(field);
    setWheelDraftValue(dropdownValues[field]);
  };

  const validate = () => {
    if (!name.trim()) return 'Asset name is required.';
    if (!category) return 'Category is required.';
    if (!subCategory) return 'Sub-category is required.';
    if (!departmentId) return 'Department is required.';
    if (!locationId) return 'Location is required.';
    if (!criticality) return 'Criticality is required.';
    if (!status) return 'Status is required.';

    if (!isValidNumber(purchaseCost)) return 'Purchase cost must be a number.';
    if (!isValidNumber(replacementCost)) return 'Replacement cost must be a number.';

    if (!isValidDate(purchaseDate)) return 'Purchase date must use YYYY-MM-DD format.';
    if (!isValidDate(warrantyExpiry)) return 'Warranty expiry must use YYYY-MM-DD format.';

    return '';
  };

  const handleSave = async () => {
    if (!asset) return;

    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateAsset(asset.id, {
        name: name.trim(),
        category,
        sub_category: subCategory,
        description: description.trim() || null,

        location_id: locationId || null,
        room_id: roomId || null,
        dept_id: departmentId || null,
        foh_boh: fohBoh ? (fohBoh as FohBoh) : null,

        make_model: makeModel.trim() || null,
        serial_number: serialNumber.trim() || null,

        purchase_date: purchaseDate.trim() || null,
        purchase_cost: purchaseCost.trim() ? Number(purchaseCost) : null,
        replacement_cost: replacementCost.trim() ? Number(replacementCost) : null,
        warranty_expiry: warrantyExpiry.trim() || null,
        criticality: criticality ? (criticality as Criticality) : null,
        inspection_frequency: inspectionFrequency ? (inspectionFrequency as InspectionFrequency) : null,
        status,
      });

      router.replace((`/admin/assets/${asset.id}` as any) as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update asset.');
    } finally {
      setSaving(false);
    }
  };

  const renderSelectionField = (key: DropdownKey, disabled = false) => (
    <SelectionField
      label={dropdownLabels[key]}
      value={selectedLabel(key)}
      placeholder={
        key === 'room' && !locationId
          ? 'Select location first'
          : key === 'subCategory' && !category
            ? 'Select category first'
            : `Select ${dropdownLabels[key].toLowerCase()}`
      }
      disabled={disabled}
      onPress={() => openPicker(key)}
    />
  );

  const activeOptions = wheelFieldKey ? dropdownOptions[wheelFieldKey] : [];
  const activeLabel = wheelFieldKey ? dropdownLabels[wheelFieldKey] : 'Select option';

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
        }}
      >
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{`Edit "${asset.name}"`}</Text>
          <Text style={[t.text.caption, { marginTop: 4 }]}>
            Update this static asset record.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />

        {error ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{error}</Text> : null}

        <View style={{ gap: t.spacing.xl }}>
          <SectionTitle label="Core Asset Identification" />

          <FormField label="Asset code" value={asset.asset_code} onChangeText={() => {}} editable={false} />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Asset name" value={name} onChangeText={setName} />
            </View>
            <View style={{ flex: 1 }}>{renderSelectionField('status')}</View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>{renderSelectionField('category')}</View>
            <View style={{ flex: 1 }}>{renderSelectionField('subCategory', !category)}</View>
          </View>

          <FormField label="Description" value={description} onChangeText={setDescription} multiline />

          <SectionTitle label="Asset Location & Ownership" />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>{renderSelectionField('department')}</View>
            <View style={{ flex: 1 }}>{renderSelectionField('location')}</View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>{renderSelectionField('room', !locationId)}</View>
            <View style={{ flex: 1 }}>{renderSelectionField('fohBoh')}</View>
          </View>

          <SectionTitle label="Asset Details" />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Make / model" value={makeModel} onChangeText={setMakeModel} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Serial number" value={serialNumber} onChangeText={setSerialNumber} />
            </View>
          </View>

          <SectionTitle label="Asset Financial & Lifecycle Data" />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Purchase / install date" value={purchaseDate} onChangeText={setPurchaseDate} />
              <Text style={t.text.caption}>Format: YYYY-MM-DD</Text>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Warranty expiry" value={warrantyExpiry} onChangeText={setWarrantyExpiry} />
              <Text style={t.text.caption}>Format: YYYY-MM-DD</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Purchase cost" value={purchaseCost} onChangeText={setPurchaseCost} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Replacement cost" value={replacementCost} onChangeText={setReplacementCost} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>{renderSelectionField('criticality')}</View>
            <View style={{ flex: 1 }}>{renderSelectionField('inspectionFrequency')}</View>
          </View>

          <SectionTitle label="Asset Photos" />
          <Text style={t.text.caption}>
            Photo upload will be connected later. Existing photo references are preserved.
          </Text>

          <View>
            <Button
              label={saving ? 'Saving...' : 'Save changes'}
              onPress={handleSave}
              disabled={saving}
              style={{ width:'100%' }}
            />
          </View>
        </View>
      </ScrollView>

      <AdminAppBottomNav />

      <Modal
        visible={Boolean(wheelFieldKey)}
        transparent
        animationType="fade"
        onRequestClose={() => setWheelFieldKey(null)}
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
            onPress={() => setWheelFieldKey(null)}
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
              <Pressable onPress={() => setWheelFieldKey(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>{activeLabel}</Text>

              <Pressable
                onPress={() => {
                  if (!wheelFieldKey) return;
                  applyWheelSelection(wheelFieldKey, wheelDraftValue);
                  setWheelFieldKey(null);
                }}
              >
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>

            <Picker
              selectedValue={wheelDraftValue}
              onValueChange={(value) => setWheelDraftValue(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}
            >
              <Picker.Item
                label={
                  wheelFieldKey === 'room' && !locationId
                    ? 'Select location first'
                    : wheelFieldKey === 'subCategory' && !category
                      ? 'Select category first'
                      : `Select ${activeLabel.toLowerCase()}`
                }
                value=""
              />
              {activeOptions.map((option) => (
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
        ]}
      >
        <Text style={[t.text.body, { color: value ? t.colors.text.primary : t.colors.text.muted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  const t = useTheme();

  return (
    <View style={{ gap: 6 }}>
      <Text style={[t.text.title, { fontSize: 21, lineHeight: 26 }]}>{label}</Text>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.12)' }} />
    </View>
  );
}