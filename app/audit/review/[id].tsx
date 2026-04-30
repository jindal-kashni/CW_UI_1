import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, SectionCard, StatusBadge } from '@/src/components';
import { locationById, roomById } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { fetchAssetById } from '@/src/services/assets';
import { submitConditionReport } from '@/src/services/reports';
import {
  clearAuditDraftSnapshot,
  getAuditDraftSnapshot,
  type AuditDraft,
} from '@/src/state/auditDraftStore';
import type { Asset } from '@/src/types/models';

export default function AuditReviewScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [draft, setDraft] = React.useState<AuditDraft | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const row = await fetchAssetById(id);
        setAsset(row);
        if (id) setDraft(getAuditDraftSnapshot(id));
      } catch (error) {
        console.log(error);
      }
    })();
  }, [id]);

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
          subtitle="Review your captured findings, recommendations and photo evidence before submission."
          right={<StatusBadge label="Ready" tone="good" />}>
          <View style={{ gap: t.spacing.sm }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>{asset.name}</Text>
            <Text style={t.text.caption}>{asset.asset_code}</Text>
            <Text style={t.text.caption}>{locationLabel}</Text>
            <View style={{ marginTop: t.spacing.sm, gap: 6 }}>
              <Text style={t.text.caption}>
                Findings: {draft?.findingsSummary?.trim() || 'No findings entered'}
              </Text>
              <Text style={t.text.caption}>
                Recommendations: {draft?.recommendedActions?.trim() || 'No recommendations entered'}
              </Text>
              <Text style={t.text.caption}>
                Follow-up owner: {draft?.followUpOwner?.trim() || 'Not set'}
              </Text>
              <Text style={t.text.caption}>
                Photos: {draft?.photosCaptured ? draft.photos.length : 0} attached
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Submission" subtitle="Submit this report to audit history and close the assignment.">
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button label="Back to form" variant="secondary" onPress={() => router.push((`/audit/form/${asset.id}` as any) as any)} style={{ flex: 1 }} />
              <Button
                label={submitting ? 'Submitting...' : 'Submit condition report'}
                onPress={async () => {
                  if (!asset) return;
                  setSubmitError(null);
                  setSubmitting(true);
                  const uploadedPhotoRefs = (draft?.photos ?? [])
                    .filter((photo) => photo.uploadStatus === 'uploaded' && Boolean(photo.remotePath))
                    .map((photo) => photo.remotePath as string);
                  const findingsText = draft?.findingsSummary?.trim() || `${asset.name} review completed.`;
                  const commentsText = [draft?.comments?.trim(), draft?.recommendedActions?.trim(), draft?.photoNotes?.trim()]
                    .filter(Boolean)
                    .join('\n\n');
                  const result = await submitConditionReport({
                    assetId: asset.id,
                    assignmentId: draft?.assignmentId,
                    findings: findingsText,
                    comments: commentsText || 'Submitted from auditor review screen.',
                    photoTaken: uploadedPhotoRefs.length > 0,
                    photoReference: uploadedPhotoRefs.join(', '),
                  });
                  setSubmitting(false);
                  if (!result.ok) {
                    setSubmitError(result.error ?? 'Submission failed. Please try again.');
                    return;
                  }
                  clearAuditDraftSnapshot(asset.id);
                  router.push('/audits' as any);
                }}
                style={{ flex: 1 }}
              />
            </View>
            {submitError ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{submitError}</Text> : null}
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

