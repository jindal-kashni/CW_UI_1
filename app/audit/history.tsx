import React from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SectionCard } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { fetchAuditAssignments } from '@/src/services/reports';
import {
  createReportAccessRequest,
  fetchAuditorReportAccessStates,
} from '@/src/services/systemData';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import { getSessionCache, setSessionCache } from '@/src/state/sessionCache';
import type { AuditAssignment } from '@/src/types/models';
import { resolveLocationNames } from '@/src/services/lookups';

type HistoryCache = {
  assignments: AuditAssignment[];
  approvedAccessIds: string[];
  pendingAccessIds: string[];
};

export default function AuditHistoryScreen() {
  const t = useTheme();
  const { assignments, setAssignments } = useDemoState();
  const { user, auditorSettings, auditorSettingsReady } = useWorkspace();
  const [message, setMessage] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'todo' | 'inprogress' | 'completed'>('todo');
  const [viewMode, setViewMode] = React.useState<'location' | 'asset'>('location');
  const [approvedAccessIds, setApprovedAccessIds] = React.useState<string[]>([]);
  const [pendingAccessIds, setPendingAccessIds] = React.useState<string[]>([]);
  const [dueUrgencyIndicators, setDueUrgencyIndicators] = React.useState(true);
  const [largeTouchTargets, setLargeTouchTargets] = React.useState(false);
  const [reminderFrequency, setReminderFrequency] = React.useState<'off' | 'daily' | 'every_2_days'>(
    'daily'
  );
  const [settingsReady, setSettingsReady] = React.useState(false);
  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const cacheKey = React.useMemo(() => `audit-history-${user?.id ?? 'anon'}`, [user?.id]);

  React.useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    const cached = getSessionCache<HistoryCache>(cacheKey);
    if (cached) {
      setAssignments(cached.assignments);
      setApprovedAccessIds(cached.approvedAccessIds);
      setPendingAccessIds(cached.pendingAccessIds);
    }
    (async () => {
      const rows = await fetchAuditAssignments();
      if (mounted) {
        setAssignments(rows);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cacheKey, setAssignments, user?.id]);

  React.useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    (async () => {
      const states = await fetchAuditorReportAccessStates(user.id);
      if (!mounted) return;
      setApprovedAccessIds(states.approvedAssignmentIds);
      setPendingAccessIds(states.pendingAssignmentIds);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  React.useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    if (activeTab !== 'completed') return;
    (async () => {
      const states = await fetchAuditorReportAccessStates(user.id);
      if (!mounted) return;
      setApprovedAccessIds(states.approvedAssignmentIds);
      setPendingAccessIds(states.pendingAssignmentIds);
    })();
    return () => {
      mounted = false;
    };
  }, [activeTab, user?.id]);

  React.useEffect(() => {
    if (!auditorSettingsReady) return;
    setActiveTab(auditorSettings.defaultReportsTab);
    setViewMode(auditorSettings.defaultReportsView);
    setDueUrgencyIndicators(auditorSettings.dueUrgencyIndicators);
    setLargeTouchTargets(auditorSettings.largeTouchTargets);
    setReminderFrequency(auditorSettings.reminderFrequency);
    setSettingsReady(true);
  }, [auditorSettings, auditorSettingsReady]);

  const visibleAssignments = React.useMemo(() => {
    // DB RLS already scopes auditors to their own rows.
    return assignments;
  }, [assignments]);

  const assignedReports = visibleAssignments.filter((a) => a.status === 'Assigned');
  const inProgressReports = visibleAssignments.filter(
    (a) => a.status === 'InProgress' || a.status === 'DraftSaved'
  );
  const completedReports = visibleAssignments.filter(
    (a) => a.status === 'Completed' || a.status === 'Submitted'
  );

  const accessGrantedIds = React.useMemo(() => new Set(approvedAccessIds), [approvedAccessIds]);
  const pendingAccessRequestIds = React.useMemo(() => new Set(pendingAccessIds), [pendingAccessIds]);
  const groupedByLocation = React.useCallback(
    (rows: typeof visibleAssignments) => {
      const groups = new Map<string, typeof visibleAssignments>();
      for (const item of rows) {
        const key = item.locationId ?? item.locationScope.precincts[0] ?? 'Unknown location';
        const existing = groups.get(key) ?? [];
        existing.push(item);
        groups.set(key, existing);
      }
      return Array.from(groups.entries()).map(([key, items]) => {
        const first = items[0];
        const locationName = first.locationId
          ? locationNameById[first.locationId] ?? first.locationScope.precincts[0] ?? 'Unknown location'
          : first.locationScope.precincts[0] ?? 'Unknown location';
        const dueSorted = [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
        const firstDue = dueSorted[0]?.dueAt ?? first.dueAt;
        const latestDue = dueSorted[dueSorted.length - 1]?.dueAt ?? first.dueAt;
        const avgProgress = Math.round(
          items.reduce((acc, curr) => acc + (curr.progressPct ?? 0), 0) / Math.max(items.length, 1)
        );
        return {
          key,
          locationName,
          items,
          count: items.length,
          firstDue,
          latestDue,
          avgProgress,
          firstItem: first,
        };
      });
    },
    [locationNameById]
  );
  const groupedTodo = React.useMemo(() => groupedByLocation(assignedReports), [assignedReports, groupedByLocation]);
  const groupedInProgress = React.useMemo(
    () => groupedByLocation(inProgressReports),
    [inProgressReports, groupedByLocation]
  );
  const groupedCompleted = React.useMemo(
    () => groupedByLocation(completedReports),
    [completedReports, groupedByLocation]
  );

  React.useEffect(() => {
    let mounted = true;
    if (!user?.id || reminderFrequency === 'off') return;
    const dueSoonCount = assignedReports.filter((item) => {
      const target = new Date(item.dueAt);
      if (Number.isNaN(target.getTime())) return false;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const dueDays = Math.ceil((target.getTime() - start.getTime()) / 86400000);
      return dueDays <= 3;
    }).length;
    if (dueSoonCount <= 0) return;

    (async () => {
      const key = `audit-reminder-last-${user.id}`;
      const last = await AsyncStorage.getItem(key);
      const now = Date.now();
      const intervalMs = reminderFrequency === 'daily' ? 24 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000;
      const isDue = !last || now - Number(last) >= intervalMs;
      if (!mounted || !isDue) return;
      Alert.alert(
        'Report reminder',
        `You have ${dueSoonCount} report${dueSoonCount === 1 ? '' : 's'} due within 3 days.`
      );
      await AsyncStorage.setItem(key, String(now));
    })();
    return () => {
      mounted = false;
    };
  }, [assignedReports, reminderFrequency, user?.id]);

  React.useEffect(() => {
    let mounted = true;
    const ids = Array.from(
      new Set(assignments.map((a) => a.locationId).filter((id): id is string => Boolean(id)))
    );
    if (ids.length === 0) return;
    (async () => {
      const resolved = await resolveLocationNames(ids);
      if (!mounted) return;
      setLocationNameById(resolved);
    })();
    return () => {
      mounted = false;
    };
  }, [assignments]);

  React.useEffect(() => {
    if (!user?.id) return;
    setSessionCache<HistoryCache>(cacheKey, {
      assignments,
      approvedAccessIds,
      pendingAccessIds,
    });
  }, [assignments, approvedAccessIds, pendingAccessIds, cacheKey, user?.id]);

  const toneForStatus = (status: string) => {
    if (status === 'Assigned') return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B' };
    if (status === 'InProgress' || status === 'DraftSaved')
      return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
    return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D' };
  };

  return (
    <ScreenContainer>
      <TopBar title="Condition Report History" userName="Auditor" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <View>
          <Text style={[t.text.title, { fontSize: 30, lineHeight: 36 }]}>Your Reports</Text>
          <Text style={[t.text.caption, { marginTop: 2 }]}>
            View and manage To Do, In Progress and Completed condition reports.
          </Text>
        </View>
        {!settingsReady ? (
          <View style={{ minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading your report preferences...</Text>
          </View>
        ) : (
          <>

        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {[
            { key: 'todo', label: 'To Do' },
            { key: 'inprogress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <View key={tab.key} style={{ flex: 1 }}>
                <Text
                  onPress={() => setActiveTab(tab.key as typeof activeTab)}
                  style={{
                    minHeight: 42,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? '#2F6B4B' : 'rgba(0,74,38,0.14)',
                    backgroundColor: selected ? '#2F6B4B' : '#F4F1EA',
                    color: selected ? '#F7F7F3' : '#2F5B45',
                    fontWeight: '700',
                    paddingTop: 10,
                  }}>
                  {tab.label}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {[
            { key: 'location', label: 'Location view' },
            { key: 'asset', label: 'Asset list' },
          ].map((mode) => {
            const selected = viewMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                onPress={() => setViewMode(mode.key as typeof viewMode)}
                style={({ pressed }) => [
                  {
                    minHeight: 34,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: selected ? 'rgba(31,59,44,0.24)' : t.colors.border.subtle,
                    backgroundColor: selected
                      ? t.colors.brand.forestTint
                      : pressed
                        ? 'rgba(30,31,28,0.04)'
                        : t.colors.card.surface,
                  },
                ]}>
                <Text
                  style={[
                    t.text.caption,
                    { fontWeight: '700', color: selected ? t.colors.brand.forest : t.colors.text.secondary },
                  ]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'todo' ? (
          <View style={{ gap: t.spacing.md }}>
            {assignedReports.length === 0 ? (
              <SectionCard title="To Do">
                <Text style={t.text.caption}>No assigned reports right now.</Text>
              </SectionCard>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.lg,
                  overflow: 'hidden',
                  backgroundColor: t.colors.card.surface,
                }}>
                <TodoHeaderRow />
                {viewMode === 'asset'
                  ? assignedReports.map((item, idx) => (
                      <TodoReportRow
                        key={item.id}
                        item={item}
                        isLast={idx === assignedReports.length - 1}
                        actionLabel="Start"
                        onAction={() => router.push((`/audit/form/${item.assetId}` as any) as any)}
                        largeTouchTargets={largeTouchTargets}
                      />
                    ))
                  : groupedTodo.map((group, idx) => (
                      <TodoReportRow
                        key={group.key}
                        item={{
                          id: group.key,
                          title: group.locationName,
                          dueAt: group.firstDue,
                          summary: `${group.count} assets in this audit batch`,
                        }}
                        isLast={idx === groupedTodo.length - 1}
                        actionLabel="Open"
                        locationGrouped
                        onAction={() =>
                          router.push((`/audit/form/${group.firstItem.assetId}` as any) as any)
                        }
                        largeTouchTargets={largeTouchTargets}
                      />
                    ))}
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'inprogress' ? (
          <View style={{ gap: t.spacing.md }}>
            {inProgressReports.length === 0 ? (
              <SectionCard title="In Progress">
                <Text style={t.text.caption}>No in-progress reports.</Text>
              </SectionCard>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.lg,
                  overflow: 'hidden',
                  backgroundColor: t.colors.card.surface,
                }}>
                <HeaderRow />
                {viewMode === 'asset'
                  ? inProgressReports.map((item, idx) => (
                      <ReportRow
                        key={item.id}
                        item={item}
                        isLast={idx === inProgressReports.length - 1}
                        actionLabel="Resume"
                        onAction={() => router.push((`/audit/form/${item.assetId}` as any) as any)}
                        toneForStatus={toneForStatus}
                        showProgress
                        dateMode="due"
                        dueUrgencyIndicators={dueUrgencyIndicators}
                        largeTouchTargets={largeTouchTargets}
                      />
                    ))
                  : groupedInProgress.map((group, idx) => (
                      <ReportRow
                        key={group.key}
                        item={{
                          id: group.key,
                          title: group.locationName,
                          dueAt: group.firstDue,
                          status: 'InProgress',
                          progressPct: group.avgProgress,
                          summary: `${group.count} assets in this audit batch`,
                        }}
                        isLast={idx === groupedInProgress.length - 1}
                        actionLabel="Open"
                        locationGrouped
                        onAction={() =>
                          router.push((`/audit/form/${group.firstItem.assetId}` as any) as any)
                        }
                        toneForStatus={toneForStatus}
                        showProgress
                        dateMode="due"
                        dueUrgencyIndicators={dueUrgencyIndicators}
                        largeTouchTargets={largeTouchTargets}
                      />
                    ))}
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'completed' ? (
          <View style={{ gap: t.spacing.md }}>
            {completedReports.length === 0 ? (
              <SectionCard title="Completed">
                <Text style={t.text.caption}>No completed reports yet.</Text>
              </SectionCard>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.lg,
                  overflow: 'hidden',
                  backgroundColor: t.colors.card.surface,
                }}>
                <HeaderRow />
                {viewMode === 'asset'
                  ? completedReports.map((item, idx) => {
                      const hasAccess = accessGrantedIds.has(item.id);
                      const pending = pendingAccessRequestIds.has(item.id);
                      return (
                        <ReportRow
                          key={item.id}
                          item={item}
                          isLast={idx === completedReports.length - 1}
                          actionLabel={hasAccess ? 'Open' : pending ? 'Pending' : 'Request access'}
                          onAction={
                            hasAccess
                              ? () => router.push((`/audit/report/${item.id}` as any) as any)
                              : pending
                                ? undefined
                                : async () => {
                                    if (!user?.id) {
                                      setMessage('Could not submit request. Please sign in again.');
                                      return;
                                    }
                                    const ok = await createReportAccessRequest({
                                      assignmentId: item.id,
                                      auditorUserId: user.id,
                                      assignmentTitle: item.title,
                                    });
                                    if (!ok) {
                                      setMessage('Request failed. Please try again.');
                                      return;
                                    }
                                    setPendingAccessIds((prev) =>
                                      prev.includes(item.id) ? prev : [item.id, ...prev]
                                    );
                                    setMessage('Access request sent to admin for approval.');
                                  }
                          }
                          toneForStatus={toneForStatus}
                          dateMode="submitted"
                          dueUrgencyIndicators={dueUrgencyIndicators}
                          largeTouchTargets={largeTouchTargets}
                        />
                      );
                    })
                  : groupedCompleted.map((group, idx) => {
                      const groupHasAccess = group.items.some((i) => accessGrantedIds.has(i.id));
                      const groupPending = group.items.some((i) => pendingAccessRequestIds.has(i.id));
                      return (
                        <ReportRow
                          key={group.key}
                          item={{
                            id: group.key,
                            title: group.locationName,
                            dueAt: group.latestDue,
                            status: 'Completed',
                            progressPct: 100,
                            summary: `${group.count} assets in this audit batch`,
                          }}
                          isLast={idx === groupedCompleted.length - 1}
                          actionLabel={
                            groupHasAccess ? 'Open' : groupPending ? 'Pending' : 'Request access'
                          }
                          locationGrouped
                          onAction={
                            groupHasAccess
                              ? () => {
                                  const target = group.items.find((i) => accessGrantedIds.has(i.id)) ?? group.firstItem;
                                  router.push((`/audit/report/${target.id}` as any) as any);
                                }
                              : groupPending
                                ? undefined
                                : async () => {
                                    if (!user?.id) {
                                      setMessage('Could not submit request. Please sign in again.');
                                      return;
                                    }
                                    const targets = group.items.filter(
                                      (i) => !accessGrantedIds.has(i.id) && !pendingAccessRequestIds.has(i.id)
                                    );
                                    if (targets.length === 0) return;
                                    let okAll = true;
                                    for (const target of targets) {
                                      const ok = await createReportAccessRequest({
                                        assignmentId: target.id,
                                        auditorUserId: user.id,
                                        assignmentTitle: target.title,
                                      });
                                      if (!ok) okAll = false;
                                    }
                                    if (!okAll) {
                                      setMessage('Some requests failed. Please retry.');
                                      return;
                                    }
                                    setPendingAccessIds((prev) => [
                                      ...new Set([...targets.map((i) => i.id), ...prev]),
                                    ]);
                                    setMessage('Access request sent to admin for approval.');
                                  }
                          }
                          toneForStatus={toneForStatus}
                          dateMode="submitted"
                          dueUrgencyIndicators={dueUrgencyIndicators}
                          largeTouchTargets={largeTouchTargets}
                        />
                      );
                    })}
              </View>
            )}
          </View>
        ) : null}
        {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}
          </>
        )}
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

function TodoHeaderRow() {
  const t = useTheme();
  return (
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
      <Text style={[t.text.caption, { flex: 2.7, fontWeight: '700' }]}>Report</Text>
      <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Due</Text>
      <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700', textAlign: 'right' }]}>Action</Text>
    </View>
  );
}

function TodoReportRow({
  item,
  isLast,
  actionLabel,
  locationGrouped = false,
  onAction,
  largeTouchTargets = false,
}: {
  item: { id: string; title: string; dueAt: string; summary?: string };
  isLast: boolean;
  actionLabel: string;
  locationGrouped?: boolean;
  onAction?: () => void | Promise<void>;
  largeTouchTargets?: boolean;
}) {
  const t = useTheme();
  const dueDays = (() => {
    const date = new Date(item.dueAt);
    if (Number.isNaN(date.getTime())) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - start.getTime()) / 86400000);
  })();
  const dueLabel = dueDays === null ? '-' : `${Math.max(dueDays, 0)} days`;

  const reportSubtext = (() => {
    const match = item.summary?.match(/\(([^)]+)\)/);
    const assetCode = match?.[1];
    if (assetCode) return `${assetCode} · 1 asset`;
    return '1 asset';
  })();

  const rowPaddingVertical = largeTouchTargets ? 16 : t.spacing.md;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: t.spacing.md,
        paddingVertical: rowPaddingVertical,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.colors.border.subtle,
      }}>
      <View style={{ flex: 2.7, paddingRight: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {locationGrouped ? (
            <FontAwesome name="map-marker" size={13} color={t.colors.brand.forest} />
          ) : null}
          <Text style={[t.text.body, { fontWeight: '700', flex: 1 }]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={[t.text.caption, { fontWeight: '500', marginTop: 2 }]} numberOfLines={1}>
          {reportSubtext}
        </Text>
      </View>
      <Text style={[t.text.caption, { flex: 1 }]}>{dueLabel}</Text>
      <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
        <Pressable onPress={onAction} disabled={!onAction} hitSlop={8}>
          <Text
            style={[
              t.text.caption,
              { fontWeight: '500', color: onAction ? t.colors.brand.forest : t.colors.text.muted },
            ]}>
            {actionLabel} →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function HeaderRow() {
  const t = useTheme();
  return (
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
      <Text style={[t.text.caption, { flex: 2.3, fontWeight: '700' }]}>Report</Text>
      <Text style={[t.text.caption, { flex: 1.2, fontWeight: '700' }]}>Date</Text>
      <Text style={[t.text.caption, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>Status</Text>
      <Text style={[t.text.caption, { flex: 1.3, fontWeight: '700', textAlign: 'center' }]}>Progress</Text>
      <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700', textAlign: 'right' }]}>Action</Text>
    </View>
  );
}

function ReportRow({
  item,
  isLast,
  actionLabel,
  onAction,
  toneForStatus,
  showProgress = false,
  dateMode = 'due',
  locationGrouped = false,
  dueUrgencyIndicators = true,
  largeTouchTargets = false,
}: {
  item: { id: string; title: string; dueAt: string; status: string; progressPct?: number; summary?: string };
  isLast: boolean;
  actionLabel: string;
  onAction?: () => void | Promise<void>;
  toneForStatus: (status: string) => { bg: string; text: string };
  showProgress?: boolean;
  dateMode?: 'due' | 'submitted';
  locationGrouped?: boolean;
  dueUrgencyIndicators?: boolean;
  largeTouchTargets?: boolean;
}) {
  const t = useTheme();
  const statusTone = toneForStatus(item.status);
  const dueDays = (() => {
    const date = new Date(item.dueAt);
    if (Number.isNaN(date.getTime())) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - start.getTime()) / 86400000);
  })();
  const dueTone =
    dueDays === null
      ? { bg: 'rgba(30,31,28,0.10)', text: '#474B44', label: formatDateDDMMYYYY(item.dueAt) }
      : !dueUrgencyIndicators
        ? { bg: 'rgba(30,31,28,0.10)', text: '#474B44', label: `${Math.max(dueDays, 0)}d` }
        : dueDays <= 3
          ? { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29', label: `${Math.max(dueDays, 0)}d` }
          : dueDays <= 7
            ? { bg: 'rgba(182,141,61,0.16)', text: '#6A5421', label: `${dueDays}d` }
            : { bg: 'rgba(47,107,75,0.12)', text: '#1F563D', label: `${dueDays}d` };
  const submittedLabel = formatDateDDMMYYYY(item.dueAt);
  const progress = Math.max(0, Math.min(100, item.progressPct ?? 0));
  const rowPaddingVertical = largeTouchTargets ? 16 : t.spacing.md;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: t.spacing.md,
        paddingVertical: rowPaddingVertical,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.colors.border.subtle,
      }}>
      <View style={{ flex: 2.3, paddingRight: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {locationGrouped ? (
            <FontAwesome name="map-marker" size={13} color={t.colors.brand.forest} />
          ) : null}
          <Text style={[t.text.body, { fontWeight: '600', flex: 1 }]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {item.summary ? (
          <Text style={[t.text.caption, { fontWeight: '500', marginTop: 2 }]} numberOfLines={1}>
            {item.summary}
          </Text>
        ) : null}
      </View>
      <View style={{ flex: 1.2 }}>
        {dateMode === 'submitted' ? (
          <Text style={t.text.caption}>{submittedLabel}</Text>
        ) : (
          <View
            style={{
              alignSelf: 'flex-start',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: dueTone.bg,
            }}>
            <Text style={{ color: dueTone.text, fontWeight: '700', fontSize: 12 }}>{dueTone.label}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View
          style={{
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: statusTone.bg,
          }}>
          <Text style={{ color: statusTone.text, fontWeight: '700', fontSize: 12 }}>
            {item.status === 'DraftSaved' ? 'Draft' : item.status}
          </Text>
        </View>
      </View>
      <View style={{ flex: 1.3, alignItems: 'center', justifyContent: 'center' }}>
        {showProgress ? (
          <View style={{ width: '100%', maxWidth: 110, gap: 4 }}>
            <View
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(30,31,28,0.10)',
                overflow: 'hidden',
              }}>
              <View
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#2F6B4B',
                }}
              />
            </View>
            <Text style={[t.text.caption, { textAlign: 'center' }]}>{progress}%</Text>
          </View>
        ) : (
          <Text style={t.text.caption}>-</Text>
        )}
      </View>
      <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
        <Pressable onPress={onAction} disabled={!onAction} hitSlop={8}>
          <Text
            style={[
              t.text.caption,
              { fontWeight: '500', color: onAction ? t.colors.brand.forest : t.colors.text.muted },
            ]}>
            {actionLabel} →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

