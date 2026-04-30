import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import {
  Button,
  FormField,
  SectionCard,
  SegmentedControl,
} from '@/src/components';
import { conditionOptions, criticalityOptions, locationById, roomById } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import type { Asset, AssetCondition, Criticality } from '@/src/types/models';
import { saveAuditDraft } from '@/src/services/reports';
import { saveAuditDraftSnapshot } from '@/src/state/auditDraftStore';
import { fetchAssetById } from '@/src/services/assets';
import {
  type CapturedPhoto,
  captureFromCamera,
  pickFromLibrary,
  saveAttachmentReference,
  uploadPhoto,
} from '@/src/services/photos';

type YesNo = 'Yes' | 'No';
type Capacity = 'Under' | 'At' | 'Over';

export default function AuditFormScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assignments } = useDemoState();
  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [loadingAsset, setLoadingAsset] = React.useState(true);
  const assignment = assignments.find((a) => a.assetId === id);
  const isInProgress =
    assignment?.status === 'InProgress' || assignment?.status === 'DraftSaved';
  const isToDo = assignment?.status === 'Assigned';

  const [condition, setCondition] = React.useState<AssetCondition | undefined>(undefined);
  const [criticality, setCriticality] = React.useState<Criticality | undefined>(
    isToDo ? undefined : asset?.criticality ?? 'Medium'
  );
  const [functional, setFunctional] = React.useState<YesNo | undefined>(isToDo ? undefined : 'Yes');
  const [capacity, setCapacity] = React.useState<Capacity | undefined>(isToDo ? undefined : 'At');
  const [remainingLife, setRemainingLife] = React.useState<'0_1' | '1_3' | '3_5' | '5_10' | '10_plus' | undefined>(
    isToDo ? undefined : '3_5'
  );
  const [complianceRisk, setComplianceRisk] = React.useState<'Low' | 'Medium' | 'High' | undefined>(
    isToDo ? undefined : 'Medium'
  );
  const [effectiveUse, setEffectiveUse] = React.useState<'Strong' | 'Adequate' | 'Limited' | undefined>(
    isToDo ? undefined : 'Adequate'
  );
  const [environmentImpact, setEnvironmentImpact] = React.useState<'Low' | 'Medium' | 'High' | undefined>(
    isToDo ? undefined : 'Low'
  );
  const [socialSignificance, setSocialSignificance] = React.useState<'Low' | 'Medium' | 'High' | undefined>(
    isToDo ? undefined : 'Medium'
  );
  const [comments, setComments] = React.useState('');
  const [photosCaptured, setPhotosCaptured] = React.useState<YesNo | undefined>(isToDo ? undefined : 'No');
  const [photoCount, setPhotoCount] = React.useState(isInProgress ? '2' : '');
  const [photoNotes, setPhotoNotes] = React.useState('');
  const [findingsSummary, setFindingsSummary] = React.useState(
    isInProgress ? 'Visual inspection started. Initial checks captured in field notes.' : ''
  );
  const [recommendedActions, setRecommendedActions] = React.useState('');
  const [followUpOwner, setFollowUpOwner] = React.useState(isInProgress ? 'Facilities Maintenance' : '');
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [photos, setPhotos] = React.useState<
    { local: CapturedPhoto; uploadStatus: 'pending' | 'uploaded' | 'failed'; remotePath?: string; error?: string }[]
  >([]);
  const [photoMessage, setPhotoMessage] = React.useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    if (!id) {
      setAsset(null);
      setLoadingAsset(false);
      return;
    }
    (async () => {
      setLoadingAsset(true);
      const row = await fetchAssetById(id);
      if (!mounted) return;
      setAsset(row);
      setLoadingAsset(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const persistDraftSnapshot = React.useCallback(() => {
    if (!asset) return;
    saveAuditDraftSnapshot({
      assetId: asset.id,
      assignmentId: assignment?.id,
      findingsSummary,
      recommendedActions,
      followUpOwner,
      comments,
      photoNotes,
      photosCaptured: photosCaptured === 'Yes',
      photos: photos.map((entry) => ({
        uri: entry.local.uri,
        remotePath: entry.remotePath,
        uploadStatus: entry.uploadStatus,
      })),
      updatedAt: new Date().toISOString(),
    });
  }, [
    asset,
    assignment?.id,
    findingsSummary,
    recommendedActions,
    followUpOwner,
    comments,
    photoNotes,
    photosCaptured,
    photos,
  ]);

  const handleAttachPhoto = React.useCallback(
    async (source: 'camera' | 'library') => {
      if (!asset || photoBusy) return;
      setPhotoMessage(null);
      setPhotoBusy(true);
      try {
        const photo = source === 'camera' ? await captureFromCamera() : await pickFromLibrary();
        if (!photo) {
          setPhotoBusy(false);
          return;
        }
        setPhotosCaptured('Yes');
        setPhotos((prev) => [...prev, { local: photo, uploadStatus: 'pending' }]);
        setPhotoCount((prev) => String((Number(prev) || 0) + 1));

        const upload = await uploadPhoto(photo, `asset/${asset.id}`);
        setPhotos((prev) =>
          prev.map((entry) =>
            entry.local.uri === photo.uri
              ? upload.ok
                ? { ...entry, uploadStatus: 'uploaded', remotePath: upload.data.publicUrl ?? upload.data.path }
                : { ...entry, uploadStatus: 'failed', error: upload.error }
              : entry
          )
        );
        if (!upload.ok) {
          setPhotoMessage(`Photo saved locally; remote upload failed: ${upload.error}`);
        } else {
          setPhotoMessage('Photo uploaded.');
          if (asset.location_id) {
            const fileUrl = upload.data.publicUrl ?? upload.data.path;
            await saveAttachmentReference({
              locationId: asset.location_id,
              fileUrl,
              fileName: photo.fileName,
              description: `Photo for asset ${asset.asset_code}`,
            });
          }
        }
      } finally {
        setPhotoBusy(false);
      }
    },
    [asset, photoBusy]
  );

  if (loadingAsset) {
    return (
      <ScreenContainer>
        <TopBar title="Condition Report Form" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <SectionCard title="Loading asset">
            <Text style={t.text.bodyMuted}>Loading asset details...</Text>
          </SectionCard>
        </View>
      </ScreenContainer>
    );
  }

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar title="Condition Report Form" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <SectionCard title="Asset not found">
            <Text style={t.text.bodyMuted}>This asset isn’t available in the demo data.</Text>
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
      <TopBar title="Condition Report Form" userName="Auditor" onPressBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <SectionCard title="Condition report form" subtitle="Complete all sections before reviewing and submitting.">
          <View style={{ gap: t.spacing.md }}>
            <View style={{ gap: 4 }}>
              <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{asset.name}</Text>
              <Text style={t.text.caption}>{asset.asset_code} · {asset.category}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.xl }}>
              <View style={{ gap: 4, flex: 1 }}>
                <Text style={t.text.caption}>Location</Text>
                <Text style={t.text.bodyMuted}>{locationLabel}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Asset details</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Confirm key record information for the assessment report.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <FormField label="Assessor" value={isToDo ? '' : 'Keyaan'} onChangeText={() => {}} editable={false} />
            <FormField label="Location" value={isToDo ? '' : locationLabel} onChangeText={() => {}} editable={false} />
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Classification & criticality</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Set the operational priority for field triage.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={criticality}
              onChange={setCriticality}
              options={criticalityOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Capacity & functionality</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            A modern, quick-to-complete interpretation of formal assessment sections.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl value={functional} onChange={setFunctional} options={[{ label: 'Functional', value: 'Yes' }, { label: 'Not functional', value: 'No' }]} />
            <SegmentedControl
              value={capacity}
              onChange={setCapacity}
              options={[
                { label: 'Under capacity', value: 'Under' },
                { label: 'At capacity', value: 'At' },
                { label: 'Over capacity', value: 'Over' },
              ]}
            />
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Condition & remaining life</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Prioritise safety and animal welfare outcomes with a clean rating flow.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={condition}
              onChange={setCondition}
              options={conditionOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
            <SegmentedControl
              value={remainingLife}
              onChange={setRemainingLife}
              options={[
                { label: '0–1y', value: '0_1' },
                { label: '1–3y', value: '1_3' },
                { label: '3–5y', value: '3_5' },
                { label: '5–10y', value: '5_10' },
                { label: '10+y', value: '10_plus' },
              ]}
            />
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Risk & effective use</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Capture compliance and operational value without recreating a paper form.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={complianceRisk}
              onChange={setComplianceRisk}
              options={[
                { label: 'Low risk', value: 'Low' },
                { label: 'Medium risk', value: 'Medium' },
                { label: 'High risk', value: 'High' },
              ]}
            />
            <SegmentedControl
              value={effectiveUse}
              onChange={setEffectiveUse}
              options={[
                { label: 'Strong', value: 'Strong' },
                { label: 'Adequate', value: 'Adequate' },
                { label: 'Limited', value: 'Limited' },
              ]}
            />
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Impact & significance</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Include environmental and social considerations in a quick rating flow.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={environmentImpact}
              onChange={setEnvironmentImpact}
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
              ]}
            />
            <SegmentedControl
              value={socialSignificance}
              onChange={setSocialSignificance}
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
              ]}
            />
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Assessor comments</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Short, field-ready notes for the final report.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <FormField
              label="Findings summary"
              value={findingsSummary}
              onChangeText={setFindingsSummary}
              placeholder="Describe observed condition and key defects."
              multiline
              hasError={isInProgress && !findingsSummary.trim()}
            />
            <FormField
              label="Recommended actions"
              value={recommendedActions}
              onChangeText={setRecommendedActions}
              placeholder="List immediate and follow-up actions."
              multiline
              hasError={isInProgress && !recommendedActions.trim()}
            />
            <FormField
              label="Follow-up owner"
              value={followUpOwner}
              onChangeText={setFollowUpOwner}
              placeholder="Team or person responsible for follow-up."
              hasError={isInProgress && !followUpOwner.trim()}
            />
            <FormField
              label="Comments"
              value={comments}
              onChangeText={setComments}
              placeholder="Add observations, constraints, recommended actions…"
              multiline
              hasError={isInProgress && !comments.trim()}
            />
            {isInProgress ? (
              <Text style={[t.text.caption, { color: '#B63E34' }]}>
                Fields outlined in red still need to be completed before submission.
              </Text>
            ) : null}
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Photo evidence</Text>
          <Text style={[t.text.caption, { marginTop: 2, marginBottom: t.spacing.md }]}>
            Attach visual evidence to support findings and follow-up actions.
          </Text>
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={photosCaptured}
              onChange={setPhotosCaptured}
              options={[
                { label: 'Photos: Yes', value: 'Yes' },
                { label: 'Photos: No', value: 'No' },
              ]}
            />
            {photosCaptured === 'Yes' ? (
              <>
                <FormField
                  label="Photo count"
                  value={photoCount}
                  onChangeText={setPhotoCount}
                  placeholder="e.g. 3"
                  hasError={isInProgress && !photoCount.trim()}
                />
                <FormField
                  label="Photo notes"
                  value={photoNotes}
                  onChangeText={setPhotoNotes}
                  placeholder="Describe what was captured in the photos."
                  multiline
                />
              </>
            ) : null}
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button
                label={photoBusy ? 'Working...' : 'Take photo'}
                variant="secondary"
                onPress={() => handleAttachPhoto('camera')}
                style={{ flex: 1 }}
              />
              <Button
                label="Choose from library"
                variant="secondary"
                onPress={() => handleAttachPhoto('library')}
                style={{ flex: 1 }}
              />
            </View>
            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.md }}>
                {photos.map((entry) => (
                  <View key={entry.local.uri} style={{ width: 96 }}>
                    <Image
                      source={{ uri: entry.local.uri }}
                      style={{ width: 96, height: 96, borderRadius: t.radius.md, backgroundColor: '#E1E5DE' }}
                    />
                    <Text
                      style={[
                        t.text.caption,
                        { fontSize: 11, marginTop: 4, color: entry.uploadStatus === 'failed' ? '#B63E34' : t.colors.text.muted },
                      ]}
                      numberOfLines={1}>
                      {entry.uploadStatus === 'pending'
                        ? 'Uploading…'
                        : entry.uploadStatus === 'uploaded'
                          ? 'Uploaded'
                          : 'Local only'}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setPhotos((prev) => prev.filter((other) => other.local.uri !== entry.local.uri));
                        setPhotoCount((prev) => String(Math.max((Number(prev) || 1) - 1, 0)));
                      }}
                      style={{ marginTop: 2 }}>
                      <Text style={[t.text.caption, { fontSize: 11, color: '#B63E34' }]}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {photoMessage ? (
              <Text style={[t.text.caption, { color: t.colors.text.muted }]}>{photoMessage}</Text>
            ) : null}
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <Button
              label={savingDraft ? 'Saving...' : 'Save draft'}
              variant="secondary"
              onPress={async () => {
                if (!asset) return;
                setSavingDraft(true);
                persistDraftSnapshot();
                await saveAuditDraft({
                  assignmentId: assignment?.id,
                  assetId: assignment?.id ? undefined : asset.id,
                  progressPct: 50,
                });
                setSavingDraft(false);
                router.back();
              }}
              style={{ flex: 1 }}
            />
            <Button
              label="Review & submit"
              onPress={() => {
                persistDraftSnapshot();
                router.push((`/audit/review/${asset.id}` as any) as any);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

