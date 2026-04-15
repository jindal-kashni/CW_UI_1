import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
type FilterKey = 'department' | 'location' | 'user';

function displayStatus(status: ReportView) {
  if (status === 'InProgress') return 'In Progress';
  if (status === 'ToDo') return 'Assigned';
  return 'Completed';
}

export default function AdminReportsPage() {
  const t = useTheme();
  const [view, setView] = React.useState<ReportView>('InProgress');
  const [query, setQuery] = React.useState('');
  const [department, setDepartment] = React.useState<string>('All');
  const [location, setLocation] = React.useState<string>('All');
  const [assignedUser, setAssignedUser] = React.useState<string>('All');
  const [notifiedReportIds, setNotifiedReportIds] = React.useState<Record<string, boolean>>({});
  const [pickerField, setPickerField] = React.useState<FilterKey | null>(null);
  const [pickerDraftValue, setPickerDraftValue] = React.useState<string>('All');

  const options = (values: string[]) => ['All', ...Array.from(new Set(values))];
  const departmentOptions = options(adminReports.map((r) => adminDepartmentById[r.departmentId]?.name ?? 'Unknown'));
  const locationOptions = options(adminReports.map((r) => adminLocationById[r.locationId]?.name ?? 'Unknown'));
  const userOptions = options(adminReports.map((r) => adminUserById[r.assignedUserId]?.name ?? 'Unknown'));
  const pickerConfig = React.useMemo(() => {
    if (pickerField === 'department') return { label: 'Department', options: departmentOptions };
    if (pickerField === 'location') return { label: 'Location', options: locationOptions };
    if (pickerField === 'user') return { label: 'User', options: userOptions };
    return { label: '', options: [] as string[] };
  }, [pickerField, departmentOptions, locationOptions, userOptions]);

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
          { label: 'Assigned', value: 'ToDo' as const },
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
        <FilterPill
          title="Department"
          value={department}
          onPress={() => {
            setPickerField('department');
            setPickerDraftValue(department);
          }}
        />
        <FilterPill
          title="Location"
          value={location}
          onPress={() => {
            setPickerField('location');
            setPickerDraftValue(location);
          }}
        />
        <FilterPill
          title="User"
          value={assignedUser}
          onPress={() => {
            setPickerField('user');
            setPickerDraftValue(assignedUser);
          }}
        />
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
          <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700' }]}>Due date</Text>
          <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>{view === 'ToDo' ? '' : 'Progress'}</Text>
        </View>
        {filtered.map((report, idx) => {
          const user = adminUserById[report.assignedUserId];
          const loc = adminLocationById[report.locationId];
          const actionLabel =
            report.status === 'Completed'
              ? 'View'
              : report.status === 'InProgress'
                ? ''
                : notifiedReportIds[report.id]
                  ? 'Notified'
                  : 'Notify assignee again';
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
              <Text style={[t.text.caption, { flex: 1 }]}>{displayStatus(report.status as ReportView)}</Text>
              <Text style={[t.text.caption, { flex: 1.1 }]}>
                {new Date(report.submittedAt ?? report.dueDate).toLocaleDateString()}
              </Text>
              <View style={{ flex: 1.2 }}>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    if (report.status === 'ToDo') {
                      setNotifiedReportIds((prev) => ({ ...prev, [report.id]: true }));
                      return;
                    }
                    if (report.status === 'Completed') {
                      router.push((`/admin/reports/${report.id}` as any) as any);
                    }
                  }}>
                  {actionLabel ? (
                    <Text
                      style={[t.text.caption, { fontWeight: '700', color: t.colors.brand.forest }]}
                      numberOfLines={2}>
                      {actionLabel}
                      {report.status === 'ToDo' ? '' : ' →'}
                    </Text>
                  ) : null}
                </Pressable>
                {view === 'ToDo' ? null : <Text style={t.text.caption}>{report.progressPct}%</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Modal visible={Boolean(pickerField)} transparent animationType="fade" onRequestClose={() => setPickerField(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable onPress={() => setPickerField(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View
            style={{
              width: '100%',
              maxWidth: 560,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              overflow: 'hidden',
            }}>
            <View
              style={{
                minHeight: 46,
                paddingHorizontal: t.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}>
              <Pressable onPress={() => setPickerField(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>{pickerConfig.label}</Text>
              <Pressable
                onPress={() => {
                  if (pickerField === 'department') setDepartment(pickerDraftValue);
                  if (pickerField === 'location') setLocation(pickerDraftValue);
                  if (pickerField === 'user') setAssignedUser(pickerDraftValue);
                  setPickerField(null);
                }}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={pickerDraftValue}
              onValueChange={(value) => setPickerDraftValue(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}>
              {pickerConfig.options.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}

function FilterPill({
  title,
  value,
  onPress,
}: {
  title: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
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

