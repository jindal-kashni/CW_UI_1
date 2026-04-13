import React from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, FormField, SectionCard, SegmentedControl } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';

type YesNo = 'Yes' | 'No';

export default function StructuredConditionReportScreen() {
  const t = useTheme();

  const [reportId] = React.useState(`CR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`);
  const [assessorName, setAssessorName] = React.useState('Auditor');
  const [assessorRole, setAssessorRole] = React.useState('Asset Auditor');
  const [assessmentDate, setAssessmentDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = React.useState('Animal Care');
  const [location, setLocation] = React.useState('');
  const [roomOrZone, setRoomOrZone] = React.useState('');

  const [assetCode, setAssetCode] = React.useState('');
  const [assetName, setAssetName] = React.useState('');
  const [assetCategory, setAssetCategory] = React.useState('');
  const [assetSubCategory, setAssetSubCategory] = React.useState('');
  const [serialNumber, setSerialNumber] = React.useState('');
  const [assignedTeam, setAssignedTeam] = React.useState('');

  const [conditionRating, setConditionRating] = React.useState<'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dilapidated'>('Good');
  const [criticality, setCriticality] = React.useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [functionalStatus, setFunctionalStatus] = React.useState<'Functional' | 'Partially functional' | 'Not functional'>('Functional');
  const [safetyRisk, setSafetyRisk] = React.useState<'Low' | 'Medium' | 'High'>('Low');
  const [complianceRisk, setComplianceRisk] = React.useState<'Low' | 'Medium' | 'High'>('Low');

  const [photosCaptured, setPhotosCaptured] = React.useState<YesNo>('No');
  const [photoCount, setPhotoCount] = React.useState('');
  const [urgentFollowUp, setUrgentFollowUp] = React.useState<YesNo>('No');
  const [followUpWindow, setFollowUpWindow] = React.useState<'24 hours' | '7 days' | '30 days' | 'Routine'>('Routine');
  const [workOrderRequired, setWorkOrderRequired] = React.useState<YesNo>('No');
  const [workOrderId, setWorkOrderId] = React.useState('');

  const [findings, setFindings] = React.useState('');
  const [recommendedActions, setRecommendedActions] = React.useState('');
  const [constraints, setConstraints] = React.useState('');
  const [stakeholderNotes, setStakeholderNotes] = React.useState('');

  const [supervisorReviewRequired, setSupervisorReviewRequired] = React.useState<YesNo>('No');
  const [supervisorName, setSupervisorName] = React.useState('');
  const [signOffDate, setSignOffDate] = React.useState('');

  const summaryRisk =
    urgentFollowUp === 'Yes' || conditionRating === 'Dilapidated' || criticality === 'Critical'
      ? 'High'
      : safetyRisk === 'High' || complianceRisk === 'High'
        ? 'High'
        : safetyRisk === 'Medium' || complianceRisk === 'Medium'
          ? 'Medium'
          : 'Low';

  return (
    <ScreenContainer>
      <TopBar title="Condition Report Form" userName="Auditor" onPressBack={() => router.back()} />
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
        <SectionCard title="Report header" subtitle="Core report identity and assessor details.">
          <View style={{ gap: t.spacing.lg }}>
            <FormField label="Condition report ID" value={reportId} onChangeText={() => {}} editable={false} />
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <FormField label="Assessor name" value={assessorName} onChangeText={setAssessorName} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Assessor role" value={assessorRole} onChangeText={setAssessorRole} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <FormField label="Assessment date (YYYY-MM-DD)" value={assessmentDate} onChangeText={setAssessmentDate} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Department" value={department} onChangeText={setDepartment} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <FormField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Reptile House" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Room / Zone" value={roomOrZone} onChangeText={setRoomOrZone} />
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Asset details" subtitle="Record the exact asset being assessed.">
          <View style={{ gap: t.spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <FormField label="Asset code" value={assetCode} onChangeText={setAssetCode} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Asset name" value={assetName} onChangeText={setAssetName} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <FormField label="Category" value={assetCategory} onChangeText={setAssetCategory} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Sub category" value={assetSubCategory} onChangeText={setAssetSubCategory} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <FormField label="Serial number" value={serialNumber} onChangeText={setSerialNumber} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Assigned team" value={assignedTeam} onChangeText={setAssignedTeam} />
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Assessment ratings" subtitle="Primary condition and risk classifications.">
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={conditionRating}
              onChange={setConditionRating}
              options={[
                { label: 'Excellent', value: 'Excellent' },
                { label: 'Good', value: 'Good' },
                { label: 'Fair', value: 'Fair' },
                { label: 'Poor', value: 'Poor' },
                { label: 'Dilapidated', value: 'Dilapidated' },
              ]}
            />
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
            <SegmentedControl
              value={functionalStatus}
              onChange={setFunctionalStatus}
              options={[
                { label: 'Functional', value: 'Functional' },
                { label: 'Partial', value: 'Partially functional' },
                { label: 'Not functional', value: 'Not functional' },
              ]}
            />
            <SegmentedControl
              value={safetyRisk}
              onChange={setSafetyRisk}
              options={[
                { label: 'Safety low', value: 'Low' },
                { label: 'Safety medium', value: 'Medium' },
                { label: 'Safety high', value: 'High' },
              ]}
            />
            <SegmentedControl
              value={complianceRisk}
              onChange={setComplianceRisk}
              options={[
                { label: 'Compliance low', value: 'Low' },
                { label: 'Compliance medium', value: 'Medium' },
                { label: 'Compliance high', value: 'High' },
              ]}
            />
            <Text style={t.text.caption}>Derived overall risk: {summaryRisk}</Text>
          </View>
        </SectionCard>

        <SectionCard title="Evidence and actions" subtitle="Capture evidence and follow-up workflow requirements.">
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={photosCaptured}
              onChange={setPhotosCaptured}
              options={[
                { label: 'Photos: Yes', value: 'Yes' },
                { label: 'Photos: No', value: 'No' },
              ]}
            />
            {photosCaptured === 'Yes' ? (
              <FormField label="Photo count" value={photoCount} onChangeText={setPhotoCount} placeholder="e.g. 4" />
            ) : null}

            <SegmentedControl
              value={urgentFollowUp}
              onChange={setUrgentFollowUp}
              options={[
                { label: 'Urgent follow-up: Yes', value: 'Yes' },
                { label: 'Urgent follow-up: No', value: 'No' },
              ]}
            />
            {urgentFollowUp === 'Yes' ? (
              <SegmentedControl
                value={followUpWindow}
                onChange={setFollowUpWindow}
                options={[
                  { label: '24 hours', value: '24 hours' },
                  { label: '7 days', value: '7 days' },
                  { label: '30 days', value: '30 days' },
                  { label: 'Routine', value: 'Routine' },
                ]}
              />
            ) : null}

            <SegmentedControl
              value={workOrderRequired}
              onChange={setWorkOrderRequired}
              options={[
                { label: 'Work order: Yes', value: 'Yes' },
                { label: 'Work order: No', value: 'No' },
              ]}
            />
            {workOrderRequired === 'Yes' ? (
              <FormField label="Work order ID" value={workOrderId} onChangeText={setWorkOrderId} />
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Narrative fields" subtitle="Core written sections for a completed condition report.">
          <View style={{ gap: t.spacing.lg }}>
            <FormField
              label="Findings summary"
              value={findings}
              onChangeText={setFindings}
              placeholder="Observed condition, defect details, and context."
              multiline
            />
            <FormField
              label="Recommended actions"
              value={recommendedActions}
              onChangeText={setRecommendedActions}
              placeholder="Repairs, replacements, monitoring, or contractor actions."
              multiline
            />
            <FormField
              label="Constraints / access notes"
              value={constraints}
              onChangeText={setConstraints}
              placeholder="Operational constraints, permit limitations, access windows."
              multiline
            />
            <FormField
              label="Stakeholder notes"
              value={stakeholderNotes}
              onChangeText={setStakeholderNotes}
              placeholder="Notes from keeper teams, facilities, or operations."
              multiline
            />
          </View>
        </SectionCard>

        <SectionCard title="Review and sign-off" subtitle="Control fields for finalisation workflow.">
          <View style={{ gap: t.spacing.lg }}>
            <SegmentedControl
              value={supervisorReviewRequired}
              onChange={setSupervisorReviewRequired}
              options={[
                { label: 'Supervisor review: Yes', value: 'Yes' },
                { label: 'Supervisor review: No', value: 'No' },
              ]}
            />
            {supervisorReviewRequired === 'Yes' ? (
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormField label="Supervisor name" value={supervisorName} onChangeText={setSupervisorName} />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Sign-off date (YYYY-MM-DD)"
                    value={signOffDate}
                    onChangeText={setSignOffDate}
                  />
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <Button label="Save draft" variant="secondary" onPress={() => {}} style={{ flex: 1 }} />
              <Button label="Submit condition report" onPress={() => router.push('/audits' as any)} style={{ flex: 1 }} />
            </View>
          </View>
        </SectionCard>
      </ScrollView>
      <AppBottomNav />
    </ScreenContainer>
  );
}

