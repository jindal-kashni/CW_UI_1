import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Button } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminSettingsPage() {
  const t = useTheme();
  const [autoSyncOnline, setAutoSyncOnline] = React.useState(true);
  const [syncWifiOnly, setSyncWifiOnly] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [displayMode, setDisplayMode] = React.useState<'Light' | 'Dark'>('Light');

  const trackColor = { false: 'rgba(30,31,28,0.15)', true: '#2F6B4B' };

  return (
    <AdminScreenScaffold title="Settings">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34, marginBottom: t.spacing.xs }]}>Settings</Text>
      <Text style={[t.text.caption, { marginBottom: t.spacing.xl }]}>
        Manage notifications, display, and sync preferences.
      </Text>
      <View style={{ gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={t.text.bodyMuted}>Push notifications</Text>
          <Switch value={pushNotifications} onValueChange={setPushNotifications} trackColor={trackColor} thumbColor="#F8F7F3" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={t.text.bodyMuted}>Auto sync when online</Text>
          <Switch value={autoSyncOnline} onValueChange={setAutoSyncOnline} trackColor={trackColor} thumbColor="#F8F7F3" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={t.text.bodyMuted}>Sync on WiFi only</Text>
          <Switch value={syncWifiOnly} onValueChange={setSyncWifiOnly} trackColor={trackColor} thumbColor="#F8F7F3" />
        </View>

        <View style={{ marginTop: t.spacing.md }}>
          <Text style={t.text.caption}>Display mode</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: 6 }}>
            {(['Light', 'Dark'] as const).map((mode) => {
              const selected = displayMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setDisplayMode(mode)}
                  style={{
                    flex: 1,
                    minHeight: 42,
                    borderRadius: t.radius.lg,
                    borderWidth: 1,
                    borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                    backgroundColor: selected ? '#2F6B4B' : t.colors.card.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{mode}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          label="Clear cached data"
          variant="secondary"
          onPress={() => setActionMessage('Cached offline data cleared.')}
        />
        {actionMessage ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{actionMessage}</Text> : null}
      </View>
    </AdminScreenScaffold>
  );
}

