import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface MultipleChoiceSectionProps {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export const MultipleChoiceSection: React.FC<MultipleChoiceSectionProps> = ({
  title,
  options,
  selected,
  onSelect,
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
          <Ionicons name="list" size={18} color={colors.blueEnergy} />
        </LinearGradient>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
        style={styles.scrollView}
      >
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected
                    ? `${colors.blueEnergy}1F`
                    : isDark
                      ? '#2A2A2A'
                      : '#F5F5F5',
                  borderColor: isSelected ? colors.blueEnergy : 'transparent',
                },
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? colors.blueEnergy : isDark ? '#CCCCCC' : '#666666',
                    fontWeight: isSelected ? '600' : '500',
                  },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingTop: 18,
    paddingBottom: 18,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    paddingHorizontal: 18,
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
  scrollView: {},
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 14,
  },
});
