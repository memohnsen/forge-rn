import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';

export default function CheckInConfirmation() {
  const theme = useTheme();
  const { overall } = useLocalSearchParams<{ overall?: string }>();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Card accentColor={theme.checkInOrange}>
          <View style={styles.iconCircle}>
            <Ionicons name="sunny" size={32} color={theme.checkInOrange} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Check-In Complete</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Overall readiness score</Text>
          <Text style={[styles.score, { color: theme.checkInOrange }]}>{overall ?? '--'}</Text>
        </Card>
        <Button label="Back to Home" onPress={() => router.push('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,160,80,0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  score: {
    fontSize: 44,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
});
