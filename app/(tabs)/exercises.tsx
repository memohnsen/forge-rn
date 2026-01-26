import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/use-theme';

const ExerciseCard = ({ title, description, icon, href }: { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; href: string }) => {
  const theme = useTheme();

  return (
    <Link href={href} asChild>
      <Pressable>
        <Card>
          <View style={styles.exerciseRow}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.blueEnergy}1A` }]}> 
              <Ionicons name={icon} size={20} color={theme.blueEnergy} />
            </View>
            <View style={styles.exerciseText}>
              <Text style={[styles.exerciseTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.exerciseDesc, { color: theme.textSecondary }]}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
};

export default function ExercisesScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Mental Exercises</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Build focus, calm, and confidence.</Text>
      </View>
      <ExerciseCard
        title="Box Breathing"
        description="Guided breathing timer with pacing cues."
        icon="grid"
        href="/exercises/box-breathing"
      />
      <ExerciseCard
        title="Visualization"
        description="Audio-guided imagery for meet readiness."
        icon="headset"
        href="/exercises/visualization"
      />
      <ExerciseCard
        title="Objective Review"
        description="Reframe challenging thoughts with coach prompts."
        icon="document-text"
        href="/exercises/objective-review"
      />
      <ExerciseCard
        title="External Anchor"
        description="Grounding focus exercise for high-pressure sessions."
        icon="compass"
        href="/exercises/anchor"
      />
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
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseText: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseDesc: {
    marginTop: 4,
    fontSize: 13,
  },
});
