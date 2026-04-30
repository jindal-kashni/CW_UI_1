import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SearchInput } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset } from '@/src/types/models';
import { fetchAssetsForList } from '@/src/services/assets';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { getSessionCache, setSessionCache } from '@/src/state/sessionCache';
import { resolveDepartmentNames, resolveLocationNames, resolveRoomNames } from '@/src/services/lookups';

type DropdownKey = 'category' | 'criticality' | 'status' | 'area' | 'department' | 'location' | 'room';
type FilterMode = 'search' | 'filters';
type AssetsCache = { rows: Asset[]; offset: number; hasMore: boolean };

export default function AuditAssetListScreen() {
  const t = useTheme();
  const { user } = useWorkspace();
  const [assetRows, setAssetRows] = React.useState<Asset[]>([]);
  const PAGE_SIZE = 20;
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const cacheKey = React.useMemo(() => `audit-assets-${user?.id ?? 'anon'}`, [user?.id]);

  const loadAssets = React.useCallback(async (nextOffset = 0, append = false) => {
    try {
      const data = await fetchAssetsForList({ offset: nextOffset, limit: PAGE_SIZE });
      setAssetRows((prev) => {
        const nextRows = append ? [...prev, ...data] : data;
        const computedOffset = append ? nextOffset + data.length : data.length;
        const nextHasMore = data.length === PAGE_SIZE;
        setOffset(computedOffset);
        setHasMore(nextHasMore);
        setSessionCache<AssetsCache>(cacheKey, {
          rows: nextRows,
          offset: computedOffset,
          hasMore: nextHasMore,
        });
        return nextRows;
      });
    } catch (error) {
      console.log(error);
    } finally {
      setInitialLoading(false);
    }
  }, [cacheKey]);

  React.useEffect(() => {
    const cached = getSessionCache<AssetsCache>(cacheKey);
    if (cached) {
      setAssetRows(cached.rows);
      setOffset(cached.offset);
      setHasMore(cached.hasMore);
      setInitialLoading(false);
      loadAssets(0, false);
      return;
    }
    loadAssets();
  }, [cacheKey, loadAssets]);

  React.useEffect(() => {
    let mounted = true;
    if (assetRows.length === 0) return;
    (async () => {
      const locationIds = Array.from(new Set(assetRows.map((a) => a.location_id).filter(Boolean)));
      const roomIds = Array.from(new Set(assetRows.map((a) => a.room_id).filter(Boolean)));
      const deptIds = Array.from(new Set(assetRows.map((a) => a.dept_id).filter(Boolean)));
      const [loc, room, dept] = await Promise.all([
        resolveLocationNames(locationIds),
        resolveRoomNames(roomIds),
        resolveDepartmentNames(deptIds),
      ]);
      if (!mounted) return;
      setLocationNameById(loc);
      setRoomNameById(room);
      setDepartmentNameById(dept);
    })();
    return () => {
      mounted = false;
    };
  }, [assetRows]);

  const loadMoreAssets = React.useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadAssets(offset, true);
    setLoadingMore(false);
  }, [hasMore, loadAssets, loadingMore, offset]);

  const handleScroll = React.useCallback(
    ({ nativeEvent }: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const threshold = 140;
      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
      if (nearBottom) {
        loadMoreAssets();
      }
    },
    [loadMoreAssets]
  );

  const [query, setQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('search');
  const [category, setCategory] = React.useState<string | undefined>(undefined);
  const [criticality, setCriticality] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [area, setArea] = React.useState<string | undefined>(undefined);
  const [department, setDepartment] = React.useState<string | undefined>(undefined);
  const [location, setLocation] = React.useState<string | undefined>(undefined);
  const [room, setRoom] = React.useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<'alphabetical' | 'criticalityHighLow'>('alphabetical');
  const [wheelFieldKey, setWheelFieldKey] = React.useState<DropdownKey | null>(null);
  const [wheelDraftValue, setWheelDraftValue] = React.useState('');
  const [sortWheelOpen, setSortWheelOpen] = React.useState(false);
  const [sortWheelDraftValue, setSortWheelDraftValue] = React.useState<'alphabetical' | 'criticalityHighLow'>('alphabetical');
  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const [roomNameById, setRoomNameById] = React.useState<Record<string, string>>({});
  const [departmentNameById, setDepartmentNameById] = React.useState<Record<string, string>>({});

  const categories = Array.from(new Set(assetRows.map((a) => a.category)));
  const criticalities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'];
  const areaOptions = ['Front of house', 'Back of house'];
  const departments = Array.from(
    new Set(assetRows.map((a) => departmentNameById[a.dept_id] || 'Unknown'))
  );
  const locations = Array.from(
    new Set(assetRows.map((a) => locationNameById[a.location_id] || 'Unknown'))
  );
  const rooms = Array.from(
    new Set(
      assetRows
        .filter(
          (a) =>
            !location ||
            (locationNameById[a.location_id] || 'Unknown') === location
        )
        .map((a) => roomNameById[a.room_id] || 'Unknown')
    )
  );

  const statusLabel = (asset: Asset) => asset.status;
  const activeFilterCount = [area, location, room, category, department, criticality, status].filter(Boolean).length;
  const clearAllFilters = () => {
    setCategory(undefined);
    setCriticality(undefined);
    setStatus(undefined);
    setArea(undefined);
    setDepartment(undefined);
    setLocation(undefined);
    setRoom(undefined);
  };

  const houseAreaForAsset = (asset: Asset) => {
    const roomName = (roomNameById[asset.room_id] ?? '').toLowerCase();
    const locationName = (locationNameById[asset.location_id] ?? '').toLowerCase();
    const departmentName = (departmentNameById[asset.dept_id] ?? '').toLowerCase();

    const isBack =
      locationName.includes('operations') ||
      locationName.includes('quarantine') ||
      locationName.includes('veterinary') ||
      roomName.includes('back service') ||
      departmentName.includes('operations') ||
      departmentName.includes('animal care');

    return isBack ? 'Back of house' : 'Front of house';
  };

  const sortLabel = sortBy === 'alphabetical' ? 'Alphabetic (A-Z)' : 'Criticality (High-Low)';
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
      options: categories.map((item) => ({ value: item, label: item === 'AnimalEnclosure' ? 'Enclosures' : item })),
      onSelect: (v?: string) => setCategory(v),
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

  const rows = assetRows
    .filter((a) => (filterMode === 'filters' ? (!category ? true : a.category === category) : true))
    .filter((a) => (filterMode === 'filters' ? (!criticality ? true : a.criticality === criticality) : true))
    .filter((a) => (filterMode === 'filters' ? (!status ? true : statusLabel(a) === status) : true))
    .filter((a) => (filterMode === 'filters' ? (!area ? true : houseAreaForAsset(a) === area) : true))
    .filter((a) =>
      filterMode === 'filters'
        ? !department ||
          (departmentNameById[a.dept_id] || 'Unknown') === department
        : true
    )
    .filter((a) =>
      filterMode === 'filters'
        ? !location || (locationNameById[a.location_id] || 'Unknown') === location
        : true
    )
    .filter((a) =>
      filterMode === 'filters'
        ? !room || (roomNameById[a.room_id] || 'Unknown') === room
        : true
    )
    .filter((a) => {
      if (filterMode !== 'search') return true;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const hay = `${a.name} ${a.asset_code} ${a.category} ${a.sub_category} ${locationNameById[a.location_id] ?? ''} ${roomNameById[a.room_id] ?? ''} ${departmentNameById[a.dept_id] ?? ''} ${a.criticality}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      return ['Critical', 'High', 'Medium', 'Low'].indexOf(a.criticality) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.criticality);
    });

  const toneForCell = (kind: 'criticality' | 'status', value: string) => {
    if (kind === 'criticality') {
      if (value === 'Low') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
      if (value === 'Medium') return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B' };
      if (value === 'High') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
      return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
    }
    if (value === 'Active') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D' };
    if (value === 'Under repair') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
    return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
  };

  return (
    <ScreenContainer>
      <TopBar title="Condition Report Assets" userName="Auditor" />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg, paddingBottom: t.spacing.xxxl }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Asset Management</Text>
              <Text style={[t.text.caption, { marginTop: -4 }]}>
                Source-of-truth view for registered sanctuary assets. {rows.length} loaded.
              </Text>
            </View>
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
                ]}>
                <Text
                  style={[
                    t.text.caption,
                    { fontWeight: '700', color: filterMode === 'search' ? t.colors.brand.forest : t.colors.text.secondary },
                  ]}>
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
                <Text
                  style={[
                    t.text.caption,
                    { fontWeight: '700', color: filterMode === 'filters' ? t.colors.brand.forest : t.colors.text.secondary },
                  ]}>
                  Search by filters
                </Text>
              </Pressable>
            </View>

            {filterMode === 'search' ? (
              <SearchInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search asset code, name, location, room, criticality..."
              />
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
                  {renderDropdownField(filterField('criticality'))}
                </View>
                <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                  {renderDropdownField(filterField('status'))}
                  <View style={{ flex: 1 }} />
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
              ]}>
              <Text style={[t.text.body, { color: t.colors.text.primary }]}>Sort: {sortLabel}</Text>
              <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
            </Pressable>
          </View>
          <Text style={[t.text.caption, { marginTop: -t.spacing.md, marginBottom: t.spacing.md }]}>
            Table view for quick scanning and comparison.
          </Text>

          {initialLoading ? (
            <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={t.colors.brand.forest} />
              <Text style={t.text.caption}>Loading asset results...</Text>
            </View>
          ) : (
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
              <Text style={[t.text.caption, { flex: 3, fontWeight: '700' }]}>Asset</Text>
              <Text style={[t.text.caption, { flex: 2.3, fontWeight: '700' }]}>Location Context</Text>
              <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700', textAlign: 'center' }]}>Status</Text>
              <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700', textAlign: 'center' }]}>Actions</Text>
            </View>

            {rows.map((a, idx) => {
              const departmentName =
                departmentNameById[a.dept_id] || 'Unknown department';
              const locationName = locationNameById[a.location_id] || 'Location unknown';
              const roomName = roomNameById[a.room_id] || 'Room not set';
              const statusColors = toneForCell('status', a.status);

              return (
                <Pressable
                  key={a.id}
                  onPress={() => router.push((`/asset/${a.id}` as any) as any)}
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
                  ]}>
                  <View style={{ flex: 3, paddingRight: t.spacing.md }}>
                    <Text style={[t.text.body, { fontWeight: '700', color: t.colors.brand.forest }]}>{a.name}</Text>
                    <Text style={[t.text.caption, { marginTop: 2 }]}>
                      {a.asset_code} · {a.category}
                    </Text>
                  </View>

                  <View style={{ flex: 2.3, paddingRight: t.spacing.md }}>
                    <Text style={t.text.caption}>{departmentName}</Text>
                    <Text style={[t.text.caption, { marginTop: 2 }]}>
                      {locationName} · {roomName}
                    </Text>
                  </View>

                  <View style={{ flex: 1.1, alignItems: 'center' }}>
                    <View
                      style={{
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        backgroundColor: statusColors.bg,
                      }}>
                      <Text style={{ color: statusColors.text, fontSize: 12, fontWeight: '700' }}>{a.status}</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1.1, alignItems: 'center', justifyContent: 'center' }}>
                    <Pressable
                      onPress={() => router.push((`/asset/${a.id}` as any) as any)}
                      style={({ pressed }) => [
                        {
                          minHeight: 32,
                          minWidth: 64,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#2F6B4B',
                          backgroundColor: pressed ? '#285E42' : '#2F6B4B',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>View</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
          )}

          {hasMore ? (
            <View style={{ marginTop: t.spacing.md, alignItems: 'center', minHeight: 36, justifyContent: 'center' }}>
              {loadingMore ? <ActivityIndicator size="small" color={t.colors.brand.forest} /> : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
      <AppBottomNav />

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
                onValueChange={(value) => setSortWheelDraftValue(value as 'alphabetical' | 'criticalityHighLow')}
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}>
                <Picker.Item label="Sort alphabetic (A-Z)" value="alphabetical" />
                <Picker.Item label="Criticality (High-Low)" value="criticalityHighLow" />
              </Picker>
            ) : (
              <Picker
                selectedValue={wheelDraftValue}
                onValueChange={(value) => setWheelDraftValue(String(value))}
                style={{ height: 230 }}
                itemStyle={{ fontSize: 18 }}>
                <Picker.Item
                  label={wheelFieldKey === 'room' && !location ? 'Select location first' : 'Select an option'}
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
    </ScreenContainer>
  );
}

