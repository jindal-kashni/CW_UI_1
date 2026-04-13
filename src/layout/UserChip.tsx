import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';

export function UserChip({
  name,
  onPress,
  disabled = false,
  tone = 'default',
}: {
  name: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'lightOnDark';
}) {
  const t = useTheme();
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const lightOnDark = tone === 'lightOnDark';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 0,
          paddingHorizontal: 0,
          backgroundColor: 'transparent',
          borderWidth: 0,
          opacity: disabled ? 0.58 : pressed ? 0.86 : 1,
        },
      ]}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: lightOnDark ? 'rgba(255,255,255,0.22)' : t.colors.brand.forest,
        }}>
        <Text style={{ color: lightOnDark ? '#F5F3ED' : t.colors.text.inverse, fontWeight: '600', fontSize: 13 }}>
          {initials || 'U'}
        </Text>
      </View>
      <Text style={{ color: lightOnDark ? '#F5F3ED' : t.colors.text.primary, fontSize: 14, fontWeight: '600' }}>
        {name}
      </Text>
    </Pressable>
  );
}

