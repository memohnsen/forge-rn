import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';

export default function VisualizationSetup() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>Visualization</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Step into your competition day with guided imagery and cues.</Text>
        </Card>
        <Button label="Start Visualization" onPress={() => router.push('/exercises/visualization/player')} />
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
  },
});
