import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface OnboardingSelectListProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export const OnboardingSelectList: React.FC<OnboardingSelectListProps> = ({
  options,
  selected,
  onSelect,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <Pressable
            key={option}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: isSelected
                  ? isDark ? '#FFFFFF' : '#000000'
                  : isDark ? '#2A2A2A' : '#E8E8E8',
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: isDark ? '#FFFFFF' : '#000000',
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {option}
            </Text>

            <View
              style={[
                styles.checkbox,
                isSelected
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#000000',
                      borderColor: isDark ? '#FFFFFF' : '#000000',
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: isDark ? '#444444' : '#CCCCCC',
                    },
              ]}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={isDark ? '#000000' : '#FFFFFF'}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
