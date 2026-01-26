import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/dateFormatter';

interface DatePickerProps {
  title: string;
  value: Date;
  onChange: (date: Date) => void;
}

export const DatePicker = ({ title, value, onChange }: DatePickerProps) => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      <Pressable onPress={() => setShowPicker(true)} style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Text style={[styles.pillText, { color: theme.text }]}>{formatDate(value)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
        />
      )}
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
  pill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
