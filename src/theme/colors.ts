export const colors = {
  bg: {
    canvas: '#F6F1E8',
    canvasSubtle: '#F2EBDD',
  },
  card: {
    surface: '#FBF7F0',
    surfaceAlt: '#F7F1E6',
  },
  text: {
    primary: '#1E1F1C',
    secondary: '#4A4C45',
    muted: '#6A6D63',
    inverse: '#FBF7F0',
  },
  border: {
    subtle: 'rgba(30, 31, 28, 0.06)',
    soft: 'rgba(30, 31, 28, 0.10)',
  },
  brand: {
    forest: '#1F3B2C',
    forestSoft: '#2A4B39',
    forestTint: 'rgba(31, 59, 44, 0.12)',
  },
  status: {
    good: '#2F6B4B',
    warn: '#8A6A2A',
    bad: '#7A3B2F',
    info: '#2C5668',
    neutral: '#5A5E55',
  },
  shadow: {
    color: 'rgba(20, 20, 16, 0.18)',
  },
} as const;

export type AppColors = typeof colors;
