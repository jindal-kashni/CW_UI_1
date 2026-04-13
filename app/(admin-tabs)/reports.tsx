import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SearchInput } from '@/src/components';
import {
  adminDepartmentById,
  adminLocationById,
  adminReports,
  adminUserById,
} from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

type ReportView = 'ToDo' | 'InProgress' | 'Completed';

export default function AdminReportsPage() {
  const t = useTheme();
  const [view, setView] = React.useState<ReportView>('InProgress');
  const [query, setQuery] = React.useState('');
  const [department, setDepartment] = React.useState<string>('All');
  const [location, setLocation] = React.useState<string>('All');
  const [assignedUser, setAssignedUser] = React.useState<string>('All');

  const options = (values: string[]) => ['All', ...Array.from(new Set(values))];
  const departmentOptions = options(adminReports.map((r) => adminDepartmentById[r.departmentId]?.name ?? 'Unknown'));
  const locationOptions = options(adminReports.map((r) => adminLocationById[r.locationId]?.name ?? 'Unknown'));
  const userOptions = options(adminReports.map((r) => adminUserById[r.assignedUserId]?.name ?? 'Unknown'));

  const filtered = adminReports
    .filter((r) => r.status === view)
    .filter((r) =>
      department === 'All'
        ? true
        : (adminDepartmentById[r.departmentId]?.name ?? 'Unknown') === department
    )
    .filter((r) =>
      location === 'All' ? true : (adminLocationById[r.locationId]?.name ?? 'Unknown') === location
    )
    .filter((r) =>
      assignedUser === 'All' ? true : (adminUserById[r.assignedUserId]?.name ?? 'Unknown') === assignedUser
    )
    .filter((r) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const locationName = adminLocationById[r.locationId]?.name ?? '';
      const userName = adminUserById[r.assignedUserId]?.name ?? '';
      return `${r.title} ${locationName} ${userName} ${r.assetCode}`.toLowerCase().includes(q);
    });

  return (
    <AdminScreenScaffold title="Reports">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Reports Oversight</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Monitor all report activity across users, locations and departments.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.md }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        {[
          { label: 'To Do', value: 'ToDo' as const },
          { label: 'In Progress', value: 'InProgress' as const },
          { label: 'Completed', value: 'Completed' as const },
        ].map((item) => {
          const selected = view === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setView(item.value)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  minHeight: 46,
                  borderRadius: t.radius.lg,
                  borderWidth: 1,
                  borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                  backgroundColor: selected ? '#2F6B4B' : pressed ? 'rgba(0,74,38,0.08)' : t.colors.card.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}>
              <Text style={{ fontWeight: selected ? '800' : '700', color: selected ? '#fff' : '#2F5B45' }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: t.spacing.md }} />
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search report title, location, asset code, or assigned user..."
      />
      <View style={{ height: t.spacing.md }} />
      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <FilterPill title="Department" value={department} options={departmentOptions} onChange={setDepartment} />
        <FilterPill title="Location" value={location} options={locationOptions} onChange={setLocation} />
        <FilterPill title="User" value={assignedUser} options={userOptions} onChange={setAssignedUser} />
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
          <Text style={[t.text.caption, { flex: 2.4, fontWeight: '700' }]}>Report</Text>
          <Text style={[t.text.caption, { flex: 1.5, fontWeight: '700' }]}>Location</Text>
          <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>Assigned user</Text>
          <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Status</Text>
          <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700' }]}>Date</Text>
          <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>Progress</Text>
        </View>
        {filtered.map((report, idx) => {
          const user = adminUserById[report.assignedUserId];
          const loc = adminLocationById[report.locationId];
          const actionLabel =
            report.status === 'Completed' ? 'View' : report.status === 'InProgress' ? 'Review' : 'Begin';
          return (
            <Pressable
              key={report.id}
              onPress={() => router.push((`/admin/reports/${report.id}` as any) as any)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.md,
                  borderBottomWidth: idx === filtered.length - 1 ? 0 : 1,
                  borderBottomColor: t.colors.border.subtle,
                  backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : 'transparent',
                },
              ]}>
              <View style={{ flex: 2.4, paddingRight: t.spacing.md }}>
                <Text style={[t.text.body, { fontWeight: '700' }]} numberOfLines={1}>
                  {report.title}
                </Text>
                <Text style={t.text.caption}>{report.assetCode}</Text>
              </View>
              <Text style={[t.text.caption, { flex: 1.5, paddingRight: t.spacing.md }]} numberOfLines={1}>
                {loc?.name ?? 'Unknown'}
              </Text>
              <Text style={[t.text.caption, { flex: 1.2 }]} numberOfLines={1}>
                {user?.name ?? 'Unknown'}
              </Text>
              <Text style={[t.text.caption, { flex: 1 }]}>{report.status}</Text>
              <Text style={[t.text.caption, { flex: 1.1 }]}>
                {new Date(report.submittedAt ?? report.dueDate).toLocaleDateString()}
              </Text>
              <View style={{ flex: 1.2 }}>
                <Text style={[t.text.caption, { fontWeight: '700', color: t.colors.brand.forest }]}>
                  {actionLabel} →
                </Text>
                <Text style={t.text.caption}>{report.progressPct}%</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </AdminScreenScaffold>
  );
}

function FilterPill({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        const idx = options.indexOf(value);
        const next = options[(idx + 1) % options.length];
        onChange(next);
      }}
      style={{
        minHeight: 40,
        borderRadius: 999,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,74,38,0.22)',
        backgroundColor: '#FBF7F0',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#2F5B45' }}>
        {title}: {value}
      </Text>
    </Pressable>
  );
}

