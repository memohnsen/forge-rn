import { OnboardingHeroPage } from '@/components/onboarding/OnboardingHeroPage';
import { colors } from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { MultipleChoiceSection } from '@/components/ui/MultipleChoiceSection';
import { SliderSection } from '@/components/ui/SliderSection';
import { TextFieldSection } from '@/components/ui/TextFieldSection';
import { DatePickerSection } from '@/components/ui/DatePickerSection';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { User } from '@/models/User';
import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hero page data for pages 1-4
const heroPages = [
  {
    primaryIcon: 'head-outline' as const,
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
    accentColor: colors.scoreGreen,
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
  const { userId, getToken } = useAuth();

  const { data, currentPage, updateData, nextPage, prevPage, totalPages } = useOnboarding();

  const [isLoading, setIsLoading] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [selectedDayForTime, setSelectedDayForTime] = useState<string | null>(null);

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getToken({ template: 'supabase', skipCache: true });
    });
  }, [getToken]);

  // Setup animation for final page
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentPage === 9) {
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

  // Validation for each section
  const isPainPointValid =
    data.currentTrackingMethod.length > 0 &&
    data.biggestFrustration.length > 0 &&
    data.reflectionFrequency.length > 0 &&
    data.whatHoldingBack.length > 0;

  const isUserInfoValid = data.firstName.length > 0 && data.lastName.length > 0;

  const isSportingInfoValid =
    data.goal.length > 0 && data.biggestStruggle.length > 0 && data.nextComp.length > 0;

  const isTrainingDaysValid = Object.keys(data.trainingDays).length > 0;

  const handleCompleteOnboarding = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const userProfile: User = {
        user_id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        sport: data.sport,
        years_of_experience: data.yearsExperience,
        meets_per_year: data.meetsPerYear,
        goal: data.goal,
        biggest_struggle: data.biggestStruggle,
        training_days: data.trainingDays,
        next_competition: data.nextComp,
        next_competition_date: data.nextCompDate.toISOString().split('T')[0],
        current_tracking_method: data.currentTrackingMethod,
        biggest_frustration: data.biggestFrustration,
        reflection_frequency: data.reflectionFrequency,
        what_holding_back: data.whatHoldingBack,
      };

      const { error } = await supabase.from('journal_users').insert(userProfile);

      if (error) throw error;

      // Mark onboarding as complete
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true');

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrainingDay = (day: string) => {
    const newDays = { ...data.trainingDays };
    if (newDays[day]) {
      delete newDays[day];
    } else {
      newDays[day] = '6:00 AM';
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
      />
    );
  }

  // Render pain point discovery (page 5)
  if (currentPage === 5) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader
            title="Understanding You"
            subtitle="These questions help personalize your experience"
            isDark={isDark}
          />

          <MultipleChoiceSection
            title="How do you currently work through mental blocks?"
            options={trackingMethodOptions}
            selected={data.currentTrackingMethod}
            onSelect={(value) => updateData({ currentTrackingMethod: value })}
          />

          <TextFieldSection
            title="What's been your biggest frustration with training lately?"
            value={data.biggestFrustration}
            onChangeText={(text) => updateData({ biggestFrustration: text })}
            placeholder="Enter your frustration..."
          />

          <MultipleChoiceSection
            title="How often do you reflect on your training sessions?"
            options={reflectionFrequencyOptions}
            selected={data.reflectionFrequency}
            onSelect={(value) => updateData({ reflectionFrequency: value })}
          />

          <TextFieldSection
            title="What do you think is holding you back from your best performance?"
            value={data.whatHoldingBack}
            onChangeText={(text) => updateData({ whatHoldingBack: text })}
            placeholder="Enter your barrier..."
          />

          <FormSubmitButton
            title="Continue"
            icon="arrow-forward"
            isLoading={false}
            isEnabled={isPainPointValid}
            accentColor={colors.blueEnergy}
            onPress={nextPage}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Render user info (page 6)
  if (currentPage === 6) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="Building Your Profile" isDark={isDark} />

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

          <MultipleChoiceSection
            title="What sport do you compete in?"
            options={sportOptions}
            selected={data.sport}
            onSelect={(value) => updateData({ sport: value })}
          />

          <SliderSection
            title="Years of Experience"
            value={data.yearsExperience}
            onValueChange={(value) => updateData({ yearsExperience: value })}
            minString="0"
            maxString="10+"
            minValue={0}
            maxValue={10}
          />

          <SliderSection
            title="Meets Per Year"
            value={data.meetsPerYear}
            onValueChange={(value) => updateData({ meetsPerYear: value })}
            minString="0"
            maxString="10+"
            minValue={0}
            maxValue={10}
          />

          <FormSubmitButton
            title="Continue"
            icon="arrow-forward"
            isLoading={false}
            isEnabled={isUserInfoValid}
            accentColor={colors.blueEnergy}
            onPress={nextPage}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Render sporting info (page 7)
  if (currentPage === 7) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="Building Your Profile" isDark={isDark} />

          <TextFieldSection
            title="What's your next 6-12 month goal?"
            value={data.goal}
            onChangeText={(text) => updateData({ goal: text })}
            placeholder="Enter your goal..."
          />

          <MultipleChoiceSection
            title={`What is the hardest part of ${data.sport === 'Olympic Weightlifting' ? 'Weightlifting' : 'Powerlifting'} mentally for you?`}
            options={struggleOptions}
            selected={data.biggestStruggle}
            onSelect={(value) => updateData({ biggestStruggle: value })}
          />

          <TextFieldSection
            title="What's your next meet?"
            value={data.nextComp}
            onChangeText={(text) => updateData({ nextComp: text })}
            placeholder="Enter meet name..."
            multiline={false}
          />

          <DatePickerSection
            title="Next meet date?"
            value={data.nextCompDate}
            onChange={(date) => updateData({ nextCompDate: date })}
          />

          <FormSubmitButton
            title="Continue"
            icon="arrow-forward"
            isLoading={false}
            isEnabled={isSportingInfoValid}
            accentColor={colors.blueEnergy}
            onPress={nextPage}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Render training days (page 8)
  if (currentPage === 8) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="Building Your Profile" isDark={isDark} />

          <View
            style={[
              styles.trainingCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: `${colors.blueEnergy}33`,
              },
            ]}
          >
            <View style={styles.header}>
              <LinearGradient
                colors={[`${colors.blueEnergy}40`, `${colors.blueEnergy}1A`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="calendar" size={18} color={colors.blueEnergy} />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                When do you train?
              </Text>
            </View>

            <View style={styles.daysContainer}>
              {weekDays.map((day) => {
                const isSelected = !!data.trainingDays[day];
                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isSelected
                          ? colors.blueEnergy
                          : isDark
                            ? '#2A2A2A'
                            : '#F0F0F0',
                        borderColor: isSelected ? colors.blueEnergy : 'transparent',
                      },
                    ]}
                    onPress={() => toggleTrainingDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? '#FFFFFF' : isDark ? '#AAAAAA' : '#666666' },
                      ]}
                    >
                      {day.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {Object.keys(data.trainingDays).length > 0 && (
              <View style={styles.selectedDaysContainer}>
                <Text style={[styles.selectedDaysTitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                  Training Times:
                </Text>
                {Object.entries(data.trainingDays).map(([day, time]) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.selectedDayRow,
                      { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
                    ]}
                    onPress={() => setSelectedDayForTime(day)}
                  >
                    <Text style={[styles.selectedDayText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {day}
                    </Text>
                    <Text style={[styles.selectedTimeText, { color: colors.blueEnergy }]}>
                      {time}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.blueEnergy} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <FormSubmitButton
            title="Continue"
            icon="arrow-forward"
            isLoading={false}
            isEnabled={isTrainingDaysValid}
            accentColor={colors.blueEnergy}
            onPress={nextPage}
          />
        </ScrollView>

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
                            ? `${colors.blueEnergy}1F`
                            : 'transparent',
                      },
                    ]}
                    onPress={() => updateTrainingTime(selectedDayForTime, time)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color:
                            data.trainingDays[selectedDayForTime] === time
                              ? colors.blueEnergy
                              : isDark
                                ? '#FFFFFF'
                                : '#000000',
                          fontWeight:
                            data.trainingDays[selectedDayForTime] === time ? '600' : '400',
                        },
                      ]}
                    >
                      {time}
                    </Text>
                    {data.trainingDays[selectedDayForTime] === time && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.blueEnergy} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Render setup/customizing (page 9)
  if (currentPage === 9) {
    return (
      <View
        style={[
          styles.container,
          styles.setupContainer,
          { backgroundColor: isDark ? '#000000' : '#F5F5F5' },
        ]}
      >
        <SectionHeader title="Setting Up" isDark={isDark} />

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
            We're setting up your personalized journal based on your preferences
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

          {setupProgress >= 100 && (
            <View style={styles.completeContainer}>
              <View style={[styles.completeBadge, { backgroundColor: `${colors.scoreGreen}1F` }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.scoreGreen} />
                <Text style={[styles.completeText, { color: colors.scoreGreen }]}>Complete</Text>
              </View>
            </View>
          )}
        </View>

        {setupProgress >= 100 && (
          <FormSubmitButton
            title="Let's get started!"
            icon="rocket"
            isLoading={isLoading}
            isEnabled={true}
            accentColor={colors.blueEnergy}
            onPress={handleCompleteOnboarding}
          />
        )}
      </View>
    );
  }

  return null;
}

// Helper Components
const SectionHeader: React.FC<{ title: string; subtitle?: string; isDark: boolean }> = ({
  title,
  subtitle,
  isDark,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
    {subtitle && (
      <Text style={[styles.sectionSubtitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
        {subtitle}
      </Text>
    )}
  </View>
);

const InputCard: React.FC<{
  isDark: boolean;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}> = ({ isDark, title, icon, children }) => (
  <View
    style={[
      styles.inputCard,
      {
        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
        borderColor: `${colors.blueEnergy}33`,
      },
    ]}
  >
    <View style={styles.header}>
      <LinearGradient
        colors={[`${colors.blueEnergy}40`, `${colors.blueEnergy}1A`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconCircle}
      >
        <Ionicons name={icon} size={18} color={colors.blueEnergy} />
      </LinearGradient>
      <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
    </View>
    <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    lineHeight: 22,
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
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDaysContainer: {
    marginTop: 8,
  },
  selectedDaysTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedDayText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  selectedTimeText: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
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
  setupContainer: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  setupContent: {
    alignItems: 'center',
    marginBottom: 40,
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
});
