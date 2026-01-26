import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/use-theme';

export default function AnchorExercise() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>External Anchor</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Focus on a single sensory anchor to steady your attention.</Text>
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
