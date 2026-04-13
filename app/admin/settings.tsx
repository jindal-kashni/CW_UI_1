import React from 'react';
import { Text, View } from 'react-native';
import { SegmentedControl } from '@/src/components';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminSettingsPage() {
  const t = useTheme();
  const [notifications, setNotifications] = React.useState<'Real-time' | 'Digest'>('Real-time');
  const [display, setDisplay] = React.useState<'Comfort' | 'Compact'>('Comfort');
  const [offline, setOffline] = React.useState<'Enabled' | 'Restricted'>('Enabled');
  const [privacy, setPrivacy] = React.useState<'Standard' | 'Strict'>('Strict');

  const Section = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <View style={{ gap: t.spacing.sm }}>
      <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>{title}</Text>
      <Text style={t.text.caption}>{description}</Text>
      {children}
      <View style={{ marginTop: t.spacing.md, height: 1, backgroundColor: 'rgba(30,31,28,0.12)' }} />
    </View>
  );

  return (
    <AdminScreenScaffold title="Settings">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin Settings</Text>
      <Text style={[t.text.caption, { marginTop: 6 }]}>
        Configure system behavior, controls and platform preferences.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.lg }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>
      <View style={{ gap: t.spacing.xl }}>
        <Section title="Notifications" description="Control how operational events are surfaced to admin users.">
          <SegmentedControl
            value={notifications}
            onChange={setNotifications}
            options={[
              { label: 'Real-time', value: 'Real-time' },
              { label: 'Digest', value: 'Digest' },
            ]}
          />
        </Section>
        <Section title="Display" description="Tune list density and dashboard visual density for iPad usage.">
          <SegmentedControl
            value={display}
            onChange={setDisplay}
            options={[
              { label: 'Comfort', value: 'Comfort' },
              { label: 'Compact', value: 'Compact' },
            ]}
          />
        </Section>
        <Section title="Field use preferences" description="Choose required report fields and default review policy.">
          <SegmentedControl
            value="Require photo"
            onChange={() => {}}
            options={[
              { label: 'Require photo', value: 'Require photo' },
              { label: 'Optional photo', value: 'Optional photo' },
            ]}
          />
        </Section>
        <Section title="Offline settings" description="Control retained offline payloads and upload enforcement.">
          <SegmentedControl
            value={offline}
            onChange={setOffline}
            options={[
              { label: 'Enabled', value: 'Enabled' },
              { label: 'Restricted', value: 'Restricted' },
            ]}
          />
        </Section>
        <Section title="Privacy and security" description="Set password, session and visibility controls.">
          <SegmentedControl
            value={privacy}
            onChange={setPrivacy}
            options={[
              { label: 'Standard', value: 'Standard' },
              { label: 'Strict', value: 'Strict' },
            ]}
          />
        </Section>
      </View>
    </AdminScreenScaffold>
  );
}

