import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchRooms } from '@/src/services/referenceData';
import { fetchAssets } from '@/src/services/assets';
import { resolveLocationNames, resolveDepartmentNames } from '@/src/services/lookups';

export default function AdminRoomDetailPage() {
  const t = useTheme();
  const { id, locationId } = useLocalSearchParams<{ id: string; locationId?: string }>();
  const [loading, setLoading] = React.useState(true);
  const [room, setRoom] = React.useState<{
    id: string;
    locationId: string;
    name: string;
    roomNumber: string;
    floorLevel: string;
    notes: string;
  } | null>(null);
  const [assetsInRoom, setAssetsInRoom] = React.useState<
    { id: string; assetCode: string; name: string; category: string; deptId: string; status: string }[]
  >([]);
  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const [departmentNameById, setDepartmentNameById] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const [rooms, assets] = await Promise.all([fetchRooms(), fetchAssets({ limit: 5000 })]);
      const matchedRoom = rooms.find((row) => row.id === id) ?? null;
      setRoom(matchedRoom);
      const roomAssets = assets
        .filter((asset) => asset.room_id === id)
        .map((asset) => ({
          id: asset.id,
          assetCode: asset.asset_code,
          name: asset.name,
          category: asset.category,
          deptId: asset.dept_id,
          status: asset.status,
        }));
      setAssetsInRoom(roomAssets);
      if (matchedRoom?.locationId) {
        setLocationNameById(await resolveLocationNames([matchedRoom.locationId]));
      }
      const deptIds = Array.from(new Set(roomAssets.map((asset) => asset.deptId).filter(Boolean)));
      if (deptIds.length > 0) {
        setDepartmentNameById(await resolveDepartmentNames(deptIds));
      }
      setLoading(false);
    })();
  }, [id]);

  const goBack = () => {
    if (locationId) {
      router.replace(`/admin/locations/${locationId}` as any);
      return;
    }
    router.replace('/admin/rooms' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Room Detail"
        userName="Admin"
        onPressBack={goBack}
        onPressUser={() => router.push('/admin/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}>
        {loading ? (
          <View style={{ minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading room details...</Text>
          </View>
        ) : !room ? (
          <Text style={t.text.caption}>Room not found.</Text>
        ) : (
          <>
            <View>
              <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{room.name || room.id}</Text>
              <Text style={t.text.caption}>
                {room.roomNumber || 'No room number'} · {room.floorLevel || 'No floor'} ·{' '}
                {locationNameById[room.locationId] ?? 'Unknown location'}
              </Text>
              <Text style={t.text.caption}>{room.notes || 'No notes'}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
            <View>
              <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>Assets in this room</Text>
              <Text style={t.text.caption}>{assetsInRoom.length} assets linked to this room.</Text>
            </View>
            {assetsInRoom.length === 0 ? (
              <Text style={t.text.caption}>No assets are currently linked to this room.</Text>
            ) : (
              <View style={{ gap: t.spacing.sm }}>
                {assetsInRoom.map((asset) => (
                  <Pressable
                    key={asset.id}
                    onPress={() => router.push(`/admin/assets/${asset.id}` as any)}
                    style={({ pressed }) => [
                      {
                        borderWidth: 1,
                        borderColor: t.colors.border.subtle,
                        borderRadius: t.radius.md,
                        backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : t.colors.card.surface,
                        paddingHorizontal: t.spacing.md,
                        paddingVertical: t.spacing.sm,
                        gap: 4,
                      },
                    ]}>
                    <Text style={[t.text.body, { fontWeight: '700' }]}>{asset.name}</Text>
                    <Text style={t.text.caption}>
                      {asset.assetCode} · {asset.category || 'Uncategorised'} ·{' '}
                      {departmentNameById[asset.deptId] ?? 'Unknown department'}
                    </Text>
                    <Text style={t.text.caption}>
                      {asset.status} · <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Open asset →</Text>
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

