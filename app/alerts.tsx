import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AlertListItem, EmptyState, FilterChip } from '@/src/components';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { useDemoState } from '@/src/state/DemoStateProvider';

function AlertsInboxContent() {
  const t = useTheme();
  const [filter, setFilter] = React.useState<'All' | 'Unread' | 'Urgent' | 'Completed'>('All');
  const { alerts, completeAlert } = useDemoState();
  const unreadCount = alerts.filter((a) => !a.read && !a.completedAt).length;

  const filtered = alerts
    .filter((a) =>
      filter === 'Unread'
        ? !a.read && !a.completedAt
        : filter === 'Urgent'
          ? a.severity === 'Urgent' && !a.completedAt
          : filter === 'Completed'
            ? Boolean(a.completedAt)
            : true
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <ScreenContainer>
      <TopBar title="Alerts Inbox" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md }}>
        <Text style={[t.text.caption, { color: t.colors.text.muted }]}>
          {filtered.length} alert{filtered.length === 1 ? '' : 's'} shown · {unreadCount} unread
        </Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          <FilterChip label="All" selected={filter === 'All'} onPress={() => setFilter('All')} />
          <FilterChip label="Unread" selected={filter === 'Unread'} onPress={() => setFilter('Unread')} />
          <FilterChip label="Urgent" selected={filter === 'Urgent'} onPress={() => setFilter('Urgent')} />
          <FilterChip label="Completed" selected={filter === 'Completed'} onPress={() => setFilter('Completed')} />
        </View>
      </View>

      <View style={{ height: t.spacing.xl }} />

      {filtered.length === 0 ? (
        <EmptyState title="No alerts in inbox" body="New operational alerts will appear here." icon="inbox" />
      ) : (
        <View style={{ gap: t.spacing.lg }}>
          {filtered.map((a) => (
            <AlertListItem
              key={a.id}
              item={a}
              onComplete={() => completeAlert(a.id)}
            />
          ))}
        </View>
      )}
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

export default function AlertsInboxScreen() {
  return (
    <RequireWorkspace role="auditor">
      <AlertsInboxContent />
    </RequireWorkspace>
  );
}

