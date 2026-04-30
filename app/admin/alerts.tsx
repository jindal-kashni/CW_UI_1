import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EmptyState } from '@/src/components';
import type { AdminAlertRecord } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import {
  fetchAdminAlerts,
  fetchPendingReportAccessRequestsForAdmin,
  markAlertResolved,
  type ReportAccessRequest,
  resolveReportAccessRequest,
} from '@/src/services/systemData';
import { resolveLocationNames, resolveUserNames } from '@/src/services/lookups';
import { formatDateDDMMYYYY } from '@/src/utils/date';

type FilterKey = 'All' | AdminAlertRecord['severity'] | AdminAlertRecord['status'] | AdminAlertRecord['type'];

export default function AdminAlertsPage() {
  const t = useTheme();
  const [alerts, setAlerts] = React.useState<AdminAlertRecord[]>([]);
  const [filter, setFilter] = React.useState<FilterKey>('All');
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [accessRequests, setAccessRequests] = React.useState<ReportAccessRequest[]>([]);
  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const [userNameById, setUserNameById] = React.useState<Record<string, string>>({});
  const [loadingAlerts, setLoadingAlerts] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [rows, requests] = await Promise.all([
        fetchAdminAlerts(),
        fetchPendingReportAccessRequestsForAdmin(),
      ]);
      setAlerts(rows);
      setAccessRequests(requests);
      setLoadingAlerts(false);
    })();
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const locationIds = Array.from(new Set(alerts.map((a) => a.locationId).filter((id): id is string => Boolean(id))));
    const userIds = Array.from(new Set(alerts.map((a) => a.userId).filter((id): id is string => Boolean(id))));
    (async () => {
      const [loc, users] = await Promise.all([
        locationIds.length ? resolveLocationNames(locationIds) : Promise.resolve({}),
        userIds.length ? resolveUserNames(userIds) : Promise.resolve({}),
      ]);
      if (!mounted) return;
      setLocationNameById(loc);
      setUserNameById(users);
    })();
    return () => {
      mounted = false;
    };
  }, [alerts]);

  const filtered = alerts.filter((alert) => {
    if (filter === 'All') return true;
    return alert.severity === filter || alert.status === filter || alert.type === filter;
  });

  return (
    <AdminScreenScaffold title="Alerts">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>System Alerts</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Track sync, report, user and asset alerts across the platform.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.md, flexWrap: 'wrap' }}>
        {['All', 'Urgent', 'Attention', 'Open', 'Resolved', 'Sync', 'Report', 'Asset', 'User'].map((item) => {
          const selected = filter === (item as FilterKey);
          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item as FilterKey)}
              style={({ pressed }) => [
                {
                  minHeight: 38,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                  backgroundColor: selected ? '#2F6B4B' : pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
                  justifyContent: 'center',
                },
              ]}>
              <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: t.spacing.lg }} />
      {accessRequests.length > 0 ? (
        <View style={{ gap: t.spacing.md, marginBottom: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 22, lineHeight: 28 }]}>Report access requests</Text>
          {accessRequests.map((request) => (
            <View
              key={request.id}
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.card.surface,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.md,
                gap: 6,
              }}>
              <Text style={[t.text.body, { fontWeight: '700' }]}>{request.assignmentTitle}</Text>
              <Text style={t.text.caption}>
                Requested by {request.requesterLabel} · {formatDateDDMMYYYY(request.createdAt)}
              </Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: 2 }}>
                <Pressable
                  onPress={async () => {
                    setActionError(null);
                    const ok = await resolveReportAccessRequest({
                      requestId: request.id,
                      assignmentId: request.assignmentId,
                      auditorUserId: request.requesterUserId,
                      assignmentTitle: request.assignmentTitle,
                      approved: true,
                    });
                    if (!ok) {
                      setActionError('Could not approve request. Please try again.');
                      return;
                    }
                    setAccessRequests((prev) => prev.filter((item) => item.id !== request.id));
                  }}>
                  <Text style={[t.text.caption, { color: '#2F6B4B', fontWeight: '700' }]}>Approve access</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    setActionError(null);
                    const ok = await resolveReportAccessRequest({
                      requestId: request.id,
                      assignmentId: request.assignmentId,
                      auditorUserId: request.requesterUserId,
                      assignmentTitle: request.assignmentTitle,
                      approved: false,
                    });
                    if (!ok) {
                      setActionError('Could not decline request. Please try again.');
                      return;
                    }
                    setAccessRequests((prev) => prev.filter((item) => item.id !== request.id));
                  }}>
                  <Text style={[t.text.caption, { color: '#B63E34', fontWeight: '700' }]}>Decline access</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ gap: t.spacing.md }}>
        {loadingAlerts ? (
          <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading alerts...</Text>
          </View>
        ) : null}
        {!loadingAlerts && filtered.length === 0 ? (
          <EmptyState title="No alerts in inbox" body="New operational alerts will appear here." icon="inbox" />
        ) : !loadingAlerts ? (
          filtered.map((alert) => (
            <View
              key={alert.id}
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.card.surface,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.md,
                gap: 6,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
                <Text style={[t.text.body, { fontWeight: '700', flex: 1 }]}>{alert.title}</Text>
                <Text style={[t.text.caption, { color: alert.status === 'Open' ? '#B63E34' : t.colors.text.muted }]}>
                  {alert.status}
                </Text>
              </View>
              <Text style={t.text.caption}>{alert.body}</Text>
              <Text style={t.text.caption}>
                {alert.type} · {alert.severity} · {formatDateDDMMYYYY(alert.createdAt)}
              </Text>
              {(alert.locationId || alert.userId) ? (
                <Text style={t.text.caption}>
                  {alert.locationId
                    ? `Location: ${locationNameById[alert.locationId] ?? alert.locationId}`
                    : ''}
                  {alert.locationId && alert.userId ? ' · ' : ''}
                  {alert.userId ? `User: ${userNameById[alert.userId] ?? alert.userId}` : ''}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: 2 }}>
                <Pressable
                  onPress={() => {
                    if (alert.locationId) {
                      router.push((`/admin/locations/${alert.locationId}` as any) as any);
                      return;
                    }
                    if (alert.userId) {
                      router.push('/admin/users' as any);
                      return;
                    }
                    router.push('/admin/reports/assign' as any);
                  }}>
                  <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Open related record</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    setActionError(null);
                    let previous: AdminAlertRecord[] = [];
                    setAlerts((prev) => {
                      previous = prev;
                      return prev.map((item) =>
                        item.id === alert.id ? { ...item, status: 'Resolved' } : item
                      );
                    });
                    const ok = await markAlertResolved(alert.id);
                    if (!ok) {
                      setAlerts(previous);
                      setActionError('Could not mark this alert as resolved. Please try again.');
                    }
                  }}>
                  <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Mark resolved</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : null}
      </View>
      {actionError ? <Text style={[t.text.caption, { color: '#B63E34', marginTop: t.spacing.md }]}>{actionError}</Text> : null}
    </AdminScreenScaffold>
  );
}
