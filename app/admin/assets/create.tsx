import React from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Button, FormField, SegmentedControl } from '@/src/components';
import { AdminAppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { supabase } from '@/utils/supabase';

export default function AdminCreateAssetPage() {
  const t = useTheme();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [subCategory, setSubCategory] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [room, setRoom] = React.useState('');
  const [assignedTo, setAssignedTo] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [makeModel, setMakeModel] = React.useState('');
  const [serial, setSerial] = React.useState('');
  const [condition, setCondition] = React.useState<'Good' | 'Fair' | 'Poor' | 'Dilapidated'>('Good');
  const [criticality, setCriticality] = React.useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [status, setStatus] = React.useState<'Active' | 'Under repair' | 'Decommissioned'>('Active');
  const [purchaseCost, setPurchaseCost] = React.useState('');
  const [replacementCost, setReplacementCost] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [warrantyExpiry, setWarrantyExpiry] = React.useState('');
  const [lastService, setLastService] = React.useState('');
  const [serviceFrequency, setServiceFrequency] = React.useState('');
  const [serviceFrequencyPickerOpen, setServiceFrequencyPickerOpen] = React.useState(false);
  const [serviceFrequencyDraft, setServiceFrequencyDraft] = React.useState('');
  const [remainingLife, setRemainingLife] = React.useState('');
  const [utilisation, setUtilisation] = React.useState('');
  const [compatibilityOfUse, setCompatibilityOfUse] = React.useState('');
  const [environmentalImpact, setEnvironmentalImpact] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  

  const serviceFrequencyOptions = React.useMemo(
    () => [
      { label: 'Select service frequency', value: '' },
      { label: 'Weekly', value: 'Weekly' },
      { label: 'Fortnightly', value: 'Fortnightly' },
      { label: 'Monthly', value: 'Monthly' },
      { label: 'Quarterly', value: 'Quarterly' },
      { label: 'Biannual', value: 'Biannual' },
      { label: 'Annual', value: 'Annual' },
    ],
    [],
  );

  const selectedServiceFrequencyLabel =
    serviceFrequencyOptions.find((option) => option.value === serviceFrequency)?.label ??
    'Select service frequency';

  const requiredValues = [
    name,
    code,
    category,
    subCategory,
    department,
    location,
    room,
    description,
    makeModel,
    serial,
    assignedTo,
    purchaseCost,
    replacementCost,
    purchaseDate,
    warrantyExpiry,
    lastService,
    serviceFrequency,
    remainingLife,
    utilisation,
    compatibilityOfUse,
    environmentalImpact,
  ];
  const canSaveAsset = requiredValues.every((value) => value.trim().length > 0);

  const handleSaveAsset = async () => {
    if (!canSaveAsset) return;

    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log('SESSION:', session);

    const { data, error } = await supabase
      .from('asset')
      .insert([
        {
          asset_code: code,
          name: name,
          category: category,
          sub_category: subCategory,
          description: description,
          make_model: makeModel,
          serial_number: serial,
          condition: condition,
          criticality: criticality,
          status: status,
          purchase_cost: Number(purchaseCost),
          replacement_cost: Number(replacementCost),
          purchase_date: purchaseDate,
          warranty_expiry: warrantyExpiry,
          assigned_to: assignedTo,
          last_serviced_date: lastService,
          remaining_life_years: Number(remainingLife),
          compatibility_of_use: compatibilityOfUse,
          environmental_impact: environmentalImpact,
          notes: notes,
        },
      ])
      .select();

    console.log('CREATE DATA:', data);
    console.log('CREATE ERROR:', error);

    setSaving(false);

    if (error) return;

    router.replace('/(admin)/assets' as any);
  };

  return (
    <ScreenContainer>
      <TopBar
        title="Create Asset"
        userName="Admin"
        onPressBack={() => router.replace('/(admin)/assets' as any)}
        onPressUser={() => router.push('/(admin)/profile' as any)}
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
          <FormField label="Assigned to" value={assignedTo} onChangeText={setAssignedTo} />
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
          <FormField label="Warranty expiry (YYYY-MM-DD)" value={warrantyExpiry} onChangeText={setWarrantyExpiry} />
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Last serviced date" value={lastService} onChangeText={setLastService} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[t.text.caption, { fontWeight: '700', marginBottom: t.spacing.xs }]}>Service frequency</Text>
              <Pressable
                onPress={() => {
                  setServiceFrequencyDraft(serviceFrequency);
                  setServiceFrequencyPickerOpen(true);
                }}
                style={{
                  minHeight: 52,
                  borderRadius: t.radius.md,
                  borderWidth: 1,
                  borderColor: 'rgba(30,31,28,0.18)',
                  backgroundColor: '#F4F2EE',
                  paddingHorizontal: t.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text style={[t.text.body, { color: serviceFrequency ? '#1E1F1C' : 'rgba(30,31,28,0.56)' }]}>
                  {selectedServiceFrequencyLabel}
                </Text>
                <Feather name="chevron-down" size={16} color="#6A6A62" />
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <View style={{ flex: 1 }}><FormField label="Utilisation" value={utilisation} onChangeText={setUtilisation} /></View>
            <View style={{ flex: 1 }}><FormField label="Environmental impact" value={environmentalImpact} onChangeText={setEnvironmentalImpact} /></View>
          </View>
          <FormField
            label="Compatibility of use"
            value={compatibilityOfUse}
            onChangeText={setCompatibilityOfUse}
          />
          <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
          {!canSaveAsset ? (
            <Text style={[t.text.caption, { color: '#A6584B' }]}>
              Fill all required fields before saving the asset.
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
            <Button
              label={saving ? 'Saving...' : 'Save asset'}
              disabled={!canSaveAsset || saving}
              onPress={handleSaveAsset}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => router.replace('/(admin)/assets' as any)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
      <AdminAppBottomNav />
      <Modal
        visible={serviceFrequencyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setServiceFrequencyPickerOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <Pressable
            onPress={() => setServiceFrequencyPickerOpen(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            style={{
              width: '100%',
              maxWidth: 560,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              overflow: 'hidden',
            }}>
            <View
              style={{
                minHeight: 46,
                paddingHorizontal: t.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}>
              <Pressable onPress={() => setServiceFrequencyPickerOpen(false)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>Service frequency</Text>
              <Pressable
                onPress={() => {
                  setServiceFrequency(serviceFrequencyDraft);
                  setServiceFrequencyPickerOpen(false);
                }}>
                <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={serviceFrequencyDraft}
              onValueChange={(value) => setServiceFrequencyDraft(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}>
              {serviceFrequencyOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

