import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  adminAlerts,
  adminLocationById,
  adminUserById,
  type AdminAlertRecord,
} from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

type FilterKey = 'All' | AdminAlertRecord['severity'] | AdminAlertRecord['status'] | AdminAlertRecord['type'];

export default function AdminAlertsPage() {
  const t = useTheme();
  const [filter, setFilter] = React.useState<FilterKey>('All');

  const filtered = adminAlerts.filter((alert) => {
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
      <View style={{ gap: t.spacing.md }}>
        {filtered.map((alert) => (
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
              {alert.type} · {alert.severity} · {new Date(alert.createdAt).toLocaleString()}
            </Text>
            {(alert.locationId || alert.userId) ? (
              <Text style={t.text.caption}>
                {alert.locationId ? `Location: ${adminLocationById[alert.locationId]?.name ?? alert.locationId}` : ''}
                {alert.locationId && alert.userId ? ' · ' : ''}
                {alert.userId ? `User: ${adminUserById[alert.userId]?.name ?? alert.userId}` : ''}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: 2 }}>
              <Pressable>
                <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Open related record</Text>
              </Pressable>
              <Pressable>
                <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>Mark resolved</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </AdminScreenScaffold>
  );
}

