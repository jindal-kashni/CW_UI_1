import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

export function ScreenContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: t.colors.bg.canvas }}>
      <View style={[{ flex: 1, backgroundColor: t.colors.bg.canvas }, style]}>{children}</View>
    </SafeAreaView>
  );
}

