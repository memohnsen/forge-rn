import { colors } from '@/constants/colors';
import { useHistory, HistoryFilter, getAccentColor, getScoreColor } from '@/hooks/use-history';
import { CheckIn } from '@/models/CheckIn';
import { CompReport } from '@/models/Competition';
import { SessionReport } from '@/models/Session';
import { formatDate } from '@/utils/dateFormatter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
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
import { trackHistoryFilterChanged, trackScreenView } from '@/utils/analytics';

const FILTER_OPTIONS: HistoryFilter[] = ['Check-Ins', 'Workouts', 'Meets'];

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    checkIns,
    sessionReports,
    compReports,
    isLoading,
    selectedFilter,
    setSelectedFilter,
    refresh,
  } = useHistory();

  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    trackScreenView('history');
  }, []);

  React.useEffect(() => {
    trackHistoryFilterChanged(selectedFilter);
  }, [selectedFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
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
        ? checkIns
        : selectedFilter === 'Workouts'
          ? sessionReports
          : compReports;

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
