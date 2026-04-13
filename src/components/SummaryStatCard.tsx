import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import { Card } from './Card';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

export function SummaryStatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: IconName;
  hint?: string;
}) {
  const t = useTheme();
  return (
    <Card style={{ padding: t.spacing.lg, flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={[t.text.caption, { color: t.colors.text.muted }]}>{label}</Text>
          <Text style={[t.text.h2, { fontSize: 28, lineHeight: 34, marginTop: t.spacing.xs }]}>
            {value}
          </Text>
          {hint ? (
            <Text style={[t.text.caption, { marginTop: t.spacing.xs }]}>{hint}</Text>
          ) : null}
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor: t.colors.brand.forestTint,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(31, 59, 44, 0.16)',
          }}>
          <FontAwesome name={icon} size={18} color={t.colors.brand.forest} />
        </View>
      </View>
    </Card>
  );
}

