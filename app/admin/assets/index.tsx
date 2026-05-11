import React from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { SearchInput } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset } from '@/src/types/models';
import { deleteAsset, fetchAssets, searchAssets } from '@/src/services/assets';
import { resolveDepartmentNames, resolveLocationNames, resolveRoomNames } from '@/src/services/lookups';
import {
  fetchDepartments,
  fetchLocations,
  fetchRooms,
  type DepartmentRecord,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';

type DropdownKey =
  | 'category'
  | 'subCategory'
  | 'criticality'
  | 'status'
  | 'fohBoh'
  | 'inspectionFrequency'
  | 'department'
  | 'location'
  | 'room';

type FilterMode = 'search' | 'filters';
type SortMode = 'alphabetical' | 'criticalityHighLow' | 'status';

const ASSET_CATEGORIES = [
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

const CRITICALITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'];
const FOH_BOH_OPTIONS = ['FOH', 'BOH', 'Mixed'];
const INSPECTION_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  '6-monthly',
  'Annually',
  'Every 2 years',
  'Every 3 years',
  'Every 5 years',
  'As required',
];

const CRITICALITY_ORDER: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function AdminAssetsPage() {
  const t = useTheme();

  const [assetRows, setAssetRows] = React.useState<Asset[]>([]);
  const PAGE_SIZE = 600;
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const [departmentNamesById, setDepartmentNamesById] = React.useState<Record<string, string>>({});
  const [locationNamesById, setLocationNamesById] = React.useState<Record<string, string>>({});
  const [roomNamesById, setRoomNamesById] = React.useState<Record<string, string>>({});

  const [allDepartments, setAllDepartments] = React.useState<DepartmentRecord[]>([]);
  const [allLocations, setAllLocations] = React.useState<LocationRecord[]>([]);
  const [allRooms, setAllRooms] = React.useState<RoomRecord[]>([]);

  const [query, setQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('search');

  const [category, setCategory] = React.useState<string | undefined>(undefined);
  const [subCategory, setSubCategory] = React.useState<string | undefined>(undefined);
  const [criticality, setCriticality] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [fohBoh, setFohBoh] = React.useState<string | undefined>(undefined);
  const [inspectionFrequency, setInspectionFrequency] = React.useState<string | undefined>(undefined);
  const [department, setDepartment] = React.useState<string | undefined>(undefined);
  const [location, setLocation] = React.useState<string | undefined>(undefined);
  const [room, setRoom] = React.useState<string | undefined>(undefined);

  const [sortBy, setSortBy] = React.useState<SortMode>('alphabetical');

  const [wheelFieldKey, setWheelFieldKey] = React.useState<DropdownKey | null>(null);
  const [wheelDraftValue, setWheelDraftValue] = React.useState('');
  const [sortWheelOpen, setSortWheelOpen] = React.useState(false);
  const [sortWheelDraftValue, setSortWheelDraftValue] = React.useState<SortMode>('alphabetical');

  const [assetPendingDelete, setAssetPendingDelete] = React.useState<Asset | null>(null);
  const [deleteStep, setDeleteStep] = React.useState<'confirm' | 'type-name'>('confirm');
  const [deleteNameInput, setDeleteNameInput] = React.useState('');

  const [searchResults, setSearchResults] = React.useState<Asset[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);

  React.useEffect(() => {
    loadAssets();
  }, []);

  React.useEffect(() => {
    const loadFilterReferenceData = async () => {
      try {
        const [departments, locations, rooms] = await Promise.all([
          fetchDepartments(),
          fetchLocations(),
          fetchRooms(),
        ]);

        setAllDepartments(departments);
        setAllLocations(locations);
        setAllRooms(rooms);
      } catch (error) {
        console.log(error);
      }
    };

    loadFilterReferenceData();
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoadingSearch(true);

      try {
        const results = await searchAssets({
          query,
          category,
          sub_category: subCategory,
          criticality,
          status,
          foh_boh: fohBoh,
          inspection_frequency: inspectionFrequency,
          dept_id: allDepartments.find((d) => d.name === department)?.id,
          location_id: allLocations.find((l) => l.name === location)?.id,
          room_id: allRooms.find((r) => r.name === room)?.id,
        });

        setSearchResults(results);
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    query,
    category,
    subCategory,
    criticality,
    status,
    fohBoh,
    inspectionFrequency,
    department,
    location,
    room,
    allDepartments,
    allLocations,
    allRooms,
  ]);

  const loadAssets = async (nextOffset = 0, append = false) => {
    try {
      const data = await fetchAssets({ offset: nextOffset, limit: PAGE_SIZE });
      setAssetRows((prev) => (append ? [...prev, ...data] : data));
      setSearchResults((prev) => (append ? [...prev, ...data] : data));
      setOffset(nextOffset + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    (async () => {
      const sourceRows = searchResults.length > 0 ? searchResults : assetRows;
      if (sourceRows.length === 0) return;

      const departmentIds = sourceRows.map((row) => row.dept_id).filter((id): id is string => Boolean(id));
      const locationIds = sourceRows.map((row) => row.location_id).filter((id): id is string => Boolean(id));
      const roomIds = sourceRows.map((row) => row.room_id).filter((id): id is string => Boolean(id));

      const [departmentMap, locationMap, roomMap] = await Promise.all([
        resolveDepartmentNames(departmentIds),
        resolveLocationNames(locationIds),
        resolveRoomNames(roomIds),
      ]);

      setDepartmentNamesById(departmentMap);
      setLocationNamesById(locationMap);
      setRoomNamesById(roomMap);
    })();
  }, [assetRows, searchResults]);

  const loadMoreAssets = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadAssets(offset, true);
    setLoadingMore(false);
  };

  const handleScroll = React.useCallback(
    ({
      nativeEvent,
    }: {
      nativeEvent: {
        layoutMeasurement: { height: number };
        contentOffset: { y: number };
        contentSize: { height: number };
      };
    }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const threshold = 140;
      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
      if (nearBottom) loadMoreAssets();
    },
    [loadMoreAssets]
  );

  const departmentName = (asset: Asset) =>
    (asset.dept_id ? departmentNamesById[asset.dept_id] : undefined) || 'Unknown department';

  const locationName = (asset: Asset) =>
    (asset.location_id ? locationNamesById[asset.location_id] : undefined) || 'Location unknown';

  const roomName = (asset: Asset) =>
    (asset.room_id ? roomNamesById[asset.room_id] : undefined) || 'Room not set';

  const selectedLocationId = allLocations.find((item) => item.name === location)?.id;

const subCategories = category
  ? SUB_CATEGORY_OPTIONS[category] ?? []
  : [];

  const departments = allDepartments
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const locations = allLocations
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const rooms = allRooms
    .filter((item) => !selectedLocationId || item.locationId === selectedLocationId)
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const activeFilterCount = [
    category,
    subCategory,
    criticality,
    status,
    fohBoh,
    inspectionFrequency,
    department,
    location,
    room,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setCategory(undefined);
    setSubCategory(undefined);
    setCriticality(undefined);
    setStatus(undefined);
    setFohBoh(undefined);
    setInspectionFrequency(undefined);
    setDepartment(undefined);
    setLocation(undefined);
    setRoom(undefined);
  };

  const sortLabel =
    sortBy === 'alphabetical'
      ? 'Alphabetic (A-Z)'
      : sortBy === 'criticalityHighLow'
        ? 'Criticality (High-Low)'
        : 'Status';

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
      options: ASSET_CATEGORIES.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => {
        setCategory(v);
        setSubCategory(undefined);
      },
      disabled: false,
    },
    {
      key: 'subCategory',
      label: 'Sub-category',
      value: subCategory,
      options: subCategories.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setSubCategory(v),
      disabled: !category,
    },
    {
      key: 'criticality',
      label: 'Criticality',
      value: criticality,
      options: CRITICALITIES.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setCriticality(v),
      disabled: false,
    },
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: STATUSES.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setStatus(v),
      disabled: false,
    },
    {
      key: 'fohBoh',
      label: 'FOH / BOH',
      value: fohBoh,
      options: FOH_BOH_OPTIONS.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setFohBoh(v),
      disabled: false,
    },
    {
      key: 'inspectionFrequency',
      label: 'Inspection frequency',
      value: inspectionFrequency,
      options: INSPECTION_FREQUENCIES.map((item) => ({ value: item, label: item })),
      onSelect: (v?: string) => setInspectionFrequency(v),
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
        ]}
      >
        <Text style={[t.text.body, { color: field.value ? t.colors.text.primary : t.colors.text.muted }]} numberOfLines={1}>
          {field.value ??
            (field.key === 'room' && !location
              ? 'Select location first'
              : field.key === 'subCategory' && !category
                ? 'Select category first'
                : 'Select an option')}
        </Text>
        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );

  const filterField = (key: DropdownKey) => filterFields.find((field) => field.key === key)!;

  const rows = React.useMemo(() => {
    const filtered = searchResults.filter((asset) => {
      if (subCategory && asset.sub_category !== subCategory) return false;
      if (fohBoh && asset.foh_boh !== fohBoh) return false;
      if (inspectionFrequency && asset.inspection_frequency !== inspectionFrequency) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'criticalityHighLow') {
        return (CRITICALITY_ORDER[b.criticality ?? ''] ?? 0) - (CRITICALITY_ORDER[a.criticality ?? ''] ?? 0);
      }

      if (sortBy === 'status') {
        return String(a.status ?? '').localeCompare(String(b.status ?? ''));
      }

      return a.name.localeCompare(b.name);
    });
  }, [searchResults, subCategory, fohBoh, inspectionFrequency, sortBy]);

  const toneForCell = (kind: 'status' | 'criticality', value?: string | null) => {
    if (kind === 'status') {
      if (value === 'Active') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D' };
      if (value === 'Under repair') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
      if (value === 'Missing') return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
      return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
    }

    if (value === 'Low') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
    if (value === 'Medium') return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B' };
    if (value === 'High') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
    if (value === 'Critical') return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
    return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
  };

  return (
    <AdminScreenScaffold title="Assets" onScroll={handleScroll}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Asset Management</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Static asset registry for sanctuary assets. {rows.length} shown.
          </Text>
        </View>
        <ButtonLike label="Add asset" variant="primary" onPress={() => router.push('/admin/assets/create' as any)} />
      </View>

      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          <FilterModeButton label="Search" active={filterMode === 'search'} onPress={() => setFilterMode('search')} />
          <FilterModeButton label="Search by filters" active={filterMode === 'filters'} onPress={() => setFilterMode('filters')} />
          <View style={{ flex: 1 }} />
          <ButtonLike label="Reference data" onPress={() => router.push('/admin/reference-data' as any)} />
        </View>

        {filterMode === 'search' ? (
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search asset code, name, category, sub-category or description..."
          />
        ) : (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('location'))}
              {renderDropdownField(filterField('room'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('category'))}
              {renderDropdownField(filterField('subCategory'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('department'))}
              {renderDropdownField(filterField('fohBoh'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('criticality'))}
              {renderDropdownField(filterField('status'))}
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {renderDropdownField(filterField('inspectionFrequency'))}
              <View style={{ flex: 1 }} />
            </View>
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
              ]}
            >
              <Text style={[t.text.caption, { fontWeight: '800', color: '#0F4A31', fontSize: 15 }]}>Reset filters</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ marginVertical: t.spacing.xl }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.md }}>
        <Text style={[t.text.title, { fontSize: 26, lineHeight: 32, marginBottom: t.spacing.md }]}>Asset Results</Text>

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
          ]}
        >
          <Text style={[t.text.body, { color: t.colors.text.primary }]}>Sort: {sortLabel}</Text>
          <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
        </Pressable>
      </View>

      {loadingSearch ? (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}

      {!loadingSearch && rows.length === 0 ? <Text style={t.text.caption}>No assets found.</Text> : null}

      <View
        style={{
          borderWidth: 1,
          borderColor: t.colors.border.subtle,
          borderRadius: t.radius.lg,
          overflow: 'hidden',
          backgroundColor: t.colors.card.surface,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.sm,
            backgroundColor: t.colors.card.surfaceAlt,
            borderBottomWidth: 1,
            borderBottomColor: t.colors.border.subtle,
          }}
        >
          <Text style={[t.text.caption, { flex: 2.6, fontWeight: '700' }]}>Asset</Text>
          <Text style={[t.text.caption, { flex: 2, fontWeight: '700' }]}>Category</Text>
          <Text style={[t.text.caption, { flex: 2.2, fontWeight: '700' }]}>Location Context</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>Status</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>Criticality</Text>
          <Text style={[t.text.caption, { flex: 0.8, fontWeight: '700', textAlign: 'center' }]}>Actions</Text>
        </View>

        {rows.map((a, idx) => {
          const departmentLabel = departmentName(a);
          const locationLabel = locationName(a);
          const roomLabel = roomName(a);
          const statusColors = toneForCell('status', a.status);
          const criticalityColors = toneForCell('criticality', a.criticality);

          return (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/admin/assets/${a.id}` as any)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.md,
                  borderBottomWidth: idx === rows.length - 1 ? 0 : 1,
                  borderBottomColor: t.colors.border.subtle,
                  backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : 'transparent',
                },
              ]}
            >
              <View style={{ flex: 2.6, paddingRight: t.spacing.md }}>
                <Text style={[t.text.body, { fontWeight: '700', color: t.colors.brand.forest }]}>{a.name}</Text>
                <Text style={[t.text.caption, { marginTop: 2 }]}>{a.asset_code}</Text>
              </View>

              <View style={{ flex: 2, paddingRight: t.spacing.md }}>
                <Text style={t.text.caption}>{a.category}</Text>
                <Text style={[t.text.caption, { marginTop: 2 }]}>{a.sub_category || 'No sub-category'}</Text>
              </View>

              <View style={{ flex: 2.2, paddingRight: t.spacing.md }}>
                <Text style={t.text.caption}>{departmentLabel}</Text>
                <Text style={[t.text.caption, { marginTop: 2 }]}>
                  {locationLabel} · {roomLabel}
                </Text>
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: statusColors.bg,
                    maxWidth: '100%',
                  }}
                >
                  <Text style={{ color: statusColors.text, fontSize: 12, fontWeight: '700', lineHeight: 16 }} numberOfLines={2}>
                    {a.status}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: criticalityColors.bg,
                  }}
                >
                  <Text style={{ color: criticalityColors.text, fontSize: 12, fontWeight: '700' }}>
                    {a.criticality || 'Not set'}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 14 }}>
                <Pressable
                  onPress={() => router.push((`/admin/assets/edit/${a.id}` as any) as any)}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name="pencil" size={17} color={t.colors.brand.forest} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setAssetPendingDelete(a);
                    setDeleteStep('confirm');
                    setDeleteNameInput('');
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name="trash" size={17} color="#9C3D37" />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>

      {hasMore ? (
        <View style={{ marginTop: t.spacing.md, alignItems: 'center', minHeight: 36, justifyContent: 'center' }}>
          {loadingMore ? <ActivityIndicator size="small" color={t.colors.brand.forest} /> : null}
        </View>
      ) : null}

      <Modal
        visible={Boolean(wheelFieldKey) || sortWheelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setWheelFieldKey(null);
          setSortWheelOpen(false);
        }}
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
              <Pressable
                onPress={() => {
                  setWheelFieldKey(null);
                  setSortWheelOpen(false);
                }}
              >
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
                }}
              >
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>

            {sortWheelOpen ? (
              <Picker
                selectedValue={sortWheelDraftValue}
                onValueChange={(value) => setSortWheelDraftValue(value as SortMode)}
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}
              >
                <Picker.Item label="Sort alphabetic (A-Z)" value="alphabetical" />
                <Picker.Item label="Criticality (High-Low)" value="criticalityHighLow" />
                <Picker.Item label="Status" value="status" />
              </Picker>
            ) : (
              <Picker
                selectedValue={wheelDraftValue}
                onValueChange={(value) => setWheelDraftValue(String(value))}
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}
              >
                <Picker.Item
                  label={
                    wheelFieldKey === 'room' && !location
                      ? 'Select location first'
                      : wheelFieldKey === 'subCategory' && !category
                        ? 'Select category first'
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

      <Modal
        visible={Boolean(assetPendingDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setAssetPendingDelete(null);
          setDeleteStep('confirm');
          setDeleteNameInput('');
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => {
              setAssetPendingDelete(null);
              setDeleteStep('confirm');
              setDeleteNameInput('');
            }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 620,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}
          >
            {deleteStep === 'confirm' ? (
              <>
                <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete asset?</Text>
                <Text style={t.text.caption}>
                  Are you sure you want to delete{' '}
                  <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{assetPendingDelete?.name}</Text>? This action
                  cannot be undone.
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
                  <ButtonLike
                    label="Cancel"
                    onPress={() => {
                      setAssetPendingDelete(null);
                      setDeleteStep('confirm');
                      setDeleteNameInput('');
                    }}
                  />
                  <ButtonLike label="Yes, continue" onPress={() => setDeleteStep('type-name')} />
                </View>
              </>
            ) : (
              <>
                <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Confirm deletion</Text>
                <Text style={t.text.caption}>
                  Type <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{assetPendingDelete?.name}</Text> to
                  confirm.
                </Text>

                <TextInput
                  value={deleteNameInput}
                  onChangeText={setDeleteNameInput}
                  placeholder="Enter asset name exactly"
                  placeholderTextColor={t.colors.text.muted}
                  autoCapitalize="none"
                  style={{
                    minHeight: 48,
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                    borderRadius: t.radius.lg,
                    backgroundColor: t.colors.card.surfaceAlt,
                    paddingHorizontal: t.spacing.md,
                    color: t.colors.text.primary,
                    fontSize: 16,
                  }}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
                  <ButtonLike
                    label="Cancel"
                    onPress={() => {
                      setAssetPendingDelete(null);
                      setDeleteStep('confirm');
                      setDeleteNameInput('');
                    }}
                  />
                  <ButtonLike
                    label="Delete asset"
                    onPress={async () => {
                      if (!assetPendingDelete) return;
                      if (deleteNameInput !== assetPendingDelete.name) return;

                      await deleteAsset(assetPendingDelete.id);
                      setAssetRows((prev) => prev.filter((item) => item.id !== assetPendingDelete.id));
                      setSearchResults((prev) => prev.filter((item) => item.id !== assetPendingDelete.id));
                      setAssetPendingDelete(null);
                      setDeleteStep('confirm');
                      setDeleteNameInput('');
                    }}
                    variant="danger"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}

function FilterModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 38,
          borderRadius: 999,
          paddingHorizontal: 14,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: active ? 'rgba(31,59,44,0.22)' : t.colors.border.subtle,
          backgroundColor: active ? t.colors.brand.forestTint : pressed ? 'rgba(30,31,28,0.04)' : t.colors.card.surface,
        },
      ]}
    >
      <Text
        style={[
          t.text.caption,
          {
            fontWeight: '700',
            color: active ? t.colors.brand.forest : t.colors.text.secondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ButtonLike({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 40,
          borderRadius: 999,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: isDanger ? '#9C3D37' : isPrimary ? '#1F563D' : 'rgba(0,74,38,0.22)',
          backgroundColor: isDanger
            ? pressed
              ? '#862F2A'
              : '#9C3D37'
            : isPrimary
              ? pressed
                ? '#194933'
                : '#1F563D'
              : pressed
                ? 'rgba(0,74,38,0.08)'
                : '#FBF7F0',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: isPrimary || isDanger ? '#FFFFFF' : '#2F5B45' }}>
        {label}
      </Text>
    </Pressable>
  );
}