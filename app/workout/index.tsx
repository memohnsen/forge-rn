import { DatePickerSection } from '@/components/ui/DatePickerSection';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { MultipleChoiceSection } from '@/components/ui/MultipleChoiceSection';
import { SliderSection } from '@/components/ui/SliderSection';
import { TextFieldSection } from '@/components/ui/TextFieldSection';
import { colors } from '@/constants/colors';
import { createClerkSupabaseClient } from '@/services/supabase';
import { formatToISO } from '@/utils/dateFormatter';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  trackScreenView,
  trackSessionReflectionStarted,
  trackSessionReflectionSubmitted,
} from '@/utils/analytics';

const TIMES_OF_DAY = ['Early Morning', 'Late Morning', 'Afternoon', 'Evening', 'Night'];
const LIFT_OPTIONS_PL = ['Squat', 'Bench', 'Deadlift', 'Total', 'Accessories', 'Other'];
const LIFT_OPTIONS = ['Snatch', 'Clean', 'Jerk', 'C & J', 'Total', 'Squats', 'Accessories', 'Other'];
const INTENSITY_OPTIONS = ['Maxing Out', 'Heavy', 'Moderate', 'Light'];
const MISS_QUANTITY = ['0', '1', '2', '3', '4', '5+'];

export default function WorkoutReflectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getToken({ template: 'supabase', skipCache: true });
    });
  }, [getToken]);

  // Form state
  const [sessionDate, setSessionDate] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState('Late Morning');
  const [selectedLift, setSelectedLift] = useState('Squat');
  const [selectedIntensity, setSelectedIntensity] = useState('Moderate');

  // Ratings
  const [sessionRPE, setSessionRPE] = useState(3);
  const [movementQuality, setMovementQuality] = useState(3);
  const [focus, setFocus] = useState(3);
  const [misses, setMisses] = useState('0');
  const [cues, setCues] = useState('');
  const [feeling, setFeeling] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);
  const [confidence, setConfidence] = useState(3);

  // Text fields
  const [whatLearned, setWhatLearned] = useState('');
  const [whatWouldChange, setWhatWouldChange] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    trackScreenView('session_reflection');
    trackSessionReflectionStarted();
  }, []);

  const hasCompletedForm = cues.length > 0;

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in before submitting a session reflection.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('journal_session_report').insert({
        user_id: userId,
        session_date: formatToISO(sessionDate),
        time_of_day: timeOfDay,
        session_rpe: sessionRPE,
        movement_quality: movementQuality,
        focus,
        misses,
        cues,
        feeling,
        satisfaction,
        confidence,
        what_learned: whatLearned,
        what_would_change: whatWouldChange,
        selected_lift: selectedLift,
        selected_intensity: selectedIntensity,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      trackSessionReflectionSubmitted(selectedLift, selectedIntensity, sessionRPE);

      Alert.alert('Success!', 'Your session reflection has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Error submitting session report:', err);
      Alert.alert('Submission failed', 'Unable to save your session reflection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Session Reflection
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <DatePickerSection title="Session Date:" value={sessionDate} onChange={setSessionDate} />

        <MultipleChoiceSection
          title="What time of day did you train?"
          options={TIMES_OF_DAY}
          selected={timeOfDay}
          onSelect={setTimeOfDay}
        />

        <MultipleChoiceSection
          title="What was the main movement for the session?"
          options={LIFT_OPTIONS}
          selected={selectedLift}
          onSelect={setSelectedLift}
        />

        <MultipleChoiceSection
          title="What was the intensity for the session?"
          options={INTENSITY_OPTIONS}
          selected={selectedIntensity}
          onSelect={setSelectedIntensity}
        />

        <SliderSection
          title="How hard did this session feel?"
          value={sessionRPE}
          onValueChange={setSessionRPE}
          minString="Easy"
          maxString="Almost Died"
          inverseColorRating
        />

        <SliderSection
          title="How did your movement quality feel?"
          value={movementQuality}
          onValueChange={setMovementQuality}
          minString="Poor"
          maxString="Excellent"
        />

        <SliderSection
          title="How was your focus during the session?"
          value={focus}
          onValueChange={setFocus}
          minString="Distracted"
          maxString="Locked In"
        />

        <MultipleChoiceSection
          title="How many lifts did you miss?"
          options={MISS_QUANTITY}
          selected={misses}
          onSelect={setMisses}
        />

        <TextFieldSection
          title="What cues made a difference?"
          value={cues}
          onChangeText={setCues}
          placeholder="Enter helpful cues..."
        />

        <SliderSection
          title="How does your body feel now?"
          value={feeling}
          onValueChange={setFeeling}
          minString="Beat Up"
          maxString="Amazing"
        />

        <SliderSection
          title="How satisfied do you feel with this session?"
          value={satisfaction}
          onValueChange={setSatisfaction}
          minString="Not Satisfied"
          maxString="Very Satisfied"
        />

        <SliderSection
          title="How confident do you feel after this session?"
          value={confidence}
          onValueChange={setConfidence}
          minString="Not Confident"
          maxString="Very Confident"
        />

        <TextFieldSection
          title="Did you learn anything about yourself during this session?"
          value={whatLearned}
          onChangeText={setWhatLearned}
          placeholder="Enter any insights..."
        />

        <TextFieldSection
          title="Would you do anything differently next time?"
          value={whatWouldChange}
          onChangeText={setWhatWouldChange}
          placeholder="Enter any changes..."
        />

        <FormSubmitButton
          title="Submit Session Review"
          icon="checkmark-circle"
          isLoading={isLoading}
          isEnabled={hasCompletedForm}
          onPress={handleSubmit}
        />
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
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
});
