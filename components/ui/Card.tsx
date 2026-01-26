import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';

interface CardProps {
  children: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
}

export const Card = ({ children, accentColor, style }: CardProps) => {
  const theme = useTheme();
  const accent = accentColor ?? theme.blueEnergy;
  const surfaceColors = [theme.card, theme.backgroundAlt];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.card, { backgroundColor: 'transparent' }]}> 
        <LinearGradient colors={surfaceColors} style={styles.surface} />
        <View style={[styles.shadow, { shadowColor: theme.shadow }]} pointerEvents="none" />
        <View style={styles.content}>{children}</View>
        <LinearGradient
          colors={[`${accent}33`, `${accent}0D`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.border}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    elevation: 3,
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  content: {
    zIndex: 2,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
  },
});
