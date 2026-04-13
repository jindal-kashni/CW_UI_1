import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { TextInput, View } from 'react-native';
import { useTheme } from '@/src/theme';

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search…',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.sm,
        paddingHorizontal: t.spacing.md,
        paddingVertical: 12,
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.card.surface,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
      }}>
      <FontAwesome name="search" size={16} color={t.colors.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.text.muted}
        style={{
          flex: 1,
          fontSize: 16,
          color: t.colors.text.primary,
          paddingVertical: 2,
        }}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

