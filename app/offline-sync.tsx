import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, StatusBadge } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { useDemoState } from '@/src/state/DemoStateProvider';

export default function OfflineSyncScreen() {
  const t = useTheme();
  const { sync: syncItems } = useDemoState();

  return (
    <ScreenContainer>
      <TopBar title="Offline Sync" userName="Auditor" onPressBack={() => router.back()} />
      <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg, gap: t.spacing.xl }}>
        <Card>
          <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Sync status</Text>
          <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
            Prototype simulation of offline readiness, upload queue, and reference data refresh.
          </Text>
        </Card>

        <View style={{ gap: t.spacing.lg }}>
          {syncItems.map((s) => {
            const tone =
              s.state === 'UpToDate'
                ? 'good'
                : s.state === 'Pending'
                  ? 'warn'
                  : s.state === 'Failed'
                    ? 'bad'
                    : 'info';

            return (
              <Card key={s.id} style={{ padding: t.spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[t.text.title, { fontSize: 16, lineHeight: 22 }]}>{s.label}</Text>
                  <StatusBadge
                    label={
                      s.state === 'UpToDate'
                        ? 'Up to date'
                        : s.state === 'Pending'
                          ? 'Pending'
                          : s.state === 'Failed'
                            ? 'Failed'
                            : 'Offline'
                    }
                    tone={tone}
                  />
                </View>
                {s.detail ? <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>{s.detail}</Text> : null}
                <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>
                  Updated {new Date(s.updatedAt).toLocaleString()}
                </Text>
              </Card>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button label="Simulate upload" onPress={() => {}} style={{ flex: 1 }} />
          <Button label="Refresh data" variant="secondary" onPress={() => {}} style={{ flex: 1 }} />
        </View>
      </View>
      <AppBottomNav />
    </ScreenContainer>
  );
}

