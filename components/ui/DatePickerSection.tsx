import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface DatePickerSectionProps {
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  accentColor?: string;
}

export const DatePickerSection: React.FC<DatePickerSectionProps> = ({
  title,
  value,
  onChange,
  accentColor,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = accentColor ?? colors.blueEnergy;
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formattedDate = value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? `${accent}33` : `${accent}20`,
          boxShadow: isDark
            ? `0 4px 12px ${accent}20`
            : `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px ${accent}30`,
        },
      ]}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[`${accent}40`, `${accent}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name="calendar" size={18} color={accent} />
        </LinearGradient>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
      </View>

      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="compact"
          onChange={handleDateChange}
          style={styles.iosPicker}
          accentColor={accent}
        />
      ) : (
        <>
          <Pressable
            style={[
              styles.dateButton,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              },
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.dateText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {formattedDate}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#999" />
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={value}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </>
      )}
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
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
  },
  dateText: {
    fontSize: 16,
  },
});
