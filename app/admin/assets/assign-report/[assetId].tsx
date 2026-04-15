import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components';
import { assetById, locationById } from '@/src/data';
import { adminDepartmentById, adminUsers } from '@/src/data/admin';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import type { AuditAssignment, Assessor } from '@/src/types/models';

function toAssessor(user: { id: string; name: string }): Assessor {
  return {
    id: user.id,
    name: user.name,
    role: 'Auditor',
    org: 'Currumbin Wildlife Sanctuary',
  };
}

export default function AdminAssignConditionReportPage() {
  const t = useTheme();
  const { setAssignments } = useDemoState();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const asset = assetId ? assetById[assetId] : undefined;
  const location = asset ? locationById[asset.location_id] : undefined;

  const auditors = React.useMemo(
    () => adminUsers.filter((u) => u.role === 'Auditor' && u.status === 'Active'),
    []
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(auditors[0]?.id ?? null);

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Assign report"
          userName="Admin"
          onPressBack={() => router.replace('/(admin)/assets' as any)}
          onPressUser={() => router.push('/(admin)/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const onConfirm = () => {
    const user = auditors.find((u) => u.id === selectedId);
    if (!user) return;

    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueAt = due.toISOString().slice(0, 10);

    const newAssignment: AuditAssignment = {
      id: `aud-assign-${Date.now()}`,
      title: `Condition Report Task · ${asset.asset_code}`,
      dueAt,
      locationScope: { precincts: [location?.precinct ?? 'Central Precinct'] },
      assetId: asset.id,
      status: 'Assigned',
      progressPct: 0,
      assignedTo: toAssessor(user),
      summary: `Condition report for ${asset.name} (${asset.asset_code}). Assigned by admin.`,
    };

    setAssignments((prev) => {
      const open: AuditAssignment['status'][] = ['Assigned', 'InProgress', 'DraftSaved'];
      const rest = prev.filter((a) => !(a.assetId === asset.id && open.includes(a.status)));
      return [...rest, newAssignment];
    });

    router.replace('/(admin)/assets' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Assign report"
        userName="Admin"
        onPressBack={() => router.replace(`/admin/assets/${asset.id}` as any)}
        onPressUser={() => router.push('/(admin)/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.lg,
        }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Assign condition report</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Choose a team member to complete a condition report for this asset. They will see it in their To Do list.
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
          }}>
          <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{asset.name}</Text>
          <Text style={t.text.caption}>
            {asset.asset_code} · {location?.name ?? 'Unknown location'}
          </Text>
        </View>

        <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Team member</Text>
        {auditors.length === 0 ? (
          <Text style={t.text.caption}>No active auditors are available to assign.</Text>
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            {auditors.map((u) => {
              const selected = selectedId === u.id;
              const dept = adminDepartmentById[u.departmentId]?.name ?? '';
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
                  ]}>
                  <Text style={{ fontWeight: '700', color: t.colors.brand.forest }}>{u.name}</Text>
                  <Text style={t.text.caption}>{u.email}</Text>
                  {dept ? <Text style={[t.text.caption, { marginTop: 4 }]}>{dept}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <Button
          label="Confirm assignment"
          onPress={onConfirm}
          style={{ marginTop: t.spacing.md }}
          disabled={!selectedId || auditors.length === 0}
        />
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}
