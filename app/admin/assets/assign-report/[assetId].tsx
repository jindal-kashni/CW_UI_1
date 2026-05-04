import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import { fetchAssetById } from '@/src/services/assets';
import { fetchAdminUsers } from '@/src/services/users';
import { createAuditAssignmentsBulk, fetchAuditAssignments } from '@/src/services/reports';
import { resolveDepartmentNames, resolveLocationNames } from '@/src/services/lookups';
import type { AdminUserRecord } from '@/src/data/admin';

export default function AdminAssignConditionReportPage() {
  const t = useTheme();
  const { setAssignments } = useDemoState();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();

  const [asset, setAsset] = React.useState<any | null>(null);
  const [loadingAsset, setLoadingAsset] = React.useState(true);
  const [assigning, setAssigning] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [locationNameById, setLocationNameById] = React.useState<Record<string, string>>({});
  const [departmentNameById, setDepartmentNameById] = React.useState<Record<string, string>>({});
  const [auditors, setAuditors] = React.useState<AdminUserRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [users, assetRow] = await Promise.all([
          fetchAdminUsers(),
          assetId ? fetchAssetById(assetId) : Promise.resolve(null),
        ]);

        const activeAuditors = users.filter((u) => u.role === 'Auditor' && u.status === 'Active');

        setAuditors(activeAuditors);
        setSelectedId(activeAuditors.length ? activeAuditors[0].id : null);
        setAsset(assetRow);

        if (assetRow?.location_id) {
          setLocationNameById(await resolveLocationNames([assetRow.location_id]));
        }

        const deptIds = activeAuditors
          .map((row) => row.departmentId)
          .filter((id): id is string => Boolean(id));

        if (deptIds.length) {
          setDepartmentNameById(await resolveDepartmentNames(deptIds));
        }
      } catch (error) {
        console.log(error);
        setMessage('Unable to load assignment page.');
      } finally {
        setLoadingAsset(false);
      }
    })();
  }, [assetId]);

  const onConfirm = async () => {
    const user = auditors.find((u) => u.id === selectedId);
    if (!user || !asset) return;

    setAssigning(true);
    setMessage(null);

    try {
      const due = new Date();
      due.setDate(due.getDate() + 7);

      const result = await createAuditAssignmentsBulk({
        assignedUserId: user.id,
        assetIds: [asset.id],
        dueAt: due.toISOString(),
      });

      if (!result.ok) {
        setMessage(result.error ?? 'Could not assign report.');
        setAssigning(false);
        return;
      }

      const refreshed = await fetchAuditAssignments();

      if (refreshed.length > 0) {
        setAssignments(refreshed);
      } else if (result.created) {
        setAssignments((prev) => [...prev, ...result.created!]);
      }

      router.replace('/admin/assets' as any);
    } catch (error) {
      console.log(error);
      setMessage('Could not assign report.');
    } finally {
      setAssigning(false);
    }
  };

  if (loadingAsset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Assign report"
          userName="Admin"
          onPressBack={() => router.replace('/admin/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Loading asset...</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Assign report"
          userName="Admin"
          onPressBack={() => router.replace('/admin/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TopBar
        title="Assign report"
        userName="Admin"
        onPressBack={() => router.replace(`/admin/assets/${asset.id}` as any)}
        onPressUser={() => router.push('/admin/profile' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}
      >
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Assign condition report</Text>

        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Choose an auditor to complete a condition report for this asset.
        </Text>

        <View style={{ marginTop: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.card.surfaceAlt,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.sm,
          }}
        >
          <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{asset.name}</Text>
          <Text style={t.text.caption}>
            {asset.asset_code} · {locationNameById[asset.location_id] ?? 'Unknown location'}
          </Text>
        </View>

        <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Team member</Text>

        {auditors.length === 0 ? (
          <Text style={t.text.caption}>No active auditors are available to assign.</Text>
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            {auditors.map((u) => {
              const selected = selectedId === u.id;
              const dept = departmentNameById[u.departmentId] ?? '';

              return (
                <Pressable
                  key={u.id}
                  onPress={() => setSelectedId(u.id)}
                  style={({ pressed }) => [
                    {
                      borderWidth: 1,
                      borderColor: selected ? 'rgba(0,74,38,0.45)' : t.colors.border.subtle,
                      borderRadius: t.radius.md,
                      backgroundColor: selected
                        ? 'rgba(0,74,38,0.10)'
                        : pressed
                          ? 'rgba(31,59,44,0.06)'
                          : t.colors.card.surface,
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.md,
                    },
                  ]}
                >
                  <Text style={{ fontWeight: '700', color: t.colors.brand.forest }}>{u.name}</Text>
                  <Text style={t.text.caption}>{u.email}</Text>
                  {dept ? <Text style={[t.text.caption, { marginTop: 4 }]}>{dept}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {message ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{message}</Text> : null}

        <Button
          label={assigning ? 'Assigning...' : 'Confirm assignment'}
          onPress={onConfirm}
          style={{ marginTop: t.spacing.md }}
          disabled={assigning || !selectedId || auditors.length === 0}
        />
      </ScrollView>

      <AdminAppBottomNav />
    </ScreenContainer>
  );
}