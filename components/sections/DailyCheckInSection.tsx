import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';

interface DailyCheckInSectionProps {
  streakCount: string;
  streakLabel: string;
  streakStatus: string;
  streakColor: string;
  streakIcon: keyof typeof Ionicons.glyphMap;
}

export const DailyCheckInSection = ({
  streakCount,
  streakLabel,
  streakStatus,
  streakColor,
  streakIcon,
}: DailyCheckInSectionProps) => {
  const theme = useTheme();

  return (
    <Card accentColor={theme.checkInOrange}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={[`${theme.checkInOrange}4D`, `${theme.checkInOrange}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="sunny" size={24} color={theme.checkInOrange} />
        </View>
        <View style={styles.headerContent}>
          <View style={[styles.streakPill, { backgroundColor: `${streakColor}26` }]}> 
            <Ionicons name={streakIcon} size={12} color={streakColor} />
            <Text style={[styles.streakText, { color: streakColor }]}>
              {streakCount} {streakLabel} {streakStatus}
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Daily Check-In</Text>
        </View>
      </View>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        How is your body feeling before today's session? Track your readiness to optimize your training.
      </Text>
      <Link href="/check-in" asChild>
        <Pressable>
          <LinearGradient
            colors={[theme.checkInOrange, `${theme.checkInOrange}D9`]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Start Check-In</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </LinearGradient>
        </Pressable>
      </Link>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    gap: 6,
  },
  streakPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    marginTop: 14,
    marginBottom: 18,
    lineHeight: 22,
  },
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
