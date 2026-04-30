import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchLocations, fetchRooms } from '@/src/services/referenceData';
import { fetchAssets } from '@/src/services/assets';
import { fetchAdminReports } from '@/src/services/reports';
import { resolveDepartmentNames } from '@/src/services/lookups';

export default function AdminLocationDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = React.useState<{
    id: string;
    name: string;
    type: string;
    siteZone: string;
    departmentId: string;
  } | null>(null);
  const [linkedRooms, setLinkedRooms] = React.useState<
    { id: string; name: string; roomNumber: string; floorLevel: string }[]
  >([]);
  const [linkedAssets, setLinkedAssets] = React.useState<{ id: string }[]>([]);
  const [linkedReports, setLinkedReports] = React.useState<{ id: string }[]>([]);
  const [departmentNameById, setDepartmentNameById] = React.useState<Record<string, string>>({});
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!id) return;
      const [locations, rooms, assets, reports] = await Promise.all([
        fetchLocations(),
        fetchRooms(),
        fetchAssets(),
        fetchAdminReports(),
      ]);
      const matchedLocation = locations.find((item) => item.id === id) ?? null;
      setLocation(matchedLocation);
      setLinkedRooms(
        rooms
          .filter((room) => room.locationId === id)
          .map((room) => ({
            id: room.id,
            name: room.name,
            roomNumber: room.roomNumber,
            floorLevel: room.floorLevel,
          }))
      );
      setLinkedAssets(assets.filter((asset) => asset.location_id === id).map((asset) => ({ id: asset.id })));
      setLinkedReports(reports.filter((report) => report.locationId === id).map((report) => ({ id: report.id })));
      if (matchedLocation?.departmentId) {
        setDepartmentNameById(await resolveDepartmentNames([matchedLocation.departmentId]));
      }
      setLoaded(true);
    })();
  }, [id]);

  if (!loaded) {
    return (
      <ScreenContainer>
        <TopBar
          title="Location Detail"
          userName="Admin"
          onPressBack={() => router.replace('/admin/locations' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Loading location...</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  if (!location) {
    return (
      <ScreenContainer>
        <TopBar
          title="Location Detail"
          userName="Admin"
          onPressBack={() => router.replace('/admin/locations' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Location not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 22, lineHeight: 28, marginBottom: t.spacing.md }]}>{title}</Text>
  );
  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );

  return (
    <ScreenContainer>
      <TopBar
        title="Location Detail"
        userName="Admin"
        onPressBack={() => router.replace('/admin/locations' as any)}
        onPressUser={() => router.push('/admin/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
        }}>
        <SectionHeading title="Location overview" />
        <Text style={[t.text.title, { fontSize: 26, lineHeight: 32 }]}>{location.name}</Text>
        <Text style={[t.text.caption, { marginTop: 4 }]}>
          {location.type || 'Location'} · {location.siteZone || 'No zone'} · {departmentNameById[location.departmentId] ?? 'Unknown'}
        </Text>

        <SectionDivider />
        <SectionHeading title="Linked rooms" />
        <Text style={t.text.caption}>{linkedRooms.length} room records linked to this location.</Text>
        {linkedRooms.length > 0 ? (
          <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
            {linkedRooms.map((room) => (
              <Pressable
                key={room.id}
                onPress={() => router.push(`/admin/rooms/${room.id}?locationId=${location.id}` as any)}
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
                <Text style={[t.text.body, { fontWeight: '700' }]}>{room.name || room.id}</Text>
                <Text style={t.text.caption}>
                  {room.roomNumber || 'No room number'} · {room.floorLevel || 'No floor'}
                </Text>
                <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                  View room assets →
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <SectionDivider />
        <SectionHeading title="Linked assets" />
        <Text style={t.text.caption}>{linkedAssets.length} assets linked to this location.</Text>

        <SectionDivider />
        <SectionHeading title="Linked reports" />
        <Text style={t.text.caption}>{linkedReports.length} reports linked to this location.</Text>

      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

