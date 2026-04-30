import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SearchInput } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { createLocation, deleteLocation, fetchLocations, updateLocation } from '@/src/services/referenceData';
import { resolveDepartmentNames } from '@/src/services/lookups';

export default function AdminLocationsPage() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [locations, setLocations] = React.useState<
    { id: string; name: string; type: string; siteZone: string; departmentId: string }[]
  >([]);
  const [loadingLocations, setLoadingLocations] = React.useState(true);
  const [departmentNameById, setDepartmentNameById] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [locationDraft, setLocationDraft] = React.useState({
    id: '',
    name: '',
    type: 'building' as 'building' | 'open_habitat' | 'enclosed_habitat',
    siteZone: '',
    departmentId: '',
    starRating: '3',
    evacuationPlanStatus: '',
    heritageListed: false,
    iconic: false,
    socialSignificance: '',
    culturalHeritage: '',
    communityAttachment: '',
    governmentCommitment: '',
    inspectionDate: '',
    inspectorName: '',
    assessorComments: '',
  });
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [locationPendingDelete, setLocationPendingDelete] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const rows = await fetchLocations();
    setLocations(rows);
    setLoadingLocations(false);
  }, []);

  React.useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  React.useEffect(() => {
    (async () => {
      const ids = Array.from(new Set(locations.map((location) => location.departmentId).filter(Boolean)));
      if (ids.length === 0) return;
      const names = await resolveDepartmentNames(ids);
      setDepartmentNameById(names);
    })();
  }, [locations]);

  const openCreate = () => {
    setLocationDraft({
      id: '',
      name: '',
      type: 'building',
      siteZone: '',
      departmentId: '',
      starRating: '3',
      evacuationPlanStatus: '',
      heritageListed: false,
      iconic: false,
      socialSignificance: '',
      culturalHeritage: '',
      communityAttachment: '',
      governmentCommitment: '',
      inspectionDate: '',
      inspectorName: '',
      assessorComments: '',
    });
    setShowLocationModal(true);
  };

  const openEdit = (location: (typeof locations)[number]) => {
    setLocationDraft({
      id: location.id,
      name: location.name,
      type:
        location.type === 'open_habitat' || location.type === 'enclosed_habitat'
          ? location.type
          : 'building',
      siteZone: location.siteZone || '',
      departmentId: location.departmentId || '',
      starRating: String(location.starRating ?? 3),
      evacuationPlanStatus: location.evacuationPlanStatus || '',
      heritageListed: Boolean(location.heritageListed),
      iconic: Boolean(location.iconic),
      socialSignificance: location.socialSignificance || '',
      culturalHeritage: location.culturalHeritage || '',
      communityAttachment: location.communityAttachment || '',
      governmentCommitment: location.governmentCommitment || '',
      inspectionDate: location.inspectionDate || '',
      inspectorName: location.inspectorName || '',
      assessorComments: location.assessorComments || '',
    });
    setShowLocationModal(true);
  };

  const saveLocation = async () => {
    if (!locationDraft.name.trim()) {
      setMessage('Location name is required.');
      return;
    }
    setSaving(true);
    try {
      if (locationDraft.id) {
        await updateLocation(locationDraft.id, {
          name: locationDraft.name,
          type: locationDraft.type,
          siteZone: locationDraft.siteZone,
          departmentId: locationDraft.departmentId || undefined,
          starRating: Number(locationDraft.starRating) || 3,
          evacuationPlanStatus: locationDraft.evacuationPlanStatus || undefined,
          heritageListed: locationDraft.heritageListed,
          iconic: locationDraft.iconic,
          socialSignificance: locationDraft.socialSignificance || undefined,
          culturalHeritage: locationDraft.culturalHeritage || undefined,
          communityAttachment: locationDraft.communityAttachment || undefined,
          governmentCommitment: locationDraft.governmentCommitment || undefined,
          inspectionDate: locationDraft.inspectionDate || undefined,
          inspectorName: locationDraft.inspectorName || undefined,
          assessorComments: locationDraft.assessorComments || undefined,
        });
        setMessage('Location updated successfully.');
      } else {
        await createLocation({
          name: locationDraft.name,
          type: locationDraft.type,
          siteZone: locationDraft.siteZone,
          departmentId: locationDraft.departmentId || undefined,
          starRating: Number(locationDraft.starRating) || 3,
          evacuationPlanStatus: locationDraft.evacuationPlanStatus || undefined,
          heritageListed: locationDraft.heritageListed,
          iconic: locationDraft.iconic,
          socialSignificance: locationDraft.socialSignificance || undefined,
          culturalHeritage: locationDraft.culturalHeritage || undefined,
          communityAttachment: locationDraft.communityAttachment || undefined,
          governmentCommitment: locationDraft.governmentCommitment || undefined,
          inspectionDate: locationDraft.inspectionDate || undefined,
          inspectorName: locationDraft.inspectorName || undefined,
          assessorComments: locationDraft.assessorComments || undefined,
        });
        setMessage('Location created successfully.');
      }
      setShowLocationModal(false);
      await refresh();
    } catch (error: any) {
      setMessage(error?.message ?? 'Could not save location.');
    } finally {
      setSaving(false);
    }
  };

  const rows = locations.filter((location) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const department = departmentNameById[location.departmentId] ?? '';
    return `${location.name} ${location.siteZone} ${location.type} ${department}`.toLowerCase().includes(q);
  });

  return (
    <AdminScreenScaffold title="Locations">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Locations</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Manage the sanctuary location hierarchy and inspection structure.
          </Text>
        </View>
        <Pressable onPress={openCreate} style={t.button.secondary}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add location</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search by location name, type, zone or department..." />
      <View style={{ height: t.spacing.lg }} />
      {message ? <Text style={[t.text.caption, { color: '#2F5B45', marginBottom: t.spacing.sm }]}>{message}</Text> : null}
      <View style={{ gap: t.spacing.md }}>
        {loadingLocations ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading locations...</Text>
          </View>
        ) : null}
        {!loadingLocations && rows.length === 0 ? (
          <Text style={t.text.caption}>No locations found yet.</Text>
        ) : !loadingLocations ? (
          rows.map((location) => (
            <Pressable
              key={location.id}
              onPress={() => router.push((`/admin/locations/${location.id}` as any) as any)}
              style={({ pressed }) => [
                {
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.lg,
                  backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : t.colors.card.surface,
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.md,
                  gap: 4,
                },
              ]}>
              <Text style={[t.text.body, { fontWeight: '700' }]}>{location.name}</Text>
              <Text style={t.text.caption}>
                {location.type || 'Location'} · {location.siteZone || 'No zone'} · {departmentNameById[location.departmentId] ?? 'Unknown'}
              </Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    openEdit(location);
                  }}>
                  <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    setLocationPendingDelete(location.id);
                  }}>
                  <Text style={[t.text.caption, { color: '#B63E34', fontWeight: '700' }]}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        ) : null}
      </View>
      <Modal visible={showLocationModal} transparent animationType="fade" onRequestClose={() => setShowLocationModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable onPress={() => setShowLocationModal(false)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View
            style={{
              width: '100%',
              maxWidth: 640,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}>
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>
              {locationDraft.id ? 'Edit location' : 'Create location'}
            </Text>
            <TextInput
              value={locationDraft.name}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, name: value }))}
              placeholder="Location name"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              {[
                { label: 'Building', value: 'building' },
                { label: 'Open habitat', value: 'open_habitat' },
                { label: 'Enclosed habitat', value: 'enclosed_habitat' },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setLocationDraft((prev) => ({ ...prev, type: item.value as any }))}
                  style={{
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor:
                      locationDraft.type === item.value ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                    backgroundColor: locationDraft.type === item.value ? '#2F6B4B' : t.colors.card.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ color: locationDraft.type === item.value ? '#fff' : '#2F5B45', fontWeight: '700' }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={locationDraft.siteZone}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, siteZone: value }))}
              placeholder="Site zone"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.departmentId}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, departmentId: value }))}
              placeholder="Department ID (optional)"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.evacuationPlanStatus}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, evacuationPlanStatus: value }))}
              placeholder="Evacuation plan status (optional)"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Pressable
                onPress={() => setLocationDraft((prev) => ({ ...prev, heritageListed: !prev.heritageListed }))}
                style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                  Heritage listed: {locationDraft.heritageListed ? 'Yes' : 'No'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLocationDraft((prev) => ({ ...prev, iconic: !prev.iconic }))}
                style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                  Iconic: {locationDraft.iconic ? 'Yes' : 'No'}
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={locationDraft.socialSignificance}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, socialSignificance: value }))}
              placeholder="Social significance"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.culturalHeritage}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, culturalHeritage: value }))}
              placeholder="Cultural heritage"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.communityAttachment}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, communityAttachment: value }))}
              placeholder="Community attachment"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.governmentCommitment}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, governmentCommitment: value }))}
              placeholder="Government commitment"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.inspectionDate}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, inspectionDate: value }))}
              placeholder="Inspection date (YYYY-MM-DD)"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.inspectorName}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, inspectorName: value }))}
              placeholder="Inspector name"
              placeholderTextColor={t.colors.text.muted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                fontSize: 15,
              }}
            />
            <TextInput
              value={locationDraft.assessorComments}
              onChangeText={(value) => setLocationDraft((prev) => ({ ...prev, assessorComments: value }))}
              placeholder="Assessor comments"
              placeholderTextColor={t.colors.text.muted}
              multiline
              style={{
                minHeight: 72,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                color: t.colors.text.primary,
                paddingHorizontal: t.spacing.md,
                paddingVertical: 10,
                fontSize: 15,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setShowLocationModal(false)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saving ? undefined : saveLocation}
                style={[t.button.secondary, { backgroundColor: '#2F6B4B', borderColor: '#2F6B4B' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save location'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(locationPendingDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationPendingDelete(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable onPress={() => setLocationPendingDelete(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View
            style={{
              width: '100%',
              maxWidth: 560,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}>
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete location?</Text>
            <Text style={t.text.caption}>This will permanently remove the location record.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
              <Pressable onPress={() => setLocationPendingDelete(null)} style={t.button.secondary}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!locationPendingDelete) return;
                  try {
                    await deleteLocation(locationPendingDelete);
                    setMessage('Location deleted.');
                    await refresh();
                  } catch (error: any) {
                    setMessage(error?.message ?? 'Could not delete location.');
                  } finally {
                    setLocationPendingDelete(null);
                  }
                }}
                style={[t.button.secondary, { backgroundColor: '#9C3D37', borderColor: '#9C3D37' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}

