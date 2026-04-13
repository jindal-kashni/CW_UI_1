import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FormField, SegmentedControl } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

export default function AdminCreateAssetPage() {
  const t = useTheme();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [subCategory, setSubCategory] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [room, setRoom] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [makeModel, setMakeModel] = React.useState('');
  const [serial, setSerial] = React.useState('');
  const [condition, setCondition] = React.useState<'Good' | 'Fair' | 'Poor' | 'Dilapidated'>('Good');
  const [criticality, setCriticality] = React.useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [status, setStatus] = React.useState<'Active' | 'Under repair' | 'Decommissioned'>('Active');
  const [purchaseCost, setPurchaseCost] = React.useState('');
  const [replacementCost, setReplacementCost] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [lastService, setLastService] = React.useState('');
  const [nextService, setNextService] = React.useState('');
  const [remainingLife, setRemainingLife] = React.useState('');
  const [utilisation, setUtilisation] = React.useState('');
  const [environmentalImpact, setEnvironmentalImpact] = React.useState('');
  const [notes, setNotes] = React.useState('');

  return (
    <ScreenContainer>
      <TopBar
        title="Create Asset"
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
        <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>Create Asset</Text>
        <Text style={[t.text.caption, { marginTop: -4 }]}>
          Add a new asset record to the system source-of-truth.
        </Text>
        <View style={{ marginTop: t.spacing.sm }}>
          <View style={{ height: 1, backgroundColor: 'rgba(30,31,28,0.16)' }} />
        </View>

        <View style={{ gap: t.spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Asset name" value={name} onChangeText={setName} /></View>
            <View style={{ flex: 1 }}><FormField label="Asset code" value={code} onChangeText={setCode} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Category" value={category} onChangeText={setCategory} /></View>
            <View style={{ flex: 1 }}><FormField label="Sub category" value={subCategory} onChangeText={setSubCategory} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Department" value={department} onChangeText={setDepartment} /></View>
            <View style={{ flex: 1 }}><FormField label="Location" value={location} onChangeText={setLocation} /></View>
          </View>
          <FormField label="Room" value={room} onChangeText={setRoom} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline />
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Make / model" value={makeModel} onChangeText={setMakeModel} /></View>
            <View style={{ flex: 1 }}><FormField label="Serial number" value={serial} onChangeText={setSerial} /></View>
          </View>

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

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Purchase cost" value={purchaseCost} onChangeText={setPurchaseCost} /></View>
            <View style={{ flex: 1 }}><FormField label="Replacement cost" value={replacementCost} onChangeText={setReplacementCost} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Purchase date (YYYY-MM-DD)" value={purchaseDate} onChangeText={setPurchaseDate} /></View>
            <View style={{ flex: 1 }}><FormField label="Remaining life (years)" value={remainingLife} onChangeText={setRemainingLife} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Last serviced date" value={lastService} onChangeText={setLastService} /></View>
            <View style={{ flex: 1 }}><FormField label="Next service date" value={nextService} onChangeText={setNextService} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Utilisation" value={utilisation} onChangeText={setUtilisation} /></View>
            <View style={{ flex: 1 }}><FormField label="Environmental impact" value={environmentalImpact} onChangeText={setEnvironmentalImpact} /></View>
          </View>
          <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <Button label="Save asset" onPress={() => router.replace('/(admin-tabs)/assets' as any)} style={{ flex: 1 }} />
            <Button label="Cancel" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
      <AdminAppBottomNav />
    </ScreenContainer>
  );
}

