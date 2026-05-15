import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Card } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import {
  fetchAdminDashboardData,
  type AdminDashboardAuditItem,
  type AdminDashboardCalendarEvent,
  type AdminDashboardData,
  type AdminDashboardLocationIssue,
  type AdminDashboardReportItem,
} from '@/src/services/dashboard';
import { resolveUserNames } from '@/src/services/lookups';

type Tone = 'good' | 'neutral' | 'warn' | 'bad' | 'info';
type WidgetKey =
  | 'critical'
  | 'replacement'
  | 'maintenance'
  | 'ready'
  | 'overdue'
  | 'dueWeek'
  | 'recentFinalised';

const eventColorByType: Record<AdminDashboardCalendarEvent['type'], string> = {
  ReportDue: '#2F6B4B',
  ReportOverdue: '#A6584B',
  ReadyToFinalise: '#B7791F',
  ReportFinalised: '#3A72C6',
  HighRiskFinding: '#B83232',
};

const eventLabelByType: Record<AdminDashboardCalendarEvent['type'], string> = {
  ReportDue: 'Report due',
  ReportOverdue: 'Overdue report',
  ReadyToFinalise: 'Ready to finalise',
  ReportFinalised: 'Finalised report',
  HighRiskFinding: 'High-risk finding',
};

function startOfTodayMs() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function conditionLabel(rating?: number | null) {
  if (rating === 5) return '5 · Excellent';
  if (rating === 4) return '4 · Good';
  if (rating === 3) return '3 · Fair';
  if (rating === 2) return '2 · Poor';
  if (rating === 1) return '1 · Needs urgent attention';
  return 'Not recorded';
}

function toneForPriority(priority: string): Tone {
  if (priority === 'Critical') return 'bad';
  if (priority === 'High') return 'warn';
  if (priority === 'Medium') return 'info';
  return 'neutral';
}

function statusTone(status: string): Tone {
  if (status === 'Finalised') return 'good';
  if (status === 'Ready to finalise') return 'info';
  if (status === 'Overdue') return 'bad';
  if (status === 'In Progress') return 'warn';
  return 'neutral';
}

function Pill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = useTheme();
  const colours: Record<Tone, { bg: string; text: string; border: string }> = {
    good: { bg: '#E8F5EE', text: '#246B45', border: '#B9DBC8' },
    neutral: { bg: t.colors.card.surfaceAlt, text: t.colors.text.muted, border: t.colors.border.subtle },
    warn: { bg: '#FFF7E6', text: '#8A5A00', border: '#F0D49A' },
    bad: { bg: '#FDECEC', text: '#A43E35', border: '#E8B8B2' },
    info: { bg: '#EAF1FB', text: '#2F5F9F', border: '#BDD0EB' },
  };
  const c = colours[tone];

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}>
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>{title}</Text>
      {subtitle ? <Text style={t.text.caption}>{subtitle}</Text> : null}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        backgroundColor: t.colors.card.surfaceAlt,
        borderRadius: t.radius.md,
        padding: t.spacing.md,
      }}>
      <Text style={t.text.caption}>{message}</Text>
    </View>
  );
}

function SummaryWidget({
  title,
  value,
  hint,
  active,
  onPress,
}: {
  title: string;
  value: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexGrow: 1,
        flexBasis: 220,
        minHeight: 112,
        borderWidth: 1,
        borderColor: active ? t.colors.brand.forest : t.colors.border.subtle,
        backgroundColor: active ? '#E8F5EE' : t.colors.card.surface,
        borderRadius: t.radius.lg,
        padding: t.spacing.lg,
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: active ? 0.08 : 0.04,
        shadowRadius: active ? 8 : 4,
        shadowOffset: { width: 0, height: 2 },
      }}>
      <Text style={[t.text.caption, { fontWeight: '800', color: active ? t.colors.brand.forest : t.colors.text.muted }]}>
        {title}
      </Text>
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{value}</Text>
      <Text style={t.text.caption}>{hint}</Text>
      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700', marginTop: 2 }]}>
        {active ? 'Hide list' : 'Show list'}
      </Text>
    </Pressable>
  );
}

function ResultRow({ item, showReplacementCost = false }: { item: AdminDashboardAuditItem; showReplacementCost?: boolean }) {
  const t = useTheme();
  const replacementCost = item.estimatedReplacementCost ?? 0;
  const maintenanceCost = item.estimatedMaintenanceCost ?? 0;

  return (
    <Pressable
      onPress={() => router.push((`/admin/reports/${item.reportId}` as any) as any)}
      style={{
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        backgroundColor: t.colors.card.surfaceAlt,
        borderRadius: t.radius.md,
        padding: t.spacing.md,
        gap: t.spacing.xs,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={{ color: t.colors.text.primary, fontWeight: '800' }}>{item.assetName}</Text>
          <Text style={t.text.caption}>{item.assetCode} · {item.category}</Text>
          <Text style={t.text.caption}>{item.locationName} · {item.roomName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: t.spacing.xs, flexWrap: 'wrap' }}>
          <Pill label={item.priorityLevel} tone={toneForPriority(item.priorityLevel)} />
          {item.safetyConcern ? <Pill label="Safety" tone="bad" /> : null}
          {item.replacementRequired ? <Pill label="Replacement" tone="warn" /> : null}
          {item.maintenanceRequired ? <Pill label="Maintenance" tone="info" /> : null}
        </View>
      </View>
      <Text style={t.text.caption}>{conditionLabel(item.conditionRating)} · {item.operationalStatus}</Text>
      <Text style={t.text.caption}>Report: {item.reportTitle}</Text>
      {item.completedAt ? <Text style={t.text.caption}>Submitted: {formatDateTime(item.completedAt)}</Text> : null}
      {item.issueDescription ? <Text style={t.text.caption}>{item.issueDescription}</Text> : null}
      {showReplacementCost ? (
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Estimated replacement cost: {formatCurrency(replacementCost)}</Text>
      ) : maintenanceCost > 0 ? (
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Estimated maintenance cost: {formatCurrency(maintenanceCost)}</Text>
      ) : null}
      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Open report</Text>
    </Pressable>
  );
}

function ReportRow({ report }: { report: AdminDashboardReportItem }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.push((`/admin/reports/${report.id}` as any) as any)}
      style={{
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        backgroundColor: t.colors.card.surfaceAlt,
        borderRadius: t.radius.md,
        padding: t.spacing.md,
        gap: t.spacing.xs,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={{ color: t.colors.text.primary, fontWeight: '800' }}>{report.title}</Text>
          <Text style={t.text.caption}>{report.locationName} · {report.departmentName}</Text>
        </View>
        <Pill label={report.workflowStatus} tone={statusTone(report.workflowStatus)} />
      </View>
      <Text style={t.text.caption}>
        {report.completedAssetCount}/{report.assetCount} assets synced · {report.progressPct}% progress
      </Text>
      <Text style={t.text.caption}>Due: {report.dueAt ? formatDateDDMMYYYY(report.dueAt) : 'Not set'}</Text>
      {report.completedAt ? <Text style={t.text.caption}>Finalised: {formatDateTime(report.completedAt)}</Text> : null}
      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Open report</Text>
    </Pressable>
  );
}

function LocationIssueRow({ location }: { location: AdminDashboardLocationIssue }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.push((`/admin/locations/${location.locationId}` as any) as any)}
      style={{
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        backgroundColor: t.colors.card.surfaceAlt,
        borderRadius: t.radius.md,
        padding: t.spacing.md,
        gap: t.spacing.xs,
      }}>
      <Text style={{ color: t.colors.text.primary, fontWeight: '800' }}>{location.locationName}</Text>
      <Text style={t.text.caption}>{location.departmentName}</Text>
      <Text style={t.text.caption}>
        {location.issueCount} issue result{location.issueCount === 1 ? '' : 's'} · {location.highRiskCount} high-risk · {location.safetyCount} safety
      </Text>
      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Open location</Text>
    </Pressable>
  );
}

function ConditionBreakdown({ data }: { data: AdminDashboardData['conditionBreakdown'] }) {
  const t = useTheme();
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <View style={{ gap: t.spacing.sm }}>
      {data.map((item) => (
        <View key={item.rating} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
            <Text style={t.text.caption}>{item.rating} · {item.label}</Text>
            <Text style={[t.text.caption, { fontWeight: '700' }]}>{item.count}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 999, backgroundColor: t.colors.card.surfaceAlt, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${Math.max(4, Math.round((item.count / max) * 100))}%`,
                backgroundColor: item.rating <= 2 ? '#A6584B' : item.rating === 3 ? '#B7791F' : '#2F6B4B',
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const t = useTheme();
  const [dashboard, setDashboard] = React.useState<AdminDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = React.useState<string | null>(null);
  const [dayModalOpen, setDayModalOpen] = React.useState(false);
  const [userNameById, setUserNameById] = React.useState<Record<string, string>>({});
  const [activeWidget, setActiveWidget] = React.useState<WidgetKey | null>('critical');

  const loadDashboard = React.useCallback(async () => {
    setLoadingDashboard(true);
    setErrorMessage(null);
    try {
      const data = await fetchAdminDashboardData();
      setDashboard(data);
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Could not load dashboard data.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    (async () => {
      const userIds = Array.from(
        new Set([
          ...(dashboard?.reports.map((report) => report.assignedUserId) ?? []),
          ...(dashboard?.finalisedAuditResults.map((result) => result.completedBy) ?? []),
        ].filter((id): id is string => Boolean(id)))
      );
      if (userIds.length === 0) {
        setUserNameById({});
        return;
      }
      setUserNameById(await resolveUserNames(userIds));
    })();
  }, [dashboard]);

  const eventsByDate = React.useMemo(() => {
    return (dashboard?.calendarEvents ?? []).reduce<Record<string, AdminDashboardCalendarEvent[]>>((acc, event) => {
      if (!event.date) return acc;
      acc[event.date] = acc[event.date] ? [...acc[event.date], event] : [event];
      return acc;
    }, {});
  }, [dashboard]);

  const markedDates = React.useMemo(() => {
    const entries: Record<string, any> = {};
    Object.entries(eventsByDate).forEach(([date, events]) => {
      const dots = Object.values(
        events.reduce<Record<string, { key: string; color: string }>>((acc, event) => {
          acc[event.type] = { key: event.type, color: eventColorByType[event.type] };
          return acc;
        }, {})
      );
      entries[date] = { dots };
    });

    if (selectedCalendarDate) {
      entries[selectedCalendarDate] = {
        ...(entries[selectedCalendarDate] ?? {}),
        selected: true,
        selectedColor: t.colors.brand.forest,
      };
    }

    return entries;
  }, [eventsByDate, selectedCalendarDate, t.colors.brand.forest]);

  const selectedEvents = selectedCalendarDate ? eventsByDate[selectedCalendarDate] ?? [] : [];
  const todayMs = startOfTodayMs();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const dueThisWeekReports = React.useMemo(() => {
    return (dashboard?.reports ?? [])
      .filter((report) => {
        if (report.isFinalised || !report.dueAt) return false;
        const dueMs = new Date(report.dueAt).getTime();
        return Number.isFinite(dueMs) && dueMs >= todayMs && dueMs <= todayMs + sevenDaysMs;
      })
      .slice(0, 8);
  }, [dashboard, sevenDaysMs, todayMs]);

  const readyReports = dashboard?.reports.filter((report) => report.isReadyToFinalise).slice(0, 8) ?? [];
  const overdueReports = dashboard?.reports.filter((report) => report.isOverdue).slice(0, 8) ?? [];
  const criticalResults = dashboard?.criticalAlerts.slice(0, 8) ?? [];
  const replacementResults = dashboard?.replacementRequired.slice(0, 8) ?? [];
  const maintenanceResults = dashboard?.maintenanceRequired.slice(0, 8) ?? [];
  const recentlyFinalisedReports = dashboard?.recentlyFinalisedReports.slice(0, 8) ?? [];

  const toggleWidget = React.useCallback((key: WidgetKey) => {
    setActiveWidget((current) => (current === key ? null : key));
  }, []);

  const renderWidgetList = () => {
    if (!dashboard || !activeWidget) return null;

    if (activeWidget === 'critical') {
      return (
        <Card>
          <SectionHeader title="Critical alerts" subtitle="Finalised high-risk audit results. Open a result to view the relevant report." />
          <View style={{ height: t.spacing.md }} />
          <View style={{ gap: t.spacing.sm }}>
            {criticalResults.length === 0 ? <EmptyState message="No critical/high-risk finalised audit results yet." /> : criticalResults.map((item) => <ResultRow key={item.id} item={item} />)}
          </View>
        </Card>
      );
    }

    if (activeWidget === 'replacement') {
      return (
        <Card>
          <SectionHeader title="Estimated replacement costs" subtitle="Assets flagged for replacement in finalised audits. Costs use the audit result's estimated replacement cost." />
          <View style={{ height: t.spacing.md }} />
          <View style={{ gap: t.spacing.sm }}>
            {replacementResults.length === 0 ? (
              <EmptyState message="No replacement-required finalised audit results yet." />
            ) : (
              replacementResults.map((item) => <ResultRow key={item.id} item={item} showReplacementCost />)
            )}
          </View>
        </Card>
      );
    }

    if (activeWidget === 'maintenance') {
      return (
        <Card>
          <SectionHeader title="Maintenance required" subtitle="Finalised audit results that require maintenance action." />
          <View style={{ height: t.spacing.md }} />
          <View style={{ gap: t.spacing.sm }}>
            {maintenanceResults.length === 0 ? <EmptyState message="No finalised maintenance actions recorded yet." /> : maintenanceResults.map((item) => <ResultRow key={item.id} item={item} />)}
          </View>
        </Card>
      );
    }

    if (activeWidget === 'ready') {
      return (
        <Card>
          <SectionHeader title="Ready to finalise" subtitle="Reports where every asset audit is synced, but the auditor has not finalised the report yet." />
          <View style={{ height: t.spacing.md }} />
          <View style={{ gap: t.spacing.sm }}>
            {readyReports.length === 0 ? <EmptyState message="No reports are currently ready to finalise." /> : readyReports.map((report) => <ReportRow key={report.id} report={report} />)}
          </View>
        </Card>
      );
    }

    if (activeWidget === 'overdue') {
      return (
        <Card>
          <SectionHeader title="Overdue reports" subtitle="Active reports past their due date. Open a report to view, reassign, or follow up." />
          <View style={{ height: t.spacing.md }} />
          <View style={{ gap: t.spacing.sm }}>
            {overdueReports.length === 0 ? <EmptyState message="No overdue active reports." /> : overdueReports.map((report) => <ReportRow key={report.id} report={report} />)}
          </View>
        </Card>
      );
    }

    if (activeWidget === 'dueWeek') {
      return (
        <Card>
          <SectionHeader title="Due this week" subtitle="Active audit reports due in the next seven days." />
          <View style={{ height: t.spacing.md }} />
          <View style={{ gap: t.spacing.sm }}>
            {dueThisWeekReports.length === 0 ? <EmptyState message="No active reports are due in the next seven days." /> : dueThisWeekReports.map((report) => <ReportRow key={report.id} report={report} />)}
          </View>
        </Card>
      );
    }

    return (
      <Card>
        <SectionHeader title="Recently finalised reports" subtitle="Finalised reports available for admin review and future PDF export." />
        <View style={{ height: t.spacing.md }} />
        <View style={{ gap: t.spacing.sm }}>
          {recentlyFinalisedReports.length === 0 ? <EmptyState message="No finalised reports yet." /> : recentlyFinalisedReports.map((report) => <ReportRow key={report.id} report={report} />)}
        </View>
      </Card>
    );
  };

  return (
    <AdminScreenScaffold title="Admin Dashboard">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin Dashboard</Text>
          <Text style={[t.text.caption, { marginTop: -4 }]}>Operational dashboard built from finalised audit results, active report workflow data, and static asset/location records.</Text>
        </View>
        <Pressable
          onPress={loadDashboard}
          style={{
            minHeight: 40,
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.card.surface,
            paddingHorizontal: t.spacing.md,
            justifyContent: 'center',
          }}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '800' }}>Refresh</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      {loadingDashboard ? (
        <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={t.colors.brand.forest} />
          <Text style={t.text.caption}>Loading dashboard data...</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <Card>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Dashboard could not load</Text>
          <Text style={[t.text.caption, { marginTop: 6 }]}>{errorMessage}</Text>
        </Card>
      ) : null}

      {dashboard ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg }}>
            <SummaryWidget
              title="Critical alerts"
              value={`${dashboard.totals.criticalAlerts}`}
              hint="Finalised high-risk results"
              active={activeWidget === 'critical'}
              onPress={() => toggleWidget('critical')}
            />
            <SummaryWidget
              title="Estimated replacement costs"
              value={formatCurrency(dashboard.totals.capexEstimate)}
              hint={`${dashboard.totals.replacementRequired} item${dashboard.totals.replacementRequired === 1 ? '' : 's'} flagged for replacement`}
              active={activeWidget === 'replacement'}
              onPress={() => toggleWidget('replacement')}
            />
            <SummaryWidget
              title="Estimated Maintainance costs"
              value={formatCurrency(dashboard.totals.maintenanceEstimate)}
              hint={`${dashboard.totals.maintenanceRequired} item${dashboard.totals.replacementRequired === 1 ? '' : 's'} flagged for maintanance`}
              active={activeWidget === 'maintenance'}
              onPress={() => toggleWidget('maintenance')}
            />
            <SummaryWidget
              title="Ready to finalise"
              value={`${dashboard.totals.readyToFinaliseReports}`}
              hint="All assets synced"
              active={activeWidget === 'ready'}
              onPress={() => toggleWidget('ready')}
            />
            <SummaryWidget
              title="Overdue reports"
              value={`${dashboard.totals.overdueReports}`}
              hint="Needs follow-up"
              active={activeWidget === 'overdue'}
              onPress={() => toggleWidget('overdue')}
            />
            <SummaryWidget
              title="Due this week"
              value={`${dashboard.totals.dueThisWeekReports}`}
              hint="Active audit reports"
              active={activeWidget === 'dueWeek'}
              onPress={() => toggleWidget('dueWeek')}
            />
            <SummaryWidget
              title="Recently finalised"
              value={`${dashboard.totals.finalisedReports}`}
              hint="Completed reports"
              active={activeWidget === 'recentFinalised'}
              onPress={() => toggleWidget('recentFinalised')}
            />
          </View>

          <View style={{ height: t.spacing.xl }} />
          {renderWidgetList()}

          <View style={{ height: t.spacing.xl }} />
          <Card>
            <SectionHeader title="Live calendar" subtitle="Interactive calendar for incomplete report due dates, overdue reports, ready-to-finalise reports, finalised reports, and high-risk findings." />
            <View style={{ flexDirection: 'row', gap: t.spacing.md, marginVertical: t.spacing.md, flexWrap: 'wrap' }}>
              {Object.entries(eventLabelByType).map(([type, label]) => (
                <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: eventColorByType[type as AdminDashboardCalendarEvent['type']] }} />
                  <Text style={t.text.caption}>{label}</Text>
                </View>
              ))}
            </View>
            <Calendar
              style={{ minHeight: 390 }}
              firstDay={1}
              hideExtraDays
              enableSwipeMonths
              markingType="multi-dot"
              onDayPress={(day) => {
                setSelectedCalendarDate(day.dateString);
                setDayModalOpen(true);
              }}
              markedDates={markedDates}
              theme={{
                backgroundColor: t.colors.card.surface,
                calendarBackground: t.colors.card.surface,
                dayTextColor: t.colors.text.primary,
                textSectionTitleColor: t.colors.text.muted,
                monthTextColor: t.colors.text.primary,
                arrowColor: t.colors.brand.forest,
                todayTextColor: t.colors.brand.forest,
                selectedDayTextColor: '#FFFFFF',
              }}
            />
          </Card>

          <View style={{ height: t.spacing.xl }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg }}>
            <View style={{ flex: 1, minWidth: 330 }}>
              <Card>
                <SectionHeader title="Asset condition breakdown" subtitle="Condition ratings from finalised audit results." />
                <View style={{ height: t.spacing.md }} />
                <ConditionBreakdown data={dashboard.conditionBreakdown} />
              </Card>
            </View>

            <View style={{ flex: 1, minWidth: 330 }}>
              <Card>
                <SectionHeader title="Top issue locations" subtitle="Locations with the most finalised audit findings requiring attention." />
                <View style={{ height: t.spacing.md }} />
                <View style={{ gap: t.spacing.sm }}>
                  {dashboard.topIssueLocations.length === 0 ? (
                    <EmptyState message="No location issue trends yet." />
                  ) : (
                    dashboard.topIssueLocations.map((location) => <LocationIssueRow key={location.locationId} location={location} />)
                  )}
                </View>
              </Card>
            </View>
          </View>
        </>
      ) : null}

      <Modal visible={dayModalOpen} transparent animationType="fade" onRequestClose={() => setDayModalOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable onPress={() => setDayModalOpen(false)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '85%',
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
              <Text style={[t.text.caption, { fontWeight: '700' }]}>
                {selectedCalendarDate ? formatDateDDMMYYYY(selectedCalendarDate) : 'Day details'}
              </Text>
              <Pressable onPress={() => setDayModalOpen(false)}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
              <SectionHeader title="Calendar items" subtitle={`${selectedEvents.length} item${selectedEvents.length === 1 ? '' : 's'} for this date.`} />
              <View style={{ gap: t.spacing.sm }}>
                {selectedEvents.length === 0 ? (
                  <EmptyState message="No dashboard items for this date." />
                ) : (
                  selectedEvents.map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => {
                        setDayModalOpen(false);
                        router.push((event.route as any) as any);
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: t.colors.border.subtle,
                        backgroundColor: t.colors.card.surfaceAlt,
                        borderRadius: t.radius.md,
                        padding: t.spacing.md,
                        gap: 4,
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: eventColorByType[event.type] }} />
                        <Text style={{ color: t.colors.text.primary, fontWeight: '800' }}>{event.title}</Text>
                        <Pill label={eventLabelByType[event.type]} tone={event.type === 'ReportOverdue' || event.type === 'HighRiskFinding' ? 'bad' : event.type === 'ReadyToFinalise' ? 'info' : 'neutral'} />
                      </View>
                      <Text style={t.text.caption}>{event.subtitle}</Text>
                      <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Open linked item</Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}
