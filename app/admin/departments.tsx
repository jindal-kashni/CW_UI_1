import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchDepartments, fetchLocations } from '@/src/services/referenceData';
import { fetchAdminReports } from '@/src/services/reports';

export default function AdminDepartmentsPage() {
  const t = useTheme();
  const [departments, setDepartments] = React.useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = React.useState<{ departmentId: string }[]>([]);
  const [reports, setReports] = React.useState<{ departmentId: string; assetCode: string }[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [departmentRows, locationRows, reportRows] = await Promise.all([
        fetchDepartments(),
        fetchLocations(),
        fetchAdminReports(),
      ]);
      setDepartments(departmentRows);
      setLocations(locationRows.map((row) => ({ departmentId: row.departmentId })));
      setReports(reportRows.map((row) => ({ departmentId: row.departmentId, assetCode: row.assetCode })));
      setLoadingDepartments(false);
    })();
  }, []);

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
        {loadingDepartments ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading departments...</Text>
          </View>
        ) : null}
        {!loadingDepartments && departments.length === 0 ? (
          <Text style={t.text.caption}>No departments found yet.</Text>
        ) : !loadingDepartments ? (
          departments.map((department) => (
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
                Assets: {new Set(reports.filter((report) => report.departmentId === department.id).map((report) => report.assetCode)).size} · Locations:{' '}
                {locations.filter((location) => location.departmentId === department.id).length}
              </Text>
            </View>
          ))
        ) : null}
      </View>
    </AdminScreenScaffold>
  );
}

