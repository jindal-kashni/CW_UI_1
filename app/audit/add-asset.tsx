import React from 'react';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Button, FormField, SectionCard, SegmentedControl } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

type NewAssetCategory = 'Facilities' | 'AnimalEnclosure' | 'Grounds' | 'Electrical' | 'Plumbing' | 'IT' | 'Safety';

export default function AddNewAssetScreen() {
  const t = useTheme();

  const [name, setName] = React.useState('');
  const [tag, setTag] = React.useState('CWS-');
  const [category, setCategory] = React.useState<NewAssetCategory>('Facilities');
  const [notes, setNotes] = React.useState('');

  return (
    <ScreenContainer>
      <TopBar title="Add New Asset" userName="Auditor" onPressBack={() => router.back()} />
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
          title="Create a new asset record"
          subtitle="UI-only demo. In production this would validate tags, capture photos, and sync to the register."
          right={<Button label="Save (demo)" onPress={() => router.back()} />}>
          <View style={{ gap: t.spacing.lg }}>
            <FormField label="Asset name" value={name} onChangeText={setName} placeholder="e.g., Wetlands boardwalk handrail (Section B)" />
            <FormField label="Asset tag" value={tag} onChangeText={setTag} placeholder="e.g., CWS-FAC-031" />

            <View style={{ gap: 8 }}>
              <SegmentedControl
                value={category}
                onChange={setCategory}
                options={[
                  { label: 'Facilities', value: 'Facilities' },
                  { label: 'Enclosure', value: 'AnimalEnclosure' },
                  { label: 'Grounds', value: 'Grounds' },
                  { label: 'Electrical', value: 'Electrical' },
                ]}
              />
              <SegmentedControl
                value={category}
                onChange={setCategory}
                options={[
                  { label: 'Plumbing', value: 'Plumbing' },
                  { label: 'IT', value: 'IT' },
                  { label: 'Safety', value: 'Safety' },
                  { label: 'Facilities', value: 'Facilities' },
                ]}
              />
            </View>

            <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any context for the auditor team…" multiline />
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

