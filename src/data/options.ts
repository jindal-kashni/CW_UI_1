import type { AssetCondition, Criticality } from '@/src/types/models';

export const conditionOptions: { label: AssetCondition; value: AssetCondition }[] = [
  { label: 'Excellent', value: 'Excellent' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' },
];

export const criticalityOptions: { label: Criticality; value: Criticality }[] = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Critical', value: 'Critical' },
];

export const remainingLifeOptions = [
  { label: '0–1 years', value: '0_1' },
  { label: '1–3 years', value: '1_3' },
  { label: '3–5 years', value: '3_5' },
  { label: '5–10 years', value: '5_10' },
  { label: '10+ years', value: '10_plus' },
];

