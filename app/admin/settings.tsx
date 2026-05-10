import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import {
  defaultAdminSettings,
  fetchAdminSettings,
  saveAdminSettings,
  type AdminSettings,
} from '@/src/services/settings';

export default function AdminSettingsPage() {
  const t = useTheme();
  const navigation = useNavigation();
  const { user } = useWorkspace();
  const [settings, setSettings] = React.useState<AdminSettings>(defaultAdminSettings);
  const [saved, setSaved] = React.useState<AdminSettings>(defaultAdminSettings);
  const [message, setMessage] = React.useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [loadingSettings, setLoadingSettings] = React.useState(true);
  const allowLeaveRef = React.useRef(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  React.useEffect(() => {
    (async () => {
      const loaded = await fetchAdminSettings(user?.id);
      setSettings(loaded);
      setSaved(loaded);
      setLoadingSettings(false);
    })();
  }, [user?.id]);

  const saveNow = React.useCallback(async () => {
    if (!user?.id) {
      setMessage({ text: 'Please sign in again.', tone: 'error' });
      return false;
    }
    setSaving(true);
    const result = await saveAdminSettings(user.id, settings);
    setSaving(false);
    if (!result.ok) {
      setMessage({ text: result.error, tone: 'error' });
      return false;
    }
    setSaved(settings);
    setMessage({ text: 'Settings saved.', tone: 'success' });
    return true;
  }, [settings, user?.id]);

  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!dirty || allowLeaveRef.current) return;
      e.preventDefault();
      Alert.alert('Unsaved changes', 'You need to save your changes before leaving this page.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard changes',
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: 'Save now',
          onPress: async () => {
            const ok = await saveNow();
            if (ok) {
              allowLeaveRef.current = true;
              navigation.dispatch(e.data.action);
            }
          },
        },
      ]);
    });
    return unsub;
  }, [dirty, navigation, saveNow]);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const trackColor = { false: 'rgba(30,31,28,0.15)', true: '#2F6B4B' };

  return (
    <AdminScreenScaffold title="Settings" scroll={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin Settings</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Manage sync, alerts and admin workspace preferences.
        </Text>
        {loadingSettings ? (
          <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading your saved settings...</Text>
          </View>
        ) : (
          <>
            <View style={{ gap: t.spacing.md }}>
              <ToggleRow
                label="Push notifications (in-app)"
                value={settings.pushNotifications}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, pushNotifications: value }))}
                trackColor={trackColor}
              />
              <ToggleRow
                label="Auto sync when online"
                value={settings.autoSyncOnline}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, autoSyncOnline: value }))}
                trackColor={trackColor}
              />
              <ToggleRow
                label="Sync on WiFi only"
                value={settings.syncWifiOnly}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, syncWifiOnly: value }))}
                trackColor={trackColor}
              />
              <ToggleRow
                label="Due urgency indicators"
                value={settings.dueUrgencyIndicators}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, dueUrgencyIndicators: value }))}
                trackColor={trackColor}
              />
              <ToggleRow
                label="Large touch targets"
                value={settings.largeTouchTargets}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, largeTouchTargets: value }))}
                trackColor={trackColor}
              />
            </View>

            <ChoiceRow
              title="Reminder frequency"
              options={[
                { label: 'Off', value: 'off' },
                { label: 'Daily', value: 'daily' },
                { label: 'Every 2 days', value: 'every_2_days' },
              ]}
              value={settings.reminderFrequency}
              onChange={(value) => setSettings((prev) => ({ ...prev, reminderFrequency: value as any }))}
            />

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Pressable
                onPress={async () => {
                  const keys = await AsyncStorage.getAllKeys();
                  const removable = keys.filter(
                    (key) =>
                      key.startsWith('audit-reminder-last-') ||
                      key.startsWith('offline-sync-') ||
                      key.startsWith('asset-cache-')
                  );
                  if (removable.length > 0) {
                    await AsyncStorage.multiRemove(removable);
                  }
                  setMessage({ text: 'Cached offline data cleared.', tone: 'success' });
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 42,
                    borderRadius: t.radius.lg,
                    borderWidth: 1,
                    borderColor: 'rgba(0,74,38,0.22)',
                    backgroundColor: pressed ? 'rgba(0,74,38,0.08)' : t.colors.card.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <Text style={{ color: '#2F5B45', fontWeight: '700' }}>Clear cached data</Text>
              </Pressable>
              <Pressable
                onPress={saveNow}
                disabled={saving}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 42,
                    borderRadius: t.radius.lg,
                    borderWidth: 1,
                    borderColor: '#2F6B4B',
                    backgroundColor: '#2F6B4B',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed || saving ? 0.9 : 1,
                  },
                ]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save settings'}</Text>
              </Pressable>
            </View>

            {message ? (
              <Text style={[t.text.caption, { color: message.tone === 'error' ? '#B63E34' : '#2F5B45' }]}>
                {message.text}
              </Text>
            ) : null}
            {dirty ? <Text style={[t.text.caption, { color: '#B63E34' }]}>You have unsaved changes.</Text> : null}
          </>
        )}
      </ScrollView>
    </AdminScreenScaffold>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  trackColor,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor: { false: string; true: string };
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={t.text.bodyMuted}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={trackColor}
        thumbColor="#F8F7F3"
      />
    </View>
  );
}

function ChoiceRow({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTheme();
  return (
    <View>
      <Text style={t.text.caption}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm, marginTop: 6, flexWrap: 'wrap' }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                {
                  minHeight: 36,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                  backgroundColor: selected ? '#2F6B4B' : pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
                  justifyContent: 'center',
                },
              ]}>
              <Text style={{ color: selected ? '#fff' : '#2F5B45', fontWeight: '700' }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
