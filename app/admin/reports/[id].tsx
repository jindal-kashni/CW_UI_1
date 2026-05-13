import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { Button, StatusBadge } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import {
  deleteReport,
  fetchReportById,
  reassignReport,
  type ReportAssetRecord,
  type ReportDetailsRecord,
} from '@/src/services/reports';
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

function assetStatusTone(status: ReportAssetRecord['status']): 'good' | 'neutral' | 'warn' | 'bad' | 'info' {
  if (status === 'Completed') return 'good';
  if (status === 'InProgress') return 'warn';
  if (status === 'Flagged') return 'bad';
  if (status === 'Skipped') return 'neutral';
  return 'info';
}

function priorityTone(priority: string): 'good' | 'neutral' | 'warn' | 'bad' | 'info' {
  if (priority === 'Critical') return 'bad';
  if (priority === 'High') return 'warn';
  if (priority === 'Medium') return 'info';
  if (priority === 'Low') return 'good';
  return 'neutral';
}

function displayStatus(status: string) {
  if (status === 'InProgress') return 'In Progress';
  if (status === 'ToDo') return 'Assigned';
  if (status === 'NotStarted') return 'Not Started';
  return status;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  return formatDateDDMMYYYY(value);
}

function moneyLabel(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not estimated';
  return `$${value.toLocaleString()}`;
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No';
}

function conditionLabel(value: number | null | undefined) {
  if (typeof value !== 'number') return 'Not recorded';
  const labels: Record<number, string> = {
    1: '1 - Needs urgent attention',
    2: '2 - Poor',
    3: '3 - Fair',
    4: '4 - Good',
    5: '5 - Excellent',
  };
  return labels[value] ?? String(value);
}

function isImageReference(value: string) {
  const clean = value.trim();
  return /^https?:\/\//i.test(clean) || /^file:/i.test(clean) || /^data:image\//i.test(clean);
}

function isOpenableUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function FlagPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  const t = useTheme();

  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: active ? 'rgba(179,79,71,0.14)' : 'rgba(30,31,28,0.08)',
        borderWidth: 1,
        borderColor: active ? 'rgba(179,79,71,0.24)' : 'rgba(30,31,28,0.10)',
      }}>
      <Text
        style={[
          t.text.caption,
          {
            color: active ? '#7A2E29' : t.colors.text.secondary,
            fontWeight: '700',
          },
        ]}>
        {label}: {yesNo(active)}
      </Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  const t = useTheme();

  return (
    <View
      style={{
        flex: 1,
        minWidth: 150,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        borderRadius: t.radius.lg,
        padding: t.spacing.md,
        backgroundColor: t.colors.card.surface,
        gap: 4,
      }}>
      <Text style={t.text.caption}>{label}</Text>
      <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>{value}</Text>
      {helper ? <Text style={t.text.caption}>{helper}</Text> : null}
    </View>
  );
}

function FieldLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const t = useTheme();

  return (
    <View style={{ gap: 2 }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{label}</Text>
      <Text style={t.text.caption}>{String(value || 'Not recorded')}</Text>
    </View>
  );
}

function AuditPhotoTile({
  photo,
  index,
}: {
  photo: string;
  index: number;
}) {
  const t = useTheme();
  const [imageFailed, setImageFailed] = React.useState(false);

  const cleanPhoto = photo.trim();
  const canRenderImage = isImageReference(cleanPhoto) && !imageFailed;
  const canOpenOriginal = isOpenableUrl(cleanPhoto);

  const openOriginal = async () => {
    if (!canOpenOriginal) return;

    try {
      await Linking.openURL(cleanPhoto);
    } catch {
      // Keep the UI quiet. The visible fallback still shows the reference if opening fails.
    }
  };

  return (
    <Pressable
      onPress={openOriginal}
      disabled={!canOpenOriginal}
      style={{
        width: 150,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        borderRadius: t.radius.md,
        backgroundColor: t.colors.card.surfaceAlt,
        overflow: 'hidden',
      }}>
      {canRenderImage ? (
        <Image
          source={{ uri: cleanPhoto }}
          style={{ width: '100%', height: 110, backgroundColor: 'rgba(30,31,28,0.06)' }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={{
            height: 110,
            padding: t.spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(30,31,28,0.06)',
            gap: 4,
          }}>
          <Text style={[t.text.caption, { fontWeight: '700', textAlign: 'center' }]}>Photo {index + 1}</Text>
          <Text style={[t.text.caption, { textAlign: 'center' }]} numberOfLines={3}>
            {cleanPhoto || 'Photo reference unavailable'}
          </Text>
        </View>
      )}

      <View style={{ padding: t.spacing.sm, gap: 2 }}>
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Photo {index + 1}</Text>
        <Text style={t.text.caption} numberOfLines={1}>
          {canOpenOriginal ? 'Tap to open original' : imageFailed ? 'Could not preview image' : 'Image reference'}
        </Text>
      </View>
    </Pressable>
  );
}

function AssetAuditCard({
  asset,
  locationName,
  roomName,
  completedByName,
}: {
  asset: ReportAssetRecord;
  locationName: string;
  roomName: string;
  completedByName: string;
}) {
  const t = useTheme();
  const result = asset.auditResult ?? null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.card.surface,
        overflow: 'hidden',
      }}>
      <View
        style={{
          padding: t.spacing.md,
          gap: t.spacing.sm,
          backgroundColor: t.colors.card.surfaceAlt,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.border.subtle,
        }}>
        <View
          style={{
            flexDirection: 'row',
            gap: t.spacing.md,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[t.text.body, { fontWeight: '800' }]}>{asset.assetName}</Text>
            <Text style={t.text.caption}>{asset.assetCode || 'No asset code'}</Text>
            <Text style={t.text.caption}>
              {locationName || 'Unknown location'} · {roomName || 'Room not set'}
            </Text>
            <Text style={t.text.caption}>
              {asset.category || 'Uncategorised'}
              {asset.subCategory ? ` · ${asset.subCategory}` : ''}
            </Text>
          </View>

          <StatusBadge label={displayStatus(asset.status)} tone={assetStatusTone(asset.status)} />
        </View>
      </View>

      <View style={{ padding: t.spacing.md, gap: t.spacing.md }}>
        {!result ? (
          <View style={{ gap: 6 }}>
            <Text style={[t.text.body, { fontWeight: '700' }]}>No submitted audit result yet</Text>
            <Text style={t.text.caption}>
              This asset is included in the report, but the auditor has not submitted the universal audit result for this asset yet.
            </Text>
            {asset.notes ? <Text style={t.text.caption}>Latest notes: {asset.notes}</Text> : null}
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: t.spacing.sm,
                alignItems: 'center',
              }}>
              <StatusBadge label={`Priority: ${result.priorityLevel || 'Not recorded'}`} tone={priorityTone(result.priorityLevel)} />
              <StatusBadge label={`Condition: ${conditionLabel(result.conditionRating)}`} tone={result.conditionRating && result.conditionRating <= 2 ? 'bad' : 'neutral'} />
              <StatusBadge label={result.operationalStatus || 'Operational status not recorded'} tone="info" />
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: t.spacing.sm,
              }}>
              <FlagPill label="Maintenance" active={result.maintenanceRequired} />
              <FlagPill label="Replacement" active={result.replacementRequired} />
              <FlagPill label="Safety concern" active={result.safetyConcern} />
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: t.spacing.lg,
              }}>
              <View style={{ flex: 1, minWidth: 220, gap: t.spacing.sm }}>
                <FieldLine label="Completed by" value={completedByName || 'Unknown user'} />
                <FieldLine label="Completed at" value={formatDate(result.completedAt)} />
                <FieldLine
                  label="Expected remaining life"
                  value={
                    typeof result.expectedRemainingLifeYears === 'number'
                      ? `${result.expectedRemainingLifeYears} years`
                      : 'Not recorded'
                  }
                />
              </View>

              <View style={{ flex: 1, minWidth: 220, gap: t.spacing.sm }}>
                <FieldLine label="Estimated maintenance cost" value={moneyLabel(result.estimatedMaintenanceCost)} />
                <FieldLine label="Estimated replacement cost" value={moneyLabel(result.estimatedReplacementCost)} />
                <FieldLine label="Evidence photos" value={result.photoUrls.length} />
              </View>
            </View>

            <View style={{ gap: t.spacing.sm }}>
              <FieldLine label="Issue description" value={result.issueDescription || 'No issue description provided.'} />
              <FieldLine label="Recommended action" value={result.recommendedAction || 'No recommended action provided.'} />
              <FieldLine label="General notes" value={result.generalNotes || asset.notes || 'No notes provided.'} />
            </View>

            {result.photoUrls.length > 0 ? (
              <View style={{ gap: t.spacing.sm }}>
                <Text style={[t.text.caption, { fontWeight: '700' }]}>Audit photos</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                  {result.photoUrls.map((photo, index) => (
                    <AuditPhotoTile key={`${photo}-${index}`} photo={photo} index={index} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
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
        new Set([
          report.assignedUserId,
          ...report.assets.map((asset) => asset.assignedUserId),
          ...report.assets.map((asset) => asset.auditResult?.completedBy ?? ''),
        ].filter(Boolean))
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
  const submittedResults = report.assets.filter((asset) => asset.auditResult).length;
  const maintenanceRequired = report.assets.filter((asset) => asset.auditResult?.maintenanceRequired).length;
  const replacementRequired = report.assets.filter((asset) => asset.auditResult?.replacementRequired).length;
  const safetyConcerns = report.assets.filter((asset) => asset.auditResult?.safetyConcern).length;
  const highRiskResults = report.assets.filter((asset) => {
    const result = asset.auditResult;
    if (!result) return false;
    return result.priorityLevel === 'Critical' || result.conditionRating === 1 || result.safetyConcern;
  }).length;

  const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View style={{ marginBottom: t.spacing.md, gap: 4 }}>
      <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>{title}</Text>
      {subtitle ? <Text style={t.text.caption}>{subtitle}</Text> : null}
    </View>
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

          {message ? <Text style={[t.text.caption, { color: '#2F5B45', fontWeight: '700' }]}>{message}</Text> : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: t.spacing.md,
            marginTop: t.spacing.lg,
          }}>
          <Button label="Reassign report" variant="secondary" onPress={() => setReassignModalOpen(true)} />
          <Button label={deleting ? 'Deleting...' : 'Delete report'} variant="secondary" disabled={deleting} onPress={onDelete} />
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

        <SectionHeading
          title="Audit result snapshot"
          subtitle="These figures are calculated from the client-approved universal audit fields submitted for this report."
        />

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: t.spacing.md,
          }}>
          <MetricCard label="Submitted results" value={`${submittedResults}/${report.assets.length}`} helper="Asset audit rows received" />
          <MetricCard label="Maintenance required" value={maintenanceRequired} />
          <MetricCard label="Replacement required" value={replacementRequired} />
          <MetricCard label="Safety concerns" value={safetyConcerns} />
          <MetricCard
            label="High-risk results"
            value={highRiskResults}
            helper="Derived from priority, condition, or safety concern"
          />
        </View>

        <SectionDivider />

        <SectionHeading
          title="Included assets and universal audit results"
          subtitle="Each asset shows assignment status plus the latest submitted universal audit result, if available."
        />

        <View style={{ gap: t.spacing.md }}>
          {report.assets.length === 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                padding: t.spacing.md,
                backgroundColor: t.colors.card.surface,
              }}>
              <Text style={t.text.caption}>No assets have been added to this report.</Text>
            </View>
          ) : (
            report.assets.map((asset) => (
              <AssetAuditCard
                key={asset.id}
                asset={asset}
                locationName={locationNamesById[asset.locationId] || asset.locationName || 'Unknown location'}
                roomName={roomNamesById[asset.roomId] || asset.roomName || 'Room not set'}
                completedByName={
                  asset.auditResult?.completedBy
                    ? userNamesById[asset.auditResult.completedBy] || asset.auditResult.completedBy
                    : ''
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={reassignModalOpen} transparent animationType="fade" onRequestClose={() => setReassignModalOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: t.spacing.xl,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: t.radius.xl,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.xl,
              gap: t.spacing.lg,
            }}>
            <View style={{ gap: 4 }}>
              <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>Reassign report</Text>
              <Text style={t.text.caption}>
                This changes the assigned auditor for the report and all incomplete or in-progress report assets. Completed asset audit
                results are preserved.
              </Text>
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                overflow: 'hidden',
                backgroundColor: t.colors.card.surfaceAlt,
              }}>
              <Picker selectedValue={selectedReassignUserId} onValueChange={(value) => setSelectedReassignUserId(String(value))}>
                <Picker.Item label="Select auditor" value="" />
                {activeAuditors.map((user) => (
                  <Picker.Item key={user.id} label={user.name} value={user.id} />
                ))}
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', gap: t.spacing.md, justifyContent: 'flex-end' }}>
              <Pressable
                onPress={() => setReassignModalOpen(false)}
                style={{
                  paddingHorizontal: t.spacing.lg,
                  paddingVertical: t.spacing.md,
                  borderRadius: t.radius.md,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                }}>
                <Text style={[t.text.caption, { fontWeight: '700' }]}>Cancel</Text>
              </Pressable>

              <Button label={reassigning ? 'Reassigning...' : 'Reassign'} disabled={reassigning} onPress={onReassign} />
            </View>
          </View>
        </View>
      </Modal>

      <AdminAppBottomNav />
    </ScreenContainer>
  );
}
