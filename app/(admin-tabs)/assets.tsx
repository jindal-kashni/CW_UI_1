import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SearchInput } from '@/src/components';
import { assets, departmentById, locationById, roomById } from '@/src/data';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminAssetsPage() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<'All' | 'Active' | 'Under repair'>('All');
  const [sortBy, setSortBy] = React.useState<'Name' | 'Condition' | 'Criticality'>('Name');

  const rows = [...assets]
    .filter((a) =>
      status === 'All' ? true : status === 'Under repair' ? a.status === 'Under repair' : a.status === status
    )
    .filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const loc = locationById[a.location_id]?.name ?? '';
      const room = roomById[a.room_id]?.name ?? '';
      return `${a.name} ${a.asset_code} ${loc} ${room} ${a.category}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Condition') return a.condition.localeCompare(b.condition);
      return a.criticality.localeCompare(b.criticality);
    });

  return (
    <AdminScreenScaffold title="Assets">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Asset Management</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Source-of-truth view for all registered sanctuary assets.
          </Text>
        </View>
        <ButtonLike label="Add asset" onPress={() => router.push('/admin/assets/create' as any)} />
      </View>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by asset name, code, category, location or room..."
      />
      <View style={{ height: t.spacing.md }} />
      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <ButtonLike label={`Status: ${status}`} onPress={() => setStatus(status === 'All' ? 'Active' : status === 'Active' ? 'Under repair' : 'All')} />
        <ButtonLike label={`Sort: ${sortBy}`} onPress={() => setSortBy(sortBy === 'Name' ? 'Condition' : sortBy === 'Condition' ? 'Criticality' : 'Name')} />
        <ButtonLike label="Reference data" onPress={() => router.push('/admin/reference-data' as any)} />
      </View>

      <View style={{ height: t.spacing.lg }} />
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
          <Text style={[t.text.caption, { flex: 2.2, fontWeight: '700' }]}>Asset</Text>
          <Text style={[t.text.caption, { flex: 2, fontWeight: '700' }]}>Location / Room</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Condition</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Criticality</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Status</Text>
          <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>Actions</Text>
        </View>
        {rows.map((a, idx) => {
          const loc = locationById[a.location_id]?.name ?? 'Unknown';
          const room = roomById[a.room_id]?.name ?? 'Unknown room';
          return (
            <View
              key={a.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.md,
                borderBottomWidth: idx === rows.length - 1 ? 0 : 1,
                borderBottomColor: t.colors.border.subtle,
              }}>
              <View style={{ flex: 2.2, paddingRight: t.spacing.md }}>
                <Text style={[t.text.body, { fontWeight: '700' }]} numberOfLines={1}>
                  {a.name}
                </Text>
                <Text style={t.text.caption}>
                  {a.asset_code} · {a.category}
                </Text>
              </View>
              <Text style={[t.text.caption, { flex: 2, paddingRight: t.spacing.md }]} numberOfLines={1}>
                {loc} · {room}
              </Text>
              <Text style={[t.text.caption, { flex: 1 }]}>{a.condition}</Text>
              <Text style={[t.text.caption, { flex: 1 }]}>{a.criticality}</Text>
              <Text style={[t.text.caption, { flex: 1 }]}>{a.status}</Text>
              <View style={{ flex: 1.2, flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => router.push((`/admin/assets/${a.id}` as any) as any)}>
                  <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>View</Text>
                </Pressable>
                <Pressable onPress={() => router.push((`/admin/assets/edit/${a.id}` as any) as any)}>
                  <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Edit</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </AdminScreenScaffold>
  );
}

function ButtonLike({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 40,
          borderRadius: 999,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: 'rgba(0,74,38,0.22)',
          backgroundColor: pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#2F5B45' }}>{label}</Text>
    </Pressable>
  );
}
