import { useColorScheme } from 'react-native';
import { theme, type Theme } from '@/constants/theme';

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? theme.dark : theme.light;
};
