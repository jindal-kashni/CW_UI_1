import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { Button, FormField } from '@/src/components';
import { createAsset, fetchAssets } from '@/src/services/assets';
import {
  fetchDepartments,
  fetchLocations,
  fetchRooms,
  type DepartmentRecord,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

type DropdownKey =
  | 'category'
  | 'subCategory'
  | 'department'
  | 'location'
  | 'room'
  | 'fohBoh'
  | 'criticality'
  | 'inspectionFrequency'
  | 'status';

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

const CRITICALITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'];
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

const CATEGORY_CODE_MAP: Record<string, string> = {
  'Electrical Equipment': 'ELE',
  'HVAC / Refrigeration': 'HVC',
  'Vehicles & Mobile Machinery': 'VEH',
  'Furniture & External Fixtures': 'FIX',
  'WHS & Safety Equipment': 'WHS',
  'Interior Infrastructure': 'INT',
  'Exterior Infrastructure': 'EXT',
  'Playground Assets': 'PLY',
  'Grounds & Maintenance Equipment': 'GRD',
  'Other / Miscellaneous': 'OTH',
};

function isValidDate(value: string) {
  return value.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isValidNumber(value: string) {
  return value.trim() === '' || !Number.isNaN(Number(value));
}

function prefixForCategory(category: string) {
  return CATEGORY_CODE_MAP[category] ?? 'AST';
}

async function generateAssetCode(category: string) {
  const prefix = prefixForCategory(category);
  const codePrefix = `CWS-${prefix}-`;

  const assets = await fetchAssets({ limit: 1000 });

  const highest = assets.reduce((max, asset) => {
    const match = asset.asset_code.match(new RegExp(`^${codePrefix}(\\d+)$`));
    if (!match) return max;

    const number = Number(match[1]);
    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 0);

  return `${codePrefix}${String(highest + 1).padStart(4, '0')}`;
}

export default function AdminCreateAssetPage() {
  const t = useTheme();

  const [name, setName] = React.useState('');
  const [assetCode, setAssetCode] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [subCategory, setSubCategory] = React.useState('');
  const [description, setDescription] = React.useState('');

  const [departmentId, setDepartmentId] = React.useState('');
  const [locationId, setLocationId] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [fohBoh, setFohBoh] = React.useState('');

  const [makeModel, setMakeModel] = React.useState('');
  const [serialNumber, setSerialNumber] = React.useState('');

  const [criticality, setCriticality] = React.useState('Medium');
  const [inspectionFrequency, setInspectionFrequency] = React.useState('');
  const [status, setStatus] = React.useState('Active');

  const [purchaseCost, setPurchaseCost] = React.useState('');
  const [replacementCost, setReplacementCost] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [warrantyExpiry, setWarrantyExpiry] = React.useState('');

  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [rooms, setRooms] = React.useState<RoomRecord[]>([]);

  const [loadingRefs, setLoadingRefs] = React.useState(true);
  const [generatingCode, setGeneratingCode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [dropdownOpen, setDropdownOpen] = React.useState<DropdownKey | null>(null);
  const [dropdownDraftValue, setDropdownDraftValue] = React.useState('');

  React.useEffect(() => {
    const loadReferenceData = async () => {
      setLoadingRefs(true);
      setError('');

      try {
        const [nextDepartments, nextLocations, nextRooms] = await Promise.all([
          fetchDepartments(),
          fetchLocations(),
          fetchRooms(),
        ]);

        setDepartments(nextDepartments);
        setLocations(nextLocations);
        setRooms(nextRooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load reference data.');
      } finally {
        setLoadingRefs(false);
      }
    };

    loadReferenceData();
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!category) {
        setAssetCode('');
        return;
      }

      setGeneratingCode(true);

      try {
        const nextCode = await generateAssetCode(category);
        if (!cancelled) setAssetCode(nextCode);
      } catch {
        if (!cancelled) setAssetCode('');
      } finally {
        if (!cancelled) setGeneratingCode(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const filteredRooms = React.useMemo(
    () => rooms.filter((room) => room.locationId === locationId),
    [rooms, locationId]
  );

  const subCategoryOptions = React.useMemo(
    () => (category ? SUB_CATEGORY_OPTIONS[category] ?? [] : []),
    [category]
  );

  const dropdownOptions: Record<DropdownKey, Option[]> = {
    category: CATEGORY_OPTIONS.map((value) => ({ label: value, value })),
    subCategory: subCategoryOptions.map((value) => ({ label: value, value })),
    department: departments.map((item) => ({ label: item.name, value: item.id })),
    location: locations.map((item) => ({ label: item.name, value: item.id })),
    room: filteredRooms.map((item) => ({ label: item.name, value: item.id })),
    fohBoh: FOH_BOH_OPTIONS.map((value) => ({ label: value, value })),
    criticality: CRITICALITY_OPTIONS.map((value) => ({ label: value, value })),
    inspectionFrequency: INSPECTION_FREQUENCY_OPTIONS.map((value) => ({ label: value, value })),
    status: STATUS_OPTIONS.map((value) => ({ label: value, value })),
  };

  const dropdownLabels: Record<DropdownKey, string> = {
    category: 'Category',
    subCategory: 'Sub-category',
    department: 'Department',
    location: 'Location',
    room: 'Room',
    fohBoh: 'FOH / BOH',
    criticality: 'Criticality',
    inspectionFrequency: 'Inspection frequency',
    status: 'Status',
  };

  const dropdownValues: Record<DropdownKey, string> = {
    category,
    subCategory,
    department: departmentId,
    location: locationId,
    room: roomId,
    fohBoh,
    criticality,
    inspectionFrequency,
    status,
  };

  const setDropdownValue = (key: DropdownKey, value: string) => {
    if (key === 'category') {
      setCategory(value);
      setSubCategory('');
    }
    if (key === 'subCategory') setSubCategory(value);
    if (key === 'department') setDepartmentId(value);
    if (key === 'location') {
      setLocationId(value);
      setRoomId('');
    }
    if (key === 'room') setRoomId(value);
    if (key === 'fohBoh') setFohBoh(value);
    if (key === 'criticality') setCriticality(value);
    if (key === 'inspectionFrequency') setInspectionFrequency(value);
    if (key === 'status') setStatus(value);
  };

  const openDropdown = (key: DropdownKey) => {
    setDropdownOpen(key);
    setDropdownDraftValue(dropdownValues[key]);
  };

  const selectedLabel = (key: DropdownKey) => {
    const value = dropdownValues[key];
    return dropdownOptions[key].find((option) => option.value === value)?.label ?? '';
  };

  const validate = () => {
    if (!name.trim()) return 'Asset name is required.';
    if (!category) return 'Category is required.';
    if (!subCategory) return 'Sub-category is required.';
    if (!assetCode) return 'Asset code could not be generated.';
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
    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const finalAssetCode = await generateAssetCode(category);

      await createAsset({
        asset_code: finalAssetCode,
        name: name.trim(),
        category,
        sub_category: subCategory,
        description: description.trim() || null,

        location_id: locationId || null,
        room_id: roomId || null,
        dept_id: departmentId || null,
        foh_boh: fohBoh || null,

        make_model: makeModel.trim() || null,
        serial_number: serialNumber.trim() || null,

        purchase_date: purchaseDate.trim() || null,
        purchase_cost: purchaseCost.trim() ? Number(purchaseCost) : null,
        replacement_cost: replacementCost.trim() ? Number(replacementCost) : null,
        warranty_expiry: warrantyExpiry.trim() || null,
        criticality,
        inspection_frequency: inspectionFrequency || null,
        status,

        asset_photo_urls: [],
      });

      router.replace('/(admin)/assets' as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create asset.');
    } finally {
      setSaving(false);
    }
  };

  const renderDropdown = (key: DropdownKey, disabled = false) => (
    <View style={{ flex: 1, gap: 6, opacity: disabled ? 0.6 : 1 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{dropdownLabels[key]}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => openDropdown(key)}
        style={({ pressed }) => [
          {
            minHeight: 52,
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.card.surface,
            paddingHorizontal: t.spacing.md,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            opacity: pressed ? 0.96 : 1,
          },
        ]}
      >
        <Text
          style={[t.text.body, { color: selectedLabel(key) ? t.colors.text.primary : t.colors.text.muted }]}
          numberOfLines={1}
        >
          {selectedLabel(key) ||
            (key === 'room' && !locationId
              ? 'Select location first'
              : key === 'subCategory' && !category
                ? 'Select category first'
                : `Select ${dropdownLabels[key].toLowerCase()}`)}
        </Text>

        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );

  const activeOptions = dropdownOpen ? dropdownOptions[dropdownOpen] : [];
  const activeLabel = dropdownOpen ? dropdownLabels[dropdownOpen] : 'Select option';

  return (
    <ScreenContainer>
      <TopBar
        title="Create Asset"
        userName="Admin"
        onPressBack={() => router.replace('/(admin)/assets' as any)}
        onPressUser={() => router.push('/(admin)/profile' as any)}
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
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Create Asset</Text>
          <Text style={[t.text.caption, { marginTop: 4 }]}>
            Add a static asset record to the system source-of-truth.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />

        {loadingRefs ? <Text style={t.text.caption}>Loading locations, rooms and departments...</Text> : null}

        {error ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{error}</Text> : null}

        <View style={{ gap: t.spacing.xl }}>
          <SectionTitle label="Core Asset Identification" />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Asset name" value={name} onChangeText={setName} />
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>Asset code</Text>
              <View
                style={{
                  minHeight: 52,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.lg,
                  backgroundColor: t.colors.card.surfaceAlt,
                  paddingHorizontal: t.spacing.md,
                  justifyContent: 'center',
                }}
              >
                <Text style={[t.text.body, { fontWeight: '700' }]}>
                  {generatingCode ? 'Generating...' : assetCode || 'Select category first'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('category')}
            {renderDropdown('subCategory', !category)}
          </View>

          <FormField label="Description" value={description} onChangeText={setDescription} multiline />

          <SectionTitle label="Asset Location & Ownership" />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('department')}
            {renderDropdown('location')}
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('room', !locationId)}
            {renderDropdown('fohBoh')}
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
            {renderDropdown('criticality')}
            {renderDropdown('inspectionFrequency')}
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('status')}
            <View style={{ flex: 1 }} />
          </View>

          <SectionTitle label="Asset Photos" />
          <Text style={t.text.caption}>
            Photo upload will be connected later. New assets currently start with an empty photo list.
          </Text>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <Button
              label={saving ? 'Saving...' : 'Save asset'}
              onPress={handleSave}
              disabled={saving || loadingRefs || generatingCode}
              style={{ flex: 1 }}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => router.replace('/(admin)/assets' as any)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>

      <AdminAppBottomNav />

      <Modal visible={Boolean(dropdownOpen)} transparent animationType="fade" onRequestClose={() => setDropdownOpen(null)}>
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
            onPress={() => setDropdownOpen(null)}
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
              <Pressable onPress={() => setDropdownOpen(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>{activeLabel}</Text>

              <Pressable
                onPress={() => {
                  if (dropdownOpen) setDropdownValue(dropdownOpen, dropdownDraftValue);
                  setDropdownOpen(null);
                }}
              >
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>

            <Picker
              selectedValue={dropdownDraftValue}
              onValueChange={(value) => setDropdownDraftValue(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}
            >
              <Picker.Item
                label={
                  dropdownOpen === 'room' && !locationId
                    ? 'Select location first'
                    : dropdownOpen === 'subCategory' && !category
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

function SectionTitle({ label }: { label: string }) {
  const t = useTheme();

  return (
    <View style={{ gap: 6 }}>
      <Text style={[t.text.title, { fontSize: 21, lineHeight: 26 }]}>{label}</Text>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.12)' }} />
    </View>
  );
}