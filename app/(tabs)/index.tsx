import React from 'react';
import { router } from 'expo-router';
import { Text, useWindowDimensions, View } from 'react-native';
import { Button, Card, StatusBadge, SummaryStatCard } from '@/src/components';
import { currentUser } from '@/src/data';
import { ScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { useDemoState } from '@/src/state/DemoStateProvider';

export default function HomeScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const { assignments, setAssignments, alerts, sync } = useDemoState();

  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const drafts = assignments.filter((a) => a.status === 'DraftSaved').length;
  const assigned = assignments.filter((a) => a.status === 'Assigned').length;
  const inProgress = assignments.filter((a) => a.status === 'InProgress').length;
  const completed = assignments.filter((a) => a.status === 'Completed' || a.status === 'Submitted').length;
  const toDoAssignments = assignments.filter((a) => a.status === 'Assigned');
  const inProgressAssignments = assignments.filter((a) => a.status === 'InProgress' || a.status === 'DraftSaved');
  const nextActionAssignment = inProgressAssignments[0] ?? toDoAssignments[0];
  const priorityAlerts = alerts
    .filter((a) => !a.read && (a.severity === 'Urgent' || a.severity === 'Attention'))
    .slice(0, 3);

  const syncSummary = (() => {
    const pending = sync.filter((s) => s.state === 'Pending').length;
    const failed = sync.filter((s) => s.state === 'Failed').length;
    const offline = sync.filter((s) => s.state === 'Offline').length;
    if (failed > 0) return 'Needs attention';
    if (offline > 0) return 'Offline';
    if (pending > 0) return 'Pending';
    return 'Up to date';
  })();

  const syncTone: 'good' | 'warn' | 'bad' | 'info' =
    syncSummary === 'Needs attention'
      ? 'bad'
      : syncSummary === 'Pending'
        ? 'warn'
        : syncSummary === 'Offline'
          ? 'info'
          : 'good';

  const onStart = (id: string) => {
    const target = assignments.find((a) => a.id === id);
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === 'Assigned' ? 'InProgress' : a.status,
              progressPct: Math.max(a.progressPct, 10),
            }
          : a
      )
    );
    if (target?.assetId) {
      router.push((`/audit/form/${target.assetId}` as any) as any);
      return;
    }
    router.push('/audits');
  };

  return (
    <ScreenScaffold title="Home">
      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          gap: t.spacing.xl,
        }}>
        <View style={{ flex: 1, gap: t.spacing.xl }}>
          <Card>
            <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>
              Welcome back, {currentUser.name}
            </Text>
            <View style={{ marginTop: t.spacing.sm, alignItems: 'flex-start' }}>
              <Button
                label="Open full condition report form"
                onPress={() => router.push('/audit/structured-form' as any)}
              />
            </View>
            <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
              Today’s focus: assigned condition reports, draft progress, and sync readiness.
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg }}>
            <SummaryStatCard
              label="Assigned"
              value={`${assigned}`}
              icon="clipboard"
              hint={assigned === 0 ? 'All assigned work started' : 'Ready to begin'}
            />
            <SummaryStatCard
              label="In progress"
              value={`${inProgress}`}
              icon="hourglass-half"
              hint={inProgress === 0 ? 'No active condition reports' : 'Continue where you left off'}
            />
            <SummaryStatCard label="Drafts" value={`${drafts}`} icon="save" hint="Saved on device" />
            <SummaryStatCard
              label="Unread alerts"
              value={`${unreadAlerts}`}
              icon="bell"
              hint={unreadAlerts === 0 ? 'All clear' : 'Review when safe'}
            />
            <SummaryStatCard
              label="Completed"
              value={`${completed}`}
              icon="check-circle"
              hint="Submitted reports"
            />
          </View>

          <Card>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Next action</Text>
            <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
              Jump straight into your highest-priority task.
            </Text>
            <View style={{ height: t.spacing.md }} />
            {nextActionAssignment ? (
              <View
                style={{
                  paddingVertical: t.spacing.sm,
                  paddingHorizontal: t.spacing.md,
                  borderRadius: t.radius.md,
                  backgroundColor: t.colors.card.surfaceAlt,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                }}>
                <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{nextActionAssignment.title}</Text>
                <Text style={[t.text.caption, { marginTop: 2 }]}>
                  Due {new Date(nextActionAssignment.dueAt).toLocaleDateString()} · {nextActionAssignment.progressPct}% complete
                </Text>
              </View>
            ) : (
              <Text style={t.text.caption}>No immediate actions right now.</Text>
            )}
            <View style={{ height: t.spacing.md }} />
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button
                label={inProgressAssignments.length > 0 ? 'Resume report' : 'Begin next report'}
                onPress={() => {
                  if (nextActionAssignment) onStart(nextActionAssignment.id);
                  else router.push('/audits');
                }}
                style={{ flex: 1 }}
              />
              <Button label="View all reports" variant="secondary" onPress={() => router.push('/audits')} style={{ flex: 1 }} />
            </View>
          </Card>
        </View>

        <View style={{ width: isWide ? 360 : 'auto', gap: t.spacing.xl }}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Offline & sync</Text>
              <StatusBadge label={syncSummary} tone={syncTone} />
            </View>
            <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
              Last sync: {new Date(currentUser.lastSyncAt).toLocaleString()}
            </Text>
            <View style={{ height: t.spacing.lg }} />
            <View style={{ gap: t.spacing.sm }}>
              {sync.map((s) => (
                <View
                  key={s.id}
                  style={{
                    paddingVertical: t.spacing.sm,
                    paddingHorizontal: t.spacing.md,
                    borderRadius: t.radius.md,
                    backgroundColor: t.colors.card.surfaceAlt,
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                  }}>
                  <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{s.label}</Text>
                  {s.detail ? <Text style={[t.text.caption, { marginTop: 2 }]}>{s.detail}</Text> : null}
                </View>
              ))}
            </View>
            <View style={{ height: t.spacing.lg }} />
            <Button label="Open offline sync" variant="secondary" onPress={() => router.push('/offline-sync')} />
          </Card>

          <Card>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Priority attention</Text>
            <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
              Urgent items that may require immediate follow-up.
            </Text>
            <View style={{ height: t.spacing.lg }} />
            <View style={{ gap: t.spacing.sm }}>
              {priorityAlerts.length === 0 ? (
                <Text style={t.text.caption}>No urgent notifications right now.</Text>
              ) : (
                priorityAlerts.map((alert) => (
                  <View
                    key={alert.id}
                    style={{
                      paddingVertical: t.spacing.sm,
                      paddingHorizontal: t.spacing.md,
                      borderRadius: t.radius.md,
                      backgroundColor: t.colors.card.surfaceAlt,
                      borderWidth: 1,
                      borderColor: t.colors.border.subtle,
                    }}>
                    <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{alert.title}</Text>
                    <Text style={[t.text.caption, { marginTop: 2 }]}>{alert.body}</Text>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: t.spacing.md }} />
            <View style={{ gap: t.spacing.md }}>
              <Button label="Open inbox" onPress={() => router.push('/alerts' as any)} />
              <Button label="Browse assets" variant="secondary" onPress={() => router.push('/assets')} />
            </View>
          </Card>
        </View>
      </View>
    </ScreenScaffold>
  );
}
