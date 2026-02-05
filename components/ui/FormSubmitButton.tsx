import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface FormSubmitButtonProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLoading: boolean;
  isEnabled: boolean;
  accentColor?: string;
  onPress: () => void;
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  title,
  icon,
  isLoading,
  isEnabled,
  accentColor = colors.blueEnergy,
  onPress,
}) => {
  const disabled = !isEnabled || isLoading;

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed]}
        onPress={onPress}
        disabled={disabled}
      >
        <LinearGradient
          colors={
            isEnabled
              ? [accentColor, `${accentColor}D9`]
              : ['#80808080', '#80808066']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            isEnabled && {
              boxShadow: `0 4px 12px ${accentColor}50`,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={icon} size={18} color="#FFFFFF" />
              <Text style={styles.text}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
