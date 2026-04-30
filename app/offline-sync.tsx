import React from 'react';
import { Text, View } from 'react-native';
import * as Network from 'expo-network';
import { router } from 'expo-router';
import { Button, Card, StatusBadge } from '@/src/components';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useWorkspace } from '@/src/state/WorkspaceProvider';

function OfflineSyncContent() {
  const t = useTheme();
  const { sync: syncItems, setSync } = useDemoState();
  const { auditorSettings, auditorSettingsReady } = useWorkspace();
  const [message, setMessage] = React.useState<string | null>(null);
  const [autoSyncOnline, setAutoSyncOnline] = React.useState(true);
  const [syncWifiOnly, setSyncWifiOnly] = React.useState(true);

  React.useEffect(() => {
    if (!auditorSettingsReady) return;
    setAutoSyncOnline(auditorSettings.autoSyncOnline);
    setSyncWifiOnly(auditorSettings.syncWifiOnly);
  }, [auditorSettings.autoSyncOnline, auditorSettings.syncWifiOnly, auditorSettingsReady]);

  const canRunSync = React.useCallback(async () => {
    const state = await Network.getNetworkStateAsync();
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (!online) {
      setMessage('No internet connection detected.');
      return false;
    }
    if (syncWifiOnly && state.type !== Network.NetworkStateType.WIFI) {
      setMessage('Sync on WiFi only is enabled. Connect to WiFi to sync.');
      return false;
    }
    return true;
  }, [syncWifiOnly]);

  React.useEffect(() => {
    if (!autoSyncOnline) return;
    let cancelled = false;
    const run = async () => {
      const ok = await canRunSync();
      if (!ok || cancelled) return;
      setSync((prev) => prev.map((item) => ({ ...item, updatedAt: new Date().toISOString() })));
      setMessage('Auto sync completed.');
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [autoSyncOnline, canRunSync, setSync]);

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
                  Updated {formatDateDDMMYYYY(s.updatedAt)}
                </Text>
              </Card>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button
            label="Simulate upload"
            onPress={async () => {
              const ok = await canRunSync();
              if (!ok) return;
              setSync((prev) =>
                prev.map((item) =>
                  item.state === 'Pending' || item.state === 'Failed'
                    ? { ...item, state: 'UpToDate', updatedAt: new Date().toISOString(), detail: 'Upload completed.' }
                    : item
                )
              );
              setMessage('Upload queue processed successfully.');
            }}
            style={{ flex: 1 }}
          />
          <Button
            label="Refresh data"
            variant="secondary"
            onPress={async () => {
              const ok = await canRunSync();
              if (!ok) return;
              setSync((prev) => prev.map((item) => ({ ...item, updatedAt: new Date().toISOString() })));
              setMessage('Offline sync state refreshed.');
            }}
            style={{ flex: 1 }}
          />
        </View>
        {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}
      </View>
      <AppBottomNav />
    </ScreenContainer>
  );
}

export default function OfflineSyncScreen() {
  return (
    <RequireWorkspace role="auditor">
      <OfflineSyncContent />
    </RequireWorkspace>
  );
}

