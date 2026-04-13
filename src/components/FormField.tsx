import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTheme } from '@/src/theme';

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
  hasError = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
  hasError?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[t.text.caption, { color: t.colors.text.muted }]}>{label}</Text>
      <View
        style={{
          borderRadius: t.radius.lg,
          backgroundColor: t.colors.card.surface,
          borderWidth: 1,
          borderColor: hasError ? '#B63E34' : t.colors.border.subtle,
          paddingHorizontal: t.spacing.md,
          paddingVertical: multiline ? t.spacing.sm : 12,
        }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.colors.text.muted}
          editable={editable}
          style={{
            fontSize: 16,
            color: t.colors.text.primary,
            minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          multiline={multiline}
          autoCorrect={!multiline}
        />
      </View>
    </View>
  );
}

