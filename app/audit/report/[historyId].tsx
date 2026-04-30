import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SectionCard } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useDemoState } from '@/src/state/DemoStateProvider';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { useTheme } from '@/src/theme';
import { formatDateDDMMYYYY } from '@/src/utils/date';
import { fetchAuditorReportAccessStates } from '@/src/services/systemData';

export default function SubmittedReportScreen() {
  const t = useTheme();
  const { user } = useWorkspace();
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const { assignments } = useDemoState();
  const assignment = historyId ? assignments.find((item) => item.id === historyId) : undefined;
  const [approvedIds, setApprovedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    (async () => {
      const states = await fetchAuditorReportAccessStates(user.id);
      if (!mounted) return;
      setApprovedIds(states.approvedAssignmentIds);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const hasGrantedAccess = Boolean(historyId && approvedIds.includes(historyId));

  if (!assignment) {
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
        {hasGrantedAccess ? (
          <SectionCard
            title="Approved report access"
            subtitle="This completed report was made available by admin approval.">
            <View style={{ gap: t.spacing.sm }}>
              <Text style={t.text.caption}>
                <Text style={{ fontWeight: '700' }}>Title:</Text> {assignment.title}
              </Text>
              <Text style={t.text.caption}>
                <Text style={{ fontWeight: '700' }}>Due date:</Text> {formatDateDDMMYYYY(assignment.dueAt)}
              </Text>
              <Text style={t.text.caption}>
                <Text style={{ fontWeight: '700' }}>Scope:</Text> {assignment.locationScope.precincts.join(', ') || 'N/A'}
              </Text>
              <Text style={t.text.caption}>
                <Text style={{ fontWeight: '700' }}>Summary:</Text> {assignment.summary || 'No summary provided.'}
              </Text>
              <Text style={t.text.caption}>
                Historical condition comparisons remain hidden to reduce bias.
              </Text>
            </View>
          </SectionCard>
        ) : (
          <SectionCard
            title="Condition report access restricted"
            subtitle="Auditor accounts cannot open completed reports without admin approval.">
            <View style={{ gap: t.spacing.sm }}>
              <Text style={t.text.caption}>
                Request access from the Completed reports section in Your Reports.
              </Text>
            </View>
          </SectionCard>
        )}
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

