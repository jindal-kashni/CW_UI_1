import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SearchInput } from '@/src/components';
import { assets as seedAssets, departmentById, locationById, roomById } from '@/src/data';
import { ScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset } from '@/src/types/models';

type DropdownKey =
  | 'category'
  | 'condition'
  | 'criticality'
  | 'status'
  | 'area'
  | 'department'
  | 'location'
  | 'room';
type FilterMode = 'search' | 'filters';

export default function AssetsScreen() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('search');
  const [category, setCategory] = React.useState<string | undefined>(undefined);
  const [condition, setCondition] = React.useState<string | undefined>(undefined);
  const [criticality, setCriticality] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [area, setArea] = React.useState<string | undefined>(undefined);
  const [department, setDepartment] = React.useState<string | undefined>(undefined);
  const [location, setLocation] = React.useState<string | undefined>(undefined);
  const [room, setRoom] = React.useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<'alphabetical' | 'conditionLowHigh' | 'criticalityHighLow'>(
    'alphabetical'
  );
  const [wheelFieldKey, setWheelFieldKey] = React.useState<DropdownKey | null>(null);
  const [wheelDraftValue, setWheelDraftValue] = React.useState('');
  const [sortWheelOpen, setSortWheelOpen] = React.useState(false);
  const [sortWheelDraftValue, setSortWheelDraftValue] = React.useState<
    'alphabetical' | 'conditionLowHigh' | 'criticalityHighLow'
  >('alphabetical');

  const categories = Array.from(new Set(seedAssets.map((a) => a.category)));
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Dilapidated', 'Critical'];
  const criticalities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = [
    'Active',
    'Under repair',
    'Decommissioned',
    'Disposed',
    'Missing',
    // Legacy labels kept for local demo compatibility.
    'Under maintenance',
    'Out of service',
    'Retired',
  ];
  const areaOptions = ['Front of house', 'Back of house'];
  const departments = Array.from(new Set(seedAssets.map((a) => departmentById[a.dept_id]?.name ?? 'Unknown')));
  const locations = Array.from(new Set(seedAssets.map((a) => locationById[a.location_id]?.name ?? 'Unknown')));
  const rooms = Array.from(
    new Set(
      seedAssets
        .filter((a) => !location || (locationById[a.location_id]?.name ?? 'Unknown') === location)
        .map((a) => roomById[a.room_id]?.name ?? 'Unknown')
    )
  );

  const statusLabel = (asset: Asset) =>
    asset.status === 'UnderMaintenance'
      ? 'Under maintenance'
      : asset.status === 'OutOfService'
        ? 'Out of service'
        : asset.status === 'Under repair'
          ? 'Under repair'
        : asset.status;

  const activeFilterCount = [area, location, room, category, department, condition, criticality, status].filter(
    Boolean
  ).length;

  const clearAllFilters = () => {
    setCategory(undefined);
    setCondition(undefined);
    setCriticality(undefined);
    setStatus(undefined);
    setArea(undefined);
    setDepartment(undefined);
    setLocation(undefined);
    setRoom(undefined);
  };

  const houseAreaForAsset = (asset: Asset) => {
    const location = locationById[asset.location_id];
    const roomName = roomById[asset.room_id]?.name?.toLowerCase() ?? '';
    const locationName = location?.name?.toLowerCase() ?? '';
    const precinct = location?.precinct?.toLowerCase() ?? '';
    const departmentName = departmentById[asset.dept_id]?.name?.toLowerCase() ?? '';

    const isBack =
      precinct.includes('operations') ||
      locationName.includes('quarantine') ||
      locationName.includes('veterinary') ||
      roomName.includes('back service') ||
      departmentName.includes('operations') ||
      departmentName.includes('animal care');

    return isBack ? 'Back of house' : 'Front of house';
  };
  const sortLabel =
    sortBy === 'alphabetical'
      ? 'Alphabetic (A-Z)'
      : sortBy === 'conditionLowHigh'
        ? 'Condition (Low-High)'
        : 'Criticality (High-Low)';
  const openSortSelector = () => {
    setSortWheelDraftValue(sortBy);
    setSortWheelOpen(true);
  };

  const filterFields: {
    key: DropdownKey;
    label: string;
    value: string | undefined;
    options: { value: string; label: string }[];
    onSelect: (v?: string) => void;
    disabled: boolean;
  }[] = [
    {
      key: 'category',
      label: 'Category',
      value: category,
      options: categories.map((item) => ({
        value: item,
        label: item === 'AnimalEnclosure' ? 'Enclosures' : item,
      })),
      onSelect: (v?: string) => setCategory(v),
      disabled: false,
    },
    {
      key: 'condition',
      label: 'Condition',
      value: condition,
      options: conditions.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setCondition(v),
      disabled: false,
    },
    {
      key: 'criticality',
      label: 'Criticality',
      value: criticality,
      options: criticalities.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setCriticality(v),
      disabled: false,
    },
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: statuses.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setStatus(v),
      disabled: false,
    },
    {
      key: 'area',
      label: 'Area (FOH or BOH)',
      value: area,
      options: areaOptions.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setArea(v),
      disabled: false,
    },
    {
      key: 'department',
      label: 'Department',
      value: department,
      options: departments.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setDepartment(v),
      disabled: false,
    },
    {
      key: 'location',
      label: 'Location',
      value: location,
      options: locations.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => {
        setLocation(v);
        setRoom(undefined);
      },
      disabled: false,
    },
    {
      key: 'room',
      label: 'Room',
      value: room,
      options: rooms.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setRoom(v),
      disabled: !location,
    },
  ];

  const renderDropdownField = (field: (typeof filterFields)[number]) => (
    <View key={field.key} style={{ flex: 1, gap: 6, opacity: field.disabled ? 0.6 : 1 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{field.label}</Text>
      <View style={{ gap: t.spacing.xs }}>
        <Pressable
          disabled={field.disabled}
          onPress={() => {
            setSortWheelOpen(false);
            setWheelFieldKey(field.key);
            setWheelDraftValue(field.value ?? '');
          }}
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
          <Text style={[t.text.body, { color: field.value ? t.colors.text.primary : t.colors.text.muted }]}>
            {field.value ?? (field.key === 'room' && !location ? 'Select location first' : 'Select an option')}
          </Text>
          <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
        </Pressable>
      </View>
    </View>
  );
  const filterField = (key: DropdownKey) => filterFields.find((field) => field.key === key)!;

  const filtered = seedAssets
    .filter((a) => (filterMode === 'filters' ? (!category ? true : a.category === category) : true))
    .filter((a) => (filterMode === 'filters' ? (!condition ? true : a.condition === condition) : true))
    .filter((a) => (filterMode === 'filters' ? (!criticality ? true : a.criticality === criticality) : true))
    .filter((a) => (filterMode === 'filters' ? (!status ? true : statusLabel(a) === status) : true))
    .filter((a) => (filterMode === 'filters' ? (!area ? true : houseAreaForAsset(a) === area) : true))
    .filter((a) =>
      filterMode === 'filters'
        ? !department || (departmentById[a.dept_id]?.name ?? 'Unknown') === department
        : true
    )
    .filter((a) =>
      filterMode === 'filters'
        ? !location || (locationById[a.location_id]?.name ?? 'Unknown') === location
        : true
    )
    .filter((a) => (filterMode === 'filters' ? (!room ? true : (roomById[a.room_id]?.name ?? 'Unknown') === room) : true))
    .filter((a) => {
      if (filterMode !== 'search') return true;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const loc = locationById[a.location_id];
      const dept = departmentById[a.dept_id];
      const rm = roomById[a.room_id];
      const hay =
        `${a.name} ${a.asset_code} ${a.category} ${a.sub_category} ${loc?.name ?? ''} ${rm?.name ?? ''} ${dept?.name ?? ''} ${a.condition} ${a.criticality}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'conditionLowHigh')
        return ['Dilapidated', 'Poor', 'Fair', 'Good', 'Excellent', 'Critical'].indexOf(a.condition) -
          ['Dilapidated', 'Poor', 'Fair', 'Good', 'Excellent', 'Critical'].indexOf(b.condition);
      return ['Critical', 'High', 'Medium', 'Low'].indexOf(a.criticality) -
        ['Critical', 'High', 'Medium', 'Low'].indexOf(b.criticality);
    });

  const toneForCell = (kind: 'condition' | 'criticality', value: string) => {
    if (kind === 'condition') {
      if (value === 'Excellent' || value === 'Good') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D' };
      if (value === 'Fair') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
      return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
    }
    if (kind === 'criticality') {
      if (value === 'Low') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
      if (value === 'Medium') return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B' };
      if (value === 'High') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
      return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
    }
    return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 26, lineHeight: 32, marginBottom: t.spacing.md }]}>{title}</Text>
  );
  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );

  return (
    <ScreenScaffold title="Assets">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34, marginBottom: t.spacing.xs }]}>
        Browse assets
      </Text>
      <Text style={[t.text.caption, { marginTop: -t.spacing.sm, marginBottom: t.spacing.md }]}>
        Search and filter assets by place and condition. {filtered.length} shown.
      </Text>
      <View style={{ marginBottom: t.spacing.lg }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          <Pressable
            onPress={() => setFilterMode('search')}
            style={({ pressed }) => [
              {
                minHeight: 38,
                borderRadius: 999,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: filterMode === 'search' ? 'rgba(31,59,44,0.22)' : t.colors.border.subtle,
                backgroundColor:
                  filterMode === 'search'
                    ? t.colors.brand.forestTint
                    : pressed
                      ? 'rgba(30,31,28,0.04)'
                      : t.colors.card.surface,
              },
            ]}>
            <Text style={[t.text.caption, { fontWeight: '700', color: filterMode === 'search' ? t.colors.brand.forest : t.colors.text.secondary }]}>
              Search
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('filters')}
            style={({ pressed }) => [
              {
                minHeight: 38,
                borderRadius: 999,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: filterMode === 'filters' ? 'rgba(31,59,44,0.22)' : t.colors.border.subtle,
                backgroundColor:
                  filterMode === 'filters'
                    ? t.colors.brand.forestTint
                    : pressed
                      ? 'rgba(30,31,28,0.04)'
                      : t.colors.card.surface,
              },
            ]}>
            <Text style={[t.text.caption, { fontWeight: '700', color: filterMode === 'filters' ? t.colors.brand.forest : t.colors.text.secondary }]}>
              Search by filters
            </Text>
          </Pressable>
        </View>

        {filterMode === 'search' ? (
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search asset code, name, location, room, condition..." />
        ) : (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('area'))}
              {renderDropdownField(filterField('location'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('room'))}
              {renderDropdownField(filterField('category'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('department'))}
              {renderDropdownField(filterField('condition'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('criticality'))}
              {renderDropdownField(filterField('status'))}
            </View>
            {!location ? <Text style={t.text.caption}>Select a location to enable room filtering.</Text> : null}
          </View>
        )}

        {filterMode === 'filters' && activeFilterCount > 0 ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Pressable
              onPress={clearAllFilters}
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
              ]}>
              <Text style={[t.text.caption, { fontWeight: '800', color: '#0F4A31', fontSize: 15 }]}>
                Reset filters
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <SectionDivider />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.md }}>
        <SectionHeading title="Asset Results" />
        <Pressable
          onPress={openSortSelector}
          hitSlop={8}
          style={({ pressed }) => [
            {
              minHeight: 44,
              minWidth: 248,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              paddingHorizontal: t.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.96 : 1,
            },
          ]}>
          <Text style={[t.text.body, { color: t.colors.text.primary }]}>Sort: {sortLabel}</Text>
          <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
        </Pressable>
      </View>
      <Text style={[t.text.caption, { marginTop: -t.spacing.md, marginBottom: t.spacing.md }]}>
        Table view for quick scanning and comparison.
      </Text>
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
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.sm,
              backgroundColor: t.colors.card.surfaceAlt,
              borderBottomWidth: 1,
              borderBottomColor: t.colors.border.subtle,
            }}>
            <Text style={[t.text.caption, { flex: 2.8, fontWeight: '700' }]}>Asset</Text>
            <Text style={[t.text.caption, { flex: 2.2, fontWeight: '700' }]}>Location Context</Text>
            <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>
              Condition
            </Text>
            <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>
              Criticality
            </Text>
          </View>

          {filtered.map((a, idx) => {
            const loc = locationById[a.location_id];
            const rm = roomById[a.room_id];
            const departmentName = loc?.department_name ?? 'Unknown department';
            const locationName = loc?.name ?? 'Location unknown';
            const roomName = rm?.name ?? 'Room not set';
            const conditionColors = toneForCell('condition', a.condition);
            const criticalityColors = toneForCell('criticality', a.criticality);

            return (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/asset/${a.id}`)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: t.spacing.md,
                    paddingVertical: t.spacing.md,
                    borderBottomWidth: idx === filtered.length - 1 ? 0 : 1,
                    borderBottomColor: t.colors.border.subtle,
                    backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : 'transparent',
                  },
                ]}>
                <View style={{ flex: 2.8, paddingRight: t.spacing.md }}>
                  <Text style={[t.text.body, { fontWeight: '700' }]}>{a.name}</Text>
                  <Text style={[t.text.caption, { marginTop: 2 }]}>
                    {a.asset_code} · {a.category}
                  </Text>
                </View>

                <View style={{ flex: 2.2, paddingRight: t.spacing.md }}>
                  <Text style={t.text.caption}>{departmentName}</Text>
                  <Text style={[t.text.caption, { marginTop: 2 }]}>
                    {locationName} · {roomName}
                  </Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      alignSelf: 'center',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      backgroundColor: conditionColors.bg,
                      maxWidth: '100%',
                    }}>
                    <Text
                      style={{ color: conditionColors.text, fontSize: 12, fontWeight: '700', lineHeight: 16 }}
                      numberOfLines={2}>
                      {a.condition}
                    </Text>
                  </View>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      alignSelf: 'center',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      backgroundColor: criticalityColors.bg,
                    }}>
                    <Text style={{ color: criticalityColors.text, fontSize: 12, fontWeight: '700' }}>{a.criticality}</Text>
                  </View>
                </View>

              </Pressable>
            );
          })}
      </View>
      <Modal
        visible={Boolean(wheelFieldKey) || sortWheelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setWheelFieldKey(null);
          setSortWheelOpen(false);
        }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable
            onPress={() => {
              setWheelFieldKey(null);
              setSortWheelOpen(false);
            }}
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
              <Pressable
                onPress={() => {
                  setWheelFieldKey(null);
                  setSortWheelOpen(false);
                }}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>
                {sortWheelOpen
                  ? 'Sort assets'
                  : filterFields.find((field) => field.key === wheelFieldKey)?.label ?? 'Select an option'}
              </Text>
              <Pressable
                onPress={() => {
                  if (sortWheelOpen) {
                    setSortBy(sortWheelDraftValue);
                    setSortWheelOpen(false);
                    return;
                  }
                  const activeField = filterFields.find((field) => field.key === wheelFieldKey);
                  activeField?.onSelect(wheelDraftValue ? wheelDraftValue : undefined);
                  setWheelFieldKey(null);
                }}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            {sortWheelOpen ? (
              <Picker
                selectedValue={sortWheelDraftValue}
                onValueChange={(value) =>
                  setSortWheelDraftValue(value as 'alphabetical' | 'conditionLowHigh' | 'criticalityHighLow')
                }
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}>
                <Picker.Item label="Sort alphabetic (A-Z)" value="alphabetical" />
                <Picker.Item label="Condition (Low-High)" value="conditionLowHigh" />
                <Picker.Item label="Criticality (High-Low)" value="criticalityHighLow" />
              </Picker>
            ) : (
              <Picker
                selectedValue={wheelDraftValue}
                onValueChange={(value) => setWheelDraftValue(String(value))}
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}>
                <Picker.Item
                  label={
                    wheelFieldKey === 'room' && !location
                      ? 'Select location first'
                      : 'Select an option'
                  }
                  value=""
                />
                {(filterFields.find((field) => field.key === wheelFieldKey)?.options ?? []).map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            )}
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );
}

