import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/theme';

export function Card({ style, ...props }: ViewProps) {
  const t = useTheme();
  return <View {...props} style={[t.card.base, style]} />;
}

