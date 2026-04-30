import React from 'react';
import { Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

const groups = [
  { title: 'Categories', values: ['Mechanical', 'Electrical', 'Infrastructure', 'Transport'] },
  { title: 'Sub categories', values: ['Pump', 'Generator', 'Lighting', 'Pathway', 'Service vehicle'] },
  { title: 'Condition values', values: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs urgent attention'] },
  { title: 'Criticality values', values: ['Low', 'Medium', 'High', 'Critical'] },
  { title: 'Status values', values: ['Active', 'Under repair', 'Decommissioned'] },
];

export default function AdminReferenceDataPage() {
  const t = useTheme();
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
        {groups.map((group) => (
          <View
            key={group.title}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
              gap: 6,
            }}>
            <Text style={[t.text.body, { fontWeight: '700' }]}>{group.title}</Text>
            <Text style={t.text.caption}>{group.values.join(' · ')}</Text>
          </View>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

