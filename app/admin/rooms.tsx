import React from 'react';
import { Text, View } from 'react-native';
import { adminLocationById, adminRooms } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminRoomsPage() {
  const t = useTheme();
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
        {adminRooms.map((room) => (
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
            <Text style={[t.text.body, { fontWeight: '700' }]}>{room.roomName}</Text>
            <Text style={t.text.caption}>
              {room.roomNumber} · {room.floorLevel} · {adminLocationById[room.locationId]?.name ?? 'Unknown'}
            </Text>
            <Text style={t.text.caption}>{room.notes}</Text>
          </View>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

