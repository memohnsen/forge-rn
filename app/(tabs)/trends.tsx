import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { LineGraph } from '@/components/ui/LineGraph';
import { useTheme } from '@/hooks/use-theme';

const sampleData = [
  { x: 'Mon', y: 62 },
  { x: 'Tue', y: 68 },
  { x: 'Wed', y: 64 },
  { x: 'Thu', y: 70 },
  { x: 'Fri', y: 66 },
  { x: 'Sat', y: 74 },
];

export default function TrendsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Trends</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Monitor readiness and training momentum.</Text>
      </View>
      <Card accentColor={theme.aiPurple}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>AI Analysis</Text>
        <Text style={[styles.cardBody, { color: theme.textSecondary }]}
        >Your latest scores suggest increased fatigue midweek. Consider a lighter session before heavy days.</Text>
      </Card>
      <Card accentColor={theme.blueEnergy}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Check-In Trend</Text>
        <LineGraph data={sampleData} color={theme.blueEnergy} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
