import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';

export default function BoxBreathingSetup() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>Box Breathing</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Reset your nervous system with a 4-4-4-4 breathing pattern.</Text>
        </Card>
        <Button label="Start" onPress={() => router.push('/exercises/box-breathing/player')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
