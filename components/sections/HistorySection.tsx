import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { ProgressView } from '@/components/ui/ProgressView';
import { Card } from '@/components/ui/Card';
import type { DailyCheckIn } from '@/models/CheckIn';
import { formatDateString } from '@/utils/dateFormatter';

interface HistorySectionProps {
  checkins: DailyCheckIn[];
  loading: boolean;
}

const HistoryItemCard = ({
  item,
  onPress,
}: {
  item: DailyCheckIn;
  onPress?: () => void;
  href?: string;
}) => {
  const theme = useTheme();
  const score = item.overall_score;
  const scoreColor = score >= 80 ? theme.successGreen : score >= 60 ? theme.warningOrange : theme.dangerRed;

  return (
    <Pressable onPress={onPress}>
      <Card accentColor={scoreColor} style={styles.historyCard}>
        <View style={styles.historyRow}>
          <View style={[styles.scoreCircle, { borderColor: `${scoreColor}66` }]}> 
            <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
          </View>
        <View style={styles.historyDetails}>
          <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>
            {item.selected_intensity} {item.selected_lift}
          </Text>
          <Text style={[styles.historyDate, { color: theme.textSecondary }]}> 
            {formatDateString(item.check_in_date)}
          </Text>
        </View>
          <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
        </View>
      </Card>
    </Pressable>
  );
};

export const HistorySection = ({ checkins, loading }: HistorySectionProps) => {
  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>RECENT ACTIVITY</Text>
          <Link href="/history" asChild>
            <Text style={[styles.headerLink, { color: theme.blueEnergy }]}>View All</Text>
          </Link>
        </View>
        <ProgressView maxNum={3} />
      </View>
    );
  }

  if (!checkins.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>RECENT ACTIVITY</Text>
        <Link href="/history" asChild>
          <Pressable style={styles.headerLinkRow}>
            <Text style={[styles.headerLink, { color: theme.blueEnergy }]}>View All</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.blueEnergy} />
          </Pressable>
        </Link>
      </View>
      {checkins.slice(0, 5).map((item) => (
        <Link key={item.id ?? item.check_in_date} href={{ pathname: '/history/[id]', params: { id: item.id ?? item.check_in_date } }} asChild>
          <HistoryItemCard item={item} />
        </Link>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyCard: {
    paddingHorizontal: 0,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 4,
  },
});
