import { colors } from '@/constants/colors';
import { HistoryFilter, useHistoryDetails, getAccentColor } from '@/hooks/use-history';
import { useHome } from '@/hooks/use-home';
import { CheckIn } from '@/models/CheckIn';
import { CompReport } from '@/models/Competition';
import { SessionReport } from '@/models/Session';
import { formatDate } from '@/utils/dateFormatter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Rating color helper
function getRatingColor(value: number, isInverse: boolean = false): string {
  if (isInverse) {
    if (value <= 2) return colors.scoreGreen;
    if (value === 3) return colors.scoreYellow;
    return colors.scoreRed;
  }
  if (value >= 4) return colors.scoreGreen;
  if (value === 3) return colors.scoreYellow;
  return colors.scoreRed;
}

// Rating Display Section Component
interface RatingDisplaySectionProps {
  title: string;
  value: string;
  isRawValue?: boolean;
  isDark: boolean;
}

const RatingDisplaySection: React.FC<RatingDisplaySectionProps> = ({
  title,
  value,
  isRawValue = false,
  isDark,
}) => {
  const numValue = parseInt(value) || 0;

  // Determine color based on title/context
  let ratingColor = colors.scoreGreen;
  const isInverseRating =
    title.includes('miss') ||
    title.includes('sore') ||
    title.includes('Misses') ||
    title.includes('hard did this session');

  const isHealthMetric =
    title.includes('Sleep Duration') ||
    title.includes('HRV') ||
    title.includes('Readiness Score') ||
    title.includes('Heart Rate') ||
    title.includes('Recovery') ||
    title.includes('Strain') ||
    title.includes('Total');

  if (isHealthMetric) {
    ratingColor = colors.blueEnergy;
  } else if (isRawValue && title.includes('Readiness')) {
    // Overall/Physical/Mental Readiness percentage
    if (numValue >= 80) ratingColor = colors.scoreGreen;
    else if (numValue >= 60) ratingColor = colors.scoreYellow;
    else ratingColor = colors.scoreRed;
  } else if (!isRawValue) {
    ratingColor = getRatingColor(numValue, isInverseRating);
  }

  return (
    <View
      style={[
        styles.ratingCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          shadowColor: ratingColor,
          borderColor: `${ratingColor}33`,
        },
      ]}
    >
      <Text style={styles.ratingTitle}>{title}</Text>
      <View style={[styles.ratingCircle, { borderColor: `${ratingColor}4D` }]}>
        <LinearGradient
          colors={[`${ratingColor}4D`, `${ratingColor}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ratingCircleGradient}
        >
          <Text style={[styles.ratingValue, { color: ratingColor }]}>
            {isRawValue ? value : `${value}/5`}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
};

// Text Display Section Component
interface TextDisplaySectionProps {
  title: string;
  value: string;
  isDark: boolean;
}

const TextDisplaySection: React.FC<TextDisplaySectionProps> = ({ title, value, isDark }) => {
  const displayValue = value || '—';
  const valueColor = value ? (isDark ? '#FFFFFF' : '#000000') : '#999';

  return (
    <View
      style={[
        styles.textCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? '#333' : '#E5E5E5',
        },
      ]}
    >
      <Text style={styles.textTitle}>{title}</Text>
      <Text style={[styles.textValue, { color: valueColor }]}>{displayValue}</Text>
    </View>
  );
};

// Lift Result Row Component
interface LiftResultRowProps {
  liftName: string;
  attempt1: string;
  attempt2: string;
  attempt3: string;
  isDark: boolean;
}

const LiftResultRow: React.FC<LiftResultRowProps> = ({
  liftName,
  attempt1,
  attempt2,
  attempt3,
  isDark,
}) => {
  const renderAttempt = (weight: string) => {
    const isGood = !weight.startsWith('-') && !weight.startsWith('X') && weight !== '0';
    const displayWeight = weight.startsWith('-') ? weight.slice(1) + 'kg' : weight + 'kg';

    return (
      <View
        style={[
          styles.attemptBadge,
          {
            backgroundColor: isGood ? `${colors.scoreGreen}26` : '#99999926',
            borderColor: isGood ? `${colors.scoreGreen}4D` : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.attemptText,
            { color: isGood ? (isDark ? '#FFFFFF' : '#000000') : '#999' },
          ]}
        >
          {displayWeight}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.liftRow}>
      <Text style={[styles.liftName, { color: colors.gold }]}>{liftName}</Text>
      <View style={styles.attemptsContainer}>
        {renderAttempt(attempt1)}
        {renderAttempt(attempt2)}
        {renderAttempt(attempt3)}
      </View>
    </View>
  );
};

// Results Display Section for Competition
interface ResultsDisplaySectionProps {
  comp: CompReport;
  userSport: string;
  isDark: boolean;
}

const ResultsDisplaySection: React.FC<ResultsDisplaySectionProps> = ({
  comp,
  userSport,
  isDark,
}) => {
  const isOlympicWeightlifting = userSport === 'Olympic Weightlifting';

  return (
    <View
      style={[
        styles.resultsCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          shadowColor: colors.gold,
          borderColor: `${colors.gold}40`,
        },
      ]}
    >
      {isOlympicWeightlifting ? (
        <>
          <LiftResultRow
            liftName="Snatch"
            attempt1={comp.snatch1 || '0'}
            attempt2={comp.snatch2 || '0'}
            attempt3={comp.snatch3 || '0'}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]} />
          <LiftResultRow
            liftName="Clean & Jerk"
            attempt1={comp.cj1 || '0'}
            attempt2={comp.cj2 || '0'}
            attempt3={comp.cj3 || '0'}
            isDark={isDark}
          />
        </>
      ) : (
        <>
          <LiftResultRow
            liftName="Squat"
            attempt1={comp.squat1 || '0'}
            attempt2={comp.squat2 || '0'}
            attempt3={comp.squat3 || '0'}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]} />
          <LiftResultRow
            liftName="Bench"
            attempt1={comp.bench1 || '0'}
            attempt2={comp.bench2 || '0'}
            attempt3={comp.bench3 || '0'}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]} />
          <LiftResultRow
            liftName="Deadlift"
            attempt1={comp.deadlift1 || '0'}
            attempt2={comp.deadlift2 || '0'}
            attempt3={comp.deadlift3 || '0'}
            isDark={isDark}
          />
        </>
      )}
    </View>
  );
};

export default function HistoryDetailsScreen() {
  const { id, type: rawType } = useLocalSearchParams<{ id: string; type: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Ensure type has a valid default
  const type: HistoryFilter = (rawType as HistoryFilter) || 'Check-Ins';
  const numId = parseInt(id || '0');

  const { checkIn, session, comp, isLoading, deleteItem } = useHistoryDetails(type, numId);
  const { user } = useHome();

  const userSport = user?.sport || 'Powerlifting';

  // Get the item data based on type
  const item = useMemo(() => {
    if (type === 'Check-Ins') return checkIn;
    if (type === 'Workouts') return session;
    if (type === 'Meets') return comp;
    return null;
  }, [type, checkIn, session, comp]);

  const pageTitle = useMemo(() => {
    if (!item) return 'Loading...';
    if (type === 'Meets') {
      return (item as CompReport).meet;
    } else if (type === 'Workouts') {
      const s = item as SessionReport;
      return `${s.selected_intensity} ${s.selected_lift}`;
    } else {
      const c = item as CheckIn;
      return `${c.selected_intensity} ${c.selected_lift}`;
    }
  }, [item, type]);

  const handleShare = async () => {
    let shareText = '';

    if (type === 'Check-Ins' && checkIn) {
      shareText = `Check-In Results for ${formatDate(checkIn.check_in_date)}

Overall Readiness: ${checkIn.overall_score}%
Physical Readiness: ${checkIn.physical_score}%
Mental Readiness: ${checkIn.mental_score}%

Daily Goal: ${checkIn.goal}

Powered By Forge - Performance Journal`;
    } else if (type === 'Workouts' && session) {
      shareText = `Session Results for ${formatDate(session.session_date)}
Session Focus: ${session.selected_intensity} ${session.selected_lift}

Session RPE: ${session.session_rpe}/5
Movement Quality: ${session.movement_quality}/5
Focus: ${session.focus}/5

Powered By Forge - Performance Journal`;
    } else if (type === 'Meets' && comp) {
      const total = (comp.squat_best || 0) + (comp.bench_best || 0) + (comp.deadlift_best || 0);
      shareText = `Meet Results for ${comp.meet} - ${formatDate(comp.meet_date)}

${comp.squat_best}/${comp.bench_best}/${comp.deadlift_best}/${total}kg

Performance Rating: ${comp.performance_rating}/5

Powered By Forge - Performance Journal`;
    }

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = () => {
    const confirmDelete = async () => {
      const success = await deleteItem();
      if (success) {
        router.back();
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Delete this entry?',
          message: 'This action cannot be undone.',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            confirmDelete();
          }
        }
      );
    } else {
      Alert.alert('Delete this entry?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const handleMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Share Results', 'Delete'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleShare();
          } else if (buttonIndex === 2) {
            handleDelete();
          }
        }
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Results', onPress: handleShare },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]);
    }
  };

  const renderCheckInContent = (checkIn: CheckIn) => (
    <>
      <RatingDisplaySection
        title="Overall Readiness"
        value={`${checkIn.overall_score}%`}
        isRawValue
        isDark={isDark}
      />
      <RatingDisplaySection
        title="Physical Readiness"
        value={`${checkIn.physical_score}%`}
        isRawValue
        isDark={isDark}
      />
      <RatingDisplaySection
        title="Mental Readiness"
        value={`${checkIn.mental_score}%`}
        isRawValue
        isDark={isDark}
      />
      <TextDisplaySection
        title="What would make today feel like a successful session for you?"
        value={checkIn.goal}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How strong does your body feel?"
        value={`${checkIn.physical_strength}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How strong does your mind feel?"
        value={`${checkIn.mental_strength}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How recovered do you feel?"
        value={`${checkIn.recovered}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How confident do you feel?"
        value={`${checkIn.confidence}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="Rate last night's sleep quality"
        value={`${checkIn.sleep}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How energized do you feel?"
        value={`${checkIn.energy}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How stressed do you feel?"
        value={`${checkIn.stress}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How sore does your body feel?"
        value={`${checkIn.soreness}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How ready do you feel to train?"
        value={`${checkIn.readiness}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How focused do you feel?"
        value={`${checkIn.focus}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How excited do you feel about today's session?"
        value={`${checkIn.excitement}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How connected do you feel to your body?"
        value={`${checkIn.body_connection}`}
        isDark={isDark}
      />
      <TextDisplaySection
        title="What concerns or worries do you have going into today's session?"
        value={checkIn.concerns || ''}
        isDark={isDark}
      />
    </>
  );

  const renderSessionContent = (session: SessionReport) => (
    <>
      <TextDisplaySection
        title="Time of day you trained"
        value={session.time_of_day}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How hard did this session feel?"
        value={`${session.session_rpe}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How did your movement quality feel?"
        value={`${session.movement_quality}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How was your focus during the session?"
        value={`${session.focus}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="Misses"
        value={session.misses}
        isRawValue
        isDark={isDark}
      />
      <TextDisplaySection
        title="What cues made a difference?"
        value={session.cues}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How does your body feel now?"
        value={`${session.feeling}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How satisfied do you feel with this session?"
        value={`${session.satisfaction}`}
        isDark={isDark}
      />
      <RatingDisplaySection
        title="How confident do you feel after this session?"
        value={`${session.confidence}`}
        isDark={isDark}
      />
      <TextDisplaySection
        title="Did you learn anything about yourself during this session?"
        value={session.what_learned || ''}
        isDark={isDark}
      />
      <TextDisplaySection
        title="Would you do anything differently next time?"
        value={session.what_would_change || ''}
        isDark={isDark}
      />
    </>
  );

  const renderCompContent = (comp: CompReport) => {
    const total =
      userSport === 'Olympic Weightlifting'
        ? (comp.snatch_best || 0) + (comp.cj_best || 0)
        : (comp.squat_best || 0) + (comp.bench_best || 0) + (comp.deadlift_best || 0);

    return (
      <>
        <ResultsDisplaySection comp={comp} userSport={userSport} isDark={isDark} />
        <RatingDisplaySection title="Total" value={`${total}kg`} isRawValue isDark={isDark} />
        <TextDisplaySection title="Bodyweight" value={`${comp.bodyweight}kg`} isDark={isDark} />
        <RatingDisplaySection
          title="How would you rate your performance?"
          value={`${comp.performance_rating}`}
          isDark={isDark}
        />
        <RatingDisplaySection
          title="How would you rate your physical preparedness?"
          value={`${comp.physical_preparedness_rating}`}
          isDark={isDark}
        />
        <RatingDisplaySection
          title="How would you rate your mental preparedness?"
          value={`${comp.mental_preparedness_rating}`}
          isDark={isDark}
        />
        <TextDisplaySection
          title="How was your nutrition?"
          value={comp.nutrition}
          isDark={isDark}
        />
        <TextDisplaySection
          title="How was your hydration?"
          value={comp.hydration}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What did you do well?"
          value={comp.did_well}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What could you have done better?"
          value={comp.needs_work}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What in training helped you feel prepared for the platform?"
          value={comp.good_from_training}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What cues worked best for you?"
          value={comp.cues}
          isDark={isDark}
        />
        <RatingDisplaySection
          title="How satisfied do you feel with this meet?"
          value={`${comp.satisfaction}`}
          isDark={isDark}
        />
        <RatingDisplaySection
          title="How confident do you feel after this meet?"
          value={`${comp.confidence}`}
          isDark={isDark}
        />
        <RatingDisplaySection
          title="How did you handle pressure during the meet?"
          value={`${comp.pressure_handling}`}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What did you learn about yourself during this meet?"
          value={comp.what_learned}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What are you most proud of from this meet?"
          value={comp.what_proud_of}
          isDark={isDark}
        />
        <TextDisplaySection
          title="What do you need to focus on for the next meet?"
          value={comp.focus}
          isDark={isDark}
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            Loading...
          </Text>
          <View style={styles.menuButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blueEnergy} />
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            Not Found
          </Text>
          <View style={styles.menuButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#999" />
          <Text style={styles.notFoundText}>Entry not found</Text>
          <Pressable onPress={() => router.back()} style={styles.goBackButton}>
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
          numberOfLines={1}
        >
          {pageTitle}
        </Text>
        <Pressable onPress={handleMenu} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {type === 'Check-Ins' && checkIn && renderCheckInContent(checkIn)}
        {type === 'Workouts' && session && renderSessionContent(session)}
        {type === 'Meets' && comp && renderCompContent(comp)}
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
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  menuButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontSize: 17,
    color: '#999',
    fontWeight: '500',
  },
  goBackButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.blueEnergy,
    borderRadius: 12,
  },
  goBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Rating Card
  ratingCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
  },
  ratingCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    overflow: 'hidden',
  },
  ratingCircleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  // Text Card
  textCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  textValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Results Card
  resultsCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  liftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  liftName: {
    fontSize: 15,
    fontWeight: '600',
    width: 90,
  },
  attemptsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  attemptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  attemptText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});
