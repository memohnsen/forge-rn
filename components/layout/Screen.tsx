import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
}

export const Screen = ({ children, style, gradient = true }: ScreenProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {gradient ? (
        <LinearGradient
          colors={[theme.background, theme.backgroundAlt, theme.background]}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
        />
      ) : (
        <View style={[styles.gradient, { backgroundColor: theme.background }]} />
      )}
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
