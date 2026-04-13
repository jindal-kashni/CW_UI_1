import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, StatusBadge } from '@/src/components';
import { assetAuditHistory, assetById, departmentById, locationById, roomById } from '@/src/data';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminAssetDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = id ? assetById[id] : undefined;
  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Asset Detail"
          userName="Admin"
          onPressBack={() => router.replace('/(admin-tabs)/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const location = locationById[asset.location_id];
  const room = roomById[asset.room_id];
  const department = departmentById[asset.dept_id];
  const history = assetAuditHistory.filter((h) => h.asset_id === asset.id).slice(0, 3);
  const statusLabel = asset.status === 'UnderMaintenance' ? 'Under maintenance' : asset.status;

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 22, lineHeight: 28, marginBottom: t.spacing.md }]}>{title}</Text>
  );
  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );

  return (
    <ScreenContainer>
      <TopBar
        title="Asset Detail"
        userName="Admin"
        onPressBack={() => router.replace('/(admin-tabs)/assets' as any)}
        onPressUser={() => router.push('/admin/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
        }}>
        <SectionHeading title="Overview" />
        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 26, lineHeight: 32 }]}>{asset.name}</Text>
              <Text style={[t.text.caption, { marginTop: 4 }]}>
                {asset.asset_code} · {asset.category} · {asset.sub_category}
              </Text>
            </View>
            <StatusBadge label={statusLabel} tone={statusLabel === 'Active' ? 'good' : 'warn'} />
          </View>
          <Text style={t.text.bodyMuted}>{asset.description}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Location and ownership" />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Location: {location?.name ?? 'Unknown'}</Text>
          <Text style={t.text.caption}>Room: {room?.name ?? 'Unknown'}</Text>
          <Text style={t.text.caption}>Department: {department?.name ?? 'Unknown'}</Text>
          <Text style={t.text.caption}>Assigned to: {asset.assigned_to}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Condition and criticality" />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Condition: {asset.condition}</Text>
          <Text style={t.text.caption}>Criticality: {asset.criticality}</Text>
          <Text style={t.text.caption}>Remaining life: {asset.remaining_life_years} years</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Lifecycle and cost" />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Purchase date: {new Date(asset.purchase_date).toLocaleDateString()}</Text>
          <Text style={t.text.caption}>Purchase cost: ${asset.purchase_cost.toLocaleString()}</Text>
          <Text style={t.text.caption}>Replacement cost: ${asset.replacement_cost.toLocaleString()}</Text>
          <Text style={t.text.caption}>Warranty expiry: {new Date(asset.warranty_expiry).toLocaleDateString()}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Service history" />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Last serviced: {new Date(asset.last_serviced_date).toLocaleDateString()}</Text>
          <Text style={t.text.caption}>Next service: {new Date(asset.next_service_date).toLocaleDateString()}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Notes" />
        <Text style={t.text.caption}>{asset.notes}</Text>

        <SectionDivider />
        <SectionHeading title="Audit history preview" />
        <View style={{ gap: t.spacing.sm }}>
          {history.map((h) => (
            <View
              key={h.id}
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
              }}>
              <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>
                {new Date(h.audit_date).toLocaleDateString()} · {h.inspector_name}
              </Text>
              <Text style={t.text.caption}>{h.findings}</Text>
            </View>
          ))}
        </View>

        <SectionDivider />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button label="Edit Asset" onPress={() => router.push((`/admin/assets/edit/${asset.id}` as any) as any)} style={{ flex: 1 }} />
          <Button label="View Report History" variant="secondary" onPress={() => router.push('/(admin-tabs)/reports' as any)} style={{ flex: 1 }} />
        </View>
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

