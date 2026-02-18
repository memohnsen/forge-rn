import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingQuestionPageProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
  children: React.ReactNode;
}

export const OnboardingQuestionPage: React.FC<OnboardingQuestionPageProps> = ({
  title,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isValid,
  children,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}
      enabled={Platform.OS === 'android'}
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header: Back button + Progress bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
        </Pressable>

        <View style={styles.progressBarContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                {
                  backgroundColor:
                    index < currentStep
                      ? colors.blueEnergy
                      : isDark ? '#333333' : '#DDDDDD',
                },
              ]}
            />
          ))}
        </View>

        {/* Spacer to balance back button */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Title */}
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {title}
        </Text>

        {/* Question content */}
        <View style={styles.contentContainer}>
          {children}
        </View>
      </ScrollView>

      {/* Continue button pinned at bottom */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <FormSubmitButton
          title="Continue"
          icon="arrow-forward"
          isLoading={false}
          isEnabled={isValid}
          accentColor={colors.blueEnergy}
          onPress={onNext}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  contentContainer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 0,
  },
});
