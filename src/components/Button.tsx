import React from 'react';
import { Pressable, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const t = useTheme();
  const base = variant === 'primary' ? t.button.primary : t.button.secondary;
  const textColor = variant === 'primary' ? t.colors.text.inverse : t.colors.brand.forest;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        base,
        {
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.92 : 1,
        },
        style,
      ]}>
      <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

