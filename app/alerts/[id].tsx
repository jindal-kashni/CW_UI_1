import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, SectionCard, StatusBadge } from '@/src/components';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { getAlertAction, getAlertMeaning } from '@/src/utils/alertMeta';

export default function AlertDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alerts, markAlertRead } = useDemoState();
  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <ScreenContainer>
        <TopBar title="Alert" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <SectionCard title="Alert not found">
            <Text style={t.text.bodyMuted}>This alert may have been deleted.</Text>
          </SectionCard>
        </View>
      </ScreenContainer>
    );
  }

  const action = getAlertAction(alert.kind);

  const actionHref =
    action.href ??
    (alert.related?.assetId ? (`/asset/${alert.related.assetId}` as any) : ('/audits' as any));

  return (
    <ScreenContainer>
      <TopBar title="Alert Detail" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <SectionCard
          title={alert.title}
          subtitle={new Date(alert.createdAt).toLocaleString()}
          right={
            <StatusBadge
              label={alert.severity}
              tone={alert.severity === 'Urgent' ? 'bad' : alert.severity === 'Attention' ? 'warn' : 'info'}
            />
          }>
          <Text style={t.text.bodyMuted}>{alert.body}</Text>
        </SectionCard>

        <SectionCard title="What this alert means" subtitle={alert.kind}>
          <Text style={t.text.bodyMuted}>{getAlertMeaning(alert.kind)}</Text>
        </SectionCard>

        <SectionCard title="Recommended action">
          <View style={{ gap: t.spacing.md }}>
            <Button
              label={action.label}
              onPress={() => {
                markAlertRead(alert.id);
                router.push(actionHref);
              }}
            />
            <Button
              label="Mark as read"
              variant="secondary"
              onPress={() => markAlertRead(alert.id)}
            />
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

