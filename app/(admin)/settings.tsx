import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Button } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminSettingsTabScreen() {
  const t = useTheme();
  const [conditionReportReminders, setConditionReportReminders] = React.useState(true);
  const [assignedTaskAlerts, setAssignedTaskAlerts] = React.useState(true);
  const [syncIssueAlerts, setSyncIssueAlerts] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState<'Light' | 'Dark'>('Light');
  const [textSize, setTextSize] = React.useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [spacing, setSpacing] = React.useState<'Compact' | 'Comfortable'>('Comfortable');
  const [autoLockDuringConditionReport, setAutoLockDuringConditionReport] = React.useState(false);
  const [keepScreenAwakeDuringConditionReport, setKeepScreenAwakeDuringConditionReport] =
    React.useState(true);
  const [cameraQuality, setCameraQuality] = React.useState<'Standard' | 'High'>('High');
  const [photoCompression, setPhotoCompression] = React.useState<'Low' | 'Balanced' | 'High'>('Balanced');
  const [autoSyncOnline, setAutoSyncOnline] = React.useState(true);
  const [syncWifiOnly, setSyncWifiOnly] = React.useState(true);
  const [requireFaceId, setRequireFaceId] = React.useState(false);
  const [autoLogout, setAutoLogout] = React.useState(true);

  const trackColor = { false: 'rgba(30,31,28,0.15)', true: '#2F6B4B' };

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 22, lineHeight: 28, marginBottom: t.spacing.md }]}>{title}</Text>
  );

  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View
        style={{
          height: 1,
          backgroundColor: 'rgba(30,31,28,0.16)',
        }}
      />
    </View>
  );

  const SettingSwitchRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md }}>
      <Text style={t.text.bodyMuted}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={trackColor} thumbColor="#F8F7F3" />
    </View>
  );

  const MultiOptionRow = <T extends string>({
    value,
    onChange,
    options,
  }: {
    value: T;
    onChange: (next: T) => void;
    options: { label: string; value: T }[];
  }) => (
    <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: 46,
                borderRadius: t.radius.lg,
                borderWidth: 1,
                borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                backgroundColor: selected
                  ? '#2F6B4B'
                  : pressed
                    ? 'rgba(0,74,38,0.08)'
                    : t.colors.card.surface,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: selected ? '800' : '700',
                color: selected ? '#FFFFFF' : '#2F5B45',
              }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <AdminScreenScaffold title="Settings">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34, marginBottom: t.spacing.xs }]}>Settings</Text>
      <Text style={[t.text.caption, { marginBottom: t.spacing.xl }]}>
        Manage notifications, display, device behavior, offline sync, and security preferences.
      </Text>
      <View style={{ marginBottom: t.spacing.xl }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <SectionHeading title="Notifications" />
      <View style={{ gap: t.spacing.md }}>
        <SettingSwitchRow
          label="Condition report reminders"
          value={conditionReportReminders}
          onChange={setConditionReportReminders}
        />
        <SettingSwitchRow label="Assigned task alerts" value={assignedTaskAlerts} onChange={setAssignedTaskAlerts} />
        <SettingSwitchRow label="Sync issue alerts" value={syncIssueAlerts} onChange={setSyncIssueAlerts} />
        <SettingSwitchRow label="Push notifications" value={pushNotifications} onChange={setPushNotifications} />
      </View>

      <SectionDivider />

      <SectionHeading title="Display" />
      <View style={{ gap: t.spacing.xl }}>
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Light / dark mode</Text>
          <MultiOptionRow
            value={displayMode}
            onChange={setDisplayMode}
            options={[
              { label: 'Light', value: 'Light' },
              { label: 'Dark', value: 'Dark' },
            ]}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={t.text.caption}>Text size</Text>
          <MultiOptionRow
            value={textSize}
            onChange={setTextSize}
            options={[
              { label: 'Small', value: 'Small' },
              { label: 'Medium', value: 'Medium' },
              { label: 'Large', value: 'Large' },
            ]}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={t.text.caption}>Spacing</Text>
          <MultiOptionRow
            value={spacing}
            onChange={setSpacing}
            options={[
              { label: 'Compact', value: 'Compact' },
              { label: 'Comfortable', value: 'Comfortable' },
            ]}
          />
        </View>
      </View>

      <SectionDivider />

      <SectionHeading title="Device / Field Use" />
      <View style={{ gap: t.spacing.lg }}>
        <SettingSwitchRow
          label="Auto lock during condition report"
          value={autoLockDuringConditionReport}
          onChange={setAutoLockDuringConditionReport}
        />
        <SettingSwitchRow
          label="Keep screen awake during condition report"
          value={keepScreenAwakeDuringConditionReport}
          onChange={setKeepScreenAwakeDuringConditionReport}
        />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Camera quality for uploads</Text>
          <MultiOptionRow
            value={cameraQuality}
            onChange={setCameraQuality}
            options={[
              { label: 'Standard', value: 'Standard' },
              { label: 'High', value: 'High' },
            ]}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Default photo compression</Text>
          <MultiOptionRow
            value={photoCompression}
            onChange={setPhotoCompression}
            options={[
              { label: 'Low', value: 'Low' },
              { label: 'Balanced', value: 'Balanced' },
              { label: 'High', value: 'High' },
            ]}
          />
        </View>
      </View>

      <SectionDivider />

      <SectionHeading title="Offline" />
      <View style={{ gap: t.spacing.lg }}>
        <SettingSwitchRow
          label="Auto sync when online"
          value={autoSyncOnline}
          onChange={setAutoSyncOnline}
        />
        <SettingSwitchRow
          label="Sync on WiFi only"
          value={syncWifiOnly}
          onChange={setSyncWifiOnly}
        />
        <Button label="Download areas for offline use" variant="secondary" onPress={() => {}} />
        <Button label="Clear cached data" variant="secondary" onPress={() => {}} />
      </View>

      <SectionDivider />

      <SectionHeading title="Privacy / Security" />
      <View style={{ gap: t.spacing.md }}>
        <SettingSwitchRow
          label="Require Face ID / passcode on open"
          value={requireFaceId}
          onChange={setRequireFaceId}
        />
        <SettingSwitchRow
          label="Auto logout after inactivity"
          value={autoLogout}
          onChange={setAutoLogout}
        />
      </View>
    </AdminScreenScaffold>
  );
}
