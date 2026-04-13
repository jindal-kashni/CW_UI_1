import { Platform } from 'react-native';
import { colors } from './colors';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow.color,
      shadowOpacity: 1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: colors.shadow.color,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
} as const;

export type AppShadows = typeof shadows;
