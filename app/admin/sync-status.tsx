import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/src/components';
import { adminSyncItems, adminUserById } from '@/src/data/admin';
import { AdminScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchAdminSyncItems } from '@/src/services/systemData';
import type { AdminSyncRecord } from '@/src/data/admin';

export default function AdminSyncStatusPage() {
  const t = useTheme();
  const [items, setItems] = React.useState<AdminSyncRecord[]>(adminSyncItems);
  const [message, setMessage] = React.useState<string | null>(null);
  const pending = items.filter((item) => item.state === 'Pending').length;
  const failed = items.filter((item) => item.state === 'Failed').length;
  const healthy = items.filter((item) => item.state === 'UpToDate').length;

  React.useEffect(() => {
    (async () => {
      const rows = await fetchAdminSyncItems();
      setItems(rows);
    })();
  }, []);

  return (
    <AdminScreenScaffold title="Sync Status">
      <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Sync Status</Text>
      <Text style={[t.text.caption, { marginTop: -4 }]}>
        Monitor sync health by device and user.
      </Text>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
        <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <Stat label="Pending" value={pending} />
        <Stat label="Failed" value={failed} />
        <Stat label="Up to date" value={healthy} />
      </View>
      <View style={{ height: t.spacing.lg }} />
      <View style={{ gap: t.spacing.md }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
              gap: 4,
            }}>
            <Text style={[t.text.body, { fontWeight: '700' }]}>{item.deviceLabel}</Text>
            <Text style={t.text.caption}>
              User: {adminUserById[item.userId]?.name ?? 'Unknown'} · {item.state}
            </Text>
            <Text style={t.text.caption}>{item.detail}</Text>
            <Text style={t.text.caption}>Updated: {new Date(item.updatedAt).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: 2 }}>
              <Button
                label="Retry"
                variant="secondary"
                onPress={() => {
                  setItems((prev) =>
                    prev.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, state: 'UpToDate', updatedAt: new Date().toISOString(), detail: 'Retry succeeded.' }
                        : entry
                    )
                  );
                  setMessage(`Retry completed for ${item.deviceLabel}.`);
                }}
                style={{ flex: 1 }}
              />
              <Button
                label="Review log"
                variant="secondary"
                onPress={() => {
                  setMessage(`Log: ${item.detail}`);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ))}
      </View>
      {message ? <Text style={[t.text.caption, { color: '#2F5B45', marginTop: t.spacing.md }]}>{message}</Text> : null}
    </AdminScreenScaffold>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 88,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,74,38,0.18)',
        backgroundColor: '#F7F5EF',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
      }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#1f3b2c' }}>{value}</Text>
      <Text style={{ fontSize: 13, color: '#647066', fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

