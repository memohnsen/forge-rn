import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';

interface MultipleChoiceProps {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export const MultipleChoice = ({ title, options, selected, onSelect }: MultipleChoiceProps) => {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <TouchableOpacity key={option} onPress={() => onSelect(option)} activeOpacity={0.8}>
              <LinearGradient
                colors={
                  isSelected
                    ? [theme.blueEnergy, `${theme.blueEnergy}D9`]
                    : [`${theme.blueEnergy}1F`, `${theme.blueEnergy}14`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pill}
              >
                <Text style={[styles.pillText, { color: isSelected ? 'white' : theme.blueEnergy }]}>
                  {option}
                </Text>
              </LinearGradient>
              {!isSelected && (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.pillBorder,
                    { borderColor: `${theme.blueEnergy}4D` },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  scroll: {
    paddingHorizontal: 2,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillBorder: {
    borderRadius: 999,
    borderWidth: 1,
  },
});
