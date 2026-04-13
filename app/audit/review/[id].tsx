import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, SectionCard, StatusBadge } from '@/src/components';
import { assetById, locationById, roomById } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AuditReviewScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = id ? assetById[id] : undefined;

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar title="Condition Report Review" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <SectionCard title="Condition report not found">
            <Text style={t.text.bodyMuted}>This condition report draft isn’t available in the demo data.</Text>
          </SectionCard>
        </View>
      </ScreenContainer>
    );
  }

  const loc = locationById[asset.location_id];
  const room = roomById[asset.room_id];
  const locationLabel = loc ? `${loc.name} · ${room?.name ?? 'Room not set'}` : 'Location unknown';

  return (
    <ScreenContainer>
      <TopBar title="Condition Report Review" userName="Auditor" onPressBack={() => router.back()} />
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
          title="Review before submitting"
          subtitle="Prototype review screen. In production, this would show a full summary of completed sections and validation checks."
          right={<StatusBadge label="Ready" tone="good" />}>
          <View style={{ gap: t.spacing.sm }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>{asset.name}</Text>
            <Text style={t.text.caption}>{asset.asset_code}</Text>
            <Text style={t.text.caption}>{locationLabel}</Text>
          </View>
        </SectionCard>

        <SectionCard title="Submission" subtitle="Simulated submission behaviour for client demo.">
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button label="Back to form" variant="secondary" onPress={() => router.push((`/audit/form/${asset.id}` as any) as any)} style={{ flex: 1 }} />
              <Button
                label="Submit condition report"
                onPress={() => {
                  router.push('/audits' as any);
                }}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={t.text.caption}>
              Tip: In presentations, you can describe this as “queued for sync when online” to keep the prototype believable.
            </Text>
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

