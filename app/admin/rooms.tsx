import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchRooms } from '@/src/services/referenceData';
import { resolveLocationNames } from '@/src/services/lookups';
import {
  fetchPlumbingServiceForRooms,
  fetchPowerDataServiceForRooms,
  type PlumbingServiceRecord,
  type PowerDataServiceRecord,
} from '@/src/services/adminInsights';

export default function AdminRoomsPage() {
  const t = useTheme();
  const [rooms, setRooms] = React.useState<
    { id: string; locationId: string; name: string; roomNumber: string; floorLevel: string; notes: string }[]
  >([]);
  const [loadingRooms, setLoadingRooms] = React.useState(true);
  const [loadingRoomServices, setLoadingRoomServices] = React.useState(true);
  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const [powerServiceByRoomId, setPowerServiceByRoomId] = React.useState<Record<string, PowerDataServiceRecord>>({});
  const [plumbingServiceByRoomId, setPlumbingServiceByRoomId] = React.useState<Record<string, PlumbingServiceRecord>>(
    {}
  );

  React.useEffect(() => {
    (async () => {
      const rows = await fetchRooms();
      setRooms(rows);
      setLoadingRooms(false);
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      const ids = Array.from(new Set(rooms.map((room) => room.locationId).filter(Boolean)));
      if (ids.length === 0) return;
      const names = await resolveLocationNames(ids);
      setLocationNameById(names);
    })();
  }, [rooms]);

  React.useEffect(() => {
    (async () => {
      if (rooms.length === 0) {
        setLoadingRoomServices(false);
        return;
      }
      const roomIds = rooms.map((room) => room.id);
      const [powerRows, plumbingRows] = await Promise.all([
        fetchPowerDataServiceForRooms(roomIds),
        fetchPlumbingServiceForRooms(roomIds),
      ]);
      setPowerServiceByRoomId(
        Object.fromEntries(powerRows.map((row) => [row.roomId, row])) as Record<string, PowerDataServiceRecord>
      );
      setPlumbingServiceByRoomId(
        Object.fromEntries(plumbingRows.map((row) => [row.roomId, row])) as Record<string, PlumbingServiceRecord>
      );
      setLoadingRoomServices(false);
    })();
  }, [rooms]);

  return (
    <AdminScreenScaffold title="Rooms">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Rooms</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Manage room records and location relationships.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.md }}>
        {loadingRooms ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading rooms...</Text>
          </View>
        ) : null}
        {!loadingRooms && rooms.length === 0 ? (
          <Text style={t.text.caption}>No rooms found yet.</Text>
        ) : !loadingRooms ? (
          rooms.map((room) => (
            <View
              key={room.id}
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.card.surface,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.md,
              }}>
              <Text style={[t.text.body, { fontWeight: '700' }]}>{room.name || room.id}</Text>
              <Text style={t.text.caption}>
                {room.roomNumber || 'No room number'} · {room.floorLevel || 'No floor'} · {locationNameById[room.locationId] ?? 'Unknown'}
              </Text>
              <Text style={t.text.caption}>{room.notes || 'No notes'}</Text>
              {loadingRoomServices ? (
                <Text style={t.text.caption}>Loading room services...</Text>
              ) : (
                <>
                  <Text style={[t.text.caption, { fontWeight: '700', marginTop: 4 }]}>Power/data services</Text>
                  {powerServiceByRoomId[room.id] ? (
                    <>
                      <Text style={t.text.caption}>
                        Data points: {powerServiceByRoomId[room.id].dataPoints} · Power points:{' '}
                        {powerServiceByRoomId[room.id].powerPoints} · Lighting:{' '}
                        {powerServiceByRoomId[room.id].lightingType || 'Unspecified'}
                      </Text>
                      <Text style={t.text.caption}>
                        Fire protection: {powerServiceByRoomId[room.id].fireProtection ? 'Yes' : 'No'} · Fire alarms:{' '}
                        {powerServiceByRoomId[room.id].fireAlarms ? 'Yes' : 'No'} · Emergency lighting:{' '}
                        {powerServiceByRoomId[room.id].emergencyLighting ? 'Yes' : 'No'} · Exit signs:{' '}
                        {powerServiceByRoomId[room.id].exitSigns ? 'Yes' : 'No'}
                      </Text>
                      {powerServiceByRoomId[room.id].notes ? (
                        <Text style={t.text.caption}>Notes: {powerServiceByRoomId[room.id].notes}</Text>
                      ) : null}
                      <Pressable
                        onPress={() =>
                          router.push(`/admin/rooms/power-services/${powerServiceByRoomId[room.id].id}?roomId=${room.id}` as any)
                        }
                        style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                          View details
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={t.text.caption}>No power/data service record.</Text>
                  )}
                  <Text style={[t.text.caption, { fontWeight: '700', marginTop: 4 }]}>Plumbing services</Text>
                  {plumbingServiceByRoomId[room.id] ? (
                    <>
                      <Text style={t.text.caption}>
                        Toilets: {plumbingServiceByRoomId[room.id].numToilets} · Filtered water:{' '}
                        {plumbingServiceByRoomId[room.id].filteredWater ? 'Yes' : 'No'} · Drains clear:{' '}
                        {plumbingServiceByRoomId[room.id].drainsClear ? 'Yes' : 'No'}
                      </Text>
                      <Text style={t.text.caption}>
                        Kitchen sink: {plumbingServiceByRoomId[room.id].kitchenSink ? 'Yes' : 'No'} · Bathroom sink:{' '}
                        {plumbingServiceByRoomId[room.id].bathroomSink ? 'Yes' : 'No'} · Fixtures:{' '}
                        {plumbingServiceByRoomId[room.id].plumbingFixtures || 'Unspecified'}
                      </Text>
                      {plumbingServiceByRoomId[room.id].notes ? (
                        <Text style={t.text.caption}>Notes: {plumbingServiceByRoomId[room.id].notes}</Text>
                      ) : null}
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/admin/rooms/plumbing-services/${plumbingServiceByRoomId[room.id].id}?roomId=${room.id}` as any
                          )
                        }
                        style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                          View details
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={t.text.caption}>No plumbing service record.</Text>
                  )}
                </>
              )}
            </View>
          ))
        ) : null}
      </View>
    </AdminScreenScaffold>
  );
}

