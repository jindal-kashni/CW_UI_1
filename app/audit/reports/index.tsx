import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SectionCard } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { fetchAuditorReports, type AuditorReportRecord } from '@/src/services/reports';
import { formatDateDDMMYYYY } from '@/src/utils/date';

type ReportTab = 'todo' | 'inprogress' | 'completed';

function dueDays(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function statusTone(status: AuditorReportRecord['status']) {
  if (status === 'Completed') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D', label: 'Completed' };
  if (status === 'InProgress') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: 'In progress' };
  return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B', label: 'To do' };
}

function dueTone(value: string) {
  const days = dueDays(value);

  if (days === null) {
    return { bg: 'rgba(30,31,28,0.10)', text: '#474B44', label: value ? formatDateDDMMYYYY(value) : 'No due date' };
  }

  if (days < 0) return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: `${Math.abs(days)}d overdue` };
  if (days === 0) return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: 'Due today' };
  if (days <= 3) return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: `${days}d left` };
  if (days <= 7) return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: `${days}d left` };
  return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D', label: `${days}d left` };
}

export default function AuditorReportsIndexScreen() {
  const t = useTheme();
  const { auditorSettings, auditorSettingsReady } = useWorkspace();
  const [reports, setReports] = React.useState<AuditorReportRecord[]>([]);
  const [activeTab, setActiveTab] = React.useState<ReportTab>('todo');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auditorSettingsReady) return;
    if (auditorSettings.defaultReportsTab === 'completed') {
      setActiveTab('completed');
    } else if (auditorSettings.defaultReportsTab === 'inprogress') {
      setActiveTab('inprogress');
    } else {
      setActiveTab('todo');
    }
  }, [auditorSettings.defaultReportsTab, auditorSettingsReady]);

  const loadReports = React.useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);

    const result = await fetchAuditorReports();

    if (!result.ok) {
      setReports([]);
      setError(result.error ?? 'Could not load assigned reports.');
    } else {
      setReports(result.reports);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadReports('initial');
    }, [loadReports])
  );

  const todoReports = React.useMemo(() => reports.filter((report) => report.status === 'Assigned'), [reports]);
  const inProgressReports = React.useMemo(
    () => reports.filter((report) => report.status === 'InProgress'),
    [reports]
  );
  const completedReports = React.useMemo(
    () => reports.filter((report) => report.status === 'Completed'),
    [reports]
  );

  const visibleReports =
    activeTab === 'todo' ? todoReports : activeTab === 'inprogress' ? inProgressReports : completedReports;

  const stats = [
    { label: 'To do', value: todoReports.length },
    { label: 'In progress', value: inProgressReports.length },
    { label: 'Completed', value: completedReports.length },
  ];

  return (
    <ScreenContainer>
      <TopBar title="Your Reports" userName="Auditor" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReports('refresh')} />}
        showsVerticalScrollIndicator={false}>
        <View>
          <Text style={[t.text.title, { fontSize: 30, lineHeight: 36 }]}>Your Reports</Text>
          <Text style={[t.text.caption, { marginTop: 2 }]}>Open assigned condition reports and complete each asset audit.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.card.surface,
                padding: t.spacing.md,
                gap: 4,
              }}>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>{stat.label}</Text>
              <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {[
            { key: 'todo', label: 'To Do', count: todoReports.length },
            { key: 'inprogress', label: 'In Progress', count: inProgressReports.length },
            { key: 'completed', label: 'Completed', count: completedReports.length },
          ].map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as ReportTab)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 42,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.14)',
                    backgroundColor: selected ? '#2F6B4B' : pressed ? 'rgba(0,74,38,0.08)' : '#F4F1EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 8,
                  },
                ]}>
                <Text style={{ color: selected ? '#F7F7F3' : '#2F5B45', fontWeight: '800' }} numberOfLines={1}>
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={{ minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading assigned reports...</Text>
          </View>
        ) : error ? (
          <SectionCard title="Could not load reports">
            <View style={{ gap: t.spacing.md }}>
              <Text style={t.text.bodyMuted}>{error}</Text>
              <Pressable onPress={() => loadReports('refresh')} hitSlop={8}>
                <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '800' }]}>Try again</Text>
              </Pressable>
            </View>
          </SectionCard>
        ) : visibleReports.length === 0 ? (
          <SectionCard title="No reports found">
            <Text style={t.text.bodyMuted}>
              {activeTab === 'todo'
                ? 'There are no assigned reports waiting to be started.'
                : activeTab === 'inprogress'
                  ? 'There are no reports currently in progress.'
                  : 'There are no completed reports yet.'}
            </Text>
          </SectionCard>
        ) : (
          <View style={{ gap: t.spacing.md }}>
            {visibleReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </View>
        )}
      </ScrollView>

      <AppBottomNav />
    </ScreenContainer>
  );
}

function ReportCard({ report }: { report: AuditorReportRecord }) {
  const t = useTheme();
  const status = statusTone(report.status);
  const due = dueTone(report.dueDate);
  const progress = Math.max(0, Math.min(100, report.progressPct));
  const locationLabel = report.locationName || report.locationId || 'Location not set';
  const actionLabel = report.status === 'Completed' ? 'Open report' : report.status === 'InProgress' ? 'Resume' : 'Start';

  return (
    <Pressable
      onPress={() => router.push((`/audit/reports/${report.id}` as any) as any)}
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: pressed ? 'rgba(0,74,38,0.28)' : t.colors.border.subtle,
          borderRadius: t.radius.lg,
          backgroundColor: pressed ? 'rgba(0,74,38,0.04)' : t.colors.card.surface,
          padding: t.spacing.lg,
          gap: t.spacing.md,
        },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[t.text.title, { fontSize: 19, lineHeight: 24 }]}>{report.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FontAwesome name="map-marker" size={13} color={t.colors.brand.forest} />
            <Text style={t.text.caption} numberOfLines={1}>{locationLabel}</Text>
          </View>
        </View>

        <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: status.bg }}>
          <Text style={{ color: status.text, fontWeight: '800', fontSize: 12 }}>{status.label}</Text>
        </View>
      </View>

      {report.summary || report.description ? (
        <Text style={t.text.bodyMuted} numberOfLines={2}>{report.summary || report.description}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
        <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: due.bg }}>
          <Text style={{ color: due.text, fontWeight: '800', fontSize: 12 }}>{due.label}</Text>
        </View>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: 'rgba(30,31,28,0.08)',
          }}>
          <Text style={{ color: '#474B44', fontWeight: '800', fontSize: 12 }}>
            {report.completedAssetCount}/{report.assetCount} assets complete
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(30,31,28,0.10)', overflow: 'hidden' }}>
          <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2F6B4B' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={t.text.caption}>{progress}% complete</Text>
          <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '800' }]}>{actionLabel} →</Text>
        </View>
      </View>
    </Pressable>
  );
}
