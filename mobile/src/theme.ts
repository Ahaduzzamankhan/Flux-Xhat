import { StyleSheet } from 'react-native';

export const colors = {
  // Backgrounds
  background: '#050508',
  surface: '#0D0D12',
  surfaceMuted: '#141419',

  // Brand
  primary: '#00F0FF',       // Cyan neon
  primarySoft: 'rgba(0, 240, 255, 0.12)',
  primaryDark: '#007A85',
  accent: '#8B5CF6',        // Violet

  // Text
  ink: '#EAEAF0',
  inkMuted: '#8888A0',
  inkSoft: '#444460',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',

  // Status
  success: '#22C55E',
  danger: '#FF4757',
  dangerSoft: 'rgba(255, 71, 87, 0.18)',
  warning: '#F59E0B',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const shadow = StyleSheet.create({
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
}).shadow;

export const typography = {
  fontFamily: 'PlusJakartaSans-Regular',
  fontFamilyMedium: 'PlusJakartaSans-Medium',
  fontFamilyBold: 'PlusJakartaSans-Bold',
} as const;
