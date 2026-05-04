import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, StatusBadge } from '@/src/components';
import { assetAuditHistory } from '@/src/data';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import type { Asset, AssetCondition } from '@/src/types/models';
import { deleteAsset, fetchAssetById } from '@/src/services/assets';
import {
  fetchDepartments,
  fetchLocations,
  fetchRooms,
  type DepartmentRecord,
  type LocationRecord,
  type RoomRecord,
} from '@/src/services/referenceData';
import {
  fetchCapexForecastForAsset,
  fetchComplianceChecksForAsset,
  type CapexForecastRecord,
  type ComplianceCheckRecord,
} from '@/src/services/adminInsights';

export default function AdminAssetDetailPage() {
  const t = useTheme();
  const { assignments } = useDemoState();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [location, setLocation] = React.useState<LocationRecord | null>(null);
  const [room, setRoom] = React.useState<RoomRecord | null>(null);
  const [department, setDepartment] = React.useState<DepartmentRecord | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [assetPendingDelete, setAssetPendingDelete] = React.useState(false);
  const [deleteStep, setDeleteStep] = React.useState<'confirm' | 'type-name'>('confirm');
  const [deleteNameInput, setDeleteNameInput] = React.useState('');
  const [selectedReport, setSelectedReport] = React.useState<(typeof assetAuditHistory)[number] | null>(null);

  const [complianceChecks, setComplianceChecks] = React.useState<ComplianceCheckRecord[]>([]);
  const [capexForecast, setCapexForecast] = React.useState<CapexForecastRecord[]>([]);
  const [loadingInsights, setLoadingInsights] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    const fetchAsset = async () => {
      setLoading(true);

      try {
        const data = await fetchAssetById(id);

        if (!data) {
          setLoading(false);
          return;
        }

        setAsset(data);

        const [departments, locations, rooms] = await Promise.all([
          fetchDepartments(),
          fetchLocations(),
          fetchRooms(),
        ]);

        setDepartment(departments.find((item) => item.id === data.dept_id) ?? null);
        setLocation(locations.find((item) => item.id === data.location_id) ?? null);
        setRoom(rooms.find((item) => item.id === data.room_id) ?? null);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  React.useEffect(() => {
    if (!id) return;

    const fetchInsights = async () => {
      setLoadingInsights(true);

      try {
        const [complianceRows, capexRows] = await Promise.all([
          fetchComplianceChecksForAsset(id),
          fetchCapexForecastForAsset(id),
        ]);

        setComplianceChecks(complianceRows);
        setCapexForecast(capexRows);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [id]);

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[t.text.title, { fontSize: 22, lineHeight: 28, marginBottom: t.spacing.md }]}>
      {title}
    </Text>
  );

  const SectionDivider = () => (
    <View style={{ marginVertical: t.spacing.xl }}>
      <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <TopBar
          title="Asset Detail"
          userName="Admin"
          onPressBack={() => router.replace('/admin/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Loading asset...</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Asset Detail"
          userName="Admin"
          onPressBack={() => router.replace('/admin/assets' as any)}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const currentAsset = asset;

  const history = assetAuditHistory
    .filter((h) => h.asset_id === currentAsset.id)
    .sort((a, b) => new Date(a.audit_date).getTime() - new Date(b.audit_date).getTime());

  const statusLabel = currentAsset.status;

  const conditionRank: Record<AssetCondition, number> = {
    Excellent: 5,
    Good: 4,
    Fair: 3,
    Poor: 2,
    'Needs urgent attention': 1,
  };

  const scoreToCondition = (score: number): AssetCondition => {
    if (score <= 1) return 'Needs urgent attention';
    if (score <= 2) return 'Poor';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Excellent';
  };

  const inferConditionFromFinding = (finding: string, fallback: AssetCondition): AssetCondition => {
    const text = finding.toLowerCase();

    if (
      text.includes('critical') ||
      text.includes('urgent') ||
      text.includes('cavitation') ||
      text.includes('dilapidated')
    ) {
      return 'Needs urgent attention';
    }

    if (text.includes('poor') || text.includes('failed') || text.includes('corrosion') || text.includes('drop')) {
      return 'Poor';
    }

    if (text.includes('fair') || text.includes('wear') || text.includes('fray') || text.includes('minor')) {
      return 'Fair';
    }

    if (text.includes('excellent')) return 'Excellent';

    if (text.includes('good') || text.includes('stable') || text.includes('nominal') || text.includes('no issues')) {
      return 'Good';
    }

    return fallback;
  };

  const purchaseYear = currentAsset.purchase_date
    ? new Date(currentAsset.purchase_date).getFullYear()
    : new Date().getFullYear();

  const expiryYear = purchaseYear + Math.max(1, currentAsset.remaining_life_years || 1);

  const reportRows = history.map((h) => {
    const year = new Date(h.audit_date).getFullYear();
    const elapsedRatio = Math.min(1, Math.max(0, (year - purchaseYear) / Math.max(1, expiryYear - purchaseYear)));
    const expectedScoreRaw = 5 - elapsedRatio * 5;
    const observedCondition = inferConditionFromFinding(h.findings, currentAsset.condition);
    const observedScore = conditionRank[observedCondition];
    const expectedCondition = scoreToCondition(expectedScoreRaw);
    const expectedScore = conditionRank[expectedCondition];

    return {
      ...h,
      observedCondition,
      observedScore,
      expectedCondition,
      expectedScore,
      delta: observedScore - expectedScore,
    };
  });

  const toneForCondition = (value: AssetCondition) => {
    if (value === 'Excellent' || value === 'Good') return { bg: 'rgba(47,107,75,0.12)', text: '#1F563D' };
    if (value === 'Fair') return { bg: 'rgba(182,141,61,0.16)', text: '#6A5421' };
    return { bg: 'rgba(179,79,71,0.14)', text: '#7A2E29' };
  };

  const activeAssignment = assignments.find(
    (assignment) =>
      assignment.assetId === currentAsset.id &&
      ['Assigned', 'InProgress', 'DraftSaved'].includes(assignment.status)
  );

  const handleDeleteAsset = async () => {
    if (deleteNameInput !== currentAsset.name) return;

    try {
      await deleteAsset(currentAsset.id);
    } catch (error) {
      console.log(error);
      return;
    }

    setAssetPendingDelete(false);
    setDeleteStep('confirm');
    setDeleteNameInput('');
    router.replace('/admin/assets' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Asset Detail"
        userName="Admin"
        onPressBack={() => router.replace('/admin/assets' as any)}
        onPressUser={() => router.push('/admin/profile' as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
        }}
      >
        <SectionHeading title="Overview" />

        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 26, lineHeight: 32 }]}>{currentAsset.name}</Text>
              <Text style={[t.text.caption, { marginTop: 4 }]}>
                {currentAsset.asset_code} · {currentAsset.category} · {currentAsset.sub_category || 'No sub category'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: t.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Pressable
                  onPress={() => router.push((`/admin/assets/edit/${currentAsset.id}` as any) as any)}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name="pencil" size={22} color={t.colors.brand.forest} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setAssetPendingDelete(true);
                    setDeleteStep('confirm');
                    setDeleteNameInput('');
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <FontAwesome name="trash" size={22} color="#9C3D37" />
                </Pressable>

                <StatusBadge label={statusLabel} tone={statusLabel === 'Active' ? 'good' : 'warn'} />
              </View>
            </View>
          </View>

          <Text style={t.text.bodyMuted}>{currentAsset.description || 'No description provided.'}</Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Location and ownership" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Location:</Text> {location?.name ?? 'Unknown'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Room:</Text> {room?.name ?? 'Room not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Department:</Text> {department?.name ?? 'Unknown'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Assigned to:</Text> {currentAsset.assigned_to || 'Not assigned'}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Condition and criticality" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Condition:</Text> {currentAsset.condition}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Criticality:</Text> {currentAsset.criticality}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Remaining life:</Text> {currentAsset.remaining_life_years || 0} years
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Lifecycle and cost" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Purchase date:</Text>{' '}
            {currentAsset.purchase_date ? formatDateDDMMYYYY(currentAsset.purchase_date) : 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Purchase cost:</Text> ${currentAsset.purchase_cost.toLocaleString()}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Replacement cost:</Text> ${currentAsset.replacement_cost.toLocaleString()}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Warranty expiry:</Text>{' '}
            {currentAsset.warranty_expiry ? formatDateDDMMYYYY(currentAsset.warranty_expiry) : 'Not set'}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Service history" />

        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Last serviced:</Text>{' '}
            {currentAsset.last_serviced_date ? formatDateDDMMYYYY(currentAsset.last_serviced_date) : 'Not set'}
          </Text>
          <Text style={t.text.caption}>
            <Text style={{ fontWeight: '700' }}>Next service:</Text>{' '}
            {currentAsset.next_service_date ? formatDateDDMMYYYY(currentAsset.next_service_date) : 'Not set'}
          </Text>
        </View>

        <SectionDivider />

        <SectionHeading title="Notes" />
        <Text style={t.text.caption}>{currentAsset.notes || 'No notes.'}</Text>

        <SectionDivider />

        <SectionHeading title="Condition reports" />

        <Text style={[t.text.caption, { marginTop: -6, marginBottom: t.spacing.md }]}>
          Historical condition versus expected depreciation from purchase year to projected end-of-life.
        </Text>

        {reportRows.length === 0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.md,
            }}
          >
            <Text style={t.text.caption}>No condition reports are associated with this asset yet.</Text>
          </View>
        ) : (
          <>
            <View
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.card.surface,
                padding: t.spacing.md,
              }}
            >
              <Text style={[t.text.caption, { fontWeight: '700', marginBottom: t.spacing.sm }]}>
                Condition trend graph
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.sm }}>
                {reportRows.map((row) => {
                  const observedHeight = Math.max(8, row.observedScore * 18);
                  const expectedHeight = Math.max(8, row.expectedScore * 18);

                  return (
                    <View key={row.id} style={{ flex: 1, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120 }}>
                        <View
                          style={{
                            width: 12,
                            height: observedHeight,
                            borderRadius: 6,
                            backgroundColor: '#2F5B45',
                          }}
                        />
                        <View
                          style={{
                            width: 12,
                            height: expectedHeight,
                            borderRadius: 6,
                            backgroundColor: '#9AA49A',
                          }}
                        />
                      </View>

                      <Text style={[t.text.caption, { marginTop: 6, fontSize: 11 }]}>
                        {formatDateDDMMYYYY(row.audit_date)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.sm }}>
                <Text style={t.text.caption}>■ Observed</Text>
                <Text style={t.text.caption}>■ Expected</Text>
              </View>
            </View>

            <View style={{ height: t.spacing.lg }} />

            <View
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.lg,
                overflow: 'hidden',
                backgroundColor: t.colors.card.surface,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.sm,
                  backgroundColor: t.colors.card.surfaceAlt,
                  borderBottomWidth: 1,
                  borderBottomColor: t.colors.border.subtle,
                }}
              >
                <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Date</Text>
                <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Reported by</Text>
                <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Observed</Text>
                <Text style={[t.text.caption, { flex: 1, fontWeight: '700' }]}>Expected</Text>
                <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700' }]}>Report</Text>
              </View>

              {reportRows.map((row, idx) => {
                const observedTone = toneForCondition(row.observedCondition);
                const expectedTone = toneForCondition(row.expectedCondition);

                return (
                  <View
                    key={`${row.id}-table`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.sm,
                      borderBottomWidth: idx === reportRows.length - 1 ? 0 : 1,
                      borderBottomColor: t.colors.border.subtle,
                    }}
                  >
                    <Text style={[t.text.caption, { flex: 1 }]}>{formatDateDDMMYYYY(row.audit_date)}</Text>
                    <Text style={[t.text.caption, { flex: 1 }]}>{row.inspector_name}</Text>

                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                      <View
                        style={{
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          backgroundColor: observedTone.bg,
                        }}
                      >
                        <Text style={{ color: observedTone.text, fontWeight: '700', fontSize: 12 }}>
                          {row.observedCondition}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                      <View
                        style={{
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          backgroundColor: expectedTone.bg,
                        }}
                      >
                        <Text style={{ color: expectedTone.text, fontWeight: '700', fontSize: 12 }}>
                          {row.expectedCondition}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1.1, alignItems: 'flex-start' }}>
                      <Pressable
                        onPress={() => setSelectedReport(row)}
                        style={({ pressed }) => [
                          {
                            minHeight: 30,
                            borderRadius: 999,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(0,74,38,0.22)',
                            backgroundColor: pressed ? 'rgba(0,74,38,0.08)' : '#FBF7F0',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2F5B45' }}>View report</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <SectionDivider />

        <View style={{ gap: t.spacing.md }}>
          <Button
            label={
              activeAssignment
                ? `Condition report assigned to ${activeAssignment.assignedTo.name}`
                : 'Assign condition report'
            }
            variant="secondary"
            onPress={() => router.push(`/admin/assets/assign-report/${currentAsset.id}` as any)}
            disabled={Boolean(activeAssignment)}
          />
        </View>

        <SectionDivider />

        <SectionHeading title="Compliance checks" />

        {loadingInsights ? (
          <View style={{ minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading compliance checks...</Text>
          </View>
        ) : complianceChecks.length === 0 ? (
          <Text style={t.text.caption}>No compliance checks logged for this asset yet.</Text>
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            {complianceChecks.map((check) => (
              <View
                key={check.id}
                style={{
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.md,
                  backgroundColor: t.colors.card.surface,
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.sm,
                  gap: 4,
                }}
              >
                <Text style={[t.text.body, { fontWeight: '700' }]}>{check.checkType || 'Compliance check'}</Text>
                <Text style={t.text.caption}>
                  Status: {check.status || 'Unknown'} · Checked by: {check.checkedBy || 'Unknown'}
                </Text>
                <Text style={t.text.caption}>
                  Check date: {check.checkDate ? formatDateDDMMYYYY(check.checkDate) : 'Not set'} · Next review:{' '}
                  {check.nextReviewDate ? formatDateDDMMYYYY(check.nextReviewDate) : 'Not set'}
                </Text>
                {check.notes ? <Text style={t.text.caption}>{check.notes}</Text> : null}
              </View>
            ))}
          </View>
        )}

        <SectionDivider />

        <SectionHeading title="CapEx forecast" />

        {loadingInsights ? (
          <View style={{ minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading capital forecast...</Text>
          </View>
        ) : capexForecast.length === 0 ? (
          <Text style={t.text.caption}>No capital forecast entries linked to this asset yet.</Text>
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            {capexForecast.map((entry) => (
              <View
                key={entry.id}
                style={{
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  borderRadius: t.radius.md,
                  backgroundColor: t.colors.card.surface,
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.sm,
                  gap: 4,
                }}
              >
                <Text style={[t.text.body, { fontWeight: '700' }]}>{entry.item || 'CapEx item'}</Text>
                <Text style={t.text.caption}>
                  Priority: {entry.priority || 'Unspecified'} · Timeframe: {entry.timeframe || 'Unspecified'}
                </Text>
                <Text style={t.text.caption}>
                  Estimated cost:{' '}
                  {typeof entry.estimatedCost === 'number' ? `$${entry.estimatedCost.toLocaleString()}` : 'Not set'}
                </Text>
                <Text style={t.text.caption}>
                  Identified: {entry.identifiedDate ? formatDateDDMMYYYY(entry.identifiedDate) : 'Not set'} · Target:{' '}
                  {entry.targetCompletion ? formatDateDDMMYYYY(entry.targetCompletion) : 'Not set'}
                </Text>
                {entry.recommendedAction ? <Text style={t.text.caption}>{entry.recommendedAction}</Text> : null}
                {entry.notes ? <Text style={t.text.caption}>{entry.notes}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AdminAppBottomNav />

      <Modal visible={Boolean(selectedReport)} transparent animationType="fade" onRequestClose={() => setSelectedReport(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setSelectedReport(null)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 680,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}
          >
            <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Condition report</Text>
            <Text style={t.text.caption}>
              {selectedReport ? `${formatDateDDMMYYYY(selectedReport.audit_date)} · ${selectedReport.inspector_name}` : ''}
            </Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: t.colors.border.subtle,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card.surfaceAlt,
                padding: t.spacing.md,
                gap: t.spacing.sm,
              }}
            >
              <Text style={[t.text.caption, { fontWeight: '700' }]}>Findings</Text>
              <Text style={t.text.caption}>{selectedReport?.findings}</Text>
              <Text style={[t.text.caption, { fontWeight: '700', marginTop: 6 }]}>Notes</Text>
              <Text style={t.text.caption}>{selectedReport?.notes}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button label="Close" variant="secondary" onPress={() => setSelectedReport(null)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={assetPendingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setAssetPendingDelete(false);
          setDeleteStep('confirm');
          setDeleteNameInput('');
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => {
              setAssetPendingDelete(false);
              setDeleteStep('confirm');
              setDeleteNameInput('');
            }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 620,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}
          >
            {deleteStep === 'confirm' ? (
              <>
                <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Delete asset?</Text>
                <Text style={t.text.caption}>
                  Are you sure you want to delete{' '}
                  <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{currentAsset.name}</Text>? This action
                  cannot be undone.
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
                  <Button label="Cancel" variant="secondary" onPress={() => setAssetPendingDelete(false)} />
                  <Button label="Yes, continue" onPress={() => setDeleteStep('type-name')} />
                </View>
              </>
            ) : (
              <>
                <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Confirm deletion</Text>
                <Text style={t.text.caption}>
                  Type <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{currentAsset.name}</Text> to confirm.
                </Text>

                <TextInput
                  value={deleteNameInput}
                  onChangeText={setDeleteNameInput}
                  placeholder="Enter asset name exactly"
                  placeholderTextColor={t.colors.text.muted}
                  autoCapitalize="none"
                  style={{
                    minHeight: 48,
                    borderWidth: 1,
                    borderColor: t.colors.border.subtle,
                    borderRadius: t.radius.lg,
                    backgroundColor: t.colors.card.surfaceAlt,
                    paddingHorizontal: t.spacing.md,
                    color: t.colors.text.primary,
                    fontSize: 16,
                  }}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => {
                      setAssetPendingDelete(false);
                      setDeleteStep('confirm');
                      setDeleteNameInput('');
                    }}
                  />
                  <Button label="Delete asset" onPress={handleDeleteAsset} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}