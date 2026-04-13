import React from 'react';
import { Text, View } from 'react-native';
import { adminDepartments, adminLocations, adminReports } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminDepartmentsPage() {
  const t = useTheme();
  return (
    <AdminScreenScaffold title="Departments">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Departments</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Maintain department ownership, contacts and scope.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.md }}>
        {adminDepartments.map((department) => (
          <View
            key={department.id}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
              gap: 4,
            }}>
            <Text style={[t.text.body, { fontWeight: '700' }]}>{department.name}</Text>
            <Text style={t.text.caption}>
              Manager: {department.managerName} · {department.contactEmail}
            </Text>
            <Text style={t.text.caption}>
              Assets: {new Set(adminReports.filter((report) => report.departmentId === department.id).map((report) => report.assetCode)).size} · Locations:{' '}
              {adminLocations.filter((location) => location.departmentId === department.id).length}
            </Text>
            <Text style={t.text.caption}>{department.notes}</Text>
          </View>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

