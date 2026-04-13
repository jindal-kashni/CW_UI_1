import type { TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  text: {
    h1: {
      fontFamily: typography.family.display,
      fontSize: typography.size.display,
      lineHeight: 40,
      fontWeight: typography.weight.semibold,
      letterSpacing: typography.letterSpacing.tight,
      color: colors.text.primary,
    } satisfies TextStyle,
    h2: {
      fontFamily: typography.family.display,
      fontSize: typography.size.xxl,
      lineHeight: 34,
      fontWeight: typography.weight.semibold,
      letterSpacing: typography.letterSpacing.tight,
      color: colors.text.primary,
    } satisfies TextStyle,
    title: {
      fontFamily: typography.family.display,
      fontSize: typography.size.xl,
      lineHeight: 28,
      fontWeight: typography.weight.semibold,
      letterSpacing: typography.letterSpacing.tight,
      color: colors.text.primary,
    } satisfies TextStyle,
    body: {
      fontFamily: typography.family.body,
      fontSize: typography.size.md,
      lineHeight: typography.lineHeight.relaxed,
      fontWeight: typography.weight.regular,
      color: colors.text.primary,
    } satisfies TextStyle,
    bodyMuted: {
      fontFamily: typography.family.body,
      fontSize: typography.size.md,
      lineHeight: typography.lineHeight.relaxed,
      fontWeight: typography.weight.regular,
      color: colors.text.secondary,
    } satisfies TextStyle,
    caption: {
      fontFamily: typography.family.body,
      fontSize: typography.size.sm,
      lineHeight: typography.lineHeight.normal,
      fontWeight: typography.weight.regular,
      color: colors.text.muted,
    } satisfies TextStyle,
  },
  card: {
    base: {
      backgroundColor: colors.card.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      ...shadows.card,
    } satisfies ViewStyle,
  },
  button: {
    primary: {
      backgroundColor: colors.brand.forest,
      borderRadius: radius.lg,
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
    } satisfies ViewStyle,
    secondary: {
      backgroundColor: colors.brand.forestTint,
      borderRadius: radius.lg,
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: 'rgba(31, 59, 44, 0.18)',
    } satisfies ViewStyle,
  },
} as const;

export type AppTheme = typeof theme;
