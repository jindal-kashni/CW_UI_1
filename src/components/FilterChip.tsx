import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@/src/theme';

export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: selected
            ? t.colors.brand.forestTint
            : pressed
              ? 'rgba(30, 31, 28, 0.04)'
              : t.colors.card.surface,
          borderWidth: 1,
          borderColor: selected ? 'rgba(31, 59, 44, 0.18)' : t.colors.border.subtle,
        },
      ]}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: selected ? '700' : '600',
          color: selected ? t.colors.brand.forest : t.colors.text.secondary,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

