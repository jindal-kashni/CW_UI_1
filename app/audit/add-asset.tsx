import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FormField, SectionCard, SegmentedControl } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { createAsset } from '@/src/services/assets';

type NewAssetCategory = 'Facilities' | 'AnimalEnclosure' | 'Grounds' | 'Electrical' | 'Plumbing' | 'IT' | 'Safety';

export default function AddNewAssetScreen() {
  const t = useTheme();

  const [name, setName] = React.useState('');
  const [tag, setTag] = React.useState('CWS-');
  const [category, setCategory] = React.useState<NewAssetCategory>('Facilities');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const canSave = name.trim().length > 0 && tag.trim().length > 0;

  const onSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setMessage(null);
    const today = new Date().toISOString().slice(0, 10);
    try {
      await createAsset({
        asset_code: tag.trim(),
        name: name.trim(),
        category,
        sub_category: category,
        description: notes.trim() || 'Created by auditor quick-add.',
        make_model: 'N/A',
        serial_number: `AUD-${Date.now()}`,
        condition: 'Good',
        criticality: 'Medium',
        status: 'Active',
        purchase_cost: 0,
        replacement_cost: 0,
        purchase_date: today,
        warranty_expiry: today,
        assigned_to: null,
        last_serviced_date: today,
        next_service_date: today,
        remaining_life_years: 0,
        utilisation: 'Moderate',
        compatibility_of_use: 'FullyCompatible',
        environmental_impact: 'Low',
        notes: notes.trim() || null,
        dept_id: null,
        location_id: null,
        room_id: null,
      });
      setMessage('Asset created and saved to database.');
      router.back();
    } catch (error: any) {
      setMessage(error?.message ?? 'Could not create asset in database.');
    } finally {
      setSaving(false);
    }
  };

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
          subtitle="Creates a new asset row in the database."
          right={<Button label={saving ? 'Saving...' : 'Save'} onPress={onSave} disabled={!canSave || saving} />}>
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
            {message ? (
              <Text style={[t.text.caption, { color: message.includes('saved') ? '#2F5B45' : '#B63E34' }]}>{message}</Text>
            ) : null}
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

