import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputFocusEventData,
  useColorScheme,
  View,
} from 'react-native';

interface TextFieldSectionProps {
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  placeholder?: string;
  multiline?: boolean;
}

export const TextFieldSection: React.FC<TextFieldSectionProps> = ({
  title,
  value,
  onChangeText,
  onFocus,
  placeholder = 'Enter your response...',
  multiline = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? `${colors.blueEnergy}33` : `${colors.blueEnergy}20`,
          boxShadow: isDark
            ? `0 4px 12px ${colors.blueEnergy}20`
            : `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px ${colors.blueEnergy}30`,
        },
      ]}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[`${colors.blueEnergy}40`, `${colors.blueEnergy}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name="create" size={18} color={colors.blueEnergy} />
        </LinearGradient>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
      </View>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
            color: isDark ? '#FFFFFF' : '#000000',
            minHeight: multiline ? 100 : 48,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  input: {
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
});
