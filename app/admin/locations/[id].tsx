import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { adminDepartmentById, adminLocationById, adminReports, adminRooms } from '@/src/data/admin';
import { assets } from '@/src/data/assets';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminLocationDetailPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const location = id ? adminLocationById[id] : undefined;

  if (!location) {
    return (
      <ScreenContainer>
        <TopBar
          title="Location Detail"
          userName="Admin"
          onPressBack={() => router.replace('/admin/locations' as any)}
          onPressUser={() => router.push('/(admin)/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Location not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  const linkedRooms = adminRooms.filter((room) => room.locationId === location.id);
  const linkedAssets = assets.filter((asset) => asset.location_id === location.id);
  const linkedReports = adminReports.filter((report) => report.locationId === location.id);

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
        title="Location Detail"
        userName="Admin"
        onPressBack={() => router.replace('/admin/locations' as any)}
        onPressUser={() => router.push('/(admin)/profile' as any)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
        }}>
        <SectionHeading title="Location overview" />
        <Text style={[t.text.title, { fontSize: 26, lineHeight: 32 }]}>{location.name}</Text>
        <Text style={[t.text.caption, { marginTop: 4 }]}>
          {location.type} · {location.siteZone} · {adminDepartmentById[location.departmentId]?.name ?? 'Unknown'}
        </Text>

        <SectionDivider />
        <SectionHeading title="Significance and assessment" />
        <Text style={t.text.caption}>Star rating: {location.starRating}/5</Text>
        <Text style={t.text.caption}>Heritage significance: {location.heritageSignificance}</Text>
        <Text style={t.text.caption}>Significance notes: {location.significanceNotes}</Text>

        <SectionDivider />
        <SectionHeading title="Inspection information" />
        <Text style={t.text.caption}>Inspection frequency: {location.inspectionFrequency}</Text>
        <Text style={t.text.caption}>Last inspection: {new Date(location.lastInspection).toLocaleDateString()}</Text>
        <Text style={t.text.caption}>Next inspection: {new Date(location.nextInspection).toLocaleDateString()}</Text>
        <Text style={t.text.caption}>Assessor comments: {location.assessorComments}</Text>

        <SectionDivider />
        <SectionHeading title="Linked rooms" />
        <Text style={t.text.caption}>{linkedRooms.length} room records linked to this location.</Text>

        <SectionDivider />
        <SectionHeading title="Linked assets" />
        <Text style={t.text.caption}>{linkedAssets.length} assets linked to this location.</Text>

        <SectionDivider />
        <SectionHeading title="Linked reports" />
        <Text style={t.text.caption}>{linkedReports.length} reports linked to this location.</Text>

        <SectionDivider />
        <SectionHeading title="Attachments" />
        {location.attachments.map((attachment) => (
          <Text key={attachment} style={t.text.caption}>
            {attachment}
          </Text>
        ))}

        <SectionDivider />
        <SectionHeading title={`${location.type} details`} />
        {location.type === 'Building' ? (
          <Text style={t.text.caption}>Building detail: Services riser and emergency exits tracked monthly.</Text>
        ) : null}
        {location.type === 'OpenHabitat' ? (
          <Text style={t.text.caption}>Open habitat detail: Visitor pathway and weather exposure controls active.</Text>
        ) : null}
        {location.type === 'EnclosedHabitat' ? (
          <Text style={t.text.caption}>Enclosed habitat detail: Climate controls and animal welfare barriers monitored.</Text>
        ) : null}
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

