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
  | 'department'
  | 'location'
  | 'room'
  | 'condition'
  | 'criticality'
  | 'status';

type Option = {
  label: string;
  value: string;
};

const CATEGORY_OPTIONS = [
  'Infrastructure',
  'Equipment',
  'Vehicle',
  'Technology',
  'Veterinary',
  'Animal Care',
  'Furniture',
  'Safety',
  'Other',
];

const CONDITION_OPTIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Needs urgent attention',
];

const CRITICALITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_OPTIONS = [
  'Active',
  'Under repair',
  'Decommissioned',
  'Disposed',
  'Missing',
];

const CATEGORY_CODE_MAP: Record<string, string> = {
  Infrastructure: 'INF',
  Equipment: 'EQP',
  Vehicle: 'VEH',
  Technology: 'TEC',
  Veterinary: 'VET',
  'Animal Care': 'ANC',
  Furniture: 'FUR',
  Safety: 'SAF',
  Other: 'OTH',
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

  return `${codePrefix}${String(highest + 1).padStart(3, '0')}`;
}

export default function AdminCreateAssetPage() {
  const t = useTheme();

  const [name, setName] = React.useState('');
  const [assetCode, setAssetCode] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [subCategory, setSubCategory] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [locationId, setLocationId] = React.useState('');
  const [roomId, setRoomId] = React.useState('');

  const [description, setDescription] = React.useState('');
  const [makeModel, setMakeModel] = React.useState('');
  const [serialNumber, setSerialNumber] = React.useState('');
  const [condition, setCondition] = React.useState('Good');
  const [criticality, setCriticality] = React.useState('Medium');
  const [status, setStatus] = React.useState('Active');
  const [assignedTo, setAssignedTo] = React.useState('');

  const [purchaseCost, setPurchaseCost] = React.useState('');
  const [replacementCost, setReplacementCost] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [warrantyExpiry, setWarrantyExpiry] = React.useState('');
  const [lastServicedDate, setLastServicedDate] = React.useState('');
  const [nextServiceDate, setNextServiceDate] = React.useState('');
  const [remainingLifeYears, setRemainingLifeYears] = React.useState('');

  const [utilisation, setUtilisation] = React.useState('');
  const [compatibilityOfUse, setCompatibilityOfUse] = React.useState('');
  const [environmentalImpact, setEnvironmentalImpact] = React.useState('');
  const [notes, setNotes] = React.useState('');

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

  const dropdownOptions: Record<DropdownKey, Option[]> = {
    category: CATEGORY_OPTIONS.map((value) => ({ label: value, value })),
    department: departments.map((item) => ({ label: item.name, value: item.id })),
    location: locations.map((item) => ({ label: item.name, value: item.id })),
    room: filteredRooms.map((item) => ({ label: item.name, value: item.id })),
    condition: CONDITION_OPTIONS.map((value) => ({ label: value, value })),
    criticality: CRITICALITY_OPTIONS.map((value) => ({ label: value, value })),
    status: STATUS_OPTIONS.map((value) => ({ label: value, value })),
  };

  const dropdownLabels: Record<DropdownKey, string> = {
    category: 'Category',
    department: 'Department',
    location: 'Location',
    room: 'Room',
    condition: 'Condition',
    criticality: 'Criticality',
    status: 'Status',
  };

  const dropdownValues: Record<DropdownKey, string> = {
    category,
    department: departmentId,
    location: locationId,
    room: roomId,
    condition,
    criticality,
    status,
  };

  const setDropdownValue = (key: DropdownKey, value: string) => {
    if (key === 'category') setCategory(value);
    if (key === 'department') setDepartmentId(value);
    if (key === 'location') {
      setLocationId(value);
      setRoomId('');
    }
    if (key === 'room') setRoomId(value);
    if (key === 'condition') setCondition(value);
    if (key === 'criticality') setCriticality(value);
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
    if (!assetCode) return 'Asset code could not be generated.';
    if (!departmentId) return 'Department is required.';
    if (!locationId) return 'Location is required.';
    if (!condition) return 'Condition is required.';
    if (!criticality) return 'Criticality is required.';
    if (!status) return 'Status is required.';

    if (!isValidNumber(purchaseCost)) return 'Purchase cost must be a number.';
    if (!isValidNumber(replacementCost)) return 'Replacement cost must be a number.';
    if (!isValidNumber(remainingLifeYears)) return 'Remaining life must be a number.';

    if (!isValidDate(purchaseDate)) return 'Purchase date must use YYYY-MM-DD format.';
    if (!isValidDate(warrantyExpiry)) return 'Warranty expiry must use YYYY-MM-DD format.';
    if (!isValidDate(lastServicedDate)) return 'Last serviced date must use YYYY-MM-DD format.';
    if (!isValidDate(nextServiceDate)) return 'Next service date must use YYYY-MM-DD format.';

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
        sub_category: subCategory.trim(),
        description: description.trim(),
        make_model: makeModel.trim(),
        serial_number: serialNumber.trim(),
        condition,
        criticality,
        status,
        location_id: locationId,
        room_id: roomId,
        dept_id: departmentId,
        assigned_to: assignedTo.trim(),
        purchase_cost: purchaseCost.trim() ? Number(purchaseCost) : undefined,
        replacement_cost: replacementCost.trim() ? Number(replacementCost) : undefined,
        purchase_date: purchaseDate.trim(),
        warranty_expiry: warrantyExpiry.trim(),
        last_serviced_date: lastServicedDate.trim(),
        next_service_date: nextServiceDate.trim(),
        remaining_life_years: remainingLifeYears.trim() ? Number(remainingLifeYears) : undefined,
        utilisation: utilisation.trim(),
        compatibility_of_use: compatibilityOfUse.trim(),
        environmental_impact: environmentalImpact.trim(),
        notes: notes.trim(),
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
      <Text style={[t.text.caption, { fontWeight: '700' }]}>
        {dropdownLabels[key]}
      </Text>

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
        <Text style={[t.text.body, { color: selectedLabel(key) ? t.colors.text.primary : t.colors.text.muted }]}>
          {selectedLabel(key) || `Select ${dropdownLabels[key].toLowerCase()}`}
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
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>
            Create Asset
          </Text>
          <Text style={[t.text.caption, { marginTop: 4 }]}>
            Add a new asset record to the system source-of-truth.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />

        {loadingRefs ? (
          <Text style={t.text.caption}>Loading locations, rooms and departments...</Text>
        ) : null}

        {error ? (
          <Text style={[t.text.caption, { color: '#B63E34' }]}>{error}</Text>
        ) : null}

        <View style={{ gap: t.spacing.lg }}>
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
            <View style={{ flex: 1 }}>
              <FormField label="Sub category" value={subCategory} onChangeText={setSubCategory} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('department')}
            {renderDropdown('location')}
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('room', !locationId)}
            {renderDropdown('status')}
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {renderDropdown('condition')}
            {renderDropdown('criticality')}
          </View>

          <FormField label="Description" value={description} onChangeText={setDescription} multiline />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Make / model" value={makeModel} onChangeText={setMakeModel} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Serial number" value={serialNumber} onChangeText={setSerialNumber} />
            </View>
          </View>

          <FormField label="Assigned to" value={assignedTo} onChangeText={setAssignedTo} />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Purchase cost" value={purchaseCost} onChangeText={setPurchaseCost} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Replacement cost" value={replacementCost} onChangeText={setReplacementCost} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Purchase date" value={purchaseDate} onChangeText={setPurchaseDate} />
              <Text style={t.text.caption}>Format: YYYY-MM-DD</Text>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Warranty expiry" value={warrantyExpiry} onChangeText={setWarrantyExpiry} />
              <Text style={t.text.caption}>Format: YYYY-MM-DD</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Last serviced" value={lastServicedDate} onChangeText={setLastServicedDate} />
              <Text style={t.text.caption}>Format: YYYY-MM-DD</Text>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Next service" value={nextServiceDate} onChangeText={setNextServiceDate} />
              <Text style={t.text.caption}>Format: YYYY-MM-DD</Text>
            </View>
          </View>

          <FormField
            label="Remaining life years"
            value={remainingLifeYears}
            onChangeText={setRemainingLifeYears}
          />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField label="Utilisation" value={utilisation} onChangeText={setUtilisation} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Environmental impact" value={environmentalImpact} onChangeText={setEnvironmentalImpact} />
            </View>
          </View>

          <FormField
            label="Compatibility of use"
            value={compatibilityOfUse}
            onChangeText={setCompatibilityOfUse}
          />

          <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />

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

      <Modal
        visible={Boolean(dropdownOpen)}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(null)}
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
              <Picker.Item label={`Select ${activeLabel.toLowerCase()}`} value="" />
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