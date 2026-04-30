import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchReferenceGroups, type ReferenceGroup } from '@/src/services/adminInsights';

export default function AdminReferenceDataPage() {
  const t = useTheme();
  const [groups, setGroups] = React.useState<ReferenceGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const rows = await fetchReferenceGroups();
      setGroups(rows);
      setLoadingGroups(false);
    })();
  }, []);

  return (
    <AdminScreenScaffold title="Reference Data">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Reference Data</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Controlled values used by forms, filters and system tables.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.md }}>
        {loadingGroups ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading reference values...</Text>
          </View>
        ) : null}
        {!loadingGroups && groups.length === 0 ? (
          <Text style={t.text.caption}>No reference values found yet.</Text>
        ) : null}
        {!loadingGroups ? groups.map((group) => (
          <View
            key={group.fieldName}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
              gap: 6,
            }}>
            <Text style={[t.text.body, { fontWeight: '700' }]}>{group.fieldName}</Text>
            <Text style={t.text.caption}>{group.values.join(' · ')}</Text>
          </View>
        )) : null}
      </View>
    </AdminScreenScaffold>
  );
}

