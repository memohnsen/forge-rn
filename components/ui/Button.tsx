import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accentColor?: string;
  style?: ViewStyle;
}

export const Button = ({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  accentColor,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const accent = accentColor ?? theme.blueEnergy;
  const isDisabled = disabled || loading;

  return (
    <Pressable disabled={isDisabled} onPress={onPress} style={[styles.wrapper, style]}>
      <LinearGradient
        colors={
          isDisabled
            ? ['rgba(120,120,120,0.5)', 'rgba(120,120,120,0.4)']
            : [accent, `${accent}D9`]
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.button, isDisabled ? styles.disabled : styles.enabled]}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  enabled: {
    shadowColor: 'rgba(83, 134, 228, 0.4)',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disabled: {
    shadowOpacity: 0,
  },
});
