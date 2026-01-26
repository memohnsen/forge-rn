import { colors } from '@/constants/colors';
import { HistoryFilter, getAccentColor, getScoreColor } from '@/hooks/use-history';
import { CheckIn } from '@/models/CheckIn';
import { CompReport } from '@/models/Competition';
import { SessionReport } from '@/models/Session';
import { formatDate } from '@/utils/dateFormatter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Fake data for UI development
const FAKE_CHECK_INS: CheckIn[] = [
  {
    id: 1,
    user_id: 'fake-user',
    check_in_date: '2026-01-25',
    selected_lift: 'Squat',
    selected_intensity: 'Heavy',
    goal: 'Hit 405 for a triple',
    physical_strength: 4,
    mental_strength: 5,
    recovered: 4,
    confidence: 5,
    sleep: 4,
    energy: 4,
    stress: 2,
    soreness: 2,
    readiness: 5,
    focus: 5,
    excitement: 5,
    body_connection: 4,
    concerns: '',
    physical_score: 85,
    mental_score: 90,
    overall_score: 88,
    created_at: '2026-01-25T08:00:00Z',
  },
  {
    id: 2,
    user_id: 'fake-user',
    check_in_date: '2026-01-24',
    selected_lift: 'Bench',
    selected_intensity: 'Moderate',
    goal: 'Work on paused reps',
    physical_strength: 3,
    mental_strength: 4,
    recovered: 3,
    confidence: 4,
    sleep: 3,
    energy: 3,
    stress: 3,
    soreness: 3,
    readiness: 3,
    focus: 4,
    excitement: 4,
    body_connection: 3,
    concerns: 'Shoulder feeling tight',
    physical_score: 68,
    mental_score: 75,
    overall_score: 72,
    created_at: '2026-01-24T08:00:00Z',
  },
  {
    id: 3,
    user_id: 'fake-user',
    check_in_date: '2026-01-22',
    selected_lift: 'Deadlift',
    selected_intensity: 'Light',
    goal: 'Speed work, focus on form',
    physical_strength: 5,
    mental_strength: 5,
    recovered: 5,
    confidence: 5,
    sleep: 5,
    energy: 4,
    stress: 1,
    soreness: 1,
    readiness: 5,
    focus: 5,
    excitement: 5,
    body_connection: 5,
    concerns: '',
    physical_score: 95,
    mental_score: 92,
    overall_score: 94,
    created_at: '2026-01-22T08:00:00Z',
  },
  {
    id: 4,
    user_id: 'fake-user',
    check_in_date: '2026-01-20',
    selected_lift: 'Squat',
    selected_intensity: 'Heavy',
    goal: 'Work up to a heavy single',
    physical_strength: 2,
    mental_strength: 3,
    recovered: 2,
    confidence: 3,
    sleep: 2,
    energy: 2,
    stress: 4,
    soreness: 4,
    readiness: 2,
    focus: 3,
    excitement: 3,
    body_connection: 2,
    concerns: 'Feeling beat up from last week',
    physical_score: 48,
    mental_score: 58,
    overall_score: 53,
    created_at: '2026-01-20T08:00:00Z',
  },
];

const FAKE_SESSION_REPORTS: SessionReport[] = [
  {
    id: 1,
    user_id: 'fake-user',
    session_date: '2026-01-25',
    time_of_day: 'Late Morning',
    session_rpe: 2,
    movement_quality: 4,
    focus: 5,
    misses: '0',
    cues: 'Drive knees out, stay tight',
    feeling: 4,
    satisfaction: 5,
    confidence: 5,
    what_learned: 'Need to trust my strength more',
    what_would_change: 'Maybe warm up longer',
    selected_lift: 'Squat',
    selected_intensity: 'Heavy',
    created_at: '2026-01-25T12:00:00Z',
  },
  {
    id: 2,
    user_id: 'fake-user',
    session_date: '2026-01-23',
    time_of_day: 'Afternoon',
    session_rpe: 3,
    movement_quality: 3,
    focus: 4,
    misses: '1',
    cues: 'Arch hard, leg drive',
    feeling: 3,
    satisfaction: 4,
    confidence: 4,
    what_learned: 'Setup is everything',
    what_would_change: 'Take more rest between sets',
    selected_lift: 'Bench',
    selected_intensity: 'Moderate',
    created_at: '2026-01-23T15:00:00Z',
  },
  {
    id: 3,
    user_id: 'fake-user',
    session_date: '2026-01-21',
    time_of_day: 'Evening',
    session_rpe: 4,
    movement_quality: 2,
    focus: 3,
    misses: '2',
    cues: 'Hips through, squeeze glutes',
    feeling: 2,
    satisfaction: 2,
    confidence: 3,
    what_learned: 'Should have listened to my body',
    what_would_change: 'Deload when fatigued',
    selected_lift: 'Deadlift',
    selected_intensity: 'Heavy',
    created_at: '2026-01-21T18:00:00Z',
  },
];

const FAKE_COMP_REPORTS: CompReport[] = [
  {
    id: 1,
    user_id: 'fake-user',
    meet: 'USAPL Regionals',
    selected_meet_type: 'Local',
    meet_date: '2026-01-15',
    bodyweight: '82.5',
    performance_rating: 4,
    physical_preparedness_rating: 5,
    mental_preparedness_rating: 4,
    nutrition: 'Carb loaded properly, felt energized',
    hydration: 'Good, drank plenty of water',
    did_well: 'Stayed calm under pressure, hit all openers',
    needs_work: 'Third attempts were shaky',
    good_from_training: 'Heavy singles helped confidence',
    cues: 'Breathe, brace, execute',
    focus: 'Hitting PRs next meet',
    satisfaction: 4,
    confidence: 5,
    pressure_handling: 4,
    what_learned: 'I can handle competition pressure',
    what_proud_of: 'Going 8/9 on attempts',
    created_at: '2026-01-15T20:00:00Z',
    squat1: '180',
    squat2: '190',
    squat3: '197.5',
    bench1: '120',
    bench2: '127.5',
    bench3: '132.5',
    deadlift1: '220',
    deadlift2: '235',
    deadlift3: '245',
    squat_best: 198,
    bench_best: 133,
    deadlift_best: 245,
  },
  {
    id: 2,
    user_id: 'fake-user',
    meet: 'Local Push-Pull',
    selected_meet_type: 'Local',
    meet_date: '2025-11-10',
    bodyweight: '83.2',
    performance_rating: 3,
    physical_preparedness_rating: 3,
    mental_preparedness_rating: 3,
    nutrition: 'Could have eaten more',
    hydration: 'Decent',
    did_well: 'Bench felt strong',
    needs_work: 'Deadlift lockout',
    good_from_training: 'Paused work',
    cues: 'Stay tight',
    focus: 'Lock in deadlift technique',
    satisfaction: 3,
    confidence: 3,
    pressure_handling: 3,
    what_learned: 'Need more meet experience',
    what_proud_of: 'PR on bench',
    created_at: '2025-11-10T20:00:00Z',
    bench1: '115',
    bench2: '125',
    bench3: '130',
    deadlift1: '210',
    deadlift2: '225',
    deadlift3: '0',
    bench_best: 130,
    deadlift_best: 225,
  },
];

const FILTER_OPTIONS: HistoryFilter[] = ['Check-Ins', 'Workouts', 'Meets'];

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('Check-Ins');
  const [refreshing, setRefreshing] = useState(false);
  const isLoading = false; // Using fake data

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleItemPress = (type: HistoryFilter, id: number) => {
    router.push({
      pathname: '/history/[id]',
      params: { id: id.toString(), type },
    });
  };

  const renderEmptyState = () => {
    const config = {
      'Check-Ins': {
        title: 'No Check-Ins Submitted',
        subtitle: 'Complete a daily check-in to see your history here.',
        icon: 'clipboard' as const,
        color: colors.scoreGreen,
      },
      Workouts: {
        title: 'No Workouts Logged',
        subtitle: 'Complete a session reflection to see your history here.',
        icon: 'barbell' as const,
        color: colors.blueEnergy,
      },
      Meets: {
        title: 'No Competitions Reported',
        subtitle: 'Complete a competition report to see your history here.',
        icon: 'trophy' as const,
        color: colors.gold,
      },
    }[selectedFilter];

    return (
      <View style={styles.emptyState}>
        <LinearGradient
          colors={[`${config.color}33`, `${config.color}14`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconCircle}
        >
          <Ionicons name={config.icon} size={28} color={config.color} />
        </LinearGradient>
        <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {config.title}
        </Text>
        <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
      </View>
    );
  };

  const renderCheckInItem = (item: CheckIn) => {
    const scoreColor = getScoreColor(item.overall_score, 'Check-Ins');
    const accentColor = getAccentColor('Check-Ins');

    return (
      <Pressable
        key={item.id}
        style={[
          styles.historyCard,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            shadowColor: scoreColor,
            borderColor: `${scoreColor}26`,
          },
        ]}
        onPress={() => handleItemPress('Check-Ins', item.id!)}
      >
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={[`${scoreColor}66`, `${scoreColor}26`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCircleInner}
          >
            <Text style={[styles.scoreText, { color: scoreColor }]}>{item.overall_score}</Text>
          </LinearGradient>
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={2}
          >
            {item.selected_intensity} {item.selected_lift} Session
          </Text>
          <Text style={styles.cardSubtitle}>{formatDate(item.check_in_date)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={14} color="#999" />
      </Pressable>
    );
  };

  const renderSessionItem = (item: SessionReport) => {
    const scoreColor = getScoreColor(item.session_rpe, 'Workouts');
    const accentColor = getAccentColor('Workouts');

    return (
      <Pressable
        key={item.id}
        style={[
          styles.historyCard,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            shadowColor: accentColor,
            borderColor: `${accentColor}26`,
          },
        ]}
        onPress={() => handleItemPress('Workouts', item.id!)}
      >
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={[`${scoreColor}66`, `${scoreColor}26`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCircleInner}
          >
            <Text style={[styles.scoreTextSmall, { color: scoreColor }]}>
              {item.session_rpe}/5
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={2}
          >
            {item.selected_intensity} {item.selected_lift} Session
          </Text>
          <Text style={styles.cardSubtitle}>{formatDate(item.session_date)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={14} color="#999" />
      </Pressable>
    );
  };

  const renderCompItem = (item: CompReport) => {
    const accentColor = getAccentColor('Meets');
    const total =
      (item.squat_best || 0) + (item.bench_best || 0) + (item.deadlift_best || 0);
    const subtitleText = item.squat_best
      ? `${item.squat_best}/${item.bench_best}/${item.deadlift_best}/${total}`
      : item.snatch_best
        ? `${item.snatch_best}/${item.cj_best}/${(item.snatch_best || 0) + (item.cj_best || 0)}`
        : '';

    return (
      <Pressable
        key={item.id}
        style={[
          styles.historyCard,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            shadowColor: accentColor,
            borderColor: `${accentColor}26`,
          },
        ]}
        onPress={() => handleItemPress('Meets', item.id!)}
      >
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={[`${accentColor}40`, `${accentColor}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCircleInner}
          >
            <Ionicons name="trophy" size={18} color={accentColor} />
          </LinearGradient>
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={2}
          >
            {item.meet}
          </Text>
          <Text style={styles.cardSubtitle}>
            {formatDate(item.meet_date)}
            {subtitleText ? ` • ${subtitleText}` : ''}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={14} color="#999" />
      </Pressable>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blueEnergy} />
        </View>
      );
    }

    const items =
      selectedFilter === 'Check-Ins'
        ? FAKE_CHECK_INS
        : selectedFilter === 'Workouts'
          ? FAKE_SESSION_REPORTS
          : FAKE_COMP_REPORTS;

    if (items.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.listContainer}>
        {selectedFilter === 'Check-Ins' &&
          (items as CheckIn[]).map((item) => renderCheckInItem(item))}
        {selectedFilter === 'Workouts' &&
          (items as SessionReport[]).map((item) => renderSessionItem(item))}
        {selectedFilter === 'Meets' &&
          (items as CompReport[]).map((item) => renderCompItem(item))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          History
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((filter) => {
          const isSelected = selectedFilter === filter;
          const accentColor = getAccentColor(filter);

          return (
            <Pressable
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isSelected
                    ? `${accentColor}1F`
                    : isDark
                      ? '#1A1A1A'
                      : '#FFFFFF',
                  borderColor: isSelected ? accentColor : isDark ? '#333' : '#E5E5E5',
                },
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected ? accentColor : isDark ? '#999' : '#666',
                    fontWeight: isSelected ? '600' : '500',
                  },
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.blueEnergy}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 14,
  },
  scoreCircle: {
    width: 48,
    height: 48,
  },
  scoreCircleInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreTextSmall: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
