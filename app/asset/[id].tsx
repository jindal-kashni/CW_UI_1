import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, StatusBadge } from '@/src/components';
import { departmentById, locationById, roomById } from '@/src/data';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchAssetById } from '@/src/services/assets';
import { saveAuditDraft } from '@/src/services/reports';
import type { Asset } from '@/src/types/models';

function AssetDetailContent() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) {
        if (mounted) {
          setAsset(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const row = await fetchAssetById(id);
        if (!mounted) return;
        setAsset(row);
      } catch {
        if (!mounted) return;
        setAsset(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <ScreenContainer>
        <TopBar title="Asset" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.bodyMuted, { marginTop: t.spacing.sm }]}>Loading asset details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar title="Asset" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
          <Text style={[t.text.bodyMuted, { marginTop: t.spacing.sm }]}>
            This record isn’t available or you do not have access.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const location = locationById[asset.location_id];
  const room = roomById[asset.room_id];
  const department = departmentById[asset.dept_id];
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
  const statusLabel = asset.status;
  const statusTone =
    statusLabel === 'Active' ? 'good' : statusLabel === 'Under repair' ? 'warn' : 'bad';
  const SectionHeading = ({ title, large = false }: { title: string; large?: boolean }) => (
    <Text
      style={[
        t.text.title,
        {
          fontSize: large ? 32 : 26,
          lineHeight: large ? 38 : 32,
          marginBottom: t.spacing.md,
        },
      ]}>
      {title}
    </Text>
  );
  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );
  const FieldRow = ({ label, value }: { label: string; value: string }) => (
    <View style={{ gap: 4 }}>
      <Text style={t.text.caption}>{label}</Text>
      <Text style={t.text.body}>{value}</Text>
    </View>
  );

  return (
    <ScreenContainer>
      <TopBar title="Asset Detail" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.sm,
        }}>
        <SectionHeading title="Overview" large />
        <View style={{ gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md }}>
            <Text style={[t.text.title, { fontSize: 26, lineHeight: 32, flex: 1 }]}>{asset.name}</Text>
            <StatusBadge
              label={statusLabel}
              tone={statusTone}
            />
          </View>
          <Text style={t.text.caption}>
            {asset.asset_code} · {asset.category} · {asset.sub_category}
          </Text>
          <Text style={t.text.bodyMuted}>{asset.description}</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.xl }}>
            <FieldRow label="Make / Model" value={asset.make_model} />
            <FieldRow label="Serial Number" value={asset.serial_number} />
          </View>
        </View>

        <SectionDivider />
        <SectionHeading title="Location and ownership" />
        <View style={{ gap: t.spacing.md }}>
          <FieldRow label="Location" value={location?.name ?? 'Unknown location'} />
          <FieldRow label="Room" value={room?.name ?? 'Unknown room'} />
          <FieldRow label="Department" value={department?.name ?? 'Unknown department'} />
          <FieldRow label="Assigned to" value={asset.assigned_to} />
        </View>

        <SectionDivider />
        <SectionHeading title="Condition and criticality" />
        <View style={{ gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
            <StatusBadge
              label={asset.condition}
              tone={
                asset.condition === 'Fair'
                  ? 'warn'
                  : asset.condition === 'Poor' || asset.condition === 'Needs urgent attention'
                    ? 'bad'
                    : 'good'
              }
            />
            <StatusBadge
              label={`${asset.criticality} criticality`}
              tone={asset.criticality === 'Critical' ? 'bad' : asset.criticality === 'High' ? 'warn' : asset.criticality === 'Medium' ? 'info' : 'neutral'}
            />
          </View>
          <FieldRow label="Remaining life years" value={String(asset.remaining_life_years)} />
          <FieldRow label="Utilisation" value={asset.utilisation} />
          <FieldRow label="Compatibility of use" value={asset.compatibility_of_use} />
          <FieldRow label="Environmental impact" value={asset.environmental_impact} />
        </View>

        <SectionDivider />
        <SectionHeading title="Lifecycle and costs" />
        <View style={{ gap: t.spacing.md }}>
          <FieldRow label="Purchase date" value={new Date(asset.purchase_date).toLocaleDateString()} />
          <FieldRow label="Purchase cost" value={fmtCurrency(asset.purchase_cost)} />
          <FieldRow label="Replacement cost" value={fmtCurrency(asset.replacement_cost)} />
          <FieldRow label="Warranty expiry" value={new Date(asset.warranty_expiry).toLocaleDateString()} />
        </View>

        <SectionDivider />
        <SectionHeading title="Service history" />
        <View style={{ gap: t.spacing.md }}>
          <FieldRow label="Last serviced" value={new Date(asset.last_serviced_date).toLocaleDateString()} />
          <FieldRow label="Next service" value={new Date(asset.next_service_date).toLocaleDateString()} />
        </View>

        <SectionDivider />
        <SectionHeading title="Notes" />
        <Text style={t.text.bodyMuted}>{asset.notes}</Text>

        <SectionHeading title="Actions" />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button label="Start Condition Report" onPress={() => router.push('/audit/select-location' as any)} style={{ flex: 1 }} />
          <Button
            label="Add to To-Do List"
            variant="secondary"
            onPress={async () => {
              if (!asset) return;
              await saveAuditDraft({ assetId: asset.id, progressPct: 0 });
              setMessage('Asset added to auditor to-do queue.');
            }}
            style={{ flex: 1 }}
          />
        </View>
        {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

export default function AssetDetailScreen() {
  return (
    <RequireWorkspace role="auditor">
      <AssetDetailContent />
    </RequireWorkspace>
  );
}

