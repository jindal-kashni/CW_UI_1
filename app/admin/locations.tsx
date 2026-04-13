import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SearchInput } from '@/src/components';
import { adminDepartmentById, adminLocations } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminLocationsPage() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');

  const rows = adminLocations.filter((location) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const department = adminDepartmentById[location.departmentId]?.name ?? '';
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
        <Pressable onPress={() => {}} style={t.button.secondary}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Add location</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search by location name, type, zone or department..." />
      <View style={{ height: t.spacing.lg }} />
      <View style={{ gap: t.spacing.md }}>
        {rows.map((location) => (
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
              {location.type} · {location.siteZone} · {adminDepartmentById[location.departmentId]?.name ?? 'Unknown'}
            </Text>
            <Text style={t.text.caption}>
              Inspection: {location.inspectionFrequency} · Next {new Date(location.nextInspection).toLocaleDateString()}
            </Text>
          </Pressable>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

