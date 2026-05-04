import React from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SearchInput } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
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
  | 'condition'
  | 'criticality'
  | 'status'
  | 'area'
  | 'department'
  | 'location'
  | 'room';

type FilterMode = 'search' | 'filters';

export default function AdminAssetsPage() {
  const t = useTheme();
  const { assignments } = useDemoState();

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
        condition,
        criticality,
        status,
        dept_id: allDepartments.find(d => d.name === department)?.id,
        location_id: allLocations.find(l => l.name === location)?.id,
        room_id: allRooms.find(r => r.name === room)?.id,
      });

      setSearchResults(results);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingSearch(false);
    }
  }, 300); // debounce

  return () => clearTimeout(timeout);
}, [query, category, condition, criticality, status, department, location, room]);

  const loadAssets = async (nextOffset = 0, append = false) => {
    try {
      const data = await fetchAssets({ offset: nextOffset, limit: PAGE_SIZE });
      setAssetRows((prev) => (append ? [...prev, ...data] : data));
      setOffset(nextOffset + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    (async () => {
      if (assetRows.length === 0) return;

      const departmentIds = assetRows.map((row) => row.dept_id).filter((id): id is string => Boolean(id));
      const locationIds = assetRows.map((row) => row.location_id).filter((id): id is string => Boolean(id));
      const roomIds = assetRows.map((row) => row.room_id).filter((id): id is string => Boolean(id));

      const [departmentMap, locationMap, roomMap] = await Promise.all([
        resolveDepartmentNames(departmentIds),
        resolveLocationNames(locationIds),
        resolveRoomNames(roomIds),
      ]);

      setDepartmentNamesById(departmentMap);
      setLocationNamesById(locationMap);
      setRoomNamesById(roomMap);
    })();
  }, [assetRows]);

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

  const departmentName = (asset: Asset) => departmentNamesById[asset.dept_id] || 'Unknown';
  const locationName = (asset: Asset) => locationNamesById[asset.location_id] || 'Unknown';
  const roomName = (asset: Asset) => roomNamesById[asset.room_id] || 'Unknown';

  const categories = Array.from(new Set(assetRows.map((a) => a.category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );

  const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs urgent attention'];
  const criticalities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'];
  const areaOptions = ['Back of house', 'Front of house'];

  const departments = allDepartments
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const locations = allLocations
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const selectedLocationId = allLocations.find((item) => item.name === location)?.id;

  const rooms = allRooms
    .filter((item) => !selectedLocationId || item.locationId === selectedLocationId)
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const statusLabel = (asset: Asset) => asset.status;

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
    const room = roomName(asset).toLowerCase();
    const locName = locationName(asset).toLowerCase();
    const deptName = departmentName(asset).toLowerCase();

    const isBack =
      locName.includes('operations') ||
      locName.includes('quarantine') ||
      locName.includes('veterinary') ||
      room.includes('back service') ||
      deptName.includes('operations') ||
      deptName.includes('animal care');

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
          ]}
        >
          <Text style={[t.text.body, { color: field.value ? t.colors.text.primary : t.colors.text.muted }]}>
            {field.value ?? (field.key === 'room' && !location ? 'Select location first' : 'Select an option')}
          </Text>
          <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
        </Pressable>
      </View>
    </View>
  );

  const filterField = (key: DropdownKey) => filterFields.find((field) => field.key === key)!;

  const rows = searchResults;

  const assignmentInProgressFor = (assetId: string) => {
    return assignments.find(
      (assignment) =>
        assignment.assetId === assetId &&
        ['Assigned', 'InProgress', 'DraftSaved'].includes(assignment.status)
    );
  };

  const toneForCell = (kind: 'condition' | 'criticality', value: string) => {
    if (kind === 'condition') {
      if (value === 'Excellent' || value === 'Good') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D' };
      if (value === 'Fair') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
      return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
    }
    if (value === 'Low') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
    if (value === 'Medium') return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B' };
    if (value === 'High') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
    return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
  };

  return (
    <AdminScreenScaffold title="Assets" onScroll={handleScroll}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Asset Management</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Source-of-truth view for registered sanctuary assets. {rows.length} loaded.
          </Text>
        </View>
        <ButtonLike label="Add asset" variant="primary" onPress={() => router.push('/admin/assets/create' as any)} />
      </View>

      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
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
            ]}
          >
            <Text
              style={[
                t.text.caption,
                { fontWeight: '700', color: filterMode === 'search' ? t.colors.brand.forest : t.colors.text.secondary },
              ]}
            >
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
            ]}
          >
            <Text
              style={[
                t.text.caption,
                { fontWeight: '700', color: filterMode === 'filters' ? t.colors.brand.forest : t.colors.text.secondary },
              ]}
            >
              Search by filters
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />
          <ButtonLike label="Reference data" onPress={() => router.push('/admin/reference-data' as any)} />
        </View>

        {filterMode === 'search' ? (
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search asset name, code, category or description..."          />
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
              ]}
            >
              <Text style={[t.text.caption, { fontWeight: '800', color: '#0F4A31', fontSize: 15 }]}>
                Reset filters
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ marginVertical: t.spacing.xl }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.md }}>
        <Text style={[t.text.title, { fontSize: 26, lineHeight: 32, marginBottom: t.spacing.md }]}>
          Asset Results
        </Text>

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

      <Text style={[t.text.caption, { marginTop: -t.spacing.md, marginBottom: t.spacing.md }]}>
        Table view for quick scanning and comparison.
      </Text>

      {loadingSearch && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator size="small" />
        </View>
      )}

      {!loadingSearch && rows.length === 0 && (
        <Text style={t.text.caption}>No assets found.</Text>
      )}

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
          <Text style={[t.text.caption, { flex: 2.8, fontWeight: '700' }]}>Asset</Text>
          <Text style={[t.text.caption, { flex: 2.2, fontWeight: '700' }]}>Location Context</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>Condition</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>Criticality</Text>
          <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700', textAlign: 'center' }]}>Actions</Text>
        </View>

        {rows.map((a, idx) => {
          const currentAssignment = assignmentInProgressFor(a.id);
          const departmentLabel = departmentNamesById[a.dept_id] || 'Unknown department';
          const locationLabel = locationNamesById[a.location_id] || 'Location unknown';
          const roomLabel = roomNamesById[a.room_id] || 'Room not set';
          const conditionColors = toneForCell('condition', a.condition);
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
              <View style={{ flex: 2.8, paddingRight: t.spacing.md }}>
                <Text style={[t.text.body, { fontWeight: '700', color: t.colors.brand.forest }]}>{a.name}</Text>
                <Text style={[t.text.caption, { marginTop: 2 }]}>
                  {a.asset_code} · {a.category}
                </Text>
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
                    alignSelf: 'center',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: conditionColors.bg,
                    maxWidth: '100%',
                  }}
                >
                  <Text style={{ color: conditionColors.text, fontSize: 12, fontWeight: '700', lineHeight: 16 }} numberOfLines={2}>
                    {a.condition === 'Needs urgent attention' ? 'Urgent' : a.condition}
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
                  }}
                >
                  <Text style={{ color: criticalityColors.text, fontSize: 12, fontWeight: '700' }}>{a.criticality}</Text>
                </View>
              </View>

              <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 14 }}>
                <Pressable
                  onPress={() => router.push(`/admin/assets/assign-report/${a.id}` as any)}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name={currentAssignment ? 'check-circle' : 'user-plus'} size={16} color="#2F5B45" />
                </Pressable>

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
                onValueChange={(value) =>
                  setSortWheelDraftValue(value as 'alphabetical' | 'conditionLowHigh' | 'criticalityHighLow')
                }
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}
              >
                <Picker.Item label="Sort alphabetic (A-Z)" value="alphabetical" />
                <Picker.Item label="Condition (Low-High)" value="conditionLowHigh" />
                <Picker.Item label="Criticality (High-Low)" value="criticalityHighLow" />
              </Picker>
            ) : (
              <Picker
                selectedValue={wheelDraftValue}
                onValueChange={(value) => setWheelDraftValue(String(value))}
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}
              >
                <Picker.Item label={wheelFieldKey === 'room' && !location ? 'Select location first' : 'Select an option'} value="" />
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