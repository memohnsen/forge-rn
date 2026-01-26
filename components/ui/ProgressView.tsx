import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface ProgressViewProps {
  maxNum?: number;
}

export const ProgressView = ({ maxNum = 3 }: ProgressViewProps) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {Array.from({ length: maxNum }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[
            styles.item,
            {
              backgroundColor: theme.backgroundAlt,
              borderColor: theme.border,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  item: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
  },
});
