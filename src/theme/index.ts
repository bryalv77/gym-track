/**
 * iOS design tokens (Human Interface Guidelines) in light and dark variants.
 * Components read them through ThemeProvider/useTheme — never statically — so
 * the whole UI re-themes instantly when the user switches modes.
 */

export interface ThemeColors {
  // System colors (accent)
  systemBlue: string;
  systemGreen: string;
  systemRed: string;
  systemOrange: string;
  systemYellow: string;
  systemPurple: string;
  systemPink: string;
  systemTeal: string;
  systemIndigo: string;
  systemGray: string;
  systemGray2: string;
  systemGray5: string;
  systemGray6: string;

  // Surfaces
  background: string;
  surface: string;

  // Text
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;

  // Lines & fills
  separator: string;
  separatorSolid: string;
  fill: string;
  fillStrong: string;

  // Tints
  blueTint: string;
  greenTint: string;
  redTint: string;
  orangeTint: string;
  purpleTint: string;

  // Tab bar
  tabBarInactive: string;
}

export const lightColors: ThemeColors = {
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemTeal: '#30B0C7',
  systemIndigo: '#5856D6',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  background: '#F2F2F7',
  surface: '#FFFFFF',

  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.60)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.30)',

  separator: 'rgba(60, 60, 67, 0.29)',
  separatorSolid: '#C6C6C8',
  fill: 'rgba(120, 120, 128, 0.12)',
  fillStrong: 'rgba(120, 120, 128, 0.20)',

  blueTint: 'rgba(0, 122, 255, 0.12)',
  greenTint: 'rgba(52, 199, 89, 0.14)',
  redTint: 'rgba(255, 59, 48, 0.12)',
  orangeTint: 'rgba(255, 149, 0, 0.14)',
  purpleTint: 'rgba(175, 82, 222, 0.14)',

  tabBarInactive: 'rgba(60, 60, 67, 0.60)',
};

export const darkColors: ThemeColors = {
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemRed: '#FF453A',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
  systemPurple: '#BF5AF2',
  systemPink: '#FF375F',
  systemTeal: '#40C8E0',
  systemIndigo: '#5E5CE6',
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',

  background: '#000000',
  surface: '#1C1C1E',

  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.60)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.30)',

  separator: 'rgba(84, 84, 88, 0.60)',
  separatorSolid: '#38383A',
  fill: 'rgba(118, 118, 128, 0.24)',
  fillStrong: 'rgba(118, 118, 128, 0.36)',

  blueTint: 'rgba(10, 132, 255, 0.22)',
  greenTint: 'rgba(48, 209, 88, 0.22)',
  redTint: 'rgba(255, 69, 58, 0.22)',
  orangeTint: 'rgba(255, 159, 10, 0.22)',
  purpleTint: 'rgba(191, 90, 242, 0.22)',

  tabBarInactive: 'rgba(235, 235, 245, 0.60)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xlg: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;

/** iOS text styles (SF font ramp). */
export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.41 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.43 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.32 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500', letterSpacing: 0.06 },
} as const;

export type TypographyVariant = keyof typeof typography;

// Re-exported for convenience — components import everything from '../theme'.
export { ThemeProvider, useTheme, type ThemePreference } from './ThemeProvider';
