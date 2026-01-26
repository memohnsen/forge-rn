import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/use-theme';

export default function BoxBreathingPlayer() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>Breathe</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Inhale 4 • Hold 4 • Exhale 4 • Hold 4</Text>
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
});
