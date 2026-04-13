import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | undefined;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.colors.card.surfaceAlt,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        padding: 4,
      }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: 44,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected
                  ? '#2F6B4B'
                  : pressed
                    ? 'rgba(30, 31, 28, 0.10)'
                    : 'rgba(30, 31, 28, 0.06)',
                borderWidth: 1,
                borderColor: selected ? 'rgba(47,107,75,0.60)' : 'rgba(30, 31, 28, 0.14)',
              },
            ]}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: selected ? '700' : '600',
                color: selected ? '#FFFFFF' : '#4F534A',
              }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

