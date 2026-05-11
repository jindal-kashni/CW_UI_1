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
  | 'assetSubCategory'
  | 'assetDepartment'
  | 'assetLocation'
  | 'assetRoom'
  | 'assetFohBoh'
  | 'assetCriticality'
  | 'assetInspectionFrequency'
  | 'assetStatus'
  | 'locationDepartment'
  | 'locationSiteZone'
  | 'locationType'
  | 'roomLocation';

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
  'Other / Miscellaneous': ['Miscellaneous', 'Temporary Asset', 'Unclassified', 'Specialty Item', 'Other'],
};

function textValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function moneyValue(value: unknown) {
  return typeof value === 'number' ? `$${value.toLocaleString()}` : '—';
}

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
  const [assetSubCategory, setAssetSubCategory] = React.useState('');
  const [assetDepartment, setAssetDepartment] = React.useState('');
  const [assetLocation, setAssetLocation] = React.useState('');
  const [assetRoom, setAssetRoom] = React.useState('');
  const [assetFohBoh, setAssetFohBoh] = React.useState('');
  const [assetCriticality, setAssetCriticality] = React.useState('');
  const [assetInspectionFrequency, setAssetInspectionFrequency] = React.useState('');
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

  const makeOptions = (values: Array<string | null | undefined>) =>
    Array.from(new Set(values.filter((value): value is string => Boolean(value))))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));

  const safeDepartmentName = (deptId: string | null | undefined) =>
    deptId ? departmentNameById[deptId] : undefined;

  const safeLocationName = (locationId: string | null | undefined) =>
    locationId ? locationNameById[locationId] : undefined;

  const safeRoomName = (roomId: string | null | undefined) =>
    roomId ? roomNameById[roomId] : undefined;

  const assetLocationId = locations.find((item) => item.name === assetLocation)?.id;
  const assetSubCategoryOptions = assetCategory ? SUB_CATEGORY_OPTIONS[assetCategory] ?? [] : [];

  const dropdownOptions: Record<DropdownKey, Option[]> = {
    assetCategory: CATEGORY_OPTIONS.map((value) => ({ label: value, value })),
    assetSubCategory: assetSubCategoryOptions.map((value) => ({ label: value, value })),
    assetDepartment: makeOptions(departments.map((item) => item.name)),
    assetLocation: makeOptions(locations.map((item) => item.name)),
    assetRoom: makeOptions(
      rooms
        .filter((item) => !assetLocationId || item.locationId === assetLocationId)
        .map((item) => item.name)
    ),
    assetFohBoh: ['FOH', 'BOH', 'Mixed'].map((value) => ({ label: value, value })),
    assetCriticality: ['Critical', 'High', 'Medium', 'Low'].map((value) => ({ label: value, value })),
    assetInspectionFrequency: [
      'Monthly',
      'Quarterly',
      '6-monthly',
      'Annually',
      'Every 2 years',
      'Every 3 years',
      'Every 5 years',
      'As required',
    ].map((value) => ({ label: value, value })),
    assetStatus: ['Active', 'Under repair', 'Decommissioned', 'Disposed', 'Missing'].map((value) => ({
      label: value,
      value,
    })),

    locationDepartment: makeOptions(departments.map((item) => item.name)),
    locationSiteZone: makeOptions(locations.map((item) => item.siteZone)),
    locationType: makeOptions(locations.map((item) => item.type)),

    roomLocation: makeOptions(locations.map((item) => item.name)),
  };

  const dropdownLabels: Record<DropdownKey, string> = {
    assetCategory: 'Category',
    assetSubCategory: 'Sub-category',
    assetDepartment: 'Department',
    assetLocation: 'Location',
    assetRoom: 'Room',
    assetFohBoh: 'FOH / BOH',
    assetCriticality: 'Criticality',
    assetInspectionFrequency: 'Inspection frequency',
    assetStatus: 'Status',
    locationDepartment: 'Department',
    locationSiteZone: 'Site zone',
    locationType: 'Location type',
    roomLocation: 'Location',
  };

  const dropdownValues: Record<DropdownKey, string> = {
    assetCategory,
    assetSubCategory,
    assetDepartment,
    assetLocation,
    assetRoom,
    assetFohBoh,
    assetCriticality,
    assetInspectionFrequency,
    assetStatus,
    locationDepartment,
    locationSiteZone,
    locationType,
    roomLocation,
  };

  const setDropdownValue = (key: DropdownKey, value: string) => {
    if (key === 'assetCategory') {
      setAssetCategory(value);
      setAssetSubCategory('');
    }
    if (key === 'assetSubCategory') setAssetSubCategory(value);
    if (key === 'assetDepartment') setAssetDepartment(value);
    if (key === 'assetLocation') {
      setAssetLocation(value);
      setAssetRoom('');
    }
    if (key === 'assetRoom') setAssetRoom(value);
    if (key === 'assetFohBoh') setAssetFohBoh(value);
    if (key === 'assetCriticality') setAssetCriticality(value);
    if (key === 'assetInspectionFrequency') setAssetInspectionFrequency(value);
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
    setAssetSubCategory('');
    setAssetDepartment('');
    setAssetLocation('');
    setAssetRoom('');
    setAssetFohBoh('');
    setAssetCriticality('');
    setAssetInspectionFrequency('');
    setAssetStatus('');
    setLocationDepartment('');
    setLocationSiteZone('');
    setLocationType('');
    setRoomLocation('');
  };

  const q = query.trim().toLowerCase();

  const filteredAssets = assets
    .filter((asset) => {
      const locationName = safeLocationName(asset.location_id) ?? '';
      const roomName = safeRoomName(asset.room_id) ?? '';
      const departmentName = safeDepartmentName(asset.dept_id) ?? '';

      if (assetCategory && asset.category !== assetCategory) return false;
      if (assetSubCategory && asset.sub_category !== assetSubCategory) return false;
      if (assetDepartment && departmentName !== assetDepartment) return false;
      if (assetLocation && locationName !== assetLocation) return false;
      if (assetRoom && roomName !== assetRoom) return false;
      if (assetFohBoh && asset.foh_boh !== assetFohBoh) return false;
      if (assetCriticality && asset.criticality !== assetCriticality) return false;
      if (assetInspectionFrequency && asset.inspection_frequency !== assetInspectionFrequency) return false;
      if (assetStatus && asset.status !== assetStatus) return false;

      if (!q) return true;

      return `${asset.name} ${asset.asset_code} ${asset.category} ${asset.sub_category} ${asset.description} ${asset.make_model} ${asset.serial_number} ${asset.criticality} ${asset.status} ${asset.foh_boh} ${asset.inspection_frequency} ${locationName} ${roomName} ${departmentName}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredLocations = locations
    .filter((location) => {
      const departmentName = safeDepartmentName(location.departmentId) ?? '';

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
      const locationName = safeLocationName(room.locationId) ?? '';

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
        <Text
          style={[t.text.body, { color: dropdownValues[fieldKey] ? t.colors.text.primary : t.colors.text.muted }]}
          numberOfLines={1}
        >
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
    Boolean(assetSubCategory) ||
    Boolean(assetDepartment) ||
    Boolean(assetLocation) ||
    Boolean(assetRoom) ||
    Boolean(assetFohBoh) ||
    Boolean(assetCriticality) ||
    Boolean(assetInspectionFrequency) ||
    Boolean(assetStatus) ||
    Boolean(locationDepartment) ||
    Boolean(locationSiteZone) ||
    Boolean(locationType) ||
    Boolean(roomLocation);

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
              ? 'Search assets by name, code, category, sub-category, location or room...'
              : activeTab === 'locations'
                ? 'Search locations by name, type, zone, department or notes...'
                : 'Search rooms by name, number, floor, location or notes...'
          }
        />

        {activeTab === 'assets' ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetCategory" />
              <DropdownField fieldKey="assetSubCategory" disabled={!assetCategory} />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetDepartment" />
              <DropdownField fieldKey="assetLocation" />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetRoom" disabled={!assetLocation} />
              <DropdownField fieldKey="assetFohBoh" />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetCriticality" />
              <DropdownField fieldKey="assetStatus" />
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <DropdownField fieldKey="assetInspectionFrequency" />
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
                      {asset.sub_category || 'No sub-category'} · {safeLocationName(asset.location_id) || 'Unknown location'}
                    </Text>

                    {expanded ? (
                      <View
                        style={{
                          marginTop: t.spacing.sm,
                          borderTopWidth: 1,
                          borderTopColor: t.colors.border.subtle,
                          paddingTop: t.spacing.sm,
                          gap: 4,
                        }}
                      >
                        <DetailLine label="Asset ID" value={asset.id} />
                        <DetailLine label="Asset code" value={asset.asset_code} />
                        <DetailLine label="Name" value={asset.name} />
                        <DetailLine label="Category" value={asset.category} />
                        <DetailLine label="Sub-category" value={asset.sub_category} />
                        <DetailLine label="Description" value={asset.description} />
                        <DetailLine label="Department" value={safeDepartmentName(asset.dept_id)} />
                        <DetailLine label="Location" value={safeLocationName(asset.location_id)} />
                        <DetailLine label="Room" value={safeRoomName(asset.room_id)} />
                        <DetailLine label="FOH / BOH" value={asset.foh_boh} />
                        <DetailLine label="Make/model" value={asset.make_model} />
                        <DetailLine label="Serial number" value={asset.serial_number} />
                        <DetailLine label="Purchase date" value={asset.purchase_date} />
                        <DetailLine label="Purchase cost" value={moneyValue(asset.purchase_cost)} />
                        <DetailLine label="Replacement cost" value={moneyValue(asset.replacement_cost)} />
                        <DetailLine label="Warranty expiry" value={asset.warranty_expiry} />
                        <DetailLine label="Criticality" value={asset.criticality} />
                        <DetailLine label="Inspection frequency" value={asset.inspection_frequency} />
                        <DetailLine label="Status" value={asset.status} />
                        <DetailLine
                          label="Photos"
                          value={
                            asset.asset_photo_urls?.length
                              ? `${asset.asset_photo_urls.length} reference photo(s)`
                              : 'No photos uploaded'
                          }
                        />
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
                      {textValue(location.type)} · {textValue(location.siteZone)} ·{' '}
                      {safeDepartmentName(location.departmentId) || 'Unknown department'}
                    </Text>

                    {expanded ? (
                      <View
                        style={{
                          marginTop: t.spacing.sm,
                          borderTopWidth: 1,
                          borderTopColor: t.colors.border.subtle,
                          paddingTop: t.spacing.sm,
                          gap: 4,
                        }}
                      >
                        <DetailLine label="Location ID" value={location.id} />
                        <DetailLine label="Name" value={location.name} />
                        <DetailLine label="Type" value={location.type} />
                        <DetailLine label="Site zone" value={location.siteZone} />
                        <DetailLine label="Department" value={safeDepartmentName(location.departmentId)} />
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
                      {safeLocationName(room.locationId) || 'Unknown location'}
                    </Text>

                    {expanded ? (
                      <View
                        style={{
                          marginTop: t.spacing.sm,
                          borderTopWidth: 1,
                          borderTopColor: t.colors.border.subtle,
                          paddingTop: t.spacing.sm,
                          gap: 4,
                        }}
                      >
                        <DetailLine label="Room ID" value={room.id} />
                        <DetailLine label="Room name" value={room.name} />
                        <DetailLine label="Room number" value={room.roomNumber} />
                        <DetailLine label="Floor level" value={room.floorLevel} />
                        <DetailLine label="Location" value={safeLocationName(room.locationId)} />
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