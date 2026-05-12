import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, FormField, SectionCard, SegmentedControl } from '@/src/components';
import { conditionOptions, criticalityOptions } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { AssetCondition, Criticality } from '@/src/types/models';
import {
  fetchAuditDraft,
  fetchReportAssetForAudit,
  saveAuditDraft,
  submitConditionReport,
  type ReportAssetForAuditRecord,
} from '@/src/services/reports';
import { saveAuditDraftSnapshot } from '@/src/state/auditDraftStore';
import {
  type CapturedPhoto,
  captureFromCamera,
  pickFromLibrary,
  saveAttachmentReference,
  uploadPhoto,
} from '@/src/services/photos';

type YesNo = 'Yes' | 'No';
type Capacity = 'Under' | 'At' | 'Over';
type RemainingLife = '0_1' | '1_3' | '3_5' | '5_10' | '10_plus';
type Risk = 'Low' | 'Medium' | 'High';
type EffectiveUse = 'Strong' | 'Adequate' | 'Limited';

type PhotoEntry = {
  local: CapturedPhoto;
  uploadStatus: 'pending' | 'uploaded' | 'failed';
  remotePath?: string;
  error?: string;
};

function conditionToRating(condition?: AssetCondition) {
  if (condition === 'Excellent') return 5;
  if (condition === 'Good') return 4;
  if (condition === 'Fair') return 3;
  if (condition === 'Poor') return 2;
  if (condition === 'Needs urgent attention') return 1;
  return 3;
}

function remainingLifeToYears(value?: RemainingLife) {
  if (value === '0_1') return 1;
  if (value === '1_3') return 3;
  if (value === '3_5') return 5;
  if (value === '5_10') return 10;
  if (value === '10_plus') return 15;
  return null;
}

function operationalStatus(functional?: YesNo) {
  if (functional === 'No') return 'Not Operational' as const;
  if (functional === 'Yes') return 'Operational' as const;
  return 'Not Inspected' as const;
}

function priorityFromInputs(criticality?: Criticality, condition?: AssetCondition, complianceRisk?: Risk) {
  if (criticality === 'Critical' || condition === 'Needs urgent attention' || complianceRisk === 'High') return 'Critical' as const;
  if (criticality === 'High' || condition === 'Poor') return 'High' as const;
  if (criticality === 'Low') return 'Low' as const;
  return 'Medium' as const;
}

export default function AuditorReportAssetAuditScreen() {
  const t = useTheme();
  const { reportAssetId: rawReportAssetId } = useLocalSearchParams<{ reportAssetId: string }>();
  const reportAssetId = Array.isArray(rawReportAssetId) ? rawReportAssetId[0] : rawReportAssetId;

  const [record, setRecord] = React.useState<ReportAssetForAuditRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [condition, setCondition] = React.useState<AssetCondition | undefined>(undefined);
  const [criticality, setCriticality] = React.useState<Criticality | undefined>('Medium');
  const [functional, setFunctional] = React.useState<YesNo | undefined>('Yes');
  const [capacity, setCapacity] = React.useState<Capacity | undefined>('At');
  const [remainingLife, setRemainingLife] = React.useState<RemainingLife | undefined>('3_5');
  const [complianceRisk, setComplianceRisk] = React.useState<Risk | undefined>('Medium');
  const [effectiveUse, setEffectiveUse] = React.useState<EffectiveUse | undefined>('Adequate');
  const [environmentImpact, setEnvironmentImpact] = React.useState<Risk | undefined>('Low');
  const [socialSignificance, setSocialSignificance] = React.useState<Risk | undefined>('Medium');

  const [comments, setComments] = React.useState('');
  const [photosCaptured, setPhotosCaptured] = React.useState<YesNo | undefined>('No');
  const [photoNotes, setPhotoNotes] = React.useState('');
  const [findingsSummary, setFindingsSummary] = React.useState('');
  const [recommendedActions, setRecommendedActions] = React.useState('');
  const [followUpOwner, setFollowUpOwner] = React.useState('');

  const [photos, setPhotos] = React.useState<PhotoEntry[]>([]);
  const [photoMessage, setPhotoMessage] = React.useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    if (!reportAssetId) {
      setRecord(null);
      setLoadError('Report asset ID is missing.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setLoadError(null);

      const result = await fetchReportAssetForAudit(reportAssetId);

      if (!mounted) return;

      if (!result.ok || !result.item) {
        setRecord(null);
        setLoadError(result.error ?? 'Could not load this assigned asset.');
        setLoading(false);
        return;
      }

      setRecord(result.item);

      const existingDraft = await fetchAuditDraft(reportAssetId);

      if (existingDraft) {
        setCondition(existingDraft.condition);
        setCriticality(existingDraft.criticality);
        setFunctional(existingDraft.functional);
        setCapacity(existingDraft.capacity);
        setRemainingLife(existingDraft.remainingLife);
        setComplianceRisk(existingDraft.complianceRisk);
        setEffectiveUse(existingDraft.effectiveUse);
        setEnvironmentImpact(existingDraft.environmentImpact);
        setSocialSignificance(existingDraft.socialSignificance);
        setFindingsSummary(existingDraft.findingsSummary || '');
        setRecommendedActions(existingDraft.recommendedActions || '');
        setFollowUpOwner(existingDraft.followUpOwner || '');
        setComments(existingDraft.comments || '');
        setPhotoNotes(existingDraft.photoNotes || '');
        setPhotosCaptured(existingDraft.photosCaptured ? 'Yes' : 'No');
        setPhotos(
          (existingDraft.photos || []).map((photo: any) => ({
            local: { uri: photo.uri } as CapturedPhoto,
            uploadStatus: photo.uploadStatus ?? 'uploaded',
            remotePath: photo.remotePath,
          }))
        );
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [reportAssetId]);

  const buildDraftPayload = React.useCallback(
    () => ({
      condition,
      criticality,
      functional,
      capacity,
      remainingLife,
      complianceRisk,
      effectiveUse,
      environmentImpact,
      socialSignificance,
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
    }),
    [
      condition,
      criticality,
      functional,
      capacity,
      remainingLife,
      complianceRisk,
      effectiveUse,
      environmentImpact,
      socialSignificance,
      findingsSummary,
      recommendedActions,
      followUpOwner,
      comments,
      photoNotes,
      photosCaptured,
      photos,
    ]
  );

  const persistDraftSnapshot = React.useCallback(() => {
    if (!record) return;

    saveAuditDraftSnapshot({
      assetId: record.assetId,
      assignmentId: record.reportAssetId,
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
  }, [record, findingsSummary, recommendedActions, followUpOwner, comments, photoNotes, photosCaptured, photos]);

  const saveDraftAndReturn = React.useCallback(async () => {
    if (!record || !reportAssetId) return;

    setSavingDraft(true);
    persistDraftSnapshot();

    const ok = await saveAuditDraft({
      reportAssetId,
      assetId: record.assetId,
      progressPct: 50,
      draftPayload: buildDraftPayload(),
    });

    setSavingDraft(false);

    if (!ok) {
      Alert.alert('Draft not saved', 'The draft could not be saved. Please try again.');
      return;
    }

    router.push((`/audit/reports/${record.reportId}` as any) as any);
  }, [buildDraftPayload, persistDraftSnapshot, record, reportAssetId]);

  const handleAttachPhoto = React.useCallback(
    async (source: 'camera' | 'library') => {
      if (!record || photoBusy) return;

      setPhotoMessage(null);
      setPhotoBusy(true);

      try {
        const photo = source === 'camera' ? await captureFromCamera() : await pickFromLibrary();

        if (!photo) {
          setPhotoBusy(false);
          return;
        }

        setPhotosCaptured('Yes');

        setPhotos((prev) => [
          ...prev,
          {
            local: photo,
            uploadStatus: 'pending',
          },
        ]);

        const upload = await uploadPhoto(photo, `asset/${record.assetId}`);

        setPhotos((prev) =>
          prev.map((entry) =>
            entry.local.uri === photo.uri
              ? upload.ok
                ? {
                    ...entry,
                    uploadStatus: 'uploaded',
                    remotePath: upload.data.publicUrl ?? upload.data.path,
                  }
                : {
                    ...entry,
                    uploadStatus: 'failed',
                    error: upload.error,
                  }
              : entry
          )
        );

        if (!upload.ok) {
          setPhotoMessage(`Photo saved locally; remote upload failed: ${upload.error}`);
          return;
        }

        setPhotoMessage('Photo uploaded.');

        if (record.locationId) {
          const fileUrl = upload.data.publicUrl ?? upload.data.path;

          await saveAttachmentReference({
            locationId: record.locationId,
            fileUrl,
            fileName: photo.fileName,
            description: `Photo for asset ${record.assetCode}`,
          });
        }
      } finally {
        setPhotoBusy(false);
      }
    },
    [photoBusy, record]
  );

  const submitAudit = React.useCallback(async () => {
    if (!record || !reportAssetId) return;

    if (!condition) {
      Alert.alert('Condition required', 'Please select an asset condition before submitting.');
      return;
    }

    if (!findingsSummary.trim()) {
      Alert.alert('Findings required', 'Please add a findings summary before submitting.');
      return;
    }

    setSubmitting(true);
    persistDraftSnapshot();

    const uploadedPhoto = photos.find((entry) => entry.remotePath)?.remotePath ?? null;
    const maintenanceRequired =
      condition === 'Poor' || condition === 'Needs urgent attention' || complianceRisk === 'High' || functional === 'No';
    const replacementRequired = condition === 'Needs urgent attention' || remainingLife === '0_1';
    const priorityLevel = priorityFromInputs(criticality, condition, complianceRisk);

    const result = await submitConditionReport({
      reportAssetId,
      assetId: record.assetId,
      findings: findingsSummary.trim(),
      comments: comments.trim() || photoNotes.trim() || recommendedActions.trim(),
      photoTaken: photosCaptured === 'Yes' || photos.length > 0,
      photoReference: uploadedPhoto,
      conditionRating: conditionToRating(condition),
      expectedRemainingLifeYears: remainingLifeToYears(remainingLife),
      operationalStatus: operationalStatus(functional),
      maintenanceRequired,
      replacementRequired,
      priorityLevel,
      safetyConcern: priorityLevel === 'Critical' || complianceRisk === 'High',
      criticalAlert: priorityLevel === 'Critical',
      recommendedAction: recommendedActions.trim() || null,
    });

    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('Submission failed', result.error ?? 'The audit could not be submitted.');
      return;
    }

    router.replace((`/audit/reports/${record.reportId}` as any) as any);
  }, [
    comments,
    complianceRisk,
    condition,
    criticality,
    findingsSummary,
    functional,
    persistDraftSnapshot,
    photoNotes,
    photos,
    photosCaptured,
    recommendedActions,
    record,
    remainingLife,
    reportAssetId,
  ]);

  if (loading) {
    return (
      <ScreenContainer>
        <TopBar title="Condition Report Form" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <SectionCard title="Loading asset">
            <Text style={t.text.bodyMuted}>Loading assigned asset details...</Text>
          </SectionCard>
        </View>
        <AppBottomNav />
      </ScreenContainer>
    );
  }

  if (!record) {
    return (
      <ScreenContainer>
        <TopBar title="Condition Report Form" userName="Auditor" onPressBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <SectionCard title="Assigned asset not found">
            <View style={{ gap: t.spacing.md }}>
              <Text style={t.text.bodyMuted}>{loadError ?? 'This assigned asset is not available.'}</Text>
              <Button label="Back" variant="secondary" onPress={() => router.back()} />
            </View>
          </SectionCard>
        </View>
        <AppBottomNav />
      </ScreenContainer>
    );
  }

  const locationLabel = [record.locationName || record.locationId, record.roomName || record.roomId]
    .filter(Boolean)
    .join(' · ') || 'Location unknown';
  const sectionTitleStyle = [t.text.title, { fontSize: 18, lineHeight: 24 }];

  return (
    <ScreenContainer>
      <TopBar
        title="Condition Report Form"
        userName="Auditor"
        onPressBack={() => router.push((`/audit/reports/${record.reportId}` as any) as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <SectionCard title="Condition report form" subtitle="Complete the universal audit fields for this assigned asset.">
          <View style={{ gap: t.spacing.md }}>
            <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{record.assetName}</Text>
            <Text style={t.text.caption}>{record.assetCode || 'No asset code'}</Text>
            <Text style={t.text.caption}>{locationLabel}</Text>
            {[record.category, record.subCategory].filter(Boolean).length > 0 ? (
              <Text style={t.text.caption}>{[record.category, record.subCategory].filter(Boolean).join(' · ')}</Text>
            ) : null}
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>

          <View style={{ gap: t.spacing.xl }}>
            <View style={{ gap: t.spacing.md }}>
              <Text style={sectionTitleStyle}>Asset condition</Text>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Condition</Text>
                <SegmentedControl value={condition} onChange={(value) => setCondition(value)} options={conditionOptions} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Criticality</Text>
                <SegmentedControl value={criticality} onChange={(value) => setCriticality(value)} options={criticalityOptions} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Functional</Text>
                <SegmentedControl
                  value={functional}
                  onChange={(value) => setFunctional(value)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Capacity</Text>
                <SegmentedControl
                  value={capacity}
                  onChange={(value) => setCapacity(value)}
                  options={[
                    { label: 'Under', value: 'Under' },
                    { label: 'At', value: 'At' },
                    { label: 'Over', value: 'Over' },
                  ]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Remaining life</Text>
                <SegmentedControl
                  value={remainingLife}
                  onChange={(value) => setRemainingLife(value)}
                  options={[
                    { label: '0-1 yrs', value: '0_1' },
                    { label: '1-3 yrs', value: '1_3' },
                    { label: '3-5 yrs', value: '3_5' },
                    { label: '5-10 yrs', value: '5_10' },
                    { label: '10+ yrs', value: '10_plus' },
                  ]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Effective use</Text>
                <SegmentedControl
                  value={effectiveUse}
                  onChange={(value) => setEffectiveUse(value)}
                  options={[
                    { label: 'Strong', value: 'Strong' },
                    { label: 'Adequate', value: 'Adequate' },
                    { label: 'Limited', value: 'Limited' },
                  ]}
                />
              </View>
            </View>

            <View style={{ gap: t.spacing.md }}>
              <Text style={sectionTitleStyle}>Compliance and impact</Text>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Compliance risk</Text>
                <SegmentedControl
                  value={complianceRisk}
                  onChange={(value) => setComplianceRisk(value)}
                  options={[
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' },
                  ]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Environmental impact</Text>
                <SegmentedControl
                  value={environmentImpact}
                  onChange={(value) => setEnvironmentImpact(value)}
                  options={[
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' },
                  ]}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Social significance</Text>
                <SegmentedControl
                  value={socialSignificance}
                  onChange={(value) => setSocialSignificance(value)}
                  options={[
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' },
                  ]}
                />
              </View>
            </View>

            <View style={{ gap: t.spacing.md }}>
              <Text style={sectionTitleStyle}>Findings and recommendations</Text>

              <FormField
                label="Findings summary"
                value={findingsSummary}
                onChangeText={setFindingsSummary}
                multiline
                placeholder="Summarise inspection findings..."
              />

              <FormField
                label="Recommended actions"
                value={recommendedActions}
                onChangeText={setRecommendedActions}
                multiline
                placeholder="Recommended maintenance or replacement..."
              />

              <FormField
                label="Follow-up owner"
                value={followUpOwner}
                onChangeText={setFollowUpOwner}
                placeholder="Responsible department or staff member..."
              />

              <FormField
                label="Comments"
                value={comments}
                onChangeText={setComments}
                multiline
                placeholder="Additional comments..."
              />
            </View>

            <View style={{ gap: t.spacing.md }}>
              <Text style={sectionTitleStyle}>Photo evidence</Text>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Photos captured</Text>
                <SegmentedControl
                  value={photosCaptured}
                  onChange={(value) => setPhotosCaptured(value)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <Button
                  label="Take photo"
                  variant="secondary"
                  onPress={() => handleAttachPhoto('camera')}
                  disabled={photoBusy}
                  style={{ flex: 1 }}
                />

                <Button
                  label="Upload photo"
                  variant="secondary"
                  onPress={() => handleAttachPhoto('library')}
                  disabled={photoBusy}
                  style={{ flex: 1 }}
                />
              </View>

              <FormField
                label="Photo notes"
                value={photoNotes}
                onChangeText={setPhotoNotes}
                multiline
                placeholder="Describe attached photos..."
              />

              {photos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.md }}>
                  {photos.map((entry) => (
                    <View key={entry.local.uri} style={{ width: 120, gap: t.spacing.xs }}>
                      <Image source={{ uri: entry.local.uri }} style={{ width: 120, height: 120, borderRadius: 12 }} />

                      <Text
                        style={[
                          t.text.caption,
                          { color: entry.uploadStatus === 'failed' ? '#B63E34' : t.colors.text.muted },
                        ]}
                        numberOfLines={1}>
                        {entry.uploadStatus === 'pending'
                          ? 'Uploading…'
                          : entry.uploadStatus === 'uploaded'
                            ? 'Uploaded'
                            : 'Local only'}
                      </Text>

                      <Pressable onPress={() => setPhotos((prev) => prev.filter((other) => other.local.uri !== entry.local.uri))}>
                        <Text style={[t.text.caption, { fontSize: 11, color: '#B63E34' }]}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              {photoMessage ? <Text style={[t.text.caption, { color: t.colors.text.muted }]}>{photoMessage}</Text> : null}
            </View>

            <View style={{ marginVertical: t.spacing.sm }}>
              <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button
                label={savingDraft ? 'Saving...' : 'Save draft'}
                variant="secondary"
                onPress={saveDraftAndReturn}
                disabled={savingDraft || submitting}
                style={{ flex: 1 }}
              />

              <Button
                label={submitting ? 'Submitting...' : 'Submit audit'}
                onPress={submitAudit}
                disabled={savingDraft || submitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </SectionCard>
      </ScrollView>

      <AppBottomNav />
    </ScreenContainer>
  );
}
