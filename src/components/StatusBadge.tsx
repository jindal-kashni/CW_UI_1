import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme';

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral';
}) {
  const t = useTheme();
  const bg =
    tone === 'good'
      ? 'rgba(47, 107, 75, 0.14)'
      : tone === 'warn'
        ? 'rgba(138, 106, 42, 0.16)'
        : tone === 'bad'
          ? 'rgba(122, 59, 47, 0.14)'
          : tone === 'info'
            ? 'rgba(44, 86, 104, 0.14)'
            : 'rgba(90, 94, 85, 0.14)';

  const fg =
    tone === 'good'
      ? t.colors.status.good
      : tone === 'warn'
        ? t.colors.status.warn
        : tone === 'bad'
          ? t.colors.status.bad
          : tone === 'info'
            ? t.colors.status.info
            : t.colors.status.neutral;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: 'rgba(30, 31, 28, 0.06)',
      }}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

