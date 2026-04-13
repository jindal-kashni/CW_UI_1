import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FormField, SegmentedControl } from '@/src/components';
import { assetById } from '@/src/data';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminEditAssetPage() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = id ? assetById[id] : undefined;

  const [name, setName] = React.useState(asset?.name ?? '');
  const [notes, setNotes] = React.useState(asset?.notes ?? '');
  const [status, setStatus] = React.useState<'Active' | 'Under repair' | 'Decommissioned'>(
    asset?.status === 'Under repair' ? 'Under repair' : asset?.status === 'Decommissioned' ? 'Decommissioned' : 'Active'
  );
  const [condition, setCondition] = React.useState<'Good' | 'Fair' | 'Poor' | 'Dilapidated'>(
    asset?.condition === 'Fair' || asset?.condition === 'Poor' || asset?.condition === 'Dilapidated'
      ? asset.condition
      : 'Good'
  );
  const [criticality, setCriticality] = React.useState<'Low' | 'Medium' | 'High' | 'Critical'>(
    asset?.criticality ?? 'Medium'
  );

  if (!asset) {
    return (
      <ScreenContainer>
        <TopBar
          title="Edit Asset"
          userName="Admin"
          onPressBack={() => router.back()}
          onPressUser={() => router.push('/admin/profile' as any)}
        />
        <View style={{ flex: 1, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg }}>
          <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>Asset not found</Text>
        </View>
        <AdminAppBottomNav />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TopBar
        title="Edit Asset"
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
          gap: t.spacing.xl,
        }}>
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Edit Asset</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Update this asset record and save changes to system structure.
        </Text>
        <View style={{ marginTop: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        <FormField label="Asset name" value={name} onChangeText={setName} />
        <FormField label="Asset code" value={asset.asset_code} onChangeText={() => {}} editable={false} />
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Condition</Text>
        <SegmentedControl
          value={condition}
          onChange={setCondition}
          options={[
            { label: 'Good', value: 'Good' },
            { label: 'Fair', value: 'Fair' },
            { label: 'Poor', value: 'Poor' },
            { label: 'Dilapidated', value: 'Dilapidated' },
          ]}
        />
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Criticality</Text>
        <SegmentedControl
          value={criticality}
          onChange={setCriticality}
          options={[
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' },
            { label: 'Critical', value: 'Critical' },
          ]}
        />
        <Text style={[t.text.caption, { fontWeight: '700' }]}>Status</Text>
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Under repair', value: 'Under repair' },
            { label: 'Decommissioned', value: 'Decommissioned' },
          ]}
        />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Button label="Save changes" onPress={() => router.replace((`/admin/assets/${asset.id}` as any) as any)} style={{ flex: 1 }} />
          <Button label="Archive asset" variant="secondary" onPress={() => {}} style={{ flex: 1 }} />
        </View>
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

