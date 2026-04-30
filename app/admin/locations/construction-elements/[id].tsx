import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchConstructionElementById } from '@/src/services/adminInsights';

export default function ConstructionElementDetailPage() {
  const t = useTheme();
  const { id, locationId } = useLocalSearchParams<{ id: string; locationId?: string }>();
  const [loading, setLoading] = React.useState(true);
  const [row, setRow] = React.useState<{
    id: string;
    category: string;
    elementName: string;
    material: string;
    condition: string;
    notes: string;
  } | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const data = await fetchConstructionElementById(id);
      setRow(data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminScreenScaffold title="Construction element">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Construction element</Text>
        <Text
          onPress={() =>
            router.replace(
              (locationId ? `/admin/locations/${locationId}` : '/admin/locations') as any
            )
          }
          style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
          Back to location
        </Text>
      </View>
      {loading ? (
        <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={t.colors.brand.forest} />
          <Text style={t.text.caption}>Loading details...</Text>
        </View>
      ) : !row ? (
        <Text style={t.text.caption}>Construction element not found.</Text>
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
          <Text style={[t.text.body, { fontWeight: '700' }]}>{row.elementName || 'Construction element'}</Text>
          <Text style={t.text.caption}>Category: {row.category || 'Unspecified'}</Text>
          <Text style={t.text.caption}>Material: {row.material || 'Unspecified'}</Text>
          <Text style={t.text.caption}>Condition: {row.condition || 'Unknown'}</Text>
          <Text style={t.text.caption}>Notes: {row.notes || 'No notes'}</Text>
        </View>
      )}
    </AdminScreenScaffold>
  );
}

