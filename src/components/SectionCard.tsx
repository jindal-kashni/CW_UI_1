import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import { Card } from './Card';

export function SectionCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Card style={{ padding: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>{title}</Text>
          {subtitle ? <Text style={[t.text.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={{ alignItems: 'flex-end' }}>{right}</View> : null}
      </View>
      <View style={{ height: t.spacing.md }} />
      {children}
    </Card>
  );
}

