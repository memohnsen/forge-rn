import { OnboardingHeroPage } from '@/components/onboarding/OnboardingHeroPage';
import { OnboardingQuestionPage } from '@/components/onboarding/OnboardingQuestionPage';
import { DatePickerSection } from '@/components/ui/DatePickerSection';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { OnboardingSelectList } from '@/components/onboarding/OnboardingSelectList';
import { SliderSection } from '@/components/ui/SliderSection';
import { TextFieldSection } from '@/components/ui/TextFieldSection';
import { colors } from '@/constants/colors';
import { useRevenueCatContext } from '@/contexts/RevenueCatContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
  setOnboardingCompleted,
  trackMeetDaysUpdated,
  trackOnboardingCompleted,
  trackOnboardingPageViewed,
  trackOnboardingStarted,
  trackScreenView,
} from '@/utils/analytics';

// Hero page data for pages 1-4
const heroPages = [
  {
    primaryIcon: 'body' as const,
    secondaryIcon: 'warning' as const,
    title: 'Is your mindset limiting your total?',
    message:
      "Physical strength isn't enough. Mental fatigue and lack of reflection can stall your progress for months.",
    buttonText: 'I Feel This',
    accentColor: '#FF6B6B',
  },
  {
    primaryIcon: 'book' as const,
    secondaryIcon: 'bulb' as const,
    title: 'Turn hard sessions into insights',
    message:
      'A dedicated space to reflect on every lift. Connect your mind to the bar and take action to improve your performance.',
    buttonText: 'I Need This',
    accentColor: colors.blueEnergy,
  },
  {
    primaryIcon: 'heart-circle' as const,
    secondaryIcon: 'trending-up' as const,
    title: 'Know when to push and when to deload',
    message:
      "Daily check-ins and reflections help you understand how your body is holding up. Listen to your body, don't fight against it.",
    buttonText: "I'm Ready",
    accentColor: '#34C759', // iOS system green
  },
  {
    primaryIcon: 'trophy' as const,
    secondaryIcon: 'star' as const,
    title: 'Analyze the day, own the outcome',
    message:
      'Post-meet reflections help you process the wins and losses, building bulletproof confidence for your next meet.',
    buttonText: "Let's Do It",
    accentColor: colors.gold,
  },
];

// Options for multiple choice questions
const trackingMethodOptions = [
  'I just push through it',
  'Talk to my coach',
  'Take a break',
  'Journal or write about it',
  'Use breathing techniques',
  "I don't have a strategy",
];

const reflectionFrequencyOptions = ['Never', 'Rarely', 'Sometimes', 'Often', 'After every session'];

const sportOptions = ['Olympic Weightlifting', 'Powerlifting'];

const struggleOptions = [
  'Confidence',
  'Focus',
  'Self Talk',
  'Fear',
  'Comparison',
  'Pressure',
  'Consistency',
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timeOptions = [
  '4:00 AM',
  '5:00 AM',
  '6:00 AM',
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { hasProAccess, isRevenueCatEnabled, refreshCustomerInfo } = useRevenueCatContext();

  const { data, currentPage, updateData, nextPage, prevPage, totalPages } = useOnboarding();

  const monoAccent = colors.blueEnergy;

  const [isLoading, setIsLoading] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [selectedDayForTime, setSelectedDayForTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTrackedStart = useRef(false);

  const convexUpsert = useMutation(api.users.upsert);

  // Setup animation for final page
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Total question pages (pages 5-16) for progress bar
  const totalQuestionSteps = 12;

  useEffect(() => {
    if (!hasTrackedStart.current) {
      trackScreenView('onboarding');
      trackOnboardingStarted();
      hasTrackedStart.current = true;
    }
  }, []);

  useEffect(() => {
    trackOnboardingPageViewed(currentPage, totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage === 17) {
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 2500,
        useNativeDriver: false,
      }).start();

      const interval = setInterval(() => {
        setSetupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [currentPage]);

  const handleCompleteOnboarding = async () => {
    // Guard against re-entrancy from rapid taps
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    if (!userId) {
      try {
        // Pre-auth onboarding: mark device-level completion and route to sign-in
        await SecureStore.setItemAsync('hasSeenOnboarding_device', 'true');
        trackOnboardingCompleted();
        router.replace('/(auth)/sign-in');
      } catch (err: unknown) {
        console.error('Error completing pre-auth onboarding:', err);
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      // Format date as local YYYY-MM-DD to avoid UTC timezone shifts
      const year = data.nextCompDate.getFullYear();
      const month = String(data.nextCompDate.getMonth() + 1).padStart(2, '0');
      const day = String(data.nextCompDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      await convexUpsert({
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        sport: data.sport,
        yearsOfExperience: data.yearsExperience,
        meetsPerYear: data.meetsPerYear,
        goal: data.goal,
        biggestStruggle: data.biggestStruggle,
        trainingDays: data.trainingDays,
        nextCompetition: data.nextComp,
        nextCompetitionDate: localDateString,
        currentTrackingMethod: data.currentTrackingMethod,
        biggestFrustration: data.biggestFrustration,
        reflectionFrequency: data.reflectionFrequency,
        whatHoldingBack: data.whatHoldingBack,
      });

      // Mark onboarding as complete (user-scoped key)
      await SecureStore.setItemAsync(`hasSeenOnboarding_${userId}`, 'true');
      await SecureStore.deleteItemAsync(`forceOnboarding_${userId}`);

      trackOnboardingCompleted();
      setOnboardingCompleted(true);
      trackMeetDaysUpdated(Object.keys(data.trainingDays).length);

      if (!isRevenueCatEnabled) {
        router.replace('/(tabs)');
        return;
      }

      const hasAccess = hasProAccess || (await refreshCustomerInfo());
      router.replace(hasAccess ? '/(tabs)' : '/(paywall)');
    } catch (err: unknown) {
      console.error('Error completing onboarding:', err);
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSkipOnboarding = async () => {
    if (!__DEV__ || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (!userId) {
        await SecureStore.setItemAsync('hasSeenOnboarding_device', 'true');
        trackOnboardingCompleted();
        setOnboardingCompleted(true);
        router.replace('/(auth)/sign-in');
        return;
      }

      await SecureStore.setItemAsync(`hasSeenOnboarding_${userId}`, 'true');
      await SecureStore.deleteItemAsync(`forceOnboarding_${userId}`);
      trackOnboardingCompleted();
      setOnboardingCompleted(true);

      if (!isRevenueCatEnabled) {
        router.replace('/(tabs)');
        return;
      }

      const hasAccess = hasProAccess || (await refreshCustomerInfo());
      router.replace(hasAccess ? '/(tabs)' : '/(paywall)');
    } catch (err: unknown) {
      console.error('Error skipping onboarding in dev:', err);
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrainingDay = (day: string) => {
    const newDays = { ...data.trainingDays };
    if (newDays[day]) {
      delete newDays[day];
    } else {
      newDays[day] = '4:00 AM';
      setSelectedDayForTime(day);
    }
    updateData({ trainingDays: newDays });
  };

  const updateTrainingTime = (day: string, time: string) => {
    updateData({
      trainingDays: { ...data.trainingDays, [day]: time },
    });
    setSelectedDayForTime(null);
  };

  // Render hero pages (1-4)
  if (currentPage >= 1 && currentPage <= 4) {
    return (
      <OnboardingHeroPage
        pageData={heroPages[currentPage - 1]}
        onNext={nextPage}
        currentStep={currentPage}
        totalSteps={4}
        secondaryAction={
          __DEV__ && currentPage === 1
            ? {
                label: 'Skip onboarding (Dev)',
                onPress: handleDevSkipOnboarding,
              }
            : undefined
        }
      />
    );
  }

  // Page 5: How do you work through mental blocks?
  if (currentPage === 5) {
    return (
      <OnboardingQuestionPage
        title="How do you currently work through mental blocks?"
        currentStep={1}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.currentTrackingMethod.length > 0}
      >
        <OnboardingSelectList
          options={trackingMethodOptions}
          selected={data.currentTrackingMethod}
          onSelect={(value) => updateData({ currentTrackingMethod: value })}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 6: Biggest frustration
  if (currentPage === 6) {
    return (
      <OnboardingQuestionPage
        title="What's been your biggest frustration with training lately?"
        currentStep={2}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.biggestFrustration.length > 0}
      >
        <TextFieldSection
          title="Your frustration"
          value={data.biggestFrustration}
          onChangeText={(text) => updateData({ biggestFrustration: text })}
          placeholder="Enter your frustration..."
          accentColor={monoAccent}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 7: Reflection frequency
  if (currentPage === 7) {
    return (
      <OnboardingQuestionPage
        title="How often do you reflect on your training sessions?"
        currentStep={3}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.reflectionFrequency.length > 0}
      >
        <OnboardingSelectList
          options={reflectionFrequencyOptions}
          selected={data.reflectionFrequency}
          onSelect={(value) => updateData({ reflectionFrequency: value })}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 8: What's holding you back
  if (currentPage === 8) {
    return (
      <OnboardingQuestionPage
        title="What do you think is holding you back from your best performance?"
        currentStep={4}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.whatHoldingBack.length > 0}
      >
        <TextFieldSection
          title="Your barrier"
          value={data.whatHoldingBack}
          onChangeText={(text) => updateData({ whatHoldingBack: text })}
          placeholder="Enter your barrier..."
          accentColor={monoAccent}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 9: First + Last Name
  if (currentPage === 9) {
    return (
      <OnboardingQuestionPage
        title="What's your name?"
        currentStep={5}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.firstName.length > 0 && data.lastName.length > 0}
      >
        <InputCard isDark={isDark} title="First Name" icon="person">
          <TextInput
            style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
            value={data.firstName}
            onChangeText={(text) => updateData({ firstName: text })}
            placeholder="First Name"
            placeholderTextColor="#999"
          />
        </InputCard>

        <InputCard isDark={isDark} title="Last Name" icon="person">
          <TextInput
            style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
            value={data.lastName}
            onChangeText={(text) => updateData({ lastName: text })}
            placeholder="Last Name"
            placeholderTextColor="#999"
          />
        </InputCard>
      </OnboardingQuestionPage>
    );
  }

  // Page 10: Sport
  if (currentPage === 10) {
    return (
      <OnboardingQuestionPage
        title="What sport do you compete in?"
        currentStep={6}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.sport.length > 0}
      >
        <OnboardingSelectList
          options={sportOptions}
          selected={data.sport}
          onSelect={(value) => updateData({ sport: value })}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 11: Years of Experience
  if (currentPage === 11) {
    return (
      <OnboardingQuestionPage
        title="How many years of experience do you have?"
        currentStep={7}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={true}
      >
        <SliderSection
          title="Years of Experience"
          value={data.yearsExperience}
          onValueChange={(value) => updateData({ yearsExperience: value })}
          minString="0"
          maxString="10+"
          minValue={0}
          maxValue={10}
          accentColor={monoAccent}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 12: Meets Per Year
  if (currentPage === 12) {
    return (
      <OnboardingQuestionPage
        title="How many meets do you do per year?"
        currentStep={8}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={true}
      >
        <SliderSection
          title="Meets Per Year"
          value={data.meetsPerYear}
          onValueChange={(value) => updateData({ meetsPerYear: value })}
          minString="0"
          maxString="10+"
          minValue={0}
          maxValue={10}
          accentColor={monoAccent}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 13: Next 6-12 month goal
  if (currentPage === 13) {
    return (
      <OnboardingQuestionPage
        title="What's your next 6-12 month goal?"
        currentStep={9}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.goal.length > 0}
      >
        <TextFieldSection
          title="Your goal"
          value={data.goal}
          onChangeText={(text) => updateData({ goal: text })}
          placeholder="Enter your goal..."
          accentColor={monoAccent}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 14: Biggest mental struggle
  if (currentPage === 14) {
    return (
      <OnboardingQuestionPage
        title={`What is the hardest part of ${data.sport === 'Olympic Weightlifting' ? 'Weightlifting' : 'Powerlifting'} mentally for you?`}
        currentStep={10}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.biggestStruggle.length > 0}
      >
        <OnboardingSelectList
          options={struggleOptions}
          selected={data.biggestStruggle}
          onSelect={(value) => updateData({ biggestStruggle: value })}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 15: Next meet name + date (grouped)
  if (currentPage === 15) {
    return (
      <OnboardingQuestionPage
        title="What's your next meet?"
        currentStep={11}
        totalSteps={totalQuestionSteps}
        onNext={nextPage}
        onBack={prevPage}
        isValid={data.nextComp.length > 0}
      >
        <TextFieldSection
          title="Meet name"
          value={data.nextComp}
          onChangeText={(text) => updateData({ nextComp: text })}
          placeholder="Enter meet name..."
          multiline={false}
          accentColor={monoAccent}
        />

        <DatePickerSection
          title="Meet date"
          value={data.nextCompDate}
          onChange={(date) => updateData({ nextCompDate: date })}
          accentColor={monoAccent}
        />
      </OnboardingQuestionPage>
    );
  }

  // Page 16: Training days
  if (currentPage === 16) {
    return (
      <>
        <OnboardingQuestionPage
          title="When do you train?"
          currentStep={12}
          totalSteps={totalQuestionSteps}
          onNext={nextPage}
          onBack={prevPage}
          isValid={Object.keys(data.trainingDays).length > 0}
        >
          <View
            style={[
              styles.trainingCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: isDark ? '#2A2A2A' : '#E8E8E8',
              },
            ]}
          >
            <View style={styles.daysList}>
              {weekDays.map((day) => {
                const isSelected = !!data.trainingDays[day];
                return (
                  <View key={day} style={styles.dayRow}>
                    <Pressable
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: isSelected
                            ? isDark ? '#FFFFFF' : '#000000'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                          borderColor: isSelected
                            ? 'transparent'
                            : isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                        },
                      ]}
                      onPress={() => toggleTrainingDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: isSelected
                              ? isDark ? '#000000' : '#FFFFFF'
                              : isDark ? '#FFFFFF' : '#000000',
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>

                    {isSelected ? (
                      <Pressable
                        style={[
                          styles.timeButton,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isDark
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(0, 0, 0, 0.12)',
                          },
                        ]}
                        onPress={() => setSelectedDayForTime(day)}
                      >
                        <Text style={[styles.timeButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                          {data.trainingDays[day]}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.timePlaceholder}>
                        <Text style={styles.timePlaceholderText}>Select time</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </OnboardingQuestionPage>

        {/* Time Picker Modal */}
        {selectedDayForTime && (
          <View style={styles.timePickerOverlay}>
            <Pressable style={styles.timePickerBackdrop} onPress={() => setSelectedDayForTime(null)} />
            <View
              style={[
                styles.timePickerSheet,
                { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
              ]}
            >
              <View style={styles.timePickerHeader}>
                <Text style={[styles.timePickerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {selectedDayForTime} Training Time
                </Text>
                <Pressable onPress={() => setSelectedDayForTime(null)}>
                  <Ionicons name="close-circle" size={28} color={isDark ? '#666666' : '#CCCCCC'} />
                </Pressable>
              </View>
              <ScrollView style={styles.timePickerScroll}>
                {timeOptions.map((time) => (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeOption,
                      {
                        backgroundColor:
                          data.trainingDays[selectedDayForTime] === time
                            ? isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'
                            : 'transparent',
                      },
                    ]}
                    onPress={() => updateTrainingTime(selectedDayForTime, time)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color: isDark ? '#FFFFFF' : '#000000',
                          fontWeight:
                            data.trainingDays[selectedDayForTime] === time ? '600' : '400',
                        },
                      ]}
                    >
                      {time}
                    </Text>
                    {data.trainingDays[selectedDayForTime] === time && (
                      <Ionicons name="checkmark-circle" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </>
    );
  }

  // Render setup/customizing (page 17)
  if (currentPage === 17) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#000000' : '#F5F5F5' },
        ]}
      >
        {/* Custom Header */}
        <View style={[styles.setupHeader, { paddingTop: insets.top + 16 }]}>
          <Text style={[styles.setupTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Setting Up
          </Text>
        </View>

        {/* Content */}
        <View style={styles.setupContent}>
          <LinearGradient
            colors={[`${colors.blueEnergy}40`, `${colors.blueEnergy}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.setupIconCircle}
          >
            <Ionicons name="sparkles" size={48} color={colors.blueEnergy} />
          </LinearGradient>

          <Text style={[styles.setupMessage, { color: isDark ? '#AAAAAA' : '#666666' }]}>
            {"We're setting up your personalized journal based on your preferences"}
          </Text>

          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBarTrack, { backgroundColor: isDark ? '#333333' : '#E5E5E5' }]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.blueEnergy,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              {setupProgress}%
            </Text>
          </View>

          {setupProgress >= 100 && !errorMessage && (
            <View style={styles.completeContainer}>
              <View style={[styles.completeBadge, { backgroundColor: `${colors.scoreGreen}1F` }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.scoreGreen} />
                <Text style={[styles.completeText, { color: colors.scoreGreen }]}>Complete</Text>
              </View>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorContainer}>
              <View style={[styles.errorBadge, { backgroundColor: '#FF3B301F' }]}>
                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Button at bottom */}
        {setupProgress >= 100 && (
          <View style={[styles.setupButtonContainer, { paddingBottom: insets.bottom + 30 }]}>
            <FormSubmitButton
              title={errorMessage ? 'Try Again' : "Let's get started!"}
              icon={errorMessage ? 'refresh' : 'rocket'}
              isLoading={isLoading}
              isEnabled={true}
              accentColor={errorMessage ? '#FF3B30' : colors.blueEnergy}
              onPress={handleCompleteOnboarding}
            />
          </View>
        )}
      </View>
    );
  }

  return null;
}

// Helper Components
const InputCard: React.FC<{
  isDark: boolean;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}> = ({ isDark, title, icon, children }) => {
  const accent = isDark ? '#FFFFFF' : '#000000';
  return (
    <View
      style={[
        styles.inputCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? '#2A2A2A' : '#E8E8E8',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text style={[styles.cardTitle, { color: accent }]}>{title}</Text>
      </View>
      <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  inputWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  textInput: {
    fontSize: 16,
    padding: 14,
  },
  trainingCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  daysList: {
    gap: 12,
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 110,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timePlaceholder: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: 'rgba(154, 154, 154, 0.1)',
  },
  timePlaceholderText: {
    fontSize: 13,
    color: '#9A9A9A',
  },
  timePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  timePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  timePickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerScroll: {
    paddingHorizontal: 16,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  timeOptionText: {
    fontSize: 17,
  },
  setupHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  setupContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  setupButtonContainer: {
    paddingHorizontal: 0,
  },
  setupIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  setupMessage: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeContainer: {
    marginTop: 24,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 24,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    flexShrink: 1,
  },
});
