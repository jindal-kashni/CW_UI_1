import React from 'react';
import { Pressable, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}) {
  const t = useTheme();
  const base = variant === 'primary' ? t.button.primary : t.button.secondary;
  const textColor = variant === 'primary' ? t.colors.text.inverse : t.colors.brand.forest;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        base,
        {
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}>
      <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

