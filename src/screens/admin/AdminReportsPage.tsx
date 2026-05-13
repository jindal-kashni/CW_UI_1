import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SearchInput } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import { fetchAdminReports } from '@/src/services/reports';
import type { AdminReportRecord } from '@/src/data/admin';
import { resolveDepartmentNames, resolveLocationNames, resolveUserNames } from '@/src/services/lookups';

type ReportView = 'ToDo' | 'InProgress' | 'Completed';
type FilterKey = 'department' | 'location' | 'user';

function displayStatus(status: ReportView) {
  if (status === 'InProgress') return 'In Progress';
  if (status === 'ToDo') return 'Assigned';
  return 'Completed';
}

function sortOptions(values: string[]) {
  return ['All', ...Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))];
}

export default function AdminReportsPage() {
  const t = useTheme();

  const [reports, setReports] = React.useState<AdminReportRecord[]>([]);
  const [view, setView] = React.useState<ReportView>('ToDo');
  const [query, setQuery] = React.useState('');
  const [department, setDepartment] = React.useState('All');
  const [location, setLocation] = React.useState('All');
  const [assignedUser, setAssignedUser] = React.useState('All');
  const [pickerField, setPickerField] = React.useState<FilterKey | null>(null);
  const [pickerDraftValue, setPickerDraftValue] = React.useState('All');
  const [departmentNamesById, setDepartmentNamesById] = React.useState<Record<string, string>>({});
  const [locationNamesById, setLocationNamesById] = React.useState<Record<string, string>>({});
  const [userNamesById, setUserNamesById] = React.useState<Record<string, string>>({});
  const [loadingReports, setLoadingReports] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadReports = React.useCallback(async () => {
    setLoadingReports(true);
    setErrorMessage(null);

    try {
      const data = await fetchAdminReports();
      setReports(data);
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Could not load reports.');
    } finally {
      setLoadingReports(false);
    }
  }, []);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  React.useEffect(() => {
    (async () => {
      if (reports.length === 0) return;

      const [departmentMap, locationMap, userMap] = await Promise.all([
        resolveDepartmentNames(reports.map((row) => row.departmentId).filter(Boolean)),
        resolveLocationNames(reports.map((row) => row.locationId).filter(Boolean)),
        resolveUserNames(reports.map((row) => row.assignedUserId).filter(Boolean)),
      ]);

      setDepartmentNamesById(departmentMap);
      setLocationNamesById(locationMap);
      setUserNamesById(userMap);
    })();
  }, [reports]);

  const departmentName = React.useCallback(
    (report: AdminReportRecord) => departmentNamesById[report.departmentId] || 'Unknown',
    [departmentNamesById]
  );

  const locationName = React.useCallback(
    (report: AdminReportRecord) => locationNamesById[report.locationId] || 'Unknown',
    [locationNamesById]
  );

  const userName = React.useCallback(
    (report: AdminReportRecord) => userNamesById[report.assignedUserId] || 'Unassigned',
    [userNamesById]
  );

  const reportCounts = React.useMemo(
    () => ({
      ToDo: reports.filter((report) => report.status === 'ToDo').length,
      InProgress: reports.filter((report) => report.status === 'InProgress').length,
      Completed: reports.filter((report) => report.status === 'Completed').length,
    }),
    [reports]
  );

  const departmentOptions = React.useMemo(
    () => sortOptions(reports.map((report) => departmentName(report))),
    [reports, departmentName]
  );

  const locationOptions = React.useMemo(
    () => sortOptions(reports.map((report) => locationName(report))),
    [reports, locationName]
  );

  const userOptions = React.useMemo(
    () => sortOptions(reports.map((report) => userName(report))),
    [reports, userName]
  );

  const pickerConfig = React.useMemo(() => {
    if (pickerField === 'department') return { label: 'Department', options: departmentOptions };
    if (pickerField === 'location') return { label: 'Location', options: locationOptions };
    if (pickerField === 'user') return { label: 'Assigned user', options: userOptions };
    return { label: '', options: [] as string[] };
  }, [pickerField, departmentOptions, locationOptions, userOptions]);

  const filtered = React.useMemo(() => {
    return reports
      .filter((report) => report.status === view)
      .filter((report) => (department === 'All' ? true : departmentName(report) === department))
      .filter((report) => (location === 'All' ? true : locationName(report) === location))
      .filter((report) => (assignedUser === 'All' ? true : userName(report) === assignedUser))
      .filter((report) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();

        return `${report.title} ${report.assetCode} ${report.findings} ${locationName(report)} ${departmentName(
          report
        )} ${userName(report)}`
          .toLowerCase()
          .includes(q);
      });
  }, [reports, view, department, location, assignedUser, query, departmentName, locationName, userName]);

  return (
    <AdminScreenScaffold title="Reports">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Reports Oversight</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>
            Monitor multi-asset audit reports, assignments and completion progress.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/admin/reports/assign' as any)}          
          style={({ pressed }) => [
            {
              minHeight: 42,
              borderRadius: t.radius.lg,
              paddingHorizontal: t.spacing.lg,
              backgroundColor: '#2F6B4B',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Create Report</Text>
        </Pressable>
      </View>

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
                {item.label} ({reportCounts[item.value]})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: t.spacing.md }} />

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search report title, assets, location, department, or assigned user..."
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
        <FilterPill
          title="Clear filters"
          value=""
          onPress={() => {
            setDepartment('All');
            setLocation('All');
            setAssignedUser('All');
            setQuery('');
          }}
        />
      </View>

      <View style={{ height: t.spacing.lg }} />

      {errorMessage ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: 'rgba(166,88,75,0.4)',
            backgroundColor: 'rgba(166,88,75,0.08)',
            borderRadius: t.radius.lg,
            padding: t.spacing.md,
            marginBottom: t.spacing.md,
          }}>
          <Text style={[t.text.caption, { color: '#8A3F35', fontWeight: '700' }]}>{errorMessage}</Text>
        </View>
      ) : null}

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
          <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>Progress</Text>
        </View>

        {loadingReports ? (
          <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.lg, alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading reports...</Text>
          </View>
        ) : null}

        {!loadingReports
          ? filtered.map((report, idx) => (
              <Pressable
                key={report.id}
                onPress={() => router.push((`/admin/reports/${report.id}` as any) as any)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: t.spacing.lg,
                    paddingVertical: t.spacing.lg,
                    borderBottomWidth: idx === filtered.length - 1 ? 0 : 1,
                    borderBottomColor: t.colors.border.subtle,
                    backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : 'transparent',
                  },
                ]}>
                <View style={{ flex: 2.4, paddingRight: t.spacing.md }}>
                  <Text style={[t.text.body, { fontWeight: '700' }]} numberOfLines={1}>
                    {report.title}
                  </Text>
                  <Text style={t.text.caption} numberOfLines={1}>
                    {report.assetCode || report.findings || 'No assets assigned'}
                  </Text>
                </View>

                <Text style={[t.text.caption, { flex: 1.5, paddingRight: t.spacing.md }]} numberOfLines={1}>
                  {locationName(report)}
                </Text>

                <Text style={[t.text.caption, { flex: 1.2, paddingRight: t.spacing.md }]} numberOfLines={1}>
                  {userName(report)}
                </Text>

                <Text style={[t.text.caption, { flex: 1 }]}>{displayStatus(report.status)}</Text>

                <Text style={[t.text.caption, { flex: 1.1 }]}>
                  {report.dueDate ? formatDateDDMMYYYY(report.submittedAt ?? report.dueDate) : 'No due date'}
                </Text>

                <View style={{ flex: 1.6, minWidth: 0 }}>
                  <Text style={[t.text.caption, { fontWeight: '700', color: t.colors.brand.forest }]}>
                    {report.progressPct}%
                  </Text>
                  <Text style={[t.text.caption, { lineHeight: 18, flexWrap: 'wrap' }]}>
                    {report.findings}
                  </Text>
                </View>
              </Pressable>
            ))
          : null}

        {!loadingReports && filtered.length === 0 ? (
          <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.md }}>
            <Text style={t.text.caption}>No reports found for the selected filters.</Text>
          </View>
        ) : null}
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
          <Pressable
            onPress={() => setPickerField(null)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

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
  const isClear = title === 'Clear filters';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 40,
          borderRadius: 999,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: isClear ? 'rgba(166,88,75,0.35)' : 'rgba(0,74,38,0.22)',
          backgroundColor: pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
          justifyContent: 'center',
        },
      ]}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: isClear ? '#8A3F35' : '#2F5B45' }}>
        {isClear ? title : `${title}: ${value}`}
      </Text>
    </Pressable>
  );
}