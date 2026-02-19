import { DatePickerSection } from '@/components/ui/DatePickerSection';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { WLLiftResultsSection } from '@/components/ui/LiftResultsSection';
import { MultipleChoiceSection } from '@/components/ui/MultipleChoiceSection';
import { SliderSection } from '@/components/ui/SliderSection';
import { TextFieldSection } from '@/components/ui/TextFieldSection';
import { colors } from '@/constants/colors';
import { formatToISO } from '@/utils/dateFormatter';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { LiftAttempt } from '@/models/Competition';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  TextInput,
  TextInputFocusEventData,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  trackCompReflectionStarted,
  trackCompReflectionSubmitted,
  trackScreenView,
} from '@/utils/analytics';

const MEET_TYPES = ['Local', 'National', 'International'];

export default function CompetitionReflectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { userId } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const isEditMode = Boolean(editId);

  const insertComp = useMutation(api.compReports.insert);
  const upsertComp = useMutation(api.compReports.upsert);
  const existingComp = useQuery(
    api.compReports.getById,
    isEditMode && editId ? { id: editId as Id<'compReports'> } : 'skip'
  );

  // Form state
  const [meetName, setMeetName] = useState('');
  const [selectedMeetType, setSelectedMeetType] = useState('Local');
  const [meetDate, setMeetDate] = useState(new Date());
  const [bodyweight, setBodyweight] = useState('');

  // Lift results
  const [snatch1, setSnatch1] = useState('');
  const [snatch2, setSnatch2] = useState('');
  const [snatch3, setSnatch3] = useState('');
  const [cj1, setCj1] = useState('');
  const [cj2, setCj2] = useState('');
  const [cj3, setCj3] = useState('');
  // const [squat1, setSquat1] = useState('');
  // const [squat2, setSquat2] = useState('');
  // const [squat3, setSquat3] = useState('');
  // const [bench1, setBench1] = useState('');
  // const [bench2, setBench2] = useState('');
  // const [bench3, setBench3] = useState('');
  // const [deadlift1, setDeadlift1] = useState('');
  // const [deadlift2, setDeadlift2] = useState('');
  // const [deadlift3, setDeadlift3] = useState('');

  // Ratings
  const [performanceRating, setPerformanceRating] = useState(3);
  const [physicalPreparedness, setPhysicalPreparedness] = useState(3);
  const [mentalPreparedness, setMentalPreparedness] = useState(3);
  const [pressureHandling, setPressureHandling] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);
  const [confidence, setConfidence] = useState(3);

  // Text fields
  const [nutrition, setNutrition] = useState('');
  const [hydration, setHydration] = useState('');
  const [didWell, setDidWell] = useState('');
  const [whatProudOf, setWhatProudOf] = useState('');
  const [goodFromTraining, setGoodFromTraining] = useState('');
  const [cues, setCues] = useState('');
  const [whatLearned, setWhatLearned] = useState('');
  const [needsWork, setNeedsWork] = useState('');
  const [focusNextMeet, setFocusNextMeet] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const isHydratingEditState = isEditMode && existingComp === undefined;
  const hasHydratedEditStateRef = React.useRef(false);

  React.useEffect(() => {
    trackScreenView('competition_reflection');
    trackCompReflectionStarted();
  }, []);

  React.useEffect(() => {
    if (!isEditMode || hasHydratedEditStateRef.current) return;
    if (existingComp === undefined) return;

    if (existingComp === null) {
      Alert.alert('Entry not found', 'Unable to load this report.');
      router.back();
      return;
    }

    hasHydratedEditStateRef.current = true;
    setMeetName(existingComp.meet ?? '');
    setSelectedMeetType(existingComp.selectedMeetType ?? 'Local');
    setMeetDate(new Date(existingComp.meetDate));
    setBodyweight(existingComp.bodyweight ?? '');
    setSnatch1(existingComp.snatchAttempts?.[0]?.weight ?? '');
    setSnatch2(existingComp.snatchAttempts?.[1]?.weight ?? '');
    setSnatch3(existingComp.snatchAttempts?.[2]?.weight ?? '');
    setCj1(existingComp.cjAttempts?.[0]?.weight ?? '');
    setCj2(existingComp.cjAttempts?.[1]?.weight ?? '');
    setCj3(existingComp.cjAttempts?.[2]?.weight ?? '');
    setPerformanceRating(existingComp.performanceRating ?? 3);
    setPhysicalPreparedness(existingComp.physicalPreparednessRating ?? 3);
    setMentalPreparedness(existingComp.mentalPreparednessRating ?? 3);
    setPressureHandling(existingComp.pressureHandling ?? 3);
    setSatisfaction(existingComp.satisfaction ?? 3);
    setConfidence(existingComp.confidence ?? 3);
    setNutrition(existingComp.nutrition ?? '');
    setHydration(existingComp.hydration ?? '');
    setDidWell(existingComp.didWell ?? '');
    setWhatProudOf(existingComp.whatProudOf ?? '');
    setGoodFromTraining(existingComp.goodFromTraining ?? '');
    setCues(existingComp.cues ?? '');
    setWhatLearned(existingComp.whatLearned ?? '');
    setNeedsWork(existingComp.needsWork ?? '');
    setFocusNextMeet(existingComp.focus ?? '');
  }, [isEditMode, existingComp, router]);

  const hasCompletedForm = meetName.length > 0 && bodyweight.length > 0;

  const buildAttempts = (w1: string, w2: string, w3: string): LiftAttempt[] =>
    [w1, w2, w3].filter((w) => w.trim() !== '').map((weight) => ({ weight }));

  const calculateBest = (lift1: string, lift2: string, lift3: string): number => {
    const values = [lift1, lift2, lift3]
      .map((v) => Number(v))
      .filter((v) => !Number.isNaN(v) && v > 0);
    return values.length ? Math.max(...values) : 0;
  };

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
      Alert.alert('Sign in required', 'Please sign in before submitting a competition report.');
      return;
    }

    setIsLoading(true);
    try {
      const snatchAttempts = buildAttempts(snatch1, snatch2, snatch3);
      const cjAttempts = buildAttempts(cj1, cj2, cj3);
      const snatchBest = calculateBest(snatch1, snatch2, snatch3);
      const cjBest = calculateBest(cj1, cj2, cj3);

      const payload = {
        userId,
        meet: meetName,
        selectedMeetType,
        meetDate: formatToISO(meetDate),
        bodyweight: bodyweight || undefined,
        performanceRating,
        physicalPreparednessRating: physicalPreparedness,
        mentalPreparednessRating: mentalPreparedness,
        nutrition: nutrition || undefined,
        hydration: hydration || undefined,
        didWell,
        needsWork,
        goodFromTraining,
        cues,
        focus: focusNextMeet,
        satisfaction,
        confidence,
        pressureHandling,
        whatLearned: whatLearned || undefined,
        whatProudOf: whatProudOf || undefined,
        snatchAttempts: snatchAttempts.length ? snatchAttempts : undefined,
        cjAttempts: cjAttempts.length ? cjAttempts : undefined,
        snatchBest: snatchBest || undefined,
        cjBest: cjBest || undefined,
      };

      if (isEditMode && editId) {
        await upsertComp({ id: editId as Id<'compReports'>, ...payload });
      } else {
        await insertComp(payload);
      }

      trackCompReflectionSubmitted(meetName, selectedMeetType, performanceRating);
      if (isEditMode) {
        Alert.alert('Saved', 'Your competition report has been updated.', [
          {
            text: 'OK',
            onPress: () =>
              router.replace({
                pathname: '/history/[id]',
                params: { id: editId, type: 'Meets' },
              }),
          },
        ]);
      } else {
        Alert.alert('Success!', 'Your competition report has been submitted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error('Error submitting competition report:', err);
      Alert.alert(
        isEditMode ? 'Update failed' : 'Submission failed',
        isEditMode
          ? 'Unable to update your competition report. Please try again.'
          : 'Unable to save your competition report. Please try again.'
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
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {isEditMode ? 'Edit Competition Report' : 'Competition Report'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {isHydratingEditState ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.gold} />
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
          {/* Meet Name Section */}
          <View
            style={[
              styles.meetNameCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: isDark ? `${colors.blueEnergy}33` : `${colors.blueEnergy}20`,
                boxShadow: isDark
                  ? `0 4px 12px ${colors.blueEnergy}20`
                  : `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px ${colors.blueEnergy}30`,
              },
            ]}
          >
            <View style={styles.meetNameHeader}>
              <LinearGradient
                colors={[`${colors.blueEnergy}40`, `${colors.blueEnergy}1A`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="trophy" size={18} color={colors.gold} />
              </LinearGradient>
              <Text style={styles.meetNameLabel}>Which meet did you compete at?</Text>
            </View>
            <TextInput
              style={[
                styles.meetNameInput,
                {
                  backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                  color: isDark ? '#FFFFFF' : '#000000',
                },
              ]}
              value={meetName}
              onChangeText={setMeetName}
              onFocus={handleInputFocus}
              placeholder="Enter your meet..."
              placeholderTextColor="#999"
            />
          </View>

        <MultipleChoiceSection
          title="What type of meet was this?"
          options={MEET_TYPES}
          selected={selectedMeetType}
          onSelect={setSelectedMeetType}
        />

        <DatePickerSection title="Meet Date:" value={meetDate} onChange={setMeetDate} />

        <TextFieldSection
          title="What was your bodyweight?"
          value={bodyweight}
          onChangeText={setBodyweight}
          onFocus={handleInputFocus}
          placeholder="Enter bodyweight (kg)..."
          multiline={true}
        />

        <WLLiftResultsSection
          snatch1={snatch1}
          snatch2={snatch2}
          snatch3={snatch3}
          cj1={cj1}
          cj2={cj2}
          cj3={cj3}
          onChangeSnatch1={setSnatch1}
          onChangeSnatch2={setSnatch2}
          onChangeSnatch3={setSnatch3}
          onChangeCj1={setCj1}
          onChangeCj2={setCj2}
          onChangeCj3={setCj3}
        />
        {/* <PLLiftResultsSection
          squat1={squat1}
          squat2={squat2}
          squat3={squat3}
          bench1={bench1}
          bench2={bench2}
          bench3={bench3}
          deadlift1={deadlift1}
          deadlift2={deadlift2}
          deadlift3={deadlift3}
          onChangeSquat1={setSquat1}
          onChangeSquat2={setSquat2}
          onChangeSquat3={setSquat3}
          onChangeBench1={setBench1}
          onChangeBench2={setBench2}
          onChangeBench3={setBench3}
          onChangeDeadlift1={setDeadlift1}
          onChangeDeadlift2={setDeadlift2}
          onChangeDeadlift3={setDeadlift3}
        /> */}

        <SliderSection
          title="How would you rate your performance?"
          value={performanceRating}
          onValueChange={setPerformanceRating}
          minString="Poor"
          maxString="Amazing"
          colorByRating
        />

        <SliderSection
          title="How prepared did you feel physically going into the meet?"
          value={physicalPreparedness}
          onValueChange={setPhysicalPreparedness}
          minString="Poor"
          maxString="Amazing"
          colorByRating
        />

        <SliderSection
          title="How prepared did you feel mentally going into the meet?"
          value={mentalPreparedness}
          onValueChange={setMentalPreparedness}
          minString="Poor"
          maxString="Amazing"
          colorByRating
        />

        <SliderSection
          title="How did you handle pressure during the meet?"
          value={pressureHandling}
          onValueChange={setPressureHandling}
          minString="Poorly"
          maxString="Very Well"
          colorByRating
        />

        <SliderSection
          title="How satisfied do you feel with this meet?"
          value={satisfaction}
          onValueChange={setSatisfaction}
          minString="Not Satisfied"
          maxString="Very Satisfied"
          colorByRating
        />

        <SliderSection
          title="How confident do you feel after this meet?"
          value={confidence}
          onValueChange={setConfidence}
          minString="Not Confident"
          maxString="Very Confident"
          colorByRating
        />

        <TextFieldSection
          title="What was your nutrition like during the meet?"
          value={nutrition}
          onChangeText={setNutrition}
          onFocus={handleInputFocus}
          placeholder="Describe your nutrition..."
        />

        <TextFieldSection
          title="What was your hydration like during the meet?"
          value={hydration}
          onChangeText={setHydration}
          onFocus={handleInputFocus}
          placeholder="Describe your hydration..."
        />

        <TextFieldSection
          title="What did you do well?"
          value={didWell}
          onChangeText={setDidWell}
          onFocus={handleInputFocus}
          placeholder="Enter what went well..."
        />

        <TextFieldSection
          title="What are you most proud of from this meet?"
          value={whatProudOf}
          onChangeText={setWhatProudOf}
          onFocus={handleInputFocus}
          placeholder="Enter what you're proud of..."
        />

        <TextFieldSection
          title="What in training helped you feel prepared for the platform?"
          value={goodFromTraining}
          onChangeText={setGoodFromTraining}
          onFocus={handleInputFocus}
          placeholder="Enter what helped..."
        />

        <TextFieldSection
          title="What cues worked best for you?"
          value={cues}
          onChangeText={setCues}
          onFocus={handleInputFocus}
          placeholder="Enter helpful cues..."
        />

        <TextFieldSection
          title="What did you learn about yourself during this meet?"
          value={whatLearned}
          onChangeText={setWhatLearned}
          onFocus={handleInputFocus}
          placeholder="Enter any insights..."
        />

        <TextFieldSection
          title="What could you have done better?"
          value={needsWork}
          onChangeText={setNeedsWork}
          onFocus={handleInputFocus}
          placeholder="Enter areas for improvement..."
        />

        <TextFieldSection
          title="What do you need to focus on for the next meet?"
          value={focusNextMeet}
          onChangeText={setFocusNextMeet}
          onFocus={handleInputFocus}
          placeholder="Enter your focus areas..."
        />

          <FormSubmitButton
            title={isEditMode ? 'Save Changes' : 'Submit Comp Report'}
            icon="trophy"
            isLoading={isLoading}
            isEnabled={hasCompletedForm}
            accentColor={colors.gold}
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
  meetNameCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 12,
  },
  meetNameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetNameLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  meetNameInput: {
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
});
