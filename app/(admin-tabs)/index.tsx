import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, StatusBadge, SummaryStatCard } from '@/src/components';
import {
  adminAlerts,
  adminReports,
  adminSyncItems,
  adminUserById,
} from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminDashboardScreen() {
  const t = useTheme();
  const inProgress = adminReports.filter((r) => r.status === 'InProgress').length;
  const completed = adminReports.filter((r) => r.status === 'Completed').length;
  const total = adminReports.length;
  const flaggedAssets = adminAlerts.filter((a) => a.type === 'Asset' && a.status === 'Open').length;
  const unreadAlerts = adminAlerts.filter((a) => a.status === 'Open').length;
  const syncIssues = adminSyncItems.filter((s) => s.state === 'Failed').length;

  const recentActivity = [...adminReports]
    .sort(
      (a, b) =>
        new Date(b.submittedAt ?? b.dueDate).getTime() -
        new Date(a.submittedAt ?? a.dueDate).getTime()
    )
    .slice(0, 5);

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
        <SummaryStatCard label="Total reports" value={`${total}`} icon="file-text-o" hint="System wide" />
        <SummaryStatCard label="In progress" value={`${inProgress}`} icon="hourglass-half" hint="Active work" />
        <SummaryStatCard label="Completed" value={`${completed}`} icon="check-circle" hint="Submitted" />
        <SummaryStatCard label="Flagged assets" value={`${flaggedAssets}`} icon="warning" hint="Needs review" />
        <SummaryStatCard label="Unread alerts" value={`${unreadAlerts}`} icon="inbox" hint="Open items" />
        <SummaryStatCard label="Sync issues" value={`${syncIssues}`} icon="refresh" hint="Failed syncs" />
      </View>

      <View style={{ height: t.spacing.xl }} />
      <Card>
        <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Quick actions</Text>
        <Text style={[t.text.caption, { marginTop: 4, marginBottom: t.spacing.md }]}>
          Go directly to high-impact admin tasks.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }}>
          <View style={{ minWidth: 220, flex: 1 }}>
            <Button label="View reports" onPress={() => router.push('/(admin-tabs)/reports' as any)} />
          </View>
          <View style={{ minWidth: 220, flex: 1 }}>
            <Button label="Manage assets" variant="secondary" onPress={() => router.push('/(admin-tabs)/assets' as any)} />
          </View>
          <View style={{ minWidth: 220, flex: 1 }}>
            <Button label="Add user" variant="secondary" onPress={() => router.push('/admin/users' as any)} />
          </View>
          <View style={{ minWidth: 220, flex: 1 }}>
            <Button label="Review alerts" variant="secondary" onPress={() => router.push('/(admin-tabs)/alerts' as any)} />
          </View>
        </View>
      </Card>

      <View style={{ height: t.spacing.xl }} />
      <View style={{ flexDirection: 'row', gap: t.spacing.lg }}>
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>System status</Text>
            <StatusBadge label={syncIssues > 0 ? 'Attention required' : 'Healthy'} tone={syncIssues > 0 ? 'warn' : 'good'} />
          </View>
          <Text style={[t.text.caption, { marginTop: t.spacing.sm }]}>
            Sync queue: {adminSyncItems.filter((s) => s.state === 'Pending').length} pending · {syncIssues} failed
          </Text>
          <Text style={[t.text.caption, { marginTop: 2 }]}>
            Active users: {adminUsersActive()} · Inactive users: {adminUsersInactive()}
          </Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>What needs attention</Text>
          <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
            {adminAlerts
              .filter((a) => a.status === 'Open')
              .slice(0, 3)
              .map((a) => (
                <View
                  key={a.id}
                  style={{
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                    backgroundColor: t.colors.card.surfaceAlt,
                    borderRadius: t.radius.md,
                    paddingHorizontal: t.spacing.md,
                    paddingVertical: t.spacing.sm,
                  }}>
                  <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{a.title}</Text>
                  <Text style={[t.text.caption, { marginTop: 2 }]}>{a.body}</Text>
                </View>
              ))}
          </View>
        </Card>
      </View>

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
    </AdminScreenScaffold>
  );
}

function adminUsersActive() {
  return Object.values(adminUserById).filter((user) => user.status === 'Active').length;
}

function adminUsersInactive() {
  return Object.values(adminUserById).filter((user) => user.status === 'Inactive').length;
}
