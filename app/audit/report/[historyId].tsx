import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, StatusBadge } from '@/src/components';
import { assetAuditHistory, assetById, locationById, roomById } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

const conditionScore = (value: string) => {
  const map: Record<string, number> = {
    Excellent: 1,
    Good: 2,
    Fair: 3,
    Poor: 4,
    'Needs urgent attention': 5,
  };
  return map[value] ?? 3;
};

export default function SubmittedReportScreen() {
  const t = useTheme();
  const [photoMessage, setPhotoMessage] = React.useState<string | null>(null);
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const record = historyId ? assetAuditHistory.find((item) => item.id === historyId) : undefined;
  const asset = record ? assetById[record.asset_id] : undefined;
  const location = asset ? locationById[asset.location_id] : undefined;
  const room = asset ? roomById[asset.room_id] : undefined;
  const locationLabel = location ? `${location.name} · ${room?.name ?? 'Room not set'}` : 'Location unknown';

  const orderedHistory = record
    ? assetAuditHistory
        .filter((item) => item.asset_id === record.asset_id)
        .sort((a, b) => new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime())
    : [];
  const currentIndex = orderedHistory.findIndex((item) => item.id === record?.id);
  const previousReport = currentIndex >= 0 ? orderedHistory[currentIndex + 1] : undefined;
  const priorReport = currentIndex >= 0 ? orderedHistory[currentIndex + 2] : undefined;

  if (!record || !asset) {
    return (
      <ScreenContainer>
        <TopBar title="Submitted Condition Report" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Condition report not found</Text>
          <Text style={[t.text.bodyMuted, { marginTop: t.spacing.sm }]}>
            This submitted report is not available in the current demo dataset.
          </Text>
        </View>
        <AppBottomNav />
      </ScreenContainer>
    );
  }

  const conditionTone =
    conditionScore(asset.condition) >= 5 ? 'bad' : conditionScore(asset.condition) >= 4 ? 'warn' : 'good';
  const statusLabel = asset.status;
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
      <TopBar title="Submitted Condition Report" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeading title="Report overview" />
        <View style={{ gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>
                {asset.asset_code} · {asset.name}
              </Text>
              <Text style={[t.text.caption, { marginTop: 4 }]}>
                Submitted {new Date(record.audit_date).toLocaleDateString()} by {record.inspector_name}
              </Text>
            </View>
            <StatusBadge label={asset.condition} tone={conditionTone} />
          </View>
          <Text style={t.text.caption}>{locationLabel}</Text>
          <Text style={t.text.caption}>{asset.category} · {asset.sub_category}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Assessment snapshot" />
        <View style={{ gap: t.spacing.sm }}>
          <Text style={t.text.caption}>Condition: {asset.condition}</Text>
          <Text style={t.text.caption}>Criticality: {asset.criticality}</Text>
          <Text style={t.text.caption}>Operational status: {statusLabel}</Text>
          <Text style={t.text.caption}>Compatibility of use: {asset.compatibility_of_use}</Text>
          <Text style={t.text.caption}>Utilisation level: {asset.utilisation}</Text>
          <Text style={t.text.caption}>Environmental impact: {asset.environmental_impact}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Inspector findings" />
        <View style={{ gap: t.spacing.sm }}>
          <Text style={t.text.caption}>Findings: {record.findings}</Text>
          <Text style={t.text.caption}>Photo evidence captured: {record.photo_taken ? 'Yes' : 'No'}</Text>
          <Text style={t.text.caption}>Assessor notes: {record.notes}</Text>
          <Text style={t.text.caption}>Assigned team: {asset.assigned_to}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Photo evidence" />
        <View style={{ gap: t.spacing.md }}>
          <Text style={t.text.caption}>
            {record.photo_taken
              ? 'Photos were attached to this submission for verification.'
              : 'No photos were attached to this submission.'}
          </Text>
          {record.photo_taken ? (
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              {[1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={{
                    flex: 1,
                    minHeight: 86,
                    borderRadius: t.radius.md,
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                    backgroundColor: t.colors.card.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={t.text.caption}>Photo {idx}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Button
            label="View attached photos"
            variant="secondary"
            onPress={() => setPhotoMessage(record.photo_taken ? 'Showing photo gallery (prototype).' : 'No photos attached.')}
          />
          {photoMessage ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{photoMessage}</Text> : null}
        </View>

        <SectionDivider />
        <SectionHeading title="Report navigation" />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Pressable
            disabled={!previousReport}
            onPress={() => {
              if (previousReport) {
                router.replace((`/audit/report/${previousReport.id}` as any) as any);
              }
            }}
            style={({ pressed }) => [
              t.button.secondary,
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !previousReport ? 0.45 : pressed ? 0.92 : 1,
              },
            ]}>
            <Text style={{ color: t.colors.brand.forest, fontSize: 15, fontWeight: '700' }}>
              Previous condition report
            </Text>
          </Pressable>
          <Pressable
            disabled={!priorReport}
            onPress={() => {
              if (priorReport) {
                router.replace((`/audit/report/${priorReport.id}` as any) as any);
              }
            }}
            style={({ pressed }) => [
              t.button.secondary,
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !priorReport ? 0.45 : pressed ? 0.92 : 1,
              },
            ]}>
            <Text style={{ color: t.colors.brand.forest, fontSize: 15, fontWeight: '700' }}>
              Prior condition report
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

