import React from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';
import { assetById } from '@/src/data';
import { ScreenScaffold } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { useDemoState } from '@/src/state/DemoStateProvider';

export default function AuditsScreen() {
  const t = useTheme();
  const { assignments } = useDemoState();
  const [tableView, setTableView] = React.useState<'todo' | 'inprogress'>('inprogress');
  const assignmentRows = assignments.filter((a) => {
    if (tableView === 'todo') return a.status === 'Assigned';
    return a.status === 'InProgress' || a.status === 'DraftSaved';
  });
  const assignmentTableRows = assignmentRows.map((a) => {
    const linkedAsset = assetById[a.assetId];
    return {
      id: a.id,
      assetName: linkedAsset?.name ?? a.title,
      assetCode: linkedAsset?.asset_code ?? 'Unknown ID',
      dateLabel: new Date(a.dueAt).toLocaleDateString(),
      progress: Math.max(0, Math.min(100, a.progressPct)),
      progressLabel: `${Math.max(0, Math.min(100, a.progressPct))}% complete`,
      progressColor: t.colors.brand.forest,
      onPress: () => router.push((`/audit/form/${a.assetId}` as any) as any),
    };
  });
  const tableRows = assignmentTableRows;
  const rowActionLabel = tableView === 'todo' ? 'Begin' : 'Resume';

  return (
    <ScreenScaffold title="Condition Reports">
      <Text style={[t.text.title, { fontSize: 22, lineHeight: 30, marginBottom: 8 }]}>Your Reports</Text>
      <Text style={[t.text.caption, { marginBottom: 16 }]}>
        View and manage To Do and In Progress condition reports.
      </Text>
      <View style={{ marginBottom: t.spacing.lg, flexDirection: 'row', gap: t.spacing.md }}>
        {[
          { label: 'To Do', value: 'todo' as const },
          { label: 'In Progress', value: 'inprogress' as const },
        ].map((opt) => {
          const selected = tableView === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setTableView(opt.value)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  minHeight: 46,
                  borderRadius: t.radius.lg,
                  borderWidth: 1,
                  borderColor: selected ? 'rgba(47,107,75,0.58)' : 'rgba(0,74,38,0.22)',
                  backgroundColor: selected
                    ? '#2F6B4B'
                    : pressed
                      ? 'rgba(0,74,38,0.08)'
                      : t.colors.card.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: selected ? '800' : '700',
                  color: selected ? '#FFFFFF' : '#2F5B45',
                }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: t.spacing.xl }}>
        {tableRows.length === 0 ? (
          <Text style={t.text.caption}>
            {tableView === 'todo'
              ? 'No to-do condition reports right now.'
              : 'No in-progress condition reports right now.'}
          </Text>
        ) : (
          <View
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              overflow: 'hidden',
              backgroundColor: t.colors.card.surface,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
                backgroundColor: t.colors.card.surfaceAlt,
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}>
              <Text style={[t.text.caption, { flex: 2.6, fontWeight: '700' }]}>Asset Name / ID</Text>
              <Text style={[t.text.caption, { flex: 1.1, fontWeight: '700' }]}>
                Due date
              </Text>
              <Text style={[t.text.caption, { flex: 2.3, fontWeight: '700' }]}>Percentage complete</Text>
            </View>

            {tableRows.map((a, idx) => {
              return (
                <Pressable
                  key={a.id}
                  onPress={a.onPress}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: t.spacing.md,
                      paddingVertical: t.spacing.md,
                      borderBottomWidth: idx === tableRows.length - 1 ? 0 : 1,
                      borderBottomColor: t.colors.border.subtle,
                      backgroundColor: pressed ? 'rgba(31,59,44,0.04)' : 'transparent',
                    },
                  ]}>
                  <View style={{ flex: 2.6, paddingRight: t.spacing.md }}>
                    <Text style={[t.text.body, { fontWeight: '700' }]} numberOfLines={1}>
                      {a.assetName}
                    </Text>
                    <Text style={[t.text.caption, { marginTop: 2 }]}>{a.assetCode}</Text>
                  </View>
                  <View style={{ flex: 1.1, paddingRight: t.spacing.md }}>
                    <Text style={t.text.caption}>{a.dateLabel}</Text>
                  </View>
                  <View style={{ flex: 2.3 }}>
                    <View
                      style={{
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: 'rgba(31,59,44,0.12)',
                        overflow: 'hidden',
                      }}>
                      <View
                        style={{
                          width: `${a.progress}%`,
                          height: '100%',
                          borderRadius: 999,
                          backgroundColor: a.progressColor,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        marginTop: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={t.text.caption}>{a.progressLabel}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700' }]}>
                          {rowActionLabel}
                        </Text>
                        <FontAwesome name="chevron-right" size={11} color={t.colors.brand.forest} />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScreenScaffold>
  );
}

