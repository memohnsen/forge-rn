import { DatePickerSection } from '@/components/ui/DatePickerSection';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { MultipleChoiceSection } from '@/components/ui/MultipleChoiceSection';
import { SliderSection } from '@/components/ui/SliderSection';
import { TextFieldSection } from '@/components/ui/TextFieldSection';
import { colors } from '@/constants/colors';
import { formatToISO } from '@/utils/dateFormatter';
import { createClerkSupabaseClient } from '@/services/supabase';
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

const LIFT_OPTIONS_PL = ['Squat', 'Bench', 'Deadlift', 'Total', 'Accessories', 'Other'];
const LIFT_OPTIONS = ['Snatch', 'Clean', 'Jerk', 'C & J', 'Total', 'Squats', 'Accessories', 'Other'];
const INTENSITY_OPTIONS = ['Maxing Out', 'Heavy', 'Moderate', 'Light'];

export default function CheckInScreen() {
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

  // Calculate scores
  const physicalScore = Math.round(
    ((physicalStrength + recovered + energy + (6 - soreness) + bodyConnection) / 25) * 100
  );
  const mentalScore = Math.round(
    ((mentalStrength + confidence + focus + stress + excitement + readiness) / 30) * 100
  );
  const overallScore = Math.round((physicalScore + mentalScore) / 2);

  const hasCompletedForm = goal.length > 0;

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in before submitting a check-in.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('journal_daily_checkins').insert({
        user_id: userId,
        check_in_date: formatToISO(sessionDate),
        selected_lift: selectedLift,
        selected_intensity: selectedIntensity,
        goal,
        physical_strength: physicalStrength,
        mental_strength: mentalStrength,
        recovered,
        confidence,
        sleep,
        energy,
        stress,
        soreness,
        readiness,
        focus,
        excitement,
        body_connection: bodyConnection,
        concerns,
        physical_score: physicalScore,
        mental_score: mentalScore,
        overall_score: overallScore,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      router.push({
        pathname: '/check-in/confirmation',
        params: {
          overallScore: overallScore.toString(),
          physicalScore: physicalScore.toString(),
          mentalScore: mentalScore.toString(),
          selectedLift,
          selectedIntensity,
        },
      });
    } catch (err) {
      console.error('Error submitting check-in:', err);
      Alert.alert('Submission failed', 'Unable to save your check-in. Please try again.');
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
          Daily Check-In
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
          placeholder="Enter your goal..."
        />

        <SliderSection
          title="How strong does your body feel?"
          value={physicalStrength}
          onValueChange={setPhysicalStrength}
          minString="Weak"
          maxString="Strong"
        />

        <SliderSection
          title="How recovered do you feel?"
          value={recovered}
          onValueChange={setRecovered}
          minString="Not At All"
          maxString="Very"
        />

        <SliderSection
          title="How energized do you feel?"
          value={energy}
          onValueChange={setEnergy}
          minString="Low"
          maxString="High"
        />

        <SliderSection
          title="How sore does your body feel?"
          value={soreness}
          onValueChange={setSoreness}
          minString="None"
          maxString="Extreme"
          inverseColorRating
        />

        <SliderSection
          title="How connected do you feel to your body?"
          value={bodyConnection}
          onValueChange={setBodyConnection}
          minString="Disconnected"
          maxString="Very Connected"
        />

        <SliderSection
          title="How strong does your mind feel?"
          value={mentalStrength}
          onValueChange={setMentalStrength}
          minString="Weak"
          maxString="Strong"
        />

        <SliderSection
          title="How confident do you feel?"
          value={confidence}
          onValueChange={setConfidence}
          minString="Not At All"
          maxString="Very"
        />

        <SliderSection
          title="How focused do you feel?"
          value={focus}
          onValueChange={setFocus}
          minString="Distracted"
          maxString="Very Focused"
        />

        <SliderSection
          title="How stressed do you feel?"
          value={stress}
          onValueChange={setStress}
          minString="Extreme"
          maxString="Relaxed"
        />

        <SliderSection
          title="How ready do you feel to train?"
          value={readiness}
          onValueChange={setReadiness}
          minString="Not Ready"
          maxString="Very Ready"
        />

        <SliderSection
          title="How excited do you feel about today's session?"
          value={excitement}
          onValueChange={setExcitement}
          minString="Not Excited"
          maxString="Very Excited"
        />

        <SliderSection
          title="Rate last night's sleep quality"
          value={sleep}
          onValueChange={setSleep}
          minString="Poor"
          maxString="Great"
        />

        <TextFieldSection
          title="What concerns or worries do you have going into today's session?"
          value={concerns}
          onChangeText={setConcerns}
          placeholder="Enter any concerns..."
        />

        <FormSubmitButton
          title="Submit Check-In"
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
