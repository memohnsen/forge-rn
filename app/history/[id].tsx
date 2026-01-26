import { colors } from '@/constants/colors';
import { HistoryFilter, getAccentColor } from '@/hooks/use-history';
import { CheckIn } from '@/models/CheckIn';
import { CompReport } from '@/models/Competition';
import { SessionReport } from '@/models/Session';
import { formatDate } from '@/utils/dateFormatter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

// Fake data matching the list screen
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

  const [isLoading, setIsLoading] = useState(false);
  const userSport = 'Powerlifting'; // Default to powerlifting

  // Ensure type has a valid default
  const type: HistoryFilter = (rawType as HistoryFilter) || 'Check-Ins';

  // Get the item data based on type and id
  const item = useMemo(() => {
    const numId = parseInt(id || '0');
    if (type === 'Check-Ins') {
      return FAKE_CHECK_INS.find((c) => c.id === numId);
    } else if (type === 'Workouts') {
      return FAKE_SESSION_REPORTS.find((s) => s.id === numId);
    } else if (type === 'Meets') {
      return FAKE_COMP_REPORTS.find((c) => c.id === numId);
    }
    return null;
  }, [id, type]);

  const pageTitle = useMemo(() => {
    if (!item) return 'Loading...';
    if (type === 'Meets') {
      return (item as CompReport).meet;
    } else if (type === 'Workouts') {
      const session = item as SessionReport;
      return `${session.selected_intensity} ${session.selected_lift}`;
    } else {
      const checkIn = item as CheckIn;
      return `${checkIn.selected_intensity} ${checkIn.selected_lift}`;
    }
  }, [item, type]);

  const handleShare = async () => {
    let shareText = '';

    if (type === 'Check-Ins' && item) {
      const checkIn = item as CheckIn;
      shareText = `Check-In Results for ${formatDate(checkIn.check_in_date)}

Overall Readiness: ${checkIn.overall_score}%
Physical Readiness: ${checkIn.physical_score}%
Mental Readiness: ${checkIn.mental_score}%

Daily Goal: ${checkIn.goal}

Powered By Forge - Performance Journal`;
    } else if (type === 'Workouts' && item) {
      const session = item as SessionReport;
      shareText = `Session Results for ${formatDate(session.session_date)}
Session Focus: ${session.selected_intensity} ${session.selected_lift}

Session RPE: ${session.session_rpe}/5
Movement Quality: ${session.movement_quality}/5
Focus: ${session.focus}/5

Powered By Forge - Performance Journal`;
    } else if (type === 'Meets' && item) {
      const comp = item as CompReport;
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
    const confirmDelete = () => {
      // In real app, this would call the delete function
      console.log('Deleting item:', id);
      router.back();
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
        {type === 'Check-Ins' && renderCheckInContent(item as CheckIn)}
        {type === 'Workouts' && renderSessionContent(item as SessionReport)}
        {type === 'Meets' && renderCompContent(item as CompReport)}
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
