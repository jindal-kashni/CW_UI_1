export const typography = {
  family: {
    body: 'System',
    display: 'System',
    mono: 'SpaceMono',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  lineHeight: {
    tight: 18,
    normal: 22,
    relaxed: 26,
  },
  letterSpacing: {
    tight: -0.2,
    normal: 0,
    wide: 0.2,
  },
} as const;

export type AppTypography = typeof typography;
