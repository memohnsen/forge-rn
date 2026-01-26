import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps {
  title: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

export const TextField = ({ title, value, placeholder, onChange, multiline = true }: TextFieldProps) => {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          onChangeText={onChange}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
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
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  input: {
    fontSize: 15,
    minHeight: 96,
  },
});
