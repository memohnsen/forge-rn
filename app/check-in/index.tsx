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
import { trackCheckInStarted, trackCheckInSubmitted, trackScreenView } from '@/utils/analytics';

const LIFT_OPTIONS_PL = ['Squat', 'Bench', 'Deadlift', 'Total', 'Accessories', 'Other'];
const LIFT_OPTIONS = ['Snatch', 'Clean', 'Jerk', 'C & J', 'Total', 'Squats', 'Accessories', 'Other'];
const INTENSITY_OPTIONS = ['Maxing Out', 'Heavy', 'Moderate', 'Light'];

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { userId } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const isEditMode = Boolean(editId);

  const upsertForDate = useMutation(api.dailyCheckIns.upsertForDate);
  const patchById = useMutation(api.dailyCheckIns.patchById);
  const existingCheckIn = useQuery(
    api.dailyCheckIns.getById,
    isEditMode && editId ? { id: editId as Id<'dailyCheckIns'> } : 'skip'
  );

  // Form state
  const [sessionDate, setSessionDate] = useState(new Date());
  const [selectedLift, setSelectedLift] = useState('Squat');
  const [selectedIntensity, setSelectedIntensity] = useState('Moderate');
  const [goal, setGoal] = useState('');

  // Physical ratings
  const [physicalStrength, setPhysicalStrength] = useState(3);
  const [recovered, setRecovered] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [bodyConnection, setBodyConnection] = useState(3);

  // Mental ratings
  const [mentalStrength, setMentalStrength] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [focus, setFocus] = useState(3);
  const [stress, setStress] = useState(3);
  const [readiness, setReadiness] = useState(3);
  const [excitement, setExcitement] = useState(3);
  const [sleep, setSleep] = useState(3);

  const [concerns, setConcerns] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isHydratingEditState = isEditMode && existingCheckIn === undefined;
  const hasHydratedEditStateRef = React.useRef(false);

  React.useEffect(() => {
    trackScreenView('check_in');
    trackCheckInStarted();
  }, []);

  React.useEffect(() => {
    if (!isEditMode || hasHydratedEditStateRef.current) return;
    if (existingCheckIn === undefined) return;

    if (existingCheckIn === null) {
      Alert.alert('Entry not found', 'Unable to load this check-in.');
      router.back();
      return;
    }

    hasHydratedEditStateRef.current = true;
    setSessionDate(new Date(existingCheckIn.checkInDate));
    setSelectedLift(existingCheckIn.selectedLift ?? 'Squat');
    setSelectedIntensity(existingCheckIn.selectedIntensity ?? 'Moderate');
    setGoal(existingCheckIn.goal ?? '');
    setPhysicalStrength(existingCheckIn.physicalStrength ?? 3);
    setMentalStrength(existingCheckIn.mentalStrength ?? 3);
    setRecovered(existingCheckIn.recovered ?? 3);
    setConfidence(existingCheckIn.confidence ?? 3);
    setSleep(existingCheckIn.sleep ?? 3);
    setEnergy(existingCheckIn.energy ?? 3);
    setStress(existingCheckIn.stress ?? 3);
    setSoreness(existingCheckIn.soreness ?? 3);
    setReadiness(existingCheckIn.readiness ?? 3);
    setFocus(existingCheckIn.focus ?? 3);
    setExcitement(existingCheckIn.excitement ?? 3);
    setBodyConnection(existingCheckIn.bodyConnection ?? 3);
    setConcerns(existingCheckIn.concerns ?? '');
  }, [isEditMode, existingCheckIn, router]);

  // Calculate scores
  const physicalScore = Math.round(
    ((physicalStrength + recovered + energy + (6 - soreness) + bodyConnection) / 25) * 100
  );
  const mentalScore = Math.round(
    ((mentalStrength + confidence + focus + stress + excitement + readiness) / 30) * 100
  );
  const overallScore = Math.round((physicalScore + mentalScore) / 2);

  const hasCompletedForm = goal.length > 0;

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
      Alert.alert('Sign in required', 'Please sign in before submitting a check-in.');
      return;
    }

    setIsLoading(true);
    try {
      const checkInDate = formatToISO(sessionDate);
      const payload = {
        userId,
        checkInDate,
        selectedLift,
        selectedIntensity,
        goal,
        physicalStrength,
        mentalStrength,
        recovered,
        confidence,
        sleep,
        energy,
        stress,
        soreness,
        readiness,
        focus,
        excitement,
        bodyConnection,
        concerns: concerns || undefined,
        physicalScore,
        mentalScore,
        overallScore,
      };

      if (isEditMode && editId) {
        await patchById({ id: editId as Id<'dailyCheckIns'>, ...payload });
      } else {
        await upsertForDate(payload);
      }

      trackCheckInSubmitted(selectedLift, selectedIntensity, overallScore);
      if (isEditMode) {
        Alert.alert('Saved', 'Your check-in has been updated.', [
          {
            text: 'OK',
            onPress: () =>
              router.replace({
                pathname: '/history/[id]',
                params: { id: editId, type: 'Check-Ins' },
              }),
          },
        ]);
      } else {
        router.push({
          pathname: '/check-in/confirmation',
          params: {
            overallScore: overallScore.toString(),
            physicalScore: physicalScore.toString(),
            mentalScore: mentalScore.toString(),
            selectedLift,
            selectedIntensity,
            sessionDate: checkInDate,
          },
        });
      }
    } catch (err) {
      console.error('Error submitting check-in:', err);
      Alert.alert(
        isEditMode ? 'Update failed' : 'Submission failed',
        isEditMode
          ? 'Unable to update your check-in. Please try again.'
          : 'Unable to save your check-in. Please try again.'
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
            {isEditMode ? 'Edit Check-In' : 'Daily Check-In'}
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
          <DatePickerSection title="Session date:" value={sessionDate} onChange={setSessionDate} />

        <MultipleChoiceSection
          title="What's the main movement for the session?"
          options={LIFT_OPTIONS}
          selected={selectedLift}
          onSelect={setSelectedLift}
        />

        <MultipleChoiceSection
          title="What's the intensity for the session?"
          options={INTENSITY_OPTIONS}
          selected={selectedIntensity}
          onSelect={setSelectedIntensity}
        />

        <TextFieldSection
          title="What would make today feel like a successful session for you?"
          value={goal}
          onChangeText={setGoal}
          onFocus={handleInputFocus}
          placeholder="Enter your goal..."
        />

        <SliderSection
          title="How strong does your body feel?"
          value={physicalStrength}
          onValueChange={setPhysicalStrength}
          minString="Weak"
          maxString="Strong"
          colorByRating
        />

        <SliderSection
          title="How recovered do you feel?"
          value={recovered}
          onValueChange={setRecovered}
          minString="Not At All"
          maxString="Very"
          colorByRating
        />

        <SliderSection
          title="How energized do you feel?"
          value={energy}
          onValueChange={setEnergy}
          minString="Low"
          maxString="High"
          colorByRating
        />

        <SliderSection
          title="How sore does your body feel?"
          value={soreness}
          onValueChange={setSoreness}
          minString="None"
          maxString="Extreme"
          colorByRating
          inverseColorRating
        />

        <SliderSection
          title="How connected do you feel to your body?"
          value={bodyConnection}
          onValueChange={setBodyConnection}
          minString="Disconnected"
          maxString="Very Connected"
          colorByRating
        />

        <SliderSection
          title="How strong does your mind feel?"
          value={mentalStrength}
          onValueChange={setMentalStrength}
          minString="Weak"
          maxString="Strong"
          colorByRating
        />

        <SliderSection
          title="How confident do you feel?"
          value={confidence}
          onValueChange={setConfidence}
          minString="Not At All"
          maxString="Very"
          colorByRating
        />

        <SliderSection
          title="How focused do you feel?"
          value={focus}
          onValueChange={setFocus}
          minString="Distracted"
          maxString="Very Focused"
          colorByRating
        />

        <SliderSection
          title="How stressed do you feel?"
          value={stress}
          onValueChange={setStress}
          minString="Extreme"
          maxString="Relaxed"
          colorByRating
        />

        <SliderSection
          title="How ready do you feel to train?"
          value={readiness}
          onValueChange={setReadiness}
          minString="Not Ready"
          maxString="Very Ready"
          colorByRating
        />

        <SliderSection
          title="How excited do you feel about today's session?"
          value={excitement}
          onValueChange={setExcitement}
          minString="Not Excited"
          maxString="Very Excited"
          colorByRating
        />

        <SliderSection
          title="Rate last night's sleep quality"
          value={sleep}
          onValueChange={setSleep}
          minString="Poor"
          maxString="Great"
          colorByRating
        />

        <TextFieldSection
          title="What concerns or worries do you have going into today's session?"
          value={concerns}
          onChangeText={setConcerns}
          onFocus={handleInputFocus}
          placeholder="Enter any concerns..."
        />

          <FormSubmitButton
            title={isEditMode ? 'Save Changes' : 'Submit Check-In'}
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
