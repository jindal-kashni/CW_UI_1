import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, SectionCard, StatusBadge } from '@/src/components';
import { assetAuditHistory, assetById, auditHistory } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AuditHistoryScreen() {
  const t = useTheme();
  const { assetId } = useLocalSearchParams<{ assetId?: string }>();
  const selectedAsset = assetId ? assetById[assetId] : undefined;
  const specificAssetHistory = assetId ? assetAuditHistory.filter((h) => h.asset_id === assetId) : [];

  return (
    <ScreenContainer>
      <TopBar title="Condition Report History" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        {selectedAsset ? (
          <SectionCard
            title={`History · ${selectedAsset.asset_code}`}
            subtitle={selectedAsset.name}>
            <View style={{ gap: t.spacing.md }}>
              {specificAssetHistory.length === 0 ? (
                <Text style={t.text.caption}>No condition report history found for this asset.</Text>
              ) : (
                specificAssetHistory.map((h) => (
                  <Pressable
                    key={h.id}
                    onPress={() => router.push((`/audit/report/${h.id}` as any) as any)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}
                  >
                    <View
                    style={{
                      paddingVertical: t.spacing.sm,
                      paddingHorizontal: t.spacing.md,
                      borderRadius: t.radius.md,
                      backgroundColor: t.colors.card.surfaceAlt,
                      borderWidth: 1,
                      borderColor: t.colors.border.subtle,
                      gap: 6,
                    }}>
                    <Text style={{ fontWeight: '800', color: t.colors.text.primary }}>
                      {new Date(h.audit_date).toLocaleDateString()} · {h.inspector_name}
                    </Text>
                    <Text style={t.text.caption}>Findings: {h.findings}</Text>
                    <Text style={t.text.caption}>Photo taken: {h.photo_taken ? 'Yes' : 'No'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[t.text.caption, { flex: 1, paddingRight: t.spacing.md }]}>{h.notes}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>View</Text>
                        <FontAwesome name="chevron-right" size={11} color={t.colors.brand.forest} />
                      </View>
                    </View>
                  </View>
                  </Pressable>
                ))
              )}
            </View>
          </SectionCard>
        ) : (
          <SectionCard
            title="Completed condition reports"
            subtitle="Believable history for demo purposes. In production this would be searchable and filterable."
            right={<Button label="Back to condition reports" variant="secondary" onPress={() => router.push('/audits' as any)} />}>
            <View style={{ gap: t.spacing.md }}>
              {auditHistory.map((h) => {
                const tone =
                  h.scoreLabel === 'Strong' ? 'good' : h.scoreLabel === 'Acceptable' ? 'info' : 'warn';
                return (
                  <View
                    key={h.id}
                    style={{
                      paddingVertical: t.spacing.sm,
                      paddingHorizontal: t.spacing.md,
                      borderRadius: t.radius.md,
                      backgroundColor: t.colors.card.surfaceAlt,
                      borderWidth: 1,
                      borderColor: t.colors.border.subtle,
                      gap: 6,
                    }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', color: t.colors.text.primary }}>{h.auditTitle}</Text>
                        <Text style={t.text.caption}>
                          {h.location.precinct} · {h.location.zone ?? '—'}
                        </Text>
                      </View>
                      <StatusBadge label={h.scoreLabel} tone={tone} />
                    </View>
                    <Text style={t.text.caption}>Completed {new Date(h.completedAt).toLocaleDateString()}</Text>
                    <Text style={t.text.caption}>{h.notes}</Text>
                  </View>
                );
              })}
            </View>
          </SectionCard>
        )}
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

