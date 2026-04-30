import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchPowerDataServiceById } from '@/src/services/adminInsights';

export default function PowerServiceDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [row, setRow] = React.useState<{
    dataPoints: number;
    powerPoints: number;
    lightingType: string;
    fireProtection: boolean;
    fireAlarms: boolean;
    emergencyLighting: boolean;
    exitSigns: boolean;
    notes: string;
  } | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const data = await fetchPowerDataServiceById(id);
      setRow(data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminScreenScaffold title="Power/data service">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Power/data service</Text>
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
        <Text style={t.text.caption}>Power/data service record not found.</Text>
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
          <Text style={t.text.caption}>Data points: {row.dataPoints}</Text>
          <Text style={t.text.caption}>Power points: {row.powerPoints}</Text>
          <Text style={t.text.caption}>Lighting type: {row.lightingType || 'Unspecified'}</Text>
          <Text style={t.text.caption}>Fire protection: {row.fireProtection ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Fire alarms: {row.fireAlarms ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Emergency lighting: {row.emergencyLighting ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Exit signs: {row.exitSigns ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Notes: {row.notes || 'No notes'}</Text>
        </View>
      )}
    </AdminScreenScaffold>
  );
}

