import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/use-theme';

export default function HistoryDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>History Detail</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Entry ID: {id}</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
});
