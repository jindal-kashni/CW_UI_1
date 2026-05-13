import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, FormField, SectionCard, SegmentedControl } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import {
  fetchAuditDraft,
  fetchReportAssetForAudit,
  saveAuditDraft,
  submitConditionReport,
  type ReportAssetForAuditRecord,
} from '@/src/services/reports';
import {
  type CapturedPhoto,
  captureFromCamera,
  pickFromLibrary,
  saveAttachmentReference,
  uploadPhoto,
} from '@/src/services/photos';

type ConditionRating = 1 | 2 | 3 | 4 | 5;
type OperationalStatus = 'Operational' | 'Partially Operational' | 'Not Operational' | 'Not Inspected';
type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type YesNo = 'Yes' | 'No';

type PhotoEntry = {
  local: CapturedPhoto;
  uploadStatus: 'pending' | 'uploaded' | 'failed';
  remotePath?: string;
  error?: string;
};

type AuditDraftPayload = {
  conditionRating?: ConditionRating;
  expectedRemainingLifeYears?: string;
  operationalStatus?: OperationalStatus;
  maintenanceRequired?: boolean;
  replacementRequired?: boolean;
  priorityLevel?: PriorityLevel;
  estimatedMaintenanceCost?: string;
  estimatedReplacementCost?: string;
  safetyConcern?: boolean;
  issueDescription?: string;
  recommendedAction?: string;
  generalNotes?: string;
  photos?: Array<{
    uri: string;
    remotePath?: string;
    uploadStatus?: 'pending' | 'uploaded' | 'failed';
  }>;
};

const CONDITION_OPTIONS: Array<{ label: string; value: ConditionRating }> = [
  { label: '5 Excellent', value: 5 },
  { label: '4 Good', value: 4 },
  { label: '3 Fair', value: 3 },
  { label: '2 Poor', value: 2 },
  { label: '1 Urgent', value: 1 },
];

const OPERATIONAL_STATUS_OPTIONS: Array<{ label: string; value: OperationalStatus }> = [
  { label: 'Operational', value: 'Operational' },
  { label: 'Partially operational', value: 'Partially Operational' },
  { label: 'Not operational', value: 'Not Operational' },
  { label: 'Not inspected', value: 'Not Inspected' },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: PriorityLevel }> = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Critical', value: 'Critical' },
];

const YES_NO_OPTIONS: Array<{ label: string; value: YesNo }> = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
];

function conditionName(value: ConditionRating) {
  if (value === 5) return 'Excellent';
  if (value === 4) return 'Good';
  if (value === 3) return 'Fair';
  if (value === 2) return 'Poor';
  return 'Needs urgent attention';
}

function conditionToRating(value?: string): ConditionRating | undefined {
  if (value === 'Excellent') return 5;
  if (value === 'Good') return 4;
  if (value === 'Fair') return 3;
  if (value === 'Poor') return 2;
  if (value === 'Needs urgent attention') return 1;
  return undefined;
}

function remainingLifeToYears(value?: string): string | undefined {
  if (value === '0_1') return '1';
  if (value === '1_3') return '3';
  if (value === '3_5') return '5';
  if (value === '5_10') return '10';
  if (value === '10_plus') return '15';
  return undefined;
}

function boolToYesNo(value: boolean): YesNo {
  return value ? 'Yes' : 'No';
}

function yesNoToBool(value: YesNo): boolean {
  return value === 'Yes';
}

function toNumberOrNull(value: string): number | null {
  const clean = value.replace(/[$,\s]/g, '');
  if (!clean) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function calcProgress(payload: AuditDraftPayload) {
  const checks = [
    Boolean(payload.conditionRating),
    payload.expectedRemainingLifeYears !== undefined && payload.expectedRemainingLifeYears !== '',
    Boolean(payload.operationalStatus),
    payload.maintenanceRequired !== undefined,
    payload.replacementRequired !== undefined,
    Boolean(payload.priorityLevel),
    payload.estimatedMaintenanceCost !== undefined && payload.estimatedMaintenanceCost !== '',
    payload.estimatedReplacementCost !== undefined && payload.estimatedReplacementCost !== '',
    payload.safetyConcern !== undefined,
    Boolean(payload.issueDescription?.trim()),
    Boolean(payload.recommendedAction?.trim()),
    Boolean(payload.generalNotes?.trim()),
    Boolean(payload.photos?.length),
  ];

  const complete = checks.filter(Boolean).length;
  return Math.max(10, Math.min(90, Math.round((complete / checks.length) * 100)));
}

function DetailText({ label, value }: { label: string; value?: string | null }) {
  const t = useTheme();

  if (!value) return null;

  return (
    <View style={{ gap: 2 }}>
      <Text style={[t.text.caption, { fontSize: 11 }]}>{label}</Text>
      <Text style={[t.text.body, { fontSize: 13, lineHeight: 18 }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function AuditorReportAssetAuditScreen() {
  const t = useTheme();
  const { reportAssetId: rawReportAssetId } = useLocalSearchParams<{ reportAssetId?: string | string[] }>();
  const reportAssetId = Array.isArray(rawReportAssetId) ? rawReportAssetId[0] : rawReportAssetId;

  const [record, setRecord] = React.useState<ReportAssetForAuditRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [conditionRating, setConditionRating] = React.useState<ConditionRating>(3);
  const [expectedRemainingLifeYears, setExpectedRemainingLifeYears] = React.useState('');
  const [operationalStatus, setOperationalStatus] = React.useState<OperationalStatus>('Operational');

  const [maintenanceRequired, setMaintenanceRequired] = React.useState<YesNo>('No');
  const [replacementRequired, setReplacementRequired] = React.useState<YesNo>('No');
  const [priorityLevel, setPriorityLevel] = React.useState<PriorityLevel>('Low');
  const [estimatedMaintenanceCost, setEstimatedMaintenanceCost] = React.useState('');
  const [estimatedReplacementCost, setEstimatedReplacementCost] = React.useState('');

  const [safetyConcern, setSafetyConcern] = React.useState<YesNo>('No');
  const [issueDescription, setIssueDescription] = React.useState('');
  const [recommendedAction, setRecommendedAction] = React.useState('');

  const [generalNotes, setGeneralNotes] = React.useState('');
  const [photos, setPhotos] = React.useState<PhotoEntry[]>([]);
  const [photoMessage, setPhotoMessage] = React.useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = React.useState(false);

  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const draftPayload = React.useMemo<AuditDraftPayload>(
    () => ({
      conditionRating,
      expectedRemainingLifeYears,
      operationalStatus,
      maintenanceRequired: yesNoToBool(maintenanceRequired),
      replacementRequired: yesNoToBool(replacementRequired),
      priorityLevel,
      estimatedMaintenanceCost,
      estimatedReplacementCost,
      safetyConcern: yesNoToBool(safetyConcern),
      issueDescription,
      recommendedAction,
      generalNotes,
      photos: photos.map((entry) => ({
        uri: entry.local.uri,
        remotePath: entry.remotePath,
        uploadStatus: entry.uploadStatus,
      })),
    }),
    [
      conditionRating,
      expectedRemainingLifeYears,
      operationalStatus,
      maintenanceRequired,
      replacementRequired,
      priorityLevel,
      estimatedMaintenanceCost,
      estimatedReplacementCost,
      safetyConcern,
      issueDescription,
      recommendedAction,
      generalNotes,
      photos,
    ]
  );

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

      const existingDraft = (await fetchAuditDraft(reportAssetId)) as AuditDraftPayload & Record<string, any> | null;

      if (existingDraft) {
        const legacyConditionRating = conditionToRating(existingDraft.condition);
        const legacyRemainingLife = remainingLifeToYears(existingDraft.remainingLife);

        if (existingDraft.conditionRating || legacyConditionRating) {
          setConditionRating((existingDraft.conditionRating ?? legacyConditionRating) as ConditionRating);
        }

        if (existingDraft.expectedRemainingLifeYears !== undefined) {
          setExpectedRemainingLifeYears(String(existingDraft.expectedRemainingLifeYears));
        } else if (legacyRemainingLife !== undefined) {
          setExpectedRemainingLifeYears(legacyRemainingLife);
        }

        if (existingDraft.operationalStatus) setOperationalStatus(existingDraft.operationalStatus);
        if (existingDraft.maintenanceRequired !== undefined) setMaintenanceRequired(boolToYesNo(Boolean(existingDraft.maintenanceRequired)));
        if (existingDraft.replacementRequired !== undefined) setReplacementRequired(boolToYesNo(Boolean(existingDraft.replacementRequired)));
        if (existingDraft.priorityLevel) setPriorityLevel(existingDraft.priorityLevel);
        if (existingDraft.estimatedMaintenanceCost !== undefined) setEstimatedMaintenanceCost(String(existingDraft.estimatedMaintenanceCost));
        if (existingDraft.estimatedReplacementCost !== undefined) setEstimatedReplacementCost(String(existingDraft.estimatedReplacementCost));
        if (existingDraft.safetyConcern !== undefined) setSafetyConcern(boolToYesNo(Boolean(existingDraft.safetyConcern)));
        if (existingDraft.issueDescription !== undefined) setIssueDescription(String(existingDraft.issueDescription));
        else if (existingDraft.findingsSummary !== undefined) setIssueDescription(String(existingDraft.findingsSummary));
        if (existingDraft.recommendedAction !== undefined) setRecommendedAction(String(existingDraft.recommendedAction));
        else if (existingDraft.recommendedActions !== undefined) setRecommendedAction(String(existingDraft.recommendedActions));
        if (existingDraft.generalNotes !== undefined) setGeneralNotes(String(existingDraft.generalNotes));
        else if (existingDraft.comments !== undefined) setGeneralNotes(String(existingDraft.comments));

        if (Array.isArray(existingDraft.photos)) {
          setPhotos(
            existingDraft.photos
              .filter((photo: any) => photo?.uri)
              .map((photo: any) => ({
                local: { uri: photo.uri } as CapturedPhoto,
                uploadStatus: photo.uploadStatus ?? (photo.remotePath ? 'uploaded' : 'failed'),
                remotePath: photo.remotePath,
              }))
          );
        }
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [reportAssetId]);

  const handleAttachPhoto = React.useCallback(
    async (source: 'camera' | 'library') => {
      if (!record || photoBusy) return;

      setPhotoMessage(null);
      setPhotoBusy(true);

      try {
        const photo = source === 'camera' ? await captureFromCamera() : await pickFromLibrary();

        if (!photo) return;

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
            description: `Photo for asset ${record.assetCode || record.assetName}`,
          });
        }
      } finally {
        setPhotoBusy(false);
      }
    },
    [photoBusy, record]
  );

  const saveDraftAndReturn = React.useCallback(async () => {
    if (!record || !reportAssetId) return;

    setSavingDraft(true);

    const ok = await saveAuditDraft({
      reportAssetId,
      assetId: record.assetId,
      progressPct: calcProgress(draftPayload),
      draftPayload,
    });

    setSavingDraft(false);

    if (!ok) {
      Alert.alert('Draft not saved', 'The draft could not be saved. Please try again.');
      return;
    }

    router.push((`/audit/reports/${record.reportId}` as any) as any);
  }, [draftPayload, record, reportAssetId]);

  const submitAudit = React.useCallback(async () => {
    if (!record || !reportAssetId) return;

    const expectedLife = toNumberOrNull(expectedRemainingLifeYears);
    const maintenanceCost = toNumberOrNull(estimatedMaintenanceCost);
    const replacementCost = toNumberOrNull(estimatedReplacementCost);

    if (expectedRemainingLifeYears.trim() && expectedLife === null) {
      Alert.alert('Check remaining life', 'Expected remaining life must be a number.');
      return;
    }

    if (estimatedMaintenanceCost.trim() && maintenanceCost === null) {
      Alert.alert('Check maintenance cost', 'Estimated maintenance cost must be a valid number.');
      return;
    }

    if (estimatedReplacementCost.trim() && replacementCost === null) {
      Alert.alert('Check replacement cost', 'Estimated replacement cost must be a valid number.');
      return;
    }

    const failedUploads = photos.filter((entry) => entry.uploadStatus === 'failed').length;

    if (failedUploads > 0) {
      Alert.alert(
        'Some photos are local only',
        'One or more photos failed to upload. They will not be included in the submitted report until uploaded successfully.'
      );
    }

    setSubmitting(true);

    const photoUrls = photos
      .map((entry) => entry.remotePath)
      .filter((value): value is string => Boolean(value));

    const result = await submitConditionReport({
      reportAssetId,
      assetId: record.assetId,
      conditionRating,
      expectedRemainingLifeYears: expectedLife,
      operationalStatus,
      maintenanceRequired: yesNoToBool(maintenanceRequired),
      replacementRequired: yesNoToBool(replacementRequired),
      priorityLevel,
      estimatedMaintenanceCost: maintenanceCost,
      estimatedReplacementCost: replacementCost,
      safetyConcern: yesNoToBool(safetyConcern),
      issueDescription: issueDescription.trim() || null,
      recommendedAction: recommendedAction.trim() || null,
      generalNotes: generalNotes.trim() || null,
      photoUrls,
    });

    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('Submission failed', result.error ?? 'The audit could not be submitted.');
      return;
    }

    router.replace((`/audit/reports/${record.reportId}` as any) as any);
  }, [
    conditionRating,
    estimatedMaintenanceCost,
    estimatedReplacementCost,
    expectedRemainingLifeYears,
    generalNotes,
    issueDescription,
    maintenanceRequired,
    operationalStatus,
    photos,
    priorityLevel,
    recommendedAction,
    record,
    replacementRequired,
    reportAssetId,
    safetyConcern,
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
          <View style={{ gap: t.spacing.lg }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(30,31,28,0.10)',
                borderRadius: t.radius.lg,
                padding: t.spacing.md,
                backgroundColor: 'rgba(0,74,38,0.04)',
                gap: t.spacing.sm,
              }}>
              <View style={{ gap: 2 }}>
                <Text style={[t.text.title, { fontSize: 20, lineHeight: 25 }]} numberOfLines={1}>
                  {record.assetName}
                </Text>
                <Text style={t.text.caption} numberOfLines={1}>
                  {record.assetCode || 'No asset code'} · {conditionName(conditionRating)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }}>
                <View style={{ minWidth: 160, flex: 1 }}>
                  <DetailText label="Location" value={locationLabel} />
                </View>
                <View style={{ minWidth: 140, flex: 1 }}>
                  <DetailText label="Category" value={[record.category, record.subCategory].filter(Boolean).join(' · ')} />
                </View>
                <View style={{ minWidth: 120, flex: 1 }}>
                  <DetailText label="Department" value={record.departmentName || record.departmentId} />
                </View>
              </View>
            </View>

            <View style={{ gap: t.spacing.md }}>
              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Condition rating</Text>
                <SegmentedControl value={conditionRating} onChange={(value) => setConditionRating(value)} options={CONDITION_OPTIONS} />
              </View>

              <FormField
                label="Expected remaining life years"
                value={expectedRemainingLifeYears}
                onChangeText={setExpectedRemainingLifeYears}
                placeholder="e.g. 5"
              />

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Operational status</Text>
                <SegmentedControl value={operationalStatus} onChange={(value) => setOperationalStatus(value)} options={OPERATIONAL_STATUS_OPTIONS} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Maintenance required</Text>
                <SegmentedControl value={maintenanceRequired} onChange={(value) => setMaintenanceRequired(value)} options={YES_NO_OPTIONS} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Replacement recommended</Text>
                <SegmentedControl value={replacementRequired} onChange={(value) => setReplacementRequired(value)} options={YES_NO_OPTIONS} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Priority level</Text>
                <SegmentedControl value={priorityLevel} onChange={(value) => setPriorityLevel(value)} options={PRIORITY_OPTIONS} />
              </View>

              <FormField
                label="Estimated maintenance cost"
                value={estimatedMaintenanceCost}
                onChangeText={setEstimatedMaintenanceCost}
                placeholder="e.g. 250"
              />

              <FormField
                label="Estimated replacement cost"
                value={estimatedReplacementCost}
                onChangeText={setEstimatedReplacementCost}
                placeholder="e.g. 1200"
              />

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Safety concern</Text>
                <SegmentedControl value={safetyConcern} onChange={(value) => setSafetyConcern(value)} options={YES_NO_OPTIONS} />
              </View>

              <FormField
                label="Issue description"
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                placeholder="Describe the issue or observation..."
              />

              <FormField
                label="Recommended action"
                value={recommendedAction}
                onChangeText={setRecommendedAction}
                multiline
                placeholder="Recommended maintenance or action..."
              />

              <FormField
                label="General notes"
                value={generalNotes}
                onChangeText={setGeneralNotes}
                multiline
                placeholder="General audit notes..."
              />

              <View style={{ gap: t.spacing.sm }}>
                <Text style={t.text.caption}>Audit photos</Text>

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
                disabled={savingDraft || submitting || photoBusy}
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
