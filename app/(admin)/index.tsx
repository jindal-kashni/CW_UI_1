import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button, Card, SummaryStatCard } from '@/src/components';
import { Calendar } from 'react-native-calendars';
import {
  adminAlerts,
  adminLocationById,
  adminReports,
  adminSyncItems,
  adminUserById,
} from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminDashboardScreen() {
  const t = useTheme();
  const [selectedCalendarDate, setSelectedCalendarDate] = React.useState<string | null>(null);
  const [dayModalOpen, setDayModalOpen] = React.useState(false);
  const assigned = adminReports.filter((r) => r.status === 'ToDo').length;
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const upcoming = adminReports.filter((r) => {
    if (r.status === 'Completed') return false;
    const dueTime = new Date(r.dueDate).getTime();
    return dueTime >= now && dueTime <= now + sevenDaysMs;
  }).length;
  const critical = adminAlerts.filter((a) => a.status === 'Open').length;
  const automations = adminSyncItems.filter((s) => s.state !== 'UpToDate').length;

  const recentActivity = [...adminReports]
    .sort(
      (a, b) =>
        new Date(b.submittedAt ?? b.dueDate).getTime() -
        new Date(a.submittedAt ?? a.dueDate).getTime()
    )
    .slice(0, 5);

  const dateKey = (value?: string) => (value ?? '').slice(0, 10);

  const reportsDueByDate = React.useMemo(
    () =>
      adminReports.reduce<Record<string, typeof adminReports>>((acc, report) => {
        const key = dateKey(report.dueDate);
        if (!key) return acc;
        acc[key] = acc[key] ? [...acc[key], report] : [report];
        return acc;
      }, {}),
    [],
  );

  const completedByDate = React.useMemo(
    () =>
      adminReports.reduce<Record<string, typeof adminReports>>((acc, report) => {
        if (report.status !== 'Completed') return acc;
        const key = dateKey(report.submittedAt ?? report.dueDate);
        if (!key) return acc;
        acc[key] = acc[key] ? [...acc[key], report] : [report];
        return acc;
      }, {}),
    [],
  );

  const urgentAlertsByDate = React.useMemo(
    () =>
      adminAlerts
        .filter((alert) => alert.status === 'Open' && alert.severity === 'Urgent')
        .reduce<Record<string, typeof adminAlerts>>((acc, alert) => {
          const key = dateKey(alert.createdAt);
          if (!key) return acc;
          acc[key] = acc[key] ? [...acc[key], alert] : [alert];
          return acc;
        }, {}),
    [],
  );

  const syncActivityByDate = React.useMemo(
    () =>
      adminSyncItems.reduce<Record<string, typeof adminSyncItems>>((acc, item) => {
        const key = dateKey(item.updatedAt);
        if (!key) return acc;
        acc[key] = acc[key] ? [...acc[key], item] : [item];
        return acc;
      }, {}),
    [],
  );

  const markedDates = React.useMemo(() => {
    const entries: Record<string, any> = {};
    const addDot = (key: string, dot: { key: string; color: string }) => {
      entries[key] = entries[key] ?? { dots: [] as { key: string; color: string }[] };
      if (!entries[key].dots.some((existing: { key: string }) => existing.key === dot.key)) {
        entries[key].dots.push(dot);
      }
    };

    Object.keys(reportsDueByDate).forEach((key) => {
      addDot(key, { key: 'service-required', color: '#2F6B4B' });
    });
    Object.keys(urgentAlertsByDate).forEach((key) => {
      addDot(key, { key: 'critical-service', color: '#A6584B' });
    });
    Object.keys(syncActivityByDate).forEach((key) => {
      addDot(key, { key: 'automation-run', color: '#3A72C6' });
    });

    if (selectedCalendarDate) {
      entries[selectedCalendarDate] = {
        ...(entries[selectedCalendarDate] ?? {}),
        selected: true,
        selectedColor: '#2F6B4B',
      };
    }

    return entries;
    return entries;
  }, [reportsDueByDate, urgentAlertsByDate, syncActivityByDate, selectedCalendarDate]);

  const selectedReportsDue = selectedCalendarDate ? (reportsDueByDate[selectedCalendarDate] ?? []) : [];
  const selectedCompleted = selectedCalendarDate ? (completedByDate[selectedCalendarDate] ?? []) : [];
  const selectedUrgentAlerts = selectedCalendarDate ? (urgentAlertsByDate[selectedCalendarDate] ?? []) : [];
  const selectedAutomations = selectedCalendarDate ? (syncActivityByDate[selectedCalendarDate] ?? []) : [];

  return (
    <AdminScreenScaffold title="Admin Dashboard">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin Dashboard</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Oversight view of reports, assets, users, alerts and sync health.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg }}>
        <SummaryStatCard label="Assigned" value={`${assigned}`} icon="clipboard" hint="Awaiting action" />
        <SummaryStatCard label="Upcoming" value={`${upcoming}`} icon="calendar" hint="Due in 7 days" />
        <SummaryStatCard label="Critical" value={`${critical}`} icon="warning" hint="Open alerts" />
        <SummaryStatCard label="Automations" value={`${automations}`} icon="refresh" hint="Needs attention" />
      </View>

      <View style={{ height: t.spacing.xl }} />
      <Card>
        <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Quick actions</Text>
        <Text style={[t.text.caption, { marginTop: 4, marginBottom: t.spacing.md }]}>
          Assign condition reports to team members.
        </Text>
        <Button label="Assign report" onPress={() => router.push('/admin/assign-report' as any)} />
      </Card>

      <View style={{ height: t.spacing.xl }} />
      <Card>
        <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Calendar</Text>
        <Text style={[t.text.caption, { marginTop: 4, marginBottom: t.spacing.md }]}>
          Track report due dates across assigned, in-progress, and completed reports.
        </Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.md, marginBottom: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#2F6B4B' }} />
            <Text style={t.text.caption}>Service required</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#A6584B' }} />
            <Text style={t.text.caption}>Critical service required</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#3A72C6' }} />
            <Text style={t.text.caption}>Automation run</Text>
          </View>
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
      <Card>
        <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Recent activity</Text>
        <Text style={[t.text.caption, { marginTop: 4, marginBottom: t.spacing.md }]}>
          Latest report movements across teams.
        </Text>
        <View style={{ gap: t.spacing.sm }}>
          {recentActivity.map((report) => (
            <View
              key={report.id}
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                backgroundColor: t.colors.card.surfaceAlt,
                borderRadius: t.radius.md,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
              }}>
              <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{report.title}</Text>
              <Text style={[t.text.caption, { marginTop: 2 }]}>
                {adminUserById[report.assignedUserId]?.name ?? 'Unknown user'} · {report.status} ·{' '}
                {new Date(report.submittedAt ?? report.dueDate).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      </Card>

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
              maxWidth: 640,
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
                {selectedCalendarDate ? new Date(selectedCalendarDate).toLocaleDateString() : 'Day details'}
              </Text>
              <Pressable onPress={() => setDayModalOpen(false)}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
              <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Info about the day</Text>
              <Text style={t.text.caption}>
                Tasks completed: {selectedCompleted.length} · Services due: {selectedReportsDue.length} · Critical
                services: {selectedUrgentAlerts.length} · Automations run: {selectedAutomations.length}
              </Text>

              {selectedReportsDue.length > 0 ? (
                <View style={{ gap: t.spacing.xs }}>
                  <Text style={[t.text.caption, { fontWeight: '700' }]}>Services due</Text>
                  {selectedReportsDue.map((report) => (
                    <Text key={report.id} style={t.text.caption}>
                      {report.title} · {adminUserById[report.assignedUserId]?.name ?? 'Unknown'} ·{' '}
                      {adminLocationById[report.locationId]?.name ?? 'Unknown location'}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={t.text.caption}>No services due on this date.</Text>
              )}

              {selectedCompleted.length > 0 ? (
                <View style={{ gap: t.spacing.xs }}>
                  <Text style={[t.text.caption, { fontWeight: '700' }]}>Tasks completed</Text>
                  {selectedCompleted.map((report) => (
                    <Text key={report.id} style={t.text.caption}>
                      {report.title} · {report.progressPct}% submitted
                    </Text>
                  ))}
                </View>
              ) : null}

              {selectedUrgentAlerts.length > 0 ? (
                <View style={{ gap: t.spacing.xs }}>
                  <Text style={[t.text.caption, { fontWeight: '700' }]}>Critical service required</Text>
                  {selectedUrgentAlerts.map((alert) => (
                    <Text key={alert.id} style={t.text.caption}>
                      {alert.title}
                    </Text>
                  ))}
                </View>
              ) : null}

              {selectedAutomations.length > 0 ? (
                <View style={{ gap: t.spacing.xs }}>
                  <Text style={[t.text.caption, { fontWeight: '700' }]}>Automation runs</Text>
                  {selectedAutomations.map((sync) => (
                    <Text key={sync.id} style={t.text.caption}>
                      {sync.deviceLabel} · {sync.state}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreenScaffold>
  );
}
