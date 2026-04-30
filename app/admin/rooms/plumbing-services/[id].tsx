import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchPlumbingServiceById } from '@/src/services/adminInsights';

export default function PlumbingServiceDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [row, setRow] = React.useState<{
    filteredWater: boolean;
    kitchenSink: boolean;
    bathroomSink: boolean;
    numToilets: number;
    plumbingFixtures: string;
    drainsClear: boolean;
    notes: string;
  } | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const data = await fetchPlumbingServiceById(id);
      setRow(data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminScreenScaffold title="Plumbing service">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Plumbing service</Text>
        <Text
          onPress={() => router.replace('/admin/rooms' as any)}
          style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
          Back to rooms
        </Text>
      </View>
      {loading ? (
        <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={t.colors.brand.forest} />
          <Text style={t.text.caption}>Loading details...</Text>
        </View>
      ) : !row ? (
        <Text style={t.text.caption}>Plumbing service record not found.</Text>
      ) : (
        <View
          style={{
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.card.surface,
            padding: t.spacing.md,
            gap: 8,
          }}>
          <Text style={t.text.caption}>Filtered water: {row.filteredWater ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Kitchen sink: {row.kitchenSink ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Bathroom sink: {row.bathroomSink ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Number of toilets: {row.numToilets}</Text>
          <Text style={t.text.caption}>Fixtures: {row.plumbingFixtures || 'Unspecified'}</Text>
          <Text style={t.text.caption}>Drains clear: {row.drainsClear ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Notes: {row.notes || 'No notes'}</Text>
        </View>
      )}
    </AdminScreenScaffold>
  );
}

