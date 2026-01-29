import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  trackMentalExerciseCompleted,
  trackMentalExerciseStarted,
  trackScreenView,
} from '@/utils/analytics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type StepInfo = {
  instruction: string;
  description: string;
  count?: number | null;
  sense?: string | null;
};

const STEPS: StepInfo[] = [
  {
    instruction: 'Take a deep breath',
    description:
      'Begin by taking a slow, deep breath. Inhale through your nose, hold for a moment, then exhale slowly.',
    count: null,
    sense: null,
  },
  {
    instruction: 'Find 5 things you can see',
    description: 'Look around your environment and identify five distinct objects you can see.',
    count: 5,
    sense: 'see',
  },
  {
    instruction: 'Find 4 things you can feel',
    description: 'Notice four different physical sensations you can feel right now.',
    count: 4,
    sense: 'feel',
  },
  {
    instruction: 'Find 3 things you can hear',
    description: 'Listen carefully and identify three distinct sounds in your environment.',
    count: 3,
    sense: 'hear',
  },
  {
    instruction: 'Find 2 things you can smell',
    description: 'Take a moment to notice two different scents or smells around you.',
    count: 2,
    sense: 'smell',
  },
  {
    instruction: 'Find 1 thing you can taste',
    description:
      'Notice one thing you can taste, or think of your favorite flavor if nothing is present.',
    count: 1,
    sense: 'taste',
  },
  {
    instruction: 'Take another deep breath',
    description:
      'Finish by taking another slow, deep breath. Remind yourself that you are safe and grounded.',
    count: null,
    sense: null,
  },
];

const STEP_COLORS = ['#D9BFF2', '#BFD9F2', '#B2E6F2', '#A6D9E6', '#99CCDA', '#8CBFCF', '#CCE6F2'];

export default function ExternalAnchorScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [currentInput, setCurrentInput] = useState('');
  const exerciseStartRef = useRef<number>(Date.now());

  useEffect(() => {
    trackScreenView('external_anchor');
    trackMentalExerciseStarted('external_anchor');
  }, []);

  const stepInfo = STEPS[currentStep];
  const stepColor = STEP_COLORS[currentStep] ?? STEP_COLORS[0];

  useEffect(() => {
    setCurrentInput(userInputs[currentStep] ?? '');
  }, [currentStep, userInputs]);

  const inputRequired = stepInfo.count != null;
  const isInputEmpty = inputRequired && currentInput.trim().length === 0;

  const handleSubmit = () => {
    if (inputRequired) {
      setUserInputs((prev) => {
        const next = [...prev];
        next[currentStep] = currentInput;
        return next;
      });
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      const durationSeconds = (Date.now() - exerciseStartRef.current) / 1000;
      trackMentalExerciseCompleted('external_anchor', durationSeconds);
      router.back();
    }
  };

  const backgroundColors = [stepColor, isDark ? '#000000' : '#FFFFFF'];
  const cardBackground = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.9)';
  const cardBorder = isDark ? 'rgba(83,134,228,0.35)' : 'rgba(83,134,228,0.25)';

  return (
    <LinearGradient
      colors={backgroundColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#000'} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
            External Anchor
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressBar}>
            {STEPS.map((_, index) => {
              if (index <= currentStep) {
                return (
                  <LinearGradient
                    key={`step-${index}`}
                    colors={[colors.blueEnergy, 'rgba(83,134,228,0.85)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressPill}
                  />
                );
              }

              return (
                <View
                  key={`step-${index}`}
                  style={[
                    styles.progressPill,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.stepContent}>
            <Text style={[styles.stepInstruction, { color: isDark ? '#FFF' : '#000' }]}>
              {stepInfo.instruction}
            </Text>
            <Text
              style={[
                styles.stepDescription,
                { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' },
              ]}
            >
              {stepInfo.description}
            </Text>

            {inputRequired ? (
              <View
                style={[
                  styles.inputCard,
                  { backgroundColor: cardBackground, borderColor: cardBorder },
                ]}
              >
                <Text style={[styles.inputLabel, { color: isDark ? '#FFF' : '#000' }]}>
                  {`Your ${stepInfo.sense ?? 'observations'}`}
                </Text>
                <TextInput
                  value={currentInput}
                  onChangeText={setCurrentInput}
                  placeholder={`List ${stepInfo.count} things...`}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)'}
                  multiline
                  textAlignVertical="top"
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#000' }]}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.breathCard,
                  { backgroundColor: cardBackground, borderColor: cardBorder },
                ]}
              >
                <MaterialCommunityIcons
                  name="weather-windy"
                  size={64}
                  color={isDark ? 'rgba(83,134,228,0.8)' : 'rgba(83,134,228,0.7)'}
                />
                <Text
                  style={[
                    styles.breathHint,
                    { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' },
                  ]}
                >
                  Slow and steady.
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isInputEmpty}
            style={[styles.submitButton, isInputEmpty && styles.submitButtonDisabled]}
          >
            <LinearGradient
              colors={[colors.blueEnergy, 'rgba(83,134,228,0.85)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {currentStep < STEPS.length - 1 ? 'Continue' : 'Complete'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  progressPill: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  stepContent: {
    gap: 20,
  },
  stepInstruction: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  textInput: {
    minHeight: 120,
    fontSize: 15,
    lineHeight: 20,
  },
  breathCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  breathHint: {
    fontSize: 15,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
