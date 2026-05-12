import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, StatusBadge } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { deleteReport, fetchReportById, reassignReport, type ReportDetailsRecord } from '@/src/services/reports';
import { fetchAdminUsers } from '@/src/services/users';
import type { AdminUserRecord } from '@/src/data/admin';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import {
  resolveDepartmentNames,
  resolveLocationNames,
  resolveRoomNames,
  resolveUserNames,
} from '@/src/services/lookups';

function statusTone(status: string): 'good' | 'neutral' | 'warn' | 'bad' | 'info' {
  if (status === 'Completed') return 'good';
  if (status === 'InProgress') return 'warn';
  if (status === 'Cancelled') return 'bad';
  if (status === 'Assigned') return 'info';
  return 'neutral';
}

function displayStatus(status: string) {
  if (status === 'InProgress') return 'In Progress';
  if (status === 'ToDo') return 'Assigned';
  return status;
}

export default function AdminReportDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [report, setReport] = React.useState<ReportDetailsRecord | null>(null);
  const [users, setUsers] = React.useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [reassignModalOpen, setReassignModalOpen] = React.useState(false);
  const [selectedReassignUserId, setSelectedReassignUserId] = React.useState('');
  const [reassigning, setReassigning] = React.useState(false);

  const [locationNamesById, setLocationNamesById] = React.useState<Record<string, string>>({});
  const [roomNamesById, setRoomNamesById] = React.useState<Record<string, string>>({});
  const [departmentNamesById, setDepartmentNamesById] = React.useState<Record<string, string>>({});
  const [userNamesById, setUserNamesById] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      if (!id) return;

      setLoading(true);
      const [reportData, userRows] = await Promise.all([fetchReportById(id), fetchAdminUsers()]);

      if (!mounted) return;

      setReport(reportData);
      setUsers(userRows);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  React.useEffect(() => {
    (async () => {
      if (!report) return;

      const locationIds = Array.from(
        new Set([report.locationId, ...report.assets.map((asset) => asset.locationId)].filter(Boolean))
      );
      const roomIds = Array.from(new Set(report.assets.map((asset) => asset.roomId).filter(Boolean)));
      const departmentIds = Array.from(
        new Set([report.departmentId, ...report.assets.map((asset) => asset.departmentId)].filter(Boolean))
      );
      const userIds = Array.from(
        new Set([report.assignedUserId, ...report.assets.map((asset) => asset.assignedUserId)].filter(Boolean))
      );

      const [locations, rooms, departments, userMap] = await Promise.all([
        locationIds.length ? resolveLocationNames(locationIds) : Promise.resolve({}),
        roomIds.length ? resolveRoomNames(roomIds) : Promise.resolve({}),
        departmentIds.length ? resolveDepartmentNames(departmentIds) : Promise.resolve({}),
        userIds.length ? resolveUserNames(userIds) : Promise.resolve({}),
      ]);

      setLocationNamesById(locations);
      setRoomNamesById(rooms);
      setDepartmentNamesById(departments);
      setUserNamesById(userMap);
    })();
  }, [report]);

  const activeAuditors = React.useMemo(
    () => users.filter((user) => user.role === 'Auditor' && user.status === 'Active'),
    [users]
  );

  const onReassign = async () => {
    if (!report || !selectedReassignUserId) {
      setMessage('Please select an auditor.');
      return;
    }

    setReassigning(true);
    setMessage(null);

    const result = await reassignReport({
      reportId: report.id,
      assignedUserId: selectedReassignUserId,
      includeInProgress: true,
    });

    setReassigning(false);

    if (!result.ok) {
      setMessage(result.error ?? 'Could not reassign report.');
      return;
    }

    const refreshed = await fetchReportById(report.id);
    setReport(refreshed);
    setReassignModalOpen(false);
    setMessage('Report reassigned successfully.');
  };

  const onDelete = async () => {
    if (!report || deleting) return;

    setDeleting(true);
    setMessage(null);

    const result = await deleteReport(report.id);

    setDeleting(false);

    if (!result.ok) {
      setMessage(result.error ?? 'Could not delete report.');
      return;
    }

    router.replace('/admin/reports' as any);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <TopBar
          title="Report Details"
          userName="Admin"
          onPressBack={() => router.replace('/admin/reports' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={t.colors.brand.forest} />
          <Text style={t.text.caption}>Loading report...</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  if (!report) {
    return (
      <ScreenContainer>
        <TopBar
          title="Report Details"
          userName="Admin"
          onPressBack={() => router.replace('/admin/reports' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Report not found</Text>
          <Text style={[t.text.caption, { marginTop: 6 }]}>This report may have been deleted or is unavailable.</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const locationName = locationNamesById[report.locationId] || 'Unknown location';
  const departmentName = departmentNamesById[report.departmentId] || 'Department unknown';
  const userName = userNamesById[report.assignedUserId] || 'Unassigned';
  const completedAssets = report.assets.filter((asset) => asset.status === 'Completed').length;

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 22, lineHeight: 28, marginBottom: t.spacing.md }]}>{title}</Text>
  );

  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );

  return (
    <ScreenContainer>
      <TopBar
        title="Report Details"
        userName="Admin"
        onPressBack={() => router.replace('/admin/reports' as any)}
        onPressUser={() => router.push('/admin/profile' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
        }}>
        <SectionHeading title="Report summary" />

        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 26, lineHeight: 32 }]}>{report.title}</Text>
              <Text style={[t.text.caption, { marginTop: 4 }]}>
                {locationName} · {departmentName}
              </Text>
            </View>

            <StatusBadge label={displayStatus(report.status)} tone={statusTone(report.rawStatus)} />
          </View>

          <Text style={t.text.caption}>Assigned to: {userName}</Text>
          <Text style={t.text.caption}>Due date: {report.dueDate ? formatDateDDMMYYYY(report.dueDate) : 'No due date set'}</Text>
          <Text style={t.text.caption}>Progress: {report.progressPct}%</Text>
          <Text style={t.text.caption}>
            Assets completed: {completedAssets}/{report.assets.length}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Report details" />

        <View style={{ gap: 8 }}>
          <Text style={t.text.caption}>Summary: {report.summary || 'No summary provided.'}</Text>
          <Text style={t.text.caption}>Description: {report.description || 'No description provided.'}</Text>
          <Text style={t.text.caption}>Created: {formatDateDDMMYYYY(report.createdAt)}</Text>
          {report.submittedAt ? <Text style={t.text.caption}>Completed: {formatDateDDMMYYYY(report.submittedAt)}</Text> : null}
        </View>

        <SectionDivider />

        <SectionHeading title="Included assets" />

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
            <Text style={[t.text.caption, { flex: 2.2, fontWeight: '700' }]}>Asset</Text>
            <Text style={[t.text.caption, { flex: 1.4, fontWeight: '700' }]}>Location</Text>
            <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>Room</Text>
            <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Status</Text>
            <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Due date</Text>
          </View>

          {report.assets.length === 0 ? (
            <View style={{ padding: t.spacing.md }}>
              <Text style={t.text.caption}>No assets have been added to this report.</Text>
            </View>
          ) : (
            report.assets.map((asset, index) => (
              <View
                key={asset.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.md,
                  borderBottomWidth: index === report.assets.length - 1 ? 0 : 1,
                  borderBottomColor: t.colors.border.subtle,
                }}>
                <View style={{ flex: 2.2, paddingRight: t.spacing.md }}>
                  <Text style={[t.text.body, { fontWeight: '700' }]} numberOfLines={1}>
                    {asset.assetName}
                  </Text>
                  <Text style={t.text.caption}>{asset.assetCode || 'No asset code'}</Text>
                </View>

                <Text style={[t.text.caption, { flex: 1.4, paddingRight: t.spacing.md }]} numberOfLines={1}>
                  {locationNamesById[asset.locationId] || 'Unknown'}
                </Text>

                <Text style={[t.text.caption, { flex: 1.2, paddingRight: t.spacing.md }]} numberOfLines={1}>
                  {roomNamesById[asset.roomId] || 'No room'}
                </Text>

                <Text style={[t.text.caption, { flex: 1 }]}>{asset.status}</Text>

                <Text style={[t.text.caption, { flex: 1 }]}>
                  {asset.dueDate ? formatDateDDMMYYYY(asset.dueDate) : report.dueDate ? formatDateDDMMYYYY(report.dueDate) : 'No due date'}
                </Text>
              </View>
            ))
          )}
        </View>

        <SectionDivider />

        <SectionHeading title="Actions" />

        {message ? (
          <Text
            style={[
              t.text.caption,
              {
                color: message.includes('success') ? '#2F5B45' : '#B63E34',
                marginBottom: t.spacing.md,
              },
            ]}>
            {message}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label="Back to reports" variant="secondary" onPress={() => router.replace('/admin/reports' as any)} />
          </View>

          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => {
                setSelectedReassignUserId(report.assignedUserId);
                setReassignModalOpen(true);
              }}
              style={({ pressed }) => [
                {
                  minHeight: 46,
                  borderRadius: t.radius.lg,
                  borderWidth: 1,
                  borderColor: 'rgba(0,74,38,0.22)',
                  backgroundColor: pressed ? 'rgba(0,74,38,0.08)' : t.colors.card.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}>
              <Text style={{ color: t.colors.brand.forest, fontWeight: '800' }}>Reassign report</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <Pressable
              disabled={deleting}
              onPress={onDelete}
              style={({ pressed }) => [
                {
                  minHeight: 46,
                  borderRadius: t.radius.lg,
                  borderWidth: 1,
                  borderColor: 'rgba(166,88,75,0.45)',
                  backgroundColor: pressed ? 'rgba(166,88,75,0.12)' : 'rgba(166,88,75,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleting ? 0.6 : 1,
                },
              ]}>
              <Text style={{ color: '#8A3F35', fontWeight: '800' }}>{deleting ? 'Deleting...' : 'Delete report'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={reassignModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReassignModalOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable
            onPress={() => setReassignModalOpen(false)}
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
              <Pressable onPress={() => setReassignModalOpen(false)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>

              <Text style={[t.text.caption, { fontWeight: '700' }]}>Reassign report</Text>

              <Pressable onPress={onReassign} disabled={reassigning}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                  {reassigning ? 'Saving...' : 'Done'}
                </Text>
              </Pressable>
            </View>

            <View style={{ padding: t.spacing.md }}>
              <Text style={[t.text.caption, { marginBottom: t.spacing.sm }]}>
                Completed asset audits will stay assigned to the auditor who completed them. In-progress and unfinished
                assets will move to the new auditor.
              </Text>

              {activeAuditors.length === 0 ? (
                <Text style={t.text.caption}>No active auditors available.</Text>
              ) : (
                <Picker
                  selectedValue={selectedReassignUserId}
                  onValueChange={(value) => setSelectedReassignUserId(String(value))}
                  style={{ height: 230 }}
                  itemStyle={{ fontSize: 18 }}>
                  {activeAuditors.map((user) => (
                    <Picker.Item key={user.id} label={user.name} value={user.id} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <AdminAppBottomNav />
    </ScreenContainer>
  );
}