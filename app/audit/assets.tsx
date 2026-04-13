import React from 'react';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AssetCard, Button, SearchInput, SectionCard } from '@/src/components';
import { assets, departmentById, locationById, roomById } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AuditAssetListScreen() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');

  const filtered = assets.filter((a) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const loc = locationById[a.location_id];
    const rm = roomById[a.room_id];
    const dept = departmentById[a.dept_id];
    const hay = `${a.name} ${a.asset_code} ${a.category} ${loc?.name ?? ''} ${rm?.name ?? ''} ${dept?.name ?? ''}`.toLowerCase();
    return hay.includes(q);
  });

  return (
    <ScreenContainer>
      <TopBar title="Condition Report Assets" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <SectionCard
          title="Select an asset to assess"
          subtitle="Tap an asset to open the condition report form. You can add a new asset if needed."
          right={<Button label="Add new asset" variant="secondary" onPress={() => router.push('/audit/add-asset' as any)} />}>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search within condition report scope…" />
        </SectionCard>

        <View style={{ gap: t.spacing.lg }}>
          {filtered.map((a) => {
            const loc = locationById[a.location_id];
            const rm = roomById[a.room_id];
            const label = loc ? `${loc.department_name ?? 'Department'} · ${loc.name}` : 'Location unknown';
            return (
              <AssetCard
                key={a.id}
                asset={a}
                locationLabel={label}
                roomLabel={rm?.name ?? 'Room not set'}
                statusLabel={
                  a.status === 'UnderMaintenance'
                    ? 'Under maintenance'
                    : a.status === 'Under repair'
                      ? 'Under repair'
                      : a.status
                }
                onPress={() => router.push((`/audit/form/${a.id}` as any) as any)}
              />
            );
          })}
        </View>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

