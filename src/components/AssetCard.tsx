import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { Asset, AssetCondition, Criticality } from '@/src/types/models';
import { Card } from './Card';

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral';

function toneForCondition(c: AssetCondition): Tone {
  if (c === 'Excellent' || c === 'Good') return 'good';
  if (c === 'Fair') return 'warn';
  return 'bad';
}

function toneForCriticality(c: Criticality): Tone {
  if (c === 'Low') return 'neutral';
  if (c === 'Medium') return 'info';
  if (c === 'High') return 'warn';
  return 'bad';
}

function toneForStatus(statusLabel: string): Tone {
  if (statusLabel === 'Active') return 'good';
  if (statusLabel === 'Under maintenance' || statusLabel === 'Under repair') return 'warn';
  return 'bad';
}

function colorsForTone(tone: Tone) {
  if (tone === 'good') return { bg: 'rgba(47,107,75,0.14)', text: '#1F563D' };
  if (tone === 'warn') return { bg: 'rgba(182,141,61,0.18)', text: '#6A5421' };
  if (tone === 'bad') return { bg: 'rgba(179,79,71,0.16)', text: '#7A2E29' };
  if (tone === 'info') return { bg: 'rgba(82,117,151,0.16)', text: '#314F6B' };
  return { bg: 'rgba(30,31,28,0.10)', text: '#474B44' };
}

export function AssetCard({
  asset,
  locationLabel,
  roomLabel,
  statusLabel,
  onPress,
}: {
  asset: Asset;
  locationLabel: string;
  roomLabel: string;
  statusLabel: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  const conditionTone = toneForCondition(asset.condition);
  const criticalityTone = toneForCriticality(asset.criticality);
  const statusTone = toneForStatus(statusLabel);

  const SummaryCell = ({
    label,
    value,
    tone,
  }: {
    label: string;
    value: string;
    tone: Tone;
  }) => {
    const colors = colorsForTone(tone);
    return (
      <View style={{ width: 118, alignItems: 'flex-start', gap: 6 }}>
        <Text style={[t.text.caption, { fontSize: 12, lineHeight: 16 }]}>{label}</Text>
        <View
          style={{
            minHeight: 30,
            borderRadius: 10,
            paddingHorizontal: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
          }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.98 : 1 }]}>
      <Card style={{ padding: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.xl }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>{asset.name}</Text>
            <Text style={[t.text.caption, { marginTop: 2 }]}>
              {asset.asset_code} · {asset.category}
            </Text>
            <Text style={[t.text.caption, { marginTop: t.spacing.sm }]}>
              {locationLabel} · {roomLabel}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: t.spacing.md }}>
            <SummaryCell label="Condition" value={asset.condition} tone={conditionTone} />
            <SummaryCell label="Criticality" value={asset.criticality} tone={criticalityTone} />
            <SummaryCell label="Status" value={statusLabel} tone={statusTone} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

