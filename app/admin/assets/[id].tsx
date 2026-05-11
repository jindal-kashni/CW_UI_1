import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, StatusBadge } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import type { Asset } from '@/src/types/models';
import { deleteAsset, fetchAssetById } from '@/src/services/assets';
import {
  fetchDepartments,
  fetchLocations,
  fetchRooms,
  type DepartmentRecord,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';

export default function AdminAssetDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [location, setLocation] = React.useState<LocationRecord | null>(null);
  const [room, setRoom] = React.useState<RoomRecord | null>(null);
  const [department, setDepartment] = React.useState<DepartmentRecord | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [assetPendingDelete, setAssetPendingDelete] = React.useState(false);
  const [deleteStep, setDeleteStep] = React.useState<'confirm' | 'type-name'>('confirm');
  const [deleteNameInput, setDeleteNameInput] = React.useState('');

  React.useEffect(() => {
    if (!id) return;

    const fetchAsset = async () => {
      setLoading(true);

      try {
        const data = await fetchAssetById(id);

        if (!data) {
          setAsset(null);
          setLoading(false);
          return;
        }

        setAsset(data);

        const [departments, locations, rooms] = await Promise.all([
          fetchDepartments(),
          fetchLocations(),
          fetchRooms(),
        ]);

        setDepartment(departments.find((item) => item.id === data.dept_id) ?? null);
        setLocation(locations.find((item) => item.id === data.location_id) ?? null);
        setRoom(rooms.find((item) => item.id === data.room_id) ?? null);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 22, lineHeight: 28, marginBottom: t.spacing.md }]}>
      {title}
    </Text>
  );

  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <TopBar
          title="Asset Detail"
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
          title="Asset Detail"
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

  const currentAsset = asset;
  const statusLabel = currentAsset.status;

  const handleDeleteAsset = async () => {
    if (deleteNameInput !== currentAsset.name) return;

    try {
      await deleteAsset(currentAsset.id);
    } catch (error) {
      console.log(error);
      return;
    }

    setAssetPendingDelete(false);
    setDeleteStep('confirm');
    setDeleteNameInput('');
    router.replace('/admin/assets' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Asset Detail"
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
        }}
      >
        <SectionHeading title="Core Asset Identification" />

        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 26, lineHeight: 32 }]}>{currentAsset.name}</Text>
              <Text style={[t.text.caption, { marginTop: 4 }]}>
                {currentAsset.asset_code} · {currentAsset.category} · {currentAsset.sub_category || 'No sub-category'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: t.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Pressable
                  onPress={() => router.push((`/admin/assets/edit/${currentAsset.id}` as any) as any)}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name="pencil" size={22} color={t.colors.brand.forest} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setAssetPendingDelete(true);
                    setDeleteStep('confirm');
                    setDeleteNameInput('');
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name="trash" size={22} color="#9C3D37" />
                </Pressable>

                <StatusBadge label={statusLabel} tone={statusLabel === 'Active' ? 'good' : 'warn'} />
              </View>
            </View>
          </View>

          <Text style={t.text.bodyMuted}>{currentAsset.description || 'No description provided.'}</Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Asset Location & Ownership" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Location:</Text> {location?.name ?? 'Unknown'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Room:</Text> {room?.name ?? 'Room not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Department:</Text> {department?.name ?? 'Unknown'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>FOH / BOH:</Text> {currentAsset.foh_boh || 'Not set'}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Asset Details" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Make / model:</Text> {currentAsset.make_model || 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Serial number:</Text> {currentAsset.serial_number || 'Not set'}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Asset Financial & Lifecycle Data" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Purchase / install date:</Text>{' '}
            {currentAsset.purchase_date ? formatDateDDMMYYYY(currentAsset.purchase_date) : 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Purchase cost:</Text>{' '}
            {typeof currentAsset.purchase_cost === 'number' ? `$${currentAsset.purchase_cost.toLocaleString()}` : 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Replacement cost:</Text>{' '}
            {typeof currentAsset.replacement_cost === 'number'
              ? `$${currentAsset.replacement_cost.toLocaleString()}`
              : 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Warranty expiry:</Text>{' '}
            {currentAsset.warranty_expiry ? formatDateDDMMYYYY(currentAsset.warranty_expiry) : 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Criticality:</Text> {currentAsset.criticality || 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Inspection frequency:</Text> {currentAsset.inspection_frequency || 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Status:</Text> {currentAsset.status}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Asset Photos" />

        {currentAsset.asset_photo_urls && currentAsset.asset_photo_urls.length > 0 ? (
          <View style={{ gap: 6 }}>
            {currentAsset.asset_photo_urls.map((url, index) => (
              <Text key={`${url}-${index}`} style={t.text.caption}>
                Photo {index + 1}: {url}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={t.text.caption}>No asset reference photos uploaded yet.</Text>
        )}
      </ScrollView>

      <AdminAppBottomNav />

      <Modal
        visible={assetPendingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setAssetPendingDelete(false);
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
              setAssetPendingDelete(false);
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
                  <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{currentAsset.name}</Text>? This action
                  cannot be undone.
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
                  <Button label="Cancel" variant="secondary" onPress={() => setAssetPendingDelete(false)} />
                  <Button label="Yes, continue" onPress={() => setDeleteStep('type-name')} />
                </View>
              </>
            ) : (
              <>
                <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Confirm deletion</Text>
                <Text style={t.text.caption}>
                  Type <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{currentAsset.name}</Text> to confirm.
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
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => {
                      setAssetPendingDelete(false);
                      setDeleteStep('confirm');
                      setDeleteNameInput('');
                    }}
                  />
                  <Button label="Delete asset" onPress={handleDeleteAsset} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}