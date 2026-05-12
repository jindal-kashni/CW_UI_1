import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Button, SectionCard } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchReportById, type ReportAssetRecord, type ReportDetailsRecord } from '@/src/services/reports';
import { formatDateDDMMYYYY } from '@/src/utils/date';

function statusTone(status: ReportAssetRecord['status']) {
  if (status === 'Completed') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D', label: 'Completed' };
  if (status === 'InProgress') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: 'In progress' };
  if (status === 'Flagged') return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: 'Flagged' };
  if (status === 'Skipped') return { bg: 'rgba(30,31,28,0.10)', text: '#474B44', label: 'Skipped' };
  return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B', label: 'Not started' };
}

function reportStatusLabel(report: ReportDetailsRecord) {
  if (report.rawStatus === 'Completed' || report.progressPct >= 100) return 'Completed';
  if (report.rawStatus === 'InProgress' || report.progressPct > 0) return 'In progress';
  return 'Assigned';
}

export default function AuditorReportDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = Array.isArray(id) ? id[0] : id;
  const [report, setReport] = React.useState<ReportDetailsRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadReport = React.useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!reportId) {
      setReport(null);
      setError('Report ID is missing.');
      setLoading(false);
      return;
    }

    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);

    const row = await fetchReportById(reportId);

    if (!row) {
      setReport(null);
      setError('This report could not be found.');
    } else {
      setReport(row);
    }

    setLoading(false);
    setRefreshing(false);
  }, [reportId]);

  useFocusEffect(
    React.useCallback(() => {
      loadReport('initial');
    }, [loadReport])
  );

  const stats = React.useMemo(() => {
    const assets = report?.assets ?? [];
    const completed = assets.filter((asset) => asset.status === 'Completed').length;
    const inProgress = assets.filter((asset) => asset.status === 'InProgress').length;
    const notStarted = assets.filter((asset) => asset.status === 'NotStarted').length;

    return { total: assets.length, completed, inProgress, notStarted };
  }, [report?.assets]);

  const progress = Math.max(0, Math.min(100, report?.progressPct ?? 0));
  const canFinalise = stats.total > 0 && stats.completed === stats.total;

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
                  <Metric label="Status" value={reportStatusLabel(report)} />
                  <Metric label="Due" value={report.dueDate ? formatDateDDMMYYYY(report.dueDate) : 'No due date'} />
                  <Metric label="Assets" value={`${stats.completed}/${stats.total}`} />
                </View>

                <View style={{ gap: 6 }}>
                  <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(30,31,28,0.10)', overflow: 'hidden' }}>
                    <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2F6B4B' }} />
                  </View>
                  <Text style={t.text.caption}>{progress}% complete</Text>
                </View>
              </View>
            </SectionCard>

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <SummaryCard label="To do" value={stats.notStarted} icon="circle-o" />
              <SummaryCard label="In progress" value={stats.inProgress} icon="clock-o" />
              <SummaryCard label="Completed" value={stats.completed} icon="check-circle" />
            </View>

            <SectionCard title="Assigned assets" subtitle="Open each asset and complete the universal condition audit fields.">
              {report.assets.length === 0 ? (
                <Text style={t.text.bodyMuted}>There are no assets assigned to this report.</Text>
              ) : (
                <View style={{ gap: t.spacing.md }}>
                  {report.assets.map((asset) => (
                    <AssetRow key={asset.id} asset={asset} />
                  ))}
                </View>
              )}
            </SectionCard>

            <SectionCard title="Finalise report">
              <View style={{ gap: t.spacing.md }}>
                <Text style={t.text.bodyMuted}>
                  {canFinalise
                    ? 'All assigned assets have been completed. You can now return to the reports list.'
                    : 'Complete every assigned asset before this report can be treated as finished.'}
                </Text>
                <Button
                  label={canFinalise ? 'Return to reports' : `Complete remaining ${stats.total - stats.completed}`}
                  variant={canFinalise ? undefined : 'secondary'}
                  onPress={() => router.push('/audit/reports' as any)}
                  disabled={!canFinalise}
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

function AssetRow({ asset }: { asset: ReportAssetRecord }) {
  const t = useTheme();
  const tone = statusTone(asset.status);
  const actionLabel = asset.status === 'Completed' ? 'Open' : asset.status === 'InProgress' ? 'Resume' : 'Start';
  const locationLabel = [asset.locationName || asset.locationId, asset.roomName || asset.roomId]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() => router.push((`/audit/reports/asset/${asset.id}` as any) as any)}
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: pressed ? 'rgba(0,74,38,0.28)' : t.colors.border.subtle,
          borderRadius: t.radius.lg,
          backgroundColor: pressed ? 'rgba(0,74,38,0.04)' : t.colors.card.surface,
          padding: t.spacing.md,
          gap: t.spacing.sm,
        },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[t.text.body, { fontWeight: '800' }]}>{asset.assetName}</Text>
          <Text style={t.text.caption}>{asset.assetCode || 'No asset code'}</Text>
          {locationLabel ? <Text style={t.text.caption} numberOfLines={1}>{locationLabel}</Text> : null}
        </View>

        <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: tone.bg }}>
          <Text style={{ color: tone.text, fontWeight: '800', fontSize: 12 }}>{tone.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={t.text.caption} numberOfLines={1}>
          {[asset.category, asset.subCategory].filter(Boolean).join(' · ') || 'Universal audit'}
        </Text>
        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '800' }]}>{actionLabel} →</Text>
      </View>
    </Pressable>
  );
}
