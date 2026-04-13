import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FilterChip, SearchInput, SectionCard } from '@/src/components';
import { locations } from '@/src/data';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function SelectLocationScreen() {
  const t = useTheme();
  const [query, setQuery] = React.useState('');
  const [precinct, setPrecinct] = React.useState<'All' | string>('All');

  const precincts = ['All', ...Array.from(new Set(locations.map((l) => l.precinct)))];

  const filtered = locations
    .filter((l) => (precinct === 'All' ? true : l.precinct === precinct))
    .filter((l) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return `${l.precinct} ${l.zone}`.toLowerCase().includes(q);
    });

  return (
    <ScreenContainer>
      <TopBar title="Select Location" userName="Auditor" onPressBack={() => router.back()} />
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
          title="Choose a precinct and zone"
          subtitle="This sets the scope for the condition report. In production, this would come from an assignment."
          right={<Button label="Continue" onPress={() => router.push('/audit/assets')} />}>
          <View style={{ gap: t.spacing.md }}>
            <SearchInput value={query} onChangeText={setQuery} placeholder="Search locations (e.g., Wetlands, Reptile…)" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.sm }}>
              {precincts.map((p) => (
                <FilterChip key={p} label={p} selected={precinct === p} onPress={() => setPrecinct(p)} />
              ))}
            </ScrollView>
          </View>
        </SectionCard>

        <SectionCard title="Available locations" subtitle={`${filtered.length} available in demo data`}>
          <View style={{ gap: t.spacing.md }}>
            {filtered.map((l) => (
              <View
                key={l.id}
                style={{
                  paddingVertical: t.spacing.sm,
                  paddingHorizontal: t.spacing.md,
                  borderRadius: t.radius.md,
                  backgroundColor: t.colors.card.surfaceAlt,
                  borderWidth: 1,
                  borderColor: t.colors.border.subtle,
                }}>
                <Text style={{ fontWeight: '700', color: t.colors.text.primary }}>{l.zone}</Text>
                <Text style={[t.text.caption, { marginTop: 2 }]}>{l.precinct}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

