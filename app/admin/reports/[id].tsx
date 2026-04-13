import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, StatusBadge } from '@/src/components';
import {
  adminDepartmentById,
  adminLocationById,
  adminReportById,
  adminReports,
  adminRoomById,
  adminUserById,
} from '@/src/data/admin';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminSubmittedReportDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const report = id ? adminReportById[id] : undefined;
  const ordered = [...adminReports]
    .filter((item) => item.status === 'Completed')
    .sort((a, b) => new Date(b.submittedAt ?? b.dueDate).getTime() - new Date(a.submittedAt ?? a.dueDate).getTime());
  const idx = ordered.findIndex((r) => r.id === report?.id);
  const previous = idx >= 0 ? ordered[idx + 1] : undefined;
  const next = idx > 0 ? ordered[idx - 1] : undefined;

  if (!report) {
    return (
      <ScreenContainer>
        <TopBar
          title="Submitted Report"
          userName="Admin"
          onPressBack={() => router.back()}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Report not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const location = adminLocationById[report.locationId];
  const room = adminRoomById[report.roomId];
  const user = adminUserById[report.assignedUserId];
  const department = adminDepartmentById[report.departmentId];

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
      <TopBar
        title="Submitted Report"
        userName="Admin"
        onPressBack={() => router.back()}
        onPressUser={() => router.push('/admin/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
        }}>
        <SectionHeading title="Report summary" />
        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>{report.title}</Text>
              <Text style={[t.text.caption, { marginTop: 4 }]}>
                {report.assetCode} · {department?.name ?? 'Department unknown'}
              </Text>
            </View>
            <StatusBadge label={report.status} tone="good" />
          </View>
          <Text style={t.text.caption}>
            Submitted by {user?.name ?? 'Unknown user'} on{' '}
            {new Date(report.submittedAt ?? report.dueDate).toLocaleDateString()}
          </Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Location context" />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Location: {location?.name ?? 'Unknown'}</Text>
          <Text style={t.text.caption}>Room: {room?.roomName ?? 'Unknown room'}</Text>
          <Text style={t.text.caption}>Site zone: {location?.siteZone ?? 'Unknown zone'}</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Condition report readout" />
        <View style={{ gap: 6 }}>
          <Text style={t.text.caption}>Findings: {report.findings}</Text>
          <Text style={t.text.caption}>Comments: {report.comments}</Text>
          <Text style={t.text.caption}>Progress at submission: {report.progressPct}%</Text>
        </View>

        <SectionDivider />
        <SectionHeading title="Photo evidence" />
        <Text style={t.text.caption}>
          {report.photoCount > 0 ? `${report.photoCount} photos attached to this submission.` : 'No photos attached.'}
        </Text>
        {report.photoCount > 0 ? (
          <View style={{ marginTop: t.spacing.sm, flexDirection: 'row', gap: t.spacing.sm }}>
            {Array.from({ length: Math.min(3, report.photoCount) }).map((_, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  minHeight: 92,
                  borderRadius: t.radius.md,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                  backgroundColor: t.colors.card.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={t.text.caption}>Photo {index + 1}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <SectionDivider />
        <SectionHeading title="Historical navigation" />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Pressable
            disabled={!previous}
            onPress={() => previous && router.replace((`/admin/reports/${previous.id}` as any) as any)}
            style={({ pressed }) => [
              t.button.secondary,
              { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: previous ? (pressed ? 0.92 : 1) : 0.45 },
            ]}>
            <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Previous report</Text>
          </Pressable>
          <Pressable
            disabled={!next}
            onPress={() => next && router.replace((`/admin/reports/${next.id}` as any) as any)}
            style={({ pressed }) => [
              t.button.secondary,
              { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: next ? (pressed ? 0.92 : 1) : 0.45 },
            ]}>
            <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Next report</Text>
          </Pressable>
        </View>
        <View style={{ height: t.spacing.md }} />
        <Button label="Back to reports" variant="secondary" onPress={() => router.replace('/(admin-tabs)/reports' as any)} />
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

