import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, StatusBadge } from '@/src/components';
import { ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminDashboardScreen() {
  const t = useTheme();

  return (
    <ScreenContainer>
      <TopBar title="Admin Dashboard" userName="Admin" onPressBack={() => router.replace('/' as any)} />
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
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Admin Dashboard</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Manage users, review submissions, and monitor system-level activity.
        </Text>

        <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.lg }}>
          <Card style={{ flex: 1 }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Pending reviews</Text>
            <Text style={[t.text.caption, { marginTop: 4 }]}>7 submissions awaiting approval</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>System sync</Text>
            <View style={{ marginTop: 6, alignItems: 'flex-start' }}>
              <StatusBadge label="Healthy" tone="good" />
            </View>
          </Card>
        </View>

        <Card>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>Admin actions</Text>
          <Text style={[t.text.caption, { marginTop: 4, marginBottom: t.spacing.md }]}>
            Quick admin shortcuts for prototype walkthroughs.
          </Text>
          <View style={{ gap: t.spacing.md }}>
            <Button label="Review submitted reports" onPress={() => router.push('/audit/history' as any)} />
            <Button label="Open auditor workspace" variant="secondary" onPress={() => router.replace('/(tabs)/audits' as any)} />
            <Button label="Sign out" variant="secondary" onPress={() => router.replace('/' as any)} />
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

