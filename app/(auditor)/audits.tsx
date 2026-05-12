import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import {
  Button,
  FormField,
  SectionCard,
  SegmentedControl,
} from '@/src/components';
import {
  conditionOptions,
  criticalityOptions,
  locationById,
  roomById,
} from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import type { Asset, AssetCondition, Criticality } from '@/src/types/models';
import { fetchAssetById } from '@/src/services/assets';
import { fetchAuditDraft, saveAuditDraft } from '@/src/services/reports';
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

export default function AuditFormScreen() {
  const t = useTheme();

  const { id, reportId, reportAssetId } = useLocalSearchParams<{
    id: string;
    reportId?: string;
    reportAssetId?: string;
  }>();

  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [loadingAsset, setLoadingAsset] = React.useState(true);

  const [condition, setCondition] = React.useState<AssetCondition | undefined>(undefined);
  const [criticality, setCriticality] = React.useState<Criticality | undefined>('Medium');
  const [functional, setFunctional] = React.useState<YesNo | undefined>('Yes');
  const [capacity, setCapacity] = React.useState<Capacity | undefined>('At');
  const [remainingLife, setRemainingLife] = React.useState<
    '0_1' | '1_3' | '3_5' | '5_10' | '10_plus' | undefined
  >('3_5');
  const [complianceRisk, setComplianceRisk] = React.useState<'Low' | 'Medium' | 'High' | undefined>('Medium');
  const [effectiveUse, setEffectiveUse] = React.useState<'Strong' | 'Adequate' | 'Limited' | undefined>('Adequate');
  const [environmentImpact, setEnvironmentImpact] = React.useState<'Low' | 'Medium' | 'High' | undefined>('Low');
  const [socialSignificance, setSocialSignificance] = React.useState<'Low' | 'Medium' | 'High' | undefined>('Medium');

  const [comments, setComments] = React.useState('');
  const [photosCaptured, setPhotosCaptured] = React.useState<YesNo | undefined>('No');
  const [photoNotes, setPhotoNotes] = React.useState('');
  const [findingsSummary, setFindingsSummary] = React.useState('');
  const [recommendedActions, setRecommendedActions] = React.useState('');
  const [followUpOwner, setFollowUpOwner] = React.useState('');
  const [savingDraft, setSavingDraft] = React.useState(false);

  const [photos, setPhotos] = React.useState<
    {
      local: CapturedPhoto;
      uploadStatus: 'pending' | 'uploaded' | 'failed';
      remotePath?: string;
      error?: string;
    }[]
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

      const existingDraft = reportAssetId ? await fetchAuditDraft(reportAssetId) : null;

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
            uploadStatus: photo.uploadStatus,
            remotePath: photo.remotePath,
          }))
        );
      }

      setLoadingAsset(false);
    })();

    return () => {
      mounted = false;
    };
  }, [id, reportAssetId]);

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
    if (!asset) return;

    saveAuditDraftSnapshot({
      assetId: asset.id,
      assignmentId: reportAssetId,
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
    reportAssetId,
    findingsSummary,
    recommendedActions,
    followUpOwner,
    comments,
    photoNotes,
    photosCaptured,
    photos,
  ]);

  const saveDraftAndReturn = React.useCallback(async () => {
    if (!asset) return;

    setSavingDraft(true);
    persistDraftSnapshot();

    await saveAuditDraft({
      reportAssetId,
      assetId: asset.id,
      progressPct: 50,
      draftPayload: buildDraftPayload(),
    });

    setSavingDraft(false);

    if (reportId) {
      router.push((`/audit/review/${reportId}` as any) as any);
    } else {
      router.back();
    }
  }, [asset, reportAssetId, reportId, persistDraftSnapshot, buildDraftPayload]);

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

        setPhotos((prev) => [
          ...prev,
          {
            local: photo,
            uploadStatus: 'pending',
          },
        ]);

        const upload = await uploadPhoto(photo, `asset/${asset.id}`);

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
            <Text style={t.text.bodyMuted}>This asset isn’t available.</Text>
          </SectionCard>
        </View>
      </ScreenContainer>
    );
  }

  const loc = asset.location_id ? locationById[asset.location_id] : undefined;
  const room = asset.room_id ? roomById[asset.room_id] : undefined;
  const locationLabel = loc ? `${loc.name} · ${room?.name ?? 'Room not set'}` : 'Location unknown';

  const sectionTitleStyle = [t.text.title, { fontSize: 18, lineHeight: 24 }];

  return (
    <ScreenContainer>
      <TopBar
        title="Condition Report Form"
        userName="Auditor"
        onPressBack={() => {
          if (reportId) {
            router.push((`/audit/review/${reportId}` as any) as any);
          } else {
            router.back();
          }
        }}
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
        <SectionCard
          title="Condition report form"
          subtitle="Complete the universal audit fields for this assigned asset.">
          <View style={{ gap: t.spacing.md }}>
            <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>{asset.name}</Text>
            <Text style={t.text.caption}>{asset.asset_code}</Text>
            <Text style={t.text.caption}>{locationLabel}</Text>
          </View>

          <View style={{ marginVertical: t.spacing.xl }}>
            <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
          </View>

          <View style={{ gap: t.spacing.xl }}>
            <View style={{ gap: t.spacing.md }}>
              <Text style={sectionTitleStyle}>Asset condition</Text>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Condition</Text>
                <SegmentedControl
                  value={condition}
                  onChange={(value) => setCondition(value)}
                  options={conditionOptions}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={t.text.caption}>Criticality</Text>
                <SegmentedControl
                  value={criticality}
                  onChange={(value) => setCriticality(value)}
                  options={criticalityOptions}
                />
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: t.spacing.md }}>
                  {photos.map((entry) => (
                    <View key={entry.local.uri} style={{ width: 120, gap: t.spacing.xs }}>
                      <Image
                        source={{ uri: entry.local.uri }}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 12,
                        }}
                      />

                      <Text
                        style={[
                          t.text.caption,
                          {
                            color:
                              entry.uploadStatus === 'failed'
                                ? '#B63E34'
                                : t.colors.text.muted,
                          },
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
                          setPhotos((prev) =>
                            prev.filter((other) => other.local.uri !== entry.local.uri)
                          );
                        }}>
                        <Text style={[t.text.caption, { fontSize: 11, color: '#B63E34' }]}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              {photoMessage ? (
                <Text style={[t.text.caption, { color: t.colors.text.muted }]}>
                  {photoMessage}
                </Text>
              ) : null}
            </View>

            <View style={{ marginVertical: t.spacing.sm }}>
              <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button
                label={savingDraft ? 'Saving...' : 'Save draft'}
                variant="secondary"
                onPress={saveDraftAndReturn}
                disabled={savingDraft}
                style={{ flex: 1 }}
              />

              <Button
                label="Review & submit"
                onPress={async () => {
                  if (!asset) return;

                  setSavingDraft(true);
                  persistDraftSnapshot();

                  await saveAuditDraft({
                    reportAssetId,
                    assetId: asset.id,
                    progressPct: 50,
                    draftPayload: buildDraftPayload(),
                  });

                  setSavingDraft(false);

                  router.push(
                    (`/audit/review/${asset.id}?reportId=${reportId}&reportAssetId=${reportAssetId}` as any) as any
                  );
                }}
                disabled={savingDraft}
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