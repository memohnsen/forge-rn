import { DatePickerSection } from '@/components/ui/DatePickerSection';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { MultipleChoiceSection } from '@/components/ui/MultipleChoiceSection';
import { SliderSection } from '@/components/ui/SliderSection';
import { TextFieldSection } from '@/components/ui/TextFieldSection';
import { colors } from '@/constants/colors';
import { formatToISO } from '@/utils/dateFormatter';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInputFocusEventData,
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
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { userId } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const isEditMode = Boolean(editId);

  const upsertForDate = useMutation(api.sessionReports.upsertForDate);
  const existingSession = useQuery(
    api.sessionReports.getById,
    isEditMode && editId ? { id: editId as Id<'sessionReports'> } : 'skip'
  );

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
  const isHydratingEditState = isEditMode && existingSession === undefined;
  const hasHydratedEditStateRef = React.useRef(false);

  React.useEffect(() => {
    trackScreenView('session_reflection');
    trackSessionReflectionStarted();
  }, []);

  React.useEffect(() => {
    if (!isEditMode || hasHydratedEditStateRef.current) return;
    if (existingSession === undefined) return;

    if (existingSession === null) {
      Alert.alert('Entry not found', 'Unable to load this reflection.');
      router.back();
      return;
    }

    hasHydratedEditStateRef.current = true;
    setSessionDate(new Date(existingSession.sessionDate));
    setTimeOfDay(existingSession.timeOfDay ?? 'Late Morning');
    setSelectedLift(existingSession.selectedLift ?? 'Squat');
    setSelectedIntensity(existingSession.selectedIntensity ?? 'Moderate');
    setSessionRPE(existingSession.sessionRpe ?? 3);
    setMovementQuality(existingSession.movementQuality ?? 3);
    setFocus(existingSession.focus ?? 3);
    setMisses(existingSession.misses ?? '0');
    setCues(existingSession.cues ?? '');
    setFeeling(existingSession.feeling ?? 3);
    setSatisfaction(existingSession.satisfaction ?? 3);
    setConfidence(existingSession.confidence ?? 3);
    setWhatLearned(existingSession.whatLearned ?? '');
    setWhatWouldChange(existingSession.whatWouldChange ?? '');
  }, [isEditMode, existingSession, router]);

  const hasCompletedForm = cues.length > 0;

  const handleInputFocus = React.useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const target = event.nativeEvent.target;
      if (!target) return;
      setTimeout(() => {
        (scrollViewRef.current as any)?.scrollResponderScrollNativeHandleToKeyboard(target, 100, true);
      }, 60);
    },
    []
  );

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in before submitting a session reflection.');
      return;
    }

    setIsLoading(true);
    try {
      await upsertForDate({
        id: isEditMode && editId ? (editId as Id<'sessionReports'>) : undefined,
        userId,
        sessionDate: formatToISO(sessionDate),
        timeOfDay,
        sessionRpe: sessionRPE,
        movementQuality,
        focus,
        misses,
        cues,
        feeling,
        satisfaction,
        confidence,
        whatLearned: whatLearned || undefined,
        whatWouldChange: whatWouldChange || undefined,
        selectedLift,
        selectedIntensity,
      });

      trackSessionReflectionSubmitted(selectedLift, selectedIntensity, sessionRPE);
      if (isEditMode) {
        Alert.alert('Saved', 'Your session reflection has been updated.', [
          {
            text: 'OK',
            onPress: () =>
              router.replace({
                pathname: '/history/[id]',
                params: { id: editId, type: 'Workouts' },
              }),
          },
        ]);
      } else {
        Alert.alert('Success!', 'Your session reflection has been submitted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error('Error submitting session report:', err);
      Alert.alert(
        isEditMode ? 'Update failed' : 'Submission failed',
        isEditMode
          ? 'Unable to update your session reflection. Please try again.'
          : 'Unable to save your session reflection. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <KeyboardAvoidingView
        style={styles.container}
        enabled={Platform.OS === 'android'}
        behavior={Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {isEditMode ? 'Edit Session Reflection' : 'Session Reflection'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {isHydratingEditState ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.blueEnergy} />
          </View>
        ) : (

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
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
          colorByRating
          inverseColorRating
        />

        <SliderSection
          title="How did your movement quality feel?"
          value={movementQuality}
          onValueChange={setMovementQuality}
          minString="Poor"
          maxString="Excellent"
          colorByRating
        />

        <SliderSection
          title="How was your focus during the session?"
          value={focus}
          onValueChange={setFocus}
          minString="Distracted"
          maxString="Locked In"
          colorByRating
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
          onFocus={handleInputFocus}
          placeholder="Enter helpful cues..."
        />

        <SliderSection
          title="How does your body feel now?"
          value={feeling}
          onValueChange={setFeeling}
          minString="Beat Up"
          maxString="Amazing"
          colorByRating
        />

        <SliderSection
          title="How satisfied do you feel with this session?"
          value={satisfaction}
          onValueChange={setSatisfaction}
          minString="Not Satisfied"
          maxString="Very Satisfied"
          colorByRating
        />

        <SliderSection
          title="How confident do you feel after this session?"
          value={confidence}
          onValueChange={setConfidence}
          minString="Not Confident"
          maxString="Very Confident"
          colorByRating
        />

        <TextFieldSection
          title="Did you learn anything about yourself during this session?"
          value={whatLearned}
          onChangeText={setWhatLearned}
          onFocus={handleInputFocus}
          placeholder="Enter any insights..."
        />

        <TextFieldSection
          title="Would you do anything differently next time?"
          value={whatWouldChange}
          onChangeText={setWhatWouldChange}
          onFocus={handleInputFocus}
          placeholder="Enter any changes..."
        />

          <FormSubmitButton
            title={isEditMode ? 'Save Changes' : 'Submit Session Review'}
            icon="checkmark-circle"
            isLoading={isLoading}
            isEnabled={hasCompletedForm}
            onPress={handleSubmit}
          />
        </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
