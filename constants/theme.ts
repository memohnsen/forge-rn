import { colors } from './colors';

export const theme = {
  light: {
    background: '#F2F2F7',
    backgroundAlt: '#E9E9F0',
    card: '#FFFFFF',
    text: '#0B0B0F',
    textSecondary: '#6C6C70',
    textTertiary: '#8E8E93',
    border: 'rgba(10, 10, 16, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    glassTint: 'rgba(255, 255, 255, 0.7)',
    ...colors,
  },
  dark: {
    background: '#0E0F13',
    backgroundAlt: '#151720',
    card: '#1B1C22',
    text: '#FFFFFF',
    textSecondary: '#B3B3B8',
    textTertiary: '#8A8A90',
    border: 'rgba(255, 255, 255, 0.06)',
    shadow: 'rgba(0, 0, 0, 0.55)',
    glassTint: 'rgba(18, 19, 24, 0.72)',
    ...colors,
  },
};

export type ThemeMode = keyof typeof theme;
export type Theme = (typeof theme)[ThemeMode];
