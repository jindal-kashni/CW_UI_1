import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SearchInput } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset } from '@/src/types/models';
import { fetchAssets } from '@/src/services/assets';
import {
  fetchDepartments,
  fetchLocations,
  fetchRooms,
  type DepartmentRecord,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';

type ActiveTab = 'assets' | 'locations' | 'rooms';

type DropdownKey =
  | 'assetCategory'
  | 'assetDepartment'
  | 'assetLocation'
  | 'assetRoom'
  | 'assetCondition'
  | 'assetCriticality'
  | 'assetStatus'
  | 'locationDepartment'
  | 'locationSiteZone'
  | 'locationType'
  | 'roomLocation'

type Option = {
  label: string;
  value: string;
};

export default function AuditAssetListScreen() {
  const t = useTheme();

  const [activeTab, setActiveTab] = React.useState<ActiveTab>('assets');
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [rooms, setRooms] = React.useState<RoomRecord[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);

  const [expandedAssetId, setExpandedAssetId] = React.useState<string | null>(null);
  const [expandedLocationId, setExpandedLocationId] = React.useState<string | null>(null);
  const [expandedRoomId, setExpandedRoomId] = React.useState<string | null>(null);

  const [assetCategory, setAssetCategory] = React.useState('');
  const [assetDepartment, setAssetDepartment] = React.useState('');
  const [assetLocation, setAssetLocation] = React.useState('');
  const [assetRoom, setAssetRoom] = React.useState('');
  const [assetCondition, setAssetCondition] = React.useState('');
  const [assetCriticality, setAssetCriticality] = React.useState('');
  const [assetStatus, setAssetStatus] = React.useState('');

  const [locationDepartment, setLocationDepartment] = React.useState('');
  const [locationSiteZone, setLocationSiteZone] = React.useState('');
  const [locationType, setLocationType] = React.useState('');

  const [roomLocation, setRoomLocation] = React.useState('');

  const [dropdownOpen, setDropdownOpen] = React.useState<DropdownKey | null>(null);
  const [dropdownDraftValue, setDropdownDraftValue] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [assetRows, locationRows, roomRows, departmentRows] = await Promise.all([
          fetchAssets({ limit: 1000 }),
          fetchLocations(),
          fetchRooms(),
          fetchDepartments(),
        ]);

        setAssets(assetRows);
        setLocations(locationRows);
        setRooms(roomRows);
        setDepartments(departmentRows);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const departmentNameById = React.useMemo(
    () => Object.fromEntries(departments.map((item) => [item.id, item.name])),
    [departments]
  );

  const locationNameById = React.useMemo(
    () => Object.fromEntries(locations.map((item) => [item.id, item.name])),
    [locations]
  );

  const roomNameById = React.useMemo(
    () => Object.fromEntries(rooms.map((item) => [item.id, item.name])),
    [rooms]
  );

  const makeOptions = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));

  const assetLocationId = locations.find((item) => item.name === assetLocation)?.id;

  const dropdownOptions: Record<DropdownKey, Option[]> = {
    assetCategory: makeOptions(assets.map((item) => item.category)),
    assetDepartment: makeOptions(departments.map((item) => item.name)),
    assetLocation: makeOptions(locations.map((item) => item.name)),
    assetRoom: makeOptions(
      rooms
        .filter((item) => !assetLocationId || item.locationId === assetLocationId)
        .map((item) => item.name)
    ),
    assetCondition: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs urgent attention'].map((value) => ({ label: value, value })),
    assetCriticality: ['Low', 'Medium', 'High', 'Critical'].map((value) => ({ label: value, value })),
    assetStatus: ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'].map((value) => ({ label: value, value })),

    locationDepartment: makeOptions(departments.map((item) => item.name)),
    locationSiteZone: makeOptions(locations.map((item) => item.siteZone)),
    locationType: makeOptions(locations.map((item) => item.type)),

    roomLocation: makeOptions(locations.map((item) => item.name)),
  };

  const dropdownLabels: Record<DropdownKey, string> = {
    assetCategory: 'Category',
    assetDepartment: 'Department',
    assetLocation: 'Location',
    assetRoom: 'Room',
    assetCondition: 'Condition',
    assetCriticality: 'Criticality',
    assetStatus: 'Status',
    locationDepartment: 'Department',
    locationSiteZone: 'Site zone',
    locationType: 'Location type',
    roomLocation: 'Location',
  };

  const dropdownValues: Record<DropdownKey, string> = {
    assetCategory,
    assetDepartment,
    assetLocation,
    assetRoom,
    assetCondition,
    assetCriticality,
    assetStatus,
    locationDepartment,
    locationSiteZone,
    locationType,
    roomLocation,
  };

  const setDropdownValue = (key: DropdownKey, value: string) => {
    if (key === 'assetCategory') setAssetCategory(value);
    if (key === 'assetDepartment') setAssetDepartment(value);
    if (key === 'assetLocation') {
      setAssetLocation(value);
      setAssetRoom('');
    }
    if (key === 'assetRoom') setAssetRoom(value);
    if (key === 'assetCondition') setAssetCondition(value);
    if (key === 'assetCriticality') setAssetCriticality(value);
    if (key === 'assetStatus') setAssetStatus(value);

    if (key === 'locationDepartment') setLocationDepartment(value);
    if (key === 'locationSiteZone') setLocationSiteZone(value);
    if (key === 'locationType') setLocationType(value);

    if (key === 'roomLocation') setRoomLocation(value);
  };

  const openDropdown = (key: DropdownKey) => {
    setDropdownOpen(key);
    setDropdownDraftValue(dropdownValues[key]);
  };

  const clearFilters = () => {
    setQuery('');
    setAssetCategory('');
    setAssetDepartment('');
    setAssetLocation('');
    setAssetRoom('');
    setAssetCondition('');
    setAssetCriticality('');
    setAssetStatus('');
    setLocationDepartment('');
    setLocationSiteZone('');
    setLocationType('');
    setRoomLocation('');
  };

  const q = query.trim().toLowerCase();

  const filteredAssets = assets
    .filter((asset) => {
      const locationName = locationNameById[asset.location_id] ?? '';
      const roomName = roomNameById[asset.room_id] ?? '';
      const departmentName = departmentNameById[asset.dept_id] ?? '';

      if (assetCategory && asset.category !== assetCategory) return false;
      if (assetDepartment && departmentName !== assetDepartment) return false;
      if (assetLocation && locationName !== assetLocation) return false;
      if (assetRoom && roomName !== assetRoom) return false;
      if (assetCondition && asset.condition !== assetCondition) return false;
      if (assetCriticality && asset.criticality !== assetCriticality) return false;
      if (assetStatus && asset.status !== assetStatus) return false;

      if (!q) return true;

      return `${asset.name} ${asset.asset_code} ${asset.category} ${asset.sub_category} ${asset.description} ${asset.make_model} ${asset.serial_number} ${asset.condition} ${asset.criticality} ${asset.status} ${locationName} ${roomName} ${departmentName}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredLocations = locations
    .filter((location) => {
      const departmentName = departmentNameById[location.departmentId] ?? '';

      if (locationDepartment && departmentName !== locationDepartment) return false;
      if (locationSiteZone && location.siteZone !== locationSiteZone) return false;
      if (locationType && location.type !== locationType) return false;

      if (!q) return true;

      return `${location.name} ${location.type} ${location.siteZone} ${departmentName} ${location.starRating} ${location.evacuationPlanStatus} ${location.socialSignificance} ${location.culturalHeritage} ${location.communityAttachment} ${location.governmentCommitment} ${location.inspectorName} ${location.assessorComments}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredRooms = rooms
    .filter((room) => {
      const locationName = locationNameById[room.locationId] ?? '';

      if (roomLocation && locationName !== roomLocation) return false;

      if (!q) return true;

      return `${room.name} ${room.roomNumber} ${room.floorLevel} ${room.notes} ${locationName}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const countLabel =
    activeTab === 'assets'
      ? `${filteredAssets.length} assets`
      : activeTab === 'locations'
        ? `${filteredLocations.length} locations`
        : `${filteredRooms.length} rooms`;

  const DetailLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Text style={t.text.caption}>
      <Text style={{ fontWeight: '700' }}>{label}: </Text>
      {value || '—'}
    </Text>
  );

  const DropdownField = ({ fieldKey, disabled = false }: { fieldKey: DropdownKey; disabled?: boolean }) => (
    <View style={{ flex: 1, gap: 6, opacity: disabled ? 0.6 : 1 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{dropdownLabels[fieldKey]}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => openDropdown(fieldKey)}
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
        <Text style={[t.text.body, { color: dropdownValues[fieldKey] ? t.colors.text.primary : t.colors.text.muted }]}>
          {dropdownValues[fieldKey] || (disabled ? 'Select parent first' : 'Select an option')}
        </Text>
        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );

  const tabButton = (key: ActiveTab, label: string) => {
    const selected = activeTab === key;

    return (
      <Pressable
        key={key}
        onPress={() => {
          setActiveTab(key);
          setQuery('');
        }}
        style={({ pressed }) => [
          {
            minHeight: 38,
            borderRadius: 999,
            paddingHorizontal: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
            backgroundColor: selected ? '#2F6B4B' : pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
          },
        ]}
      >
        <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{label}</Text>
      </Pressable>
    );
  };

  const hasActiveFilters =
    Boolean(query) ||
    Boolean(assetCategory) ||
    Boolean(assetDepartment) ||
    Boolean(assetLocation) ||
    Boolean(assetRoom) ||
    Boolean(assetCondition) ||
    Boolean(assetCriticality) ||
    Boolean(assetStatus) ||
    Boolean(locationDepartment) ||
    Boolean(locationSiteZone) ||
    Boolean(locationType) ||
    Boolean(roomLocation)

  return (
    <ScreenContainer>
      <TopBar title="Asset, Location & Room Info" userName="Auditor" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>
            Asset, Location & Room Information
          </Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Read-only source-of-truth view for auditors. {countLabel} shown.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />

        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {tabButton('assets', 'Assets')}
          {tabButton('locations', 'Locations')}
          {tabButton('rooms', 'Rooms')}
        </View>

        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            activeTab === 'assets'
              ? 'Search assets by name, code, category, location or room...'
              : activeTab === 'locations'
                ? 'Search locations by name, type, zone, department or notes...'
                : 'Search rooms by name, number, floor, location or notes...'
          }
        />

        {activeTab === 'assets' ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetCategory" />
              <DropdownField fieldKey="assetDepartment" />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetLocation" />
              <DropdownField fieldKey="assetRoom" disabled={!assetLocation} />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetCondition" />
              <DropdownField fieldKey="assetCriticality" />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetStatus" />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        {activeTab === 'locations' ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="locationDepartment" />
              <DropdownField fieldKey="locationSiteZone" />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="locationType" />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        {activeTab === 'rooms' ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="roomLocation" />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        {hasActiveFilters ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Pressable
              onPress={clearFilters}
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

        {loading ? (
          <View style={{ minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading information...</Text>
          </View>
        ) : null}

        {!loading && activeTab === 'assets' ? (
          <View style={{ gap: t.spacing.md }}>
            {filteredAssets.length === 0 ? (
              <Text style={t.text.caption}>No assets found.</Text>
            ) : (
              filteredAssets.map((asset) => {
                const expanded = expandedAssetId === asset.id;

                return (
                  <View
                    key={asset.id}
                    style={{
                      borderWidth: 1,
                      borderColor: t.colors.border.subtle,
                      borderRadius: t.radius.lg,
                      backgroundColor: t.colors.card.surface,
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.md,
                      gap: 6,
                    }}
                  >
                    <Text style={[t.text.body, { fontWeight: '700' }]}>{asset.name}</Text>
                    <Text style={t.text.caption}>
                      {asset.asset_code} · {asset.category || 'No category'} ·{' '}
                      {locationNameById[asset.location_id] || 'Unknown location'}
                    </Text>

                    {expanded ? (
                      <View style={{ marginTop: t.spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border.subtle, paddingTop: t.spacing.sm, gap: 4 }}>
                        <DetailLine label="Asset ID" value={asset.id} />
                        <DetailLine label="Asset code" value={asset.asset_code} />
                        <DetailLine label="Name" value={asset.name} />
                        <DetailLine label="Category" value={asset.category} />
                        <DetailLine label="Sub category" value={asset.sub_category} />
                        <DetailLine label="Description" value={asset.description} />
                        <DetailLine label="Make/model" value={asset.make_model} />
                        <DetailLine label="Serial number" value={asset.serial_number} />
                        <DetailLine label="Condition" value={asset.condition} />
                        <DetailLine label="Criticality" value={asset.criticality} />
                        <DetailLine label="Status" value={asset.status} />
                        <DetailLine label="Department" value={departmentNameById[asset.dept_id]} />
                        <DetailLine label="Location" value={locationNameById[asset.location_id]} />
                        <DetailLine label="Room" value={roomNameById[asset.room_id]} />
                        <DetailLine label="Assigned to" value={asset.assigned_to} />
                        <DetailLine label="Remaining life" value={`${asset.remaining_life_years || 0} years`} />
                        <DetailLine label="Utilisation" value={asset.utilisation} />
                        <DetailLine label="Compatibility of use" value={asset.compatibility_of_use} />
                        <DetailLine label="Environmental impact" value={asset.environmental_impact} />
                        <DetailLine label="Purchase date" value={asset.purchase_date} />
                        <DetailLine label="Purchase cost" value={typeof asset.purchase_cost === 'number' ? `$${asset.purchase_cost.toLocaleString()}` : '—'} />
                        <DetailLine label="Replacement cost" value={typeof asset.replacement_cost === 'number' ? `$${asset.replacement_cost.toLocaleString()}` : '—'} />
                        <DetailLine label="Warranty expiry" value={asset.warranty_expiry} />
                        <DetailLine label="Last serviced" value={asset.last_serviced_date} />
                        <DetailLine label="Next service" value={asset.next_service_date} />
                        <DetailLine label="Notes" value={asset.notes} />
                      </View>
                    ) : null}

                    <Pressable onPress={() => setExpandedAssetId((current) => (current === asset.id ? null : asset.id))}>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                        {expanded ? 'Hide details' : 'View details'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {!loading && activeTab === 'locations' ? (
          <View style={{ gap: t.spacing.md }}>
            {filteredLocations.length === 0 ? (
              <Text style={t.text.caption}>No locations found.</Text>
            ) : (
              filteredLocations.map((location) => {
                const expanded = expandedLocationId === location.id;

                return (
                  <View
                    key={location.id}
                    style={{
                      borderWidth: 1,
                      borderColor: t.colors.border.subtle,
                      borderRadius: t.radius.lg,
                      backgroundColor: t.colors.card.surface,
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.md,
                      gap: 6,
                    }}
                  >
                    <Text style={[t.text.body, { fontWeight: '700' }]}>{location.name}</Text>
                    <Text style={t.text.caption}>
                      {location.type || 'Location'} · {location.siteZone || 'No zone'} ·{' '}
                      {departmentNameById[location.departmentId] ?? 'Unknown department'}
                    </Text>

                    {expanded ? (
                      <View style={{ marginTop: t.spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border.subtle, paddingTop: t.spacing.sm, gap: 4 }}>
                        <DetailLine label="Location ID" value={location.id} />
                        <DetailLine label="Name" value={location.name} />
                        <DetailLine label="Type" value={location.type} />
                        <DetailLine label="Site zone" value={location.siteZone} />
                        <DetailLine label="Department" value={departmentNameById[location.departmentId]} />
                        <DetailLine label="Department ID" value={location.departmentId} />
                        <DetailLine label="Star rating" value={location.starRating} />
                        <DetailLine label="Evacuation plan" value={location.evacuationPlanStatus} />
                        <DetailLine label="Heritage listed" value={location.heritageListed ? 'Yes' : 'No'} />
                        <DetailLine label="Iconic" value={location.iconic ? 'Yes' : 'No'} />
                        <DetailLine label="Social significance" value={location.socialSignificance} />
                        <DetailLine label="Cultural heritage" value={location.culturalHeritage} />
                        <DetailLine label="Community attachment" value={location.communityAttachment} />
                        <DetailLine label="Government commitment" value={location.governmentCommitment} />
                        <DetailLine label="Inspection date" value={location.inspectionDate} />
                        <DetailLine label="Inspector name" value={location.inspectorName} />
                        <DetailLine label="Assessor comments" value={location.assessorComments} />
                      </View>
                    ) : null}

                    <Pressable onPress={() => setExpandedLocationId((current) => (current === location.id ? null : location.id))}>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                        {expanded ? 'Hide details' : 'View details'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {!loading && activeTab === 'rooms' ? (
          <View style={{ gap: t.spacing.md }}>
            {filteredRooms.length === 0 ? (
              <Text style={t.text.caption}>No rooms found.</Text>
            ) : (
              filteredRooms.map((room) => {
                const expanded = expandedRoomId === room.id;

                return (
                  <View
                    key={room.id}
                    style={{
                      borderWidth: 1,
                      borderColor: t.colors.border.subtle,
                      borderRadius: t.radius.lg,
                      backgroundColor: t.colors.card.surface,
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.md,
                      gap: 6,
                    }}
                  >
                    <Text style={[t.text.body, { fontWeight: '700' }]}>{room.name || room.id}</Text>
                    <Text style={t.text.caption}>
                      {room.roomNumber || 'No room number'} · {room.floorLevel || 'No floor'} ·{' '}
                      {locationNameById[room.locationId] ?? 'Unknown location'}
                    </Text>

                    {expanded ? (
                      <View style={{ marginTop: t.spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border.subtle, paddingTop: t.spacing.sm, gap: 4 }}>
                        <DetailLine label="Room ID" value={room.id} />
                        <DetailLine label="Room name" value={room.name} />
                        <DetailLine label="Room number" value={room.roomNumber} />
                        <DetailLine label="Floor level" value={room.floorLevel} />
                        <DetailLine label="Location" value={locationNameById[room.locationId]} />
                        <DetailLine label="Location ID" value={room.locationId} />
                        <DetailLine label="Notes" value={room.notes} />
                      </View>
                    ) : null}

                    <Pressable onPress={() => setExpandedRoomId((current) => (current === room.id ? null : room.id))}>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                        {expanded ? 'Hide details' : 'View details'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        ) : null}
      </ScrollView>

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

              <Text style={[t.text.caption, { fontWeight: '700' }]}>
                {dropdownOpen ? dropdownLabels[dropdownOpen] : 'Select option'}
              </Text>

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
              <Picker.Item label="All" value="" />
              {dropdownOpen
                ? dropdownOptions[dropdownOpen].map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))
                : null}
            </Picker>
          </View>
        </View>
      </Modal>

      <AppBottomNav />
    </ScreenContainer>
  );
}