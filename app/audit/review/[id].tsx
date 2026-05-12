import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Button,
  SectionCard,
  StatusBadge,
} from '@/src/components';

import {
  AppBottomNav,
  ScreenContainer,
  TopBar,
} from '@/src/layout';

import { useTheme } from '@/src/theme';

import {
  fetchReportById,
  type ReportAssetRecord,
} from '@/src/services/reports';

import {
  locationById,
  roomById,
} from '@/src/data';

type AssetTab =
  | 'all'
  | 'todo'
  | 'inProgress'
  | 'completed';

function assetTab(
  asset: ReportAssetRecord
): AssetTab {
  if (asset.status === 'Completed') {
    return 'completed';
  }

  if (
    asset.status === 'InProgress' ||
    asset.status === 'Flagged'
  ) {
    return 'inProgress';
  }

  return 'todo';
}

function statusTone(
  status: ReportAssetRecord['status']
): 'neutral' | 'warn' | 'good' {
  if (status === 'Completed') {
    return 'good';
  }

  if (
    status === 'InProgress' ||
    status === 'Flagged'
  ) {
    return 'warn';
  }

  return 'neutral';
}

function statusLabel(
  status: ReportAssetRecord['status']
) {
  if (status === 'Completed') {
    return 'Completed';
  }

  if (status === 'InProgress') {
    return 'In progress';
  }

  if (status === 'Flagged') {
    return 'Flagged';
  }

  return 'To do';
}

function AssetCard({
  reportId,
  asset,
}: {
  reportId: string;
  asset: ReportAssetRecord;
}) {
  const t = useTheme();

  const loc = asset.locationId
    ? locationById[asset.locationId]
    : undefined;

  const room = asset.roomId
    ? roomById[asset.roomId]
    : undefined;

  const locationLabel = loc
    ? `${loc.name} · ${room?.name ?? 'Room not set'}`
    : 'Location unknown';

  const openAsset = () => {
    router.push(
      (`/audit/form/${asset.assetId}?reportId=${reportId}&reportAssetId=${asset.id}` as any) as any
    );
  };

  return (
    <Pressable
      onPress={openAsset}
      style={{
        borderWidth: 1,
        borderColor: 'rgba(30,31,28,0.10)',
        borderRadius: t.radius.lg,
        padding: t.spacing.lg,
        backgroundColor: '#FFFFFF',
        gap: t.spacing.md,
      }}>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: t.spacing.md,
        }}>

        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={[
              t.text.title,
              {
                fontSize: 18,
                lineHeight: 24,
              },
            ]}>

            {asset.assetName}
          </Text>

          <Text style={t.text.caption}>
            {asset.assetCode}
          </Text>

          <Text style={t.text.caption}>
            {locationLabel}
          </Text>
        </View>

        <StatusBadge
          label={statusLabel(asset.status)}
          tone={statusTone(asset.status)}
        />
      </View>

      {asset.notes ? (
        <Text style={t.text.bodyMuted}>
          {asset.notes}
        </Text>
      ) : null}

      <Button
        label={
          asset.status === 'Completed'
            ? 'View audit'
            : asset.status === 'InProgress'
              ? 'Resume audit'
              : 'Start audit'
        }
        onPress={openAsset}
      />
    </Pressable>
  );
}

export default function AuditReportWorkspaceScreen() {
  const t = useTheme();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [loading, setLoading] =
    React.useState(true);

  const [error, setError] =
    React.useState<string | null>(null);

  const [activeTab, setActiveTab] =
    React.useState<AssetTab>('all');

  const [report, setReport] =
    React.useState<any>(null);

  React.useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);

      const result = await fetchReportById(id);

      if (!result) {
        setError('Failed to load report.');
        setLoading(false);
        return;
      }

      setReport(result);
      setLoading(false);
    })();
  }, [id]);

  const assets: ReportAssetRecord[] =
    report?.assets ?? [];

  const counts = React.useMemo(
    () => ({
      all: assets.length,
      todo: assets.filter(
        (asset) =>
          assetTab(asset) === 'todo'
      ).length,
      inProgress: assets.filter(
        (asset) =>
          assetTab(asset) === 'inProgress'
      ).length,
      completed: assets.filter(
        (asset) =>
          assetTab(asset) === 'completed'
      ).length,
    }),
    [assets]
  );

  const visibleAssets =
    activeTab === 'all'
      ? assets
      : assets.filter(
          (asset) =>
            assetTab(asset) === activeTab
        );

  const completed =
    counts.completed;

  const total =
    counts.all || 1;

  const progress =
    Math.round(
      (completed / total) * 100
    );

  return (
    <ScreenContainer>
      <TopBar
        title="Report Workspace"
        userName="Auditor"
        onPressBack={() =>
          router.push('/audits' as any)
        }
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

        {loading ? (
          <SectionCard title="Loading report">
            <Text style={t.text.bodyMuted}>
              Loading report workspace...
            </Text>
          </SectionCard>
        ) : error ? (
          <SectionCard title="Could not load report">
            <Text
              style={[
                t.text.bodyMuted,
                {
                  color: '#B63E34',
                },
              ]}>

              {error}
            </Text>
          </SectionCard>
        ) : (
          <>
            <SectionCard
              title={
                report?.title ??
                'Assigned Report'
              }
              subtitle={
                report?.summary ??
                'Complete all assigned asset audits before submitting the report.'
              }>

              <View
                style={{
                  gap: t.spacing.lg,
                }}>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                  }}>

                  <View style={{ gap: 4 }}>
                    <Text
                      style={
                        t.text.caption
                      }>

                      Assets completed
                    </Text>

                    <Text
                      style={[
                        t.text.title,
                        {
                          fontSize: 24,
                          lineHeight: 30,
                        },
                      ]}>

                      {completed}/{counts.all}
                    </Text>
                  </View>

                  <StatusBadge
                    label={`${progress}%`}
                    tone={
                      progress === 100
                        ? 'good'
                        : progress > 0
                          ? 'warn'
                          : 'neutral'
                    }
                  />
                </View>

                <View
                  style={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor:
                      'rgba(30,31,28,0.10)',
                    overflow: 'hidden',
                  }}>

                  <View
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor:
                        '#6B7F52',
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    gap: t.spacing.md,
                    flexWrap: 'wrap',
                  }}>

                  <Text
                    style={
                      t.text.caption
                    }>

                    To do: {counts.todo}
                  </Text>

                  <Text
                    style={
                      t.text.caption
                    }>

                    In progress:{' '}
                    {
                      counts.inProgress
                    }
                  </Text>

                  <Text
                    style={
                      t.text.caption
                    }>

                    Completed:{' '}
                    {
                      counts.completed
                    }
                  </Text>
                </View>
              </View>
            </SectionCard>

            <SectionCard
              title="Assigned assets"
              subtitle="Select an asset to begin or continue the audit form.">

              <View
                style={{
                  gap: t.spacing.lg,
                }}>

                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: t.spacing.sm,
                  }}>

                  {(
                    [
                      [
                        'all',
                        `All (${counts.all})`,
                      ],
                      [
                        'todo',
                        `To do (${counts.todo})`,
                      ],
                      [
                        'inProgress',
                        `In progress (${counts.inProgress})`,
                      ],
                      [
                        'completed',
                        `Completed (${counts.completed})`,
                      ],
                    ] as const
                  ).map(([tab, label]) => (
                    <Pressable
                      key={tab}
                      onPress={() =>
                        setActiveTab(tab)
                      }
                      style={{
                        paddingHorizontal:
                          t.spacing.md,
                        paddingVertical:
                          t.spacing.sm,
                        borderRadius:
                          999,
                        backgroundColor:
                          activeTab === tab
                            ? '#6B7F52'
                            : 'rgba(30,31,28,0.08)',
                      }}>

                      <Text
                        style={{
                          color:
                            activeTab === tab
                              ? '#FFFFFF'
                              : '#1E1F1C',
                          fontWeight: '600',
                        }}>

                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View
                  style={{
                    gap: t.spacing.md,
                  }}>

                  {visibleAssets.length ===
                  0 ? (
                    <SectionCard title="No assets">
                      <Text
                        style={
                          t.text.bodyMuted
                        }>

                        No assets in this
                        section.
                      </Text>
                    </SectionCard>
                  ) : (
                    visibleAssets.map(
                      (asset) => (
                        <AssetCard
                          key={
                            asset.id
                          }
                          reportId={id}
                          asset={asset}
                        />
                      )
                    )
                  )}
                </View>
              </View>
            </SectionCard>

            <SectionCard
              title="Report submission"
              subtitle="Once all assigned asset audits are completed the report can be finalised.">

              <View
                style={{
                  gap: t.spacing.md,
                }}>

                <Text
                  style={
                    t.text.bodyMuted
                  }>

                  Ensure all assets
                  have been reviewed,
                  findings entered and
                  photos uploaded
                  before final
                  submission.
                </Text>

                <Button
                  label={
                    progress === 100
                      ? 'Finalise report'
                      : 'Continue audits'
                  }
                  disabled={
                    progress !== 100
                  }
                  onPress={() => {
                    router.push(
                      '/audits' as any
                    );
                  }}
                />
              </View>
            </SectionCard>
          </>
        )}
      </ScrollView>

      <AppBottomNav />
    </ScreenContainer>
  );
}