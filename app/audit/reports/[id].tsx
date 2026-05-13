import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Button, SectionCard } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import {
  fetchReportById,
  finaliseAuditorReport,
  syncPendingAuditSubmissions,
  type ReportAssetRecord,
  type ReportDetailsRecord,
} from '@/src/services/reports';
import {
  getPendingReportAudits,
  getPendingReportStats,
  type PendingAuditSubmission,
} from '@/src/services/auditPendingQueue';
import { formatDateDDMMYYYY } from '@/src/utils/date';

type DisplayAssetStatus = ReportAssetRecord['status'] | 'Draft' | 'PendingSync' | 'SyncFailed' | 'Locked';

function statusTone(status: DisplayAssetStatus) {
  if (status === 'Locked') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44', label: 'Locked' };
  if (status === 'Completed') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D', label: 'Completed' };
  if (status === 'PendingSync') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: 'Pending sync' };
  if (status === 'SyncFailed') return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: 'Sync failed' };
  if (status === 'Draft') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: 'Draft saved' };
  if (status === 'InProgress') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: 'In progress' };
  if (status === 'Flagged') return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: 'Flagged' };
  if (status === 'Skipped') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44', label: 'Skipped' };
  return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B', label: 'Not started' };
}

function reportStatusLabel(report: ReportDetailsRecord, pendingCount: number) {
  if (report.rawStatus === 'Completed') return 'Finalised';
  if (pendingCount > 0) return 'Pending sync';
  if (report.rawStatus === 'InProgress' || report.progressPct > 0) return 'In progress';
  return 'Assigned';
}

export default function AuditorReportDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = Array.isArray(id) ? id[0] : id;

  const [report, setReport] = React.useState<ReportDetailsRecord | null>(null);
  const [pendingAudits, setPendingAudits] = React.useState<PendingAuditSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [finalising, setFinalising] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadReport = React.useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!reportId) {
      setReport(null);
      setPendingAudits([]);
      setError('Report ID is missing.');
      setLoading(false);
      return;
    }

    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);

    const [row, pending] = await Promise.all([
      fetchReportById(reportId),
      getPendingReportAudits(reportId),
    ]);

    if (!row) {
      setReport(null);
      setError('This report could not be found. If you are offline, open the Reports tab while online first so assigned reports can be cached.');
    } else {
      setReport(row);
    }

    setPendingAudits(pending);
    setLoading(false);
    setRefreshing(false);
  }, [reportId]);

  useFocusEffect(
    React.useCallback(() => {
      loadReport('initial');
    }, [loadReport])
  );

  const pendingByReportAssetId = React.useMemo(() => {
    return Object.fromEntries(pendingAudits.map((item) => [item.reportAssetId, item]));
  }, [pendingAudits]);

  const stats = React.useMemo(() => {
    const assets = report?.assets ?? [];
    const reportAssetIds = assets.map((asset) => asset.id);
    const pendingStats = getPendingReportStats(pendingAudits, reportAssetIds);
    const completed = assets.filter((asset) => asset.status === 'Completed').length;
    const inProgress = assets.filter((asset) => asset.status === 'InProgress').length;
    const notStarted = assets.filter((asset) => asset.status === 'NotStarted').length;

    return {
      total: assets.length,
      completed,
      inProgress,
      notStarted,
      pendingStats,
    };
  }, [pendingAudits, report?.assets]);

  const reportIsFinalised = Boolean(report && report.rawStatus === 'Completed');
  const progress = Math.max(0, Math.min(100, report?.progressPct ?? 0));
  const hasPendingItems = stats.pendingStats.totalPending > 0;
  const hasSyncableItems = pendingAudits.some((item) => item.status === 'PendingSync' || item.status === 'SyncFailed');
  const remainingCount = Math.max(0, stats.total - stats.completed);
  const canFinalise = Boolean(
    report &&
    !reportIsFinalised &&
    stats.total > 0 &&
    stats.completed === stats.total &&
    !hasPendingItems &&
    !finalising
  );

  const handleSyncPending = React.useCallback(async () => {
    if (!reportId || syncing) return;

    setSyncing(true);
    const result = await syncPendingAuditSubmissions(reportId);
    await loadReport('refresh');
    setSyncing(false);

    if (!result.ok) {
      Alert.alert(
        'Some audits could not sync',
        result.error ?? `${result.syncedCount} synced, ${result.failedCount} failed. Check your connection and try again.`
      );
      return;
    }

    Alert.alert('Sync complete', `${result.syncedCount} pending audit${result.syncedCount === 1 ? '' : 's'} synced.`);
  }, [loadReport, reportId, syncing]);

  const handleFinaliseReport = React.useCallback(async () => {
    if (!report) {
      Alert.alert('Report unavailable', 'This report could not be loaded.');
      return;
    }

    if (reportIsFinalised) {
      Alert.alert('Already finalised', 'This report has already been finalised.');
      return;
    }

    if (hasPendingItems) {
      Alert.alert('Sync required', 'Sync all local pending audits before finalising this report.');
      return;
    }

    if (stats.total === 0) {
      Alert.alert('No assets assigned', 'This report has no assigned assets to finalise.');
      return;
    }

    if (stats.completed !== stats.total) {
      Alert.alert(
        'Report not complete',
        `Complete all assigned assets before finalising. ${stats.completed}/${stats.total} assets are completed.`
      );
      return;
    }

    try {
      setFinalising(true);

      const result = await finaliseAuditorReport(report.id);

      if (!result.ok) {
        Alert.alert('Could not finalise report', result.error ?? 'Please try again.');
        return;
      }

      await loadReport('refresh');
      Alert.alert('Report finalised', 'This report is now locked from auditor edits.');
    } finally {
      setFinalising(false);
    }
  }, [hasPendingItems, loadReport, report, reportIsFinalised, stats.completed, stats.total]);

  return (
    <ScreenContainer>
      <TopBar title="Report Details" userName="Auditor" onPressBack={() => router.push('/audit/reports' as any)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReport('refresh')} />}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading report...</Text>
          </View>
        ) : error || !report ? (
          <SectionCard title="Report unavailable">
            <View style={{ gap: t.spacing.md }}>
              <Text style={t.text.bodyMuted}>{error ?? 'This report is not available.'}</Text>
              <Button label="Back to reports" variant="secondary" onPress={() => router.push('/audit/reports' as any)} />
            </View>
          </SectionCard>
        ) : (
          <>
            <SectionCard title={report.title} subtitle={report.summary || report.description || 'Assigned condition report.'}>
              <View style={{ gap: t.spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: t.spacing.md, flexWrap: 'wrap' }}>
                  <Metric label="Status" value={reportStatusLabel(report, stats.pendingStats.totalPending)} />
                  <Metric label="Due" value={report.dueDate ? formatDateDDMMYYYY(report.dueDate) : 'No due date'} />
                  <Metric label="Assets" value={`${stats.completed}/${stats.total}`} />
                </View>

                <View style={{ gap: 6 }}>
                  <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(30,31,28,0.10)', overflow: 'hidden' }}>
                    <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2F6B4B' }} />
                  </View>
                  <Text style={t.text.caption}>
                    {reportIsFinalised
                      ? 'Finalised and locked'
                      : hasPendingItems
                        ? `${progress}% synced · ${stats.pendingStats.totalPending} local item${stats.pendingStats.totalPending === 1 ? '' : 's'} pending`
                        : `${progress}% complete`}
                  </Text>
                </View>
              </View>
            </SectionCard>

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <SummaryCard label="To do" value={stats.notStarted} icon="circle-o" />
              <SummaryCard label="In progress" value={stats.inProgress} icon="clock-o" />
              <SummaryCard label="Completed" value={stats.completed} icon="check-circle" />
            </View>

            {hasPendingItems ? (
              <SectionCard title="Pending local audits" subtitle="These are stored on this device until they sync to Supabase.">
                <View style={{ gap: t.spacing.md }}>
                  <Text style={t.text.bodyMuted}>
                    Drafts: {stats.pendingStats.drafts} · Pending sync: {stats.pendingStats.pendingSync} · Sync failed: {stats.pendingStats.syncFailed}
                  </Text>
                  <Button
                    label={syncing ? 'Syncing...' : hasSyncableItems ? 'Sync pending audits' : 'No sync-ready audits'}
                    variant={hasSyncableItems ? undefined : 'secondary'}
                    onPress={handleSyncPending}
                    disabled={!hasSyncableItems || syncing}
                  />
                </View>
              </SectionCard>
            ) : null}

            <SectionCard title="Assigned assets" subtitle="Complete each asset audit. Completed assets can still be edited until the full report is finalised.">
              {report.assets.length === 0 ? (
                <Text style={t.text.bodyMuted}>There are no assets assigned to this report.</Text>
              ) : (
                <View style={{ gap: t.spacing.md }}>
                  {report.assets.map((asset) => (
                    <AssetRow
                      key={asset.id}
                      asset={asset}
                      pending={pendingByReportAssetId[asset.id]}
                      reportIsFinalised={reportIsFinalised}
                    />
                  ))}
                </View>
              )}
            </SectionCard>

            <SectionCard title="Finalise report">
              <View style={{ gap: t.spacing.md }}>
                <Text style={t.text.bodyMuted}>
                  {reportIsFinalised
                    ? 'This report has been finalised. Submitted reports are locked from further auditor edits.'
                    : hasPendingItems
                      ? 'Sync all local pending audits before finalising this report.'
                      : canFinalise
                        ? 'All assigned assets have been completed and synced. Finalise this report to lock it from further auditor edits.'
                        : 'Complete every assigned asset before finalising this report.'}
                </Text>
                <Button
                  label={
                    reportIsFinalised
                      ? 'Return to reports'
                      : finalising
                        ? 'Finalising...'
                        : canFinalise
                          ? 'Finalise Report'
                          : hasPendingItems
                            ? 'Sync pending audits first'
                            : `Complete remaining ${remainingCount}`
                  }
                  variant={canFinalise && !reportIsFinalised ? undefined : 'secondary'}
                  onPress={reportIsFinalised ? () => router.push('/audit/reports' as any) : handleFinaliseReport}
                  disabled={!reportIsFinalised && !canFinalise}
                />
              </View>
            </SectionCard>
          </>
        )}
      </ScrollView>

      <AppBottomNav />
    </ScreenContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        minWidth: 120,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        backgroundColor: t.colors.card.surfaceAlt,
        padding: t.spacing.md,
        gap: 4,
      }}>
      <Text style={[t.text.caption, { fontWeight: '700' }]}>{label}</Text>
      <Text style={[t.text.body, { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.card.surface,
        padding: t.spacing.md,
        gap: 6,
      }}>
      <FontAwesome name={icon as any} size={18} color={t.colors.brand.forest} />
      <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>{value}</Text>
      <Text style={t.text.caption}>{label}</Text>
    </View>
  );
}

function displayStatusForAsset(asset: ReportAssetRecord, pending: PendingAuditSubmission | undefined, reportIsFinalised: boolean): DisplayAssetStatus {
  if (reportIsFinalised) return 'Locked';
  if (pending?.status === 'PendingSync') return 'PendingSync';
  if (pending?.status === 'SyncFailed') return 'SyncFailed';
  if (pending?.status === 'Draft') return 'Draft';
  return asset.status;
}

function actionLabelForStatus(status: DisplayAssetStatus, asset: ReportAssetRecord, reportIsFinalised: boolean) {
  if (reportIsFinalised) return 'Locked';
  if (status === 'PendingSync') return 'Edit pending';
  if (status === 'SyncFailed') return 'Retry/edit';
  if (status === 'Draft') return 'Resume';
  if (asset.status === 'Completed') return 'Edit';
  if (asset.status === 'InProgress') return 'Resume';
  return 'Start';
}

function AssetRow({
  asset,
  pending,
  reportIsFinalised,
}: {
  asset: ReportAssetRecord;
  pending?: PendingAuditSubmission;
  reportIsFinalised: boolean;
}) {
  const t = useTheme();
  const displayStatus = displayStatusForAsset(asset, pending, reportIsFinalised);
  const tone = statusTone(displayStatus);
  const actionLabel = actionLabelForStatus(displayStatus, asset, reportIsFinalised);
  const locationLabel = [asset.locationName || asset.locationId, asset.roomName || asset.roomId]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      disabled={reportIsFinalised}
      onPress={() => {
        if (!reportIsFinalised) router.push((`/audit/reports/asset/${asset.id}` as any) as any);
      }}
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: pressed ? 'rgba(0,74,38,0.28)' : t.colors.border.subtle,
          borderRadius: t.radius.lg,
          backgroundColor: reportIsFinalised ? 'rgba(30,31,28,0.035)' : pressed ? 'rgba(0,74,38,0.04)' : t.colors.card.surface,
          padding: t.spacing.md,
          gap: t.spacing.sm,
        },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[t.text.body, { fontWeight: '800' }]}>{asset.assetName}</Text>
          <Text style={t.text.caption}>{asset.assetCode || 'No asset code'}</Text>
          {locationLabel ? <Text style={t.text.caption} numberOfLines={1}>{locationLabel}</Text> : null}
          {pending?.lastError ? <Text style={[t.text.caption, { color: '#B63E34' }]} numberOfLines={2}>{pending.lastError}</Text> : null}
        </View>

        <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: tone.bg }}>
          <Text style={{ color: tone.text, fontWeight: '800', fontSize: 12 }}>{tone.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={t.text.caption} numberOfLines={1}>
          {[asset.category, asset.subCategory].filter(Boolean).join(' · ') || 'Universal audit'}
        </Text>
        <Text
          style={[
            t.text.caption,
            {
              color: reportIsFinalised ? t.colors.text.muted : t.colors.brand.forest,
              fontWeight: '800',
            },
          ]}>
          {reportIsFinalised ? actionLabel : `${actionLabel} →`}
        </Text>
      </View>
    </Pressable>
  );
}
