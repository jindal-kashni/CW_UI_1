import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme';

export function EmptyState({
  title,
  body,
  icon = 'leaf',
}: {
  title: string;
  body?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
}) {
  const t = useTheme();
  return (
    <View
      style={{
        padding: t.spacing.xl,
        borderRadius: t.radius.xl,
        backgroundColor: t.colors.card.surface,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        alignItems: 'center',
        gap: t.spacing.sm,
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 22,
          backgroundColor: t.colors.brand.forestTint,
          borderWidth: 1,
          borderColor: 'rgba(31, 59, 44, 0.16)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FontAwesome name={icon} size={20} color={t.colors.brand.forest} />
      </View>
      <Text style={[t.text.title, { fontSize: 18, lineHeight: 24, textAlign: 'center' }]}>
        {title}
      </Text>
      {body ? <Text style={[t.text.caption, { textAlign: 'center' }]}>{body}</Text> : null}
    </View>
  );
}

