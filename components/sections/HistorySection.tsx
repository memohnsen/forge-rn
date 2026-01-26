import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CheckIn } from '@/models/CheckIn';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/dateFormatter';

interface HistoryItemCardProps {
  intensity: string;
  lift: string;
  date: string;
  score: number;
  onPress: () => void;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  intensity,
  lift,
  date,
  score,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scoreColor = (() => {
    if (score >= 80) {
      return colors.scoreGreen;
    } else if (score >= 60) {
      return colors.scoreYellow;
    } else {
      return colors.scoreRed;
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.itemCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
      ]}
    >
      <View style={[styles.scoreCircle, { borderColor: `${scoreColor}66` }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
      </View>

      <View style={styles.itemTextContainer}>
        <Text
          style={[styles.itemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
          numberOfLines={1}
        >
          {intensity} {lift}
        </Text>
        <Text style={styles.itemDate}>{date}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#666" />
    </Pressable>
  );
};

interface HistorySectionProps {
  checkIns: CheckIn[];
  isLoading: boolean;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ checkIns, isLoading }) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RECENT ACTIVITY</Text>
          <Pressable onPress={() => router.push('/history' as any)}>
            <Text style={[styles.viewAllText, { color: colors.blueEnergy }]}>View All</Text>
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.blueEnergy} />
        </View>
      </View>
    );
  }

  if (checkIns.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RECENT ACTIVITY</Text>
        <Pressable
          onPress={() => router.push('/history' as any)}
          style={styles.viewAllButton}
        >
          <Text style={[styles.viewAllText, { color: colors.blueEnergy }]}>View All</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.blueEnergy} />
        </Pressable>
      </View>

      {checkIns.slice(0, 5).map((checkIn) => (
        <HistoryItemCard
          key={checkIn.id}
          intensity={checkIn.selected_intensity}
          lift={checkIn.selected_lift}
          date={formatDate(checkIn.check_in_date) || checkIn.check_in_date}
          score={checkIn.overall_score}
          onPress={() =>
            router.push({
              pathname: '/history/[id]' as any,
              params: {
                id: checkIn.id?.toString() || '',
                title: checkIn.selected_lift,
                date: checkIn.check_in_date,
              },
            })
          }
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemTextContainer: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
});
