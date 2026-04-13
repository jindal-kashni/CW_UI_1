import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme';

export function ProgressBar({ value }: { value: number }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(31, 59, 44, 0.10)',
        overflow: 'hidden',
      }}>
      <View
        style={{
          width: `${v}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: t.colors.brand.forest,
        }}
      />
    </View>
  );
}

