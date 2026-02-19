import { colors } from '@/constants/colors';
import { queryOpenRouter } from '@/services/openrouter';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import ReAnimated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  trackMentalExerciseCompleted,
  trackMentalExerciseStarted,
  trackScreenView,
} from '@/utils/analytics';

type ReviewState = 'vent' | 'processing' | 'reframed';

const BLUE_ENERGY = '#5386E4';
const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);

export default function ObjectiveReviewScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { userId, getToken } = useAuth();

  const convexUser = useQuery(api.users.getByUserId, userId ? { userId } : 'skip');
  const insertReview = useMutation(api.objectiveReviews.insert);
  const historyReviews = useQuery(api.objectiveReviews.listByUser, userId ? { userId } : 'skip');

  const [currentState, setCurrentState] = useState<ReviewState>('vent');
  const [ventText, setVentText] = useState('');
  const [reframedText, setReframedText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const exerciseStartRef = useRef<number>(Date.now());

  const userSport = convexUser?.sport ?? 'Olympic Weightlifting';
  const isLoadingHistory = historyReviews === undefined;

  useEffect(() => {
    trackScreenView('objective_review');
    trackMentalExerciseStarted('objective_review');
  }, []);

  const handleReframe = useCallback(async () => {
    if (!ventText.trim()) {
      Alert.alert('Input Required', 'Please describe what happened before reframing.');
      return;
    }

    setCurrentState('processing');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Missing authentication token');
      }

      const prompt = `You are a professional ${userSport} coach. An athlete just shared their emotional reaction to a set. Your job is to transform their emotional, subjective feedback into objective, actionable coaching cues.

Athlete's emotional feedback:
"${ventText}"

Transform this into objective coaching perspective. Focus on:
1. Identifying the specific technical issue (bar path, positioning, timing, etc.)
2. Providing concrete, actionable cues for the next attempt
3. Using technical language appropriate for ${userSport}
4. Being direct and helpful, not overly positive or negative

Format your response as a brief coaching note that the athlete can use as a training cue. Keep it concise (2-3 sentences max). Focus on what to do differently, not what went wrong.

Example transformation:
Athlete: "I'm a disaster. I let the bar drift forward and I just gave up because I felt weak."
Coach: "The bar path drifted forward at the sticking point. Focus on 'chest up' and 'driving through the mid-foot' on the next attempt."

Response Format:
    - No emojis
    - Do not include any greetings, get straight to the data
    - Write as plain text, no markdown`;

      const response = await queryOpenRouter({
        prompt,
        token,
        purpose: 'objective_review',
      });
      setReframedText(response);
      setCurrentState('reframed');
    } catch (err) {
      console.error('Reframe error:', err);
      Alert.alert('Error', 'Unable to generate reframe. Please try again.');
      setCurrentState('vent');
    }
  }, [ventText, userSport, getToken]);

  const handleSave = useCallback(async () => {
    if (!userId) return;

    try {
      await insertReview({
        userId,
        athleteVent: ventText,
        coachReframe: reframedText,
      });

      Alert.alert('Success!', 'Your training cues have been saved!', [
        {
          text: 'OK',
          onPress: () => {
            setVentText('');
            setReframedText('');
            setCurrentState('vent');
          },
        },
      ]);
      const durationSeconds = (Date.now() - exerciseStartRef.current) / 1000;
      trackMentalExerciseCompleted('objective_review', durationSeconds);
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to save. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [userId, ventText, reframedText, insertReview]);

  const handleReset = useCallback(() => {
    setVentText('');
    setReframedText('');
    setCurrentState('vent');
  }, []);


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? '#FFF' : '#000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
          Objective Review
        </Text>
        <Pressable onPress={() => setShowHistory(true)} style={styles.historyButton}>
          <MaterialCommunityIcons name="history" size={20} color={BLUE_ENERGY} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {currentState === 'vent' && (
          <VentModeView
            isDark={isDark}
            ventText={ventText}
            onChangeText={setVentText}
            onReframe={handleReframe}
          />
        )}

        {currentState === 'processing' && <ProcessingView />}

        {currentState === 'reframed' && (
          <ReframedView
            isDark={isDark}
            ventText={ventText}
            reframedText={reframedText}
            onSave={handleSave}
            onReset={handleReset}
          />
        )}
      </ScrollView>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>
              Training Cues History
            </Text>
            <Pressable onPress={() => setShowHistory(false)} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={BLUE_ENERGY} />
            </Pressable>
          </View>

          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE_ENERGY} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : historyReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={64} color="#666" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#000' }]}>
                No Training Cues Yet
              </Text>
              <Text style={styles.emptyText}>
                Your saved coaching perspectives will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyContent}>
              {(historyReviews ?? []).map((review) => {
                const isExpanded = expandedReviewId === review._id;
                const date = new Date(review._creationTime);
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <Pressable
                    key={review._id}
                    style={[
                      styles.historyCard,
                      { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
                    ]}
                    onPress={() => setExpandedReviewId(isExpanded ? null : review._id)}
                  >
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historyDate}>{formattedDate}</Text>
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={BLUE_ENERGY}
                      />
                    </View>

                    {isExpanded && (
                      <>
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHeader}>
                            <MaterialCommunityIcons name="account" size={14} color="#999" />
                            <Text style={styles.historySectionTitle}>Athlete&apos;s Voice</Text>
                          </View>
                          <Text style={[styles.historyText, { color: '#999' }]}>
                            {review.athleteVent}
                          </Text>
                        </View>

                        <View style={styles.historySection}>
                          <View style={styles.historySectionHeader}>
                            <MaterialCommunityIcons name="shield-check" size={14} color={BLUE_ENERGY} />
                            <Text style={[styles.historySectionTitle, { color: BLUE_ENERGY }]}>
                              Coach&apos;s Voice
                            </Text>
                          </View>
                          <Text style={[styles.historyText, { color: isDark ? '#FFF' : '#000' }]}>
                            {review.coachReframe}
                          </Text>
                        </View>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function VentModeView({
  isDark,
  ventText,
  onChangeText,
  onReframe,
}: {
  isDark: boolean;
  ventText: string;
  onChangeText: (text: string) => void;
  onReframe: () => void;
}) {
  const reframeScale = useSharedValue(1);
  const reframeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reframeScale.value }],
  }));

  return (
    <ReAnimated.View
      entering={FadeInDown.duration(500).springify().damping(16)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? `${BLUE_ENERGY}40` : `${BLUE_ENERGY}20`,
          boxShadow: isDark
            ? `0 8px 24px ${BLUE_ENERGY}25`
            : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${BLUE_ENERGY}30`,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.orange}40` }]}>
          <MaterialCommunityIcons name="fire" size={20} color={colors.orange} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#000' }]}>
            What happened?
          </Text>
          <Text style={styles.cardSubtitle}>
            Describe the frustrating moment. Get it all out—no filter.
          </Text>
        </View>
      </View>

      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            color: isDark ? '#FFF' : '#000',
            borderColor: isDark ? '#333' : '#E0E0E0',
          },
        ]}
        placeholder="I was so frustrated when..."
        placeholderTextColor="#999"
        value={ventText}
        onChangeText={onChangeText}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />

      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onReframe();
        }}
        onPressIn={() => {
          reframeScale.value = withSpring(0.95);
        }}
        onPressOut={() => {
          reframeScale.value = withSpring(1);
        }}
        style={[
          styles.reframeButton,
          reframeAnimStyle,
          !ventText.trim() && styles.buttonDisabled,
        ]}
        disabled={!ventText.trim()}
      >
        <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />
        <Text style={styles.buttonText}>Convert to Coach Perspective</Text>
      </AnimatedPressable>
    </ReAnimated.View>
  );
}

function ProcessingView() {
  return (
    <View style={styles.processingCard}>
      <View style={styles.processingIcon}>
        <MaterialCommunityIcons name="brain" size={32} color={BLUE_ENERGY} />
      </View>
      <ActivityIndicator size="large" color={BLUE_ENERGY} style={styles.spinner} />
      <Text style={styles.processingText}>Take a deep breath...</Text>
    </View>
  );
}

function ReframedView({
  isDark,
  ventText,
  reframedText,
  onSave,
  onReset,
}: {
  isDark: boolean;
  ventText: string;
  reframedText: string;
  onSave: () => void;
  onReset: () => void;
}) {
  const saveScale = useSharedValue(1);
  const resetScale = useSharedValue(1);
  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));
  const resetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resetScale.value }],
  }));

  return (
    <>
      <View style={[styles.reframedHeader, { marginBottom: 16 }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: `${BLUE_ENERGY}40` }]}>
            <MaterialCommunityIcons name="lightbulb" size={20} color={BLUE_ENERGY} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#000' }]}>
              Reframed Cues
            </Text>
            <Text style={styles.cardSubtitle}>Compare perspectives</Text>
          </View>
        </View>
      </View>

      <ReAnimated.View
        entering={FadeInDown.duration(400).springify().damping(16)}
      >
        <View style={[styles.ventCard, { backgroundColor: isDark ? '#FFFFFF08' : '#00000008' }]}>
          <View style={styles.ventCardHeader}>
            <MaterialCommunityIcons name="account" size={16} color="#999" />
            <Text style={styles.ventCardTitle}>The Athlete&apos;s Voice</Text>
          </View>
          <Text style={[styles.ventTextDisplay, { color: '#999' }]}>{ventText}</Text>
        </View>
      </ReAnimated.View>

      <ReAnimated.View
        entering={FadeInDown.delay(100).duration(400).springify().damping(16)}
      >
        <View
          style={[
            styles.coachCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              borderColor: BLUE_ENERGY,
              shadowColor: BLUE_ENERGY,
            },
          ]}
        >
          <View style={styles.coachCardHeader}>
            <MaterialCommunityIcons name="shield-check" size={16} color={BLUE_ENERGY} />
            <Text style={[styles.coachCardTitle, { color: BLUE_ENERGY }]}>The Coach&apos;s Voice</Text>
          </View>
          <Text style={[styles.reframedText, { color: isDark ? '#FFF' : '#000' }]}>
            {reframedText}
          </Text>
        </View>
      </ReAnimated.View>

      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSave();
        }}
        onPressIn={() => {
          saveScale.value = withSpring(0.95);
        }}
        onPressOut={() => {
          saveScale.value = withSpring(1);
        }}
        style={[styles.button, saveAnimStyle, { backgroundColor: BLUE_ENERGY, marginTop: 20 }]}
      >
        <MaterialCommunityIcons name="plus-circle" size={18} color="#FFF" />
        <Text style={styles.buttonText}>Add to Training Cues</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onReset();
        }}
        onPressIn={() => {
          resetScale.value = withSpring(0.95);
        }}
        onPressOut={() => {
          resetScale.value = withSpring(1);
        }}
        style={[styles.button, styles.buttonSecondary, resetAnimStyle, { marginTop: 12 }]}
      >
        <MaterialCommunityIcons name="restart" size={18} color={BLUE_ENERGY} />
        <Text style={[styles.buttonText, { color: BLUE_ENERGY }]}>Start Over</Text>
      </AnimatedPressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BLUE_ENERGY}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BLUE_ENERGY}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 18,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 160,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  reframeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 16,
    gap: 10,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BLUE_ENERGY,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  processingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${BLUE_ENERGY}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginVertical: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  reframedHeader: {
    paddingHorizontal: 16,
  },
  ventCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF10',
  },
  ventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ventCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  ventTextDisplay: {
    fontSize: 14,
    lineHeight: 20,
  },
  coachCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  coachCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  coachCardTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  reframedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BLUE_ENERGY}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyScroll: {
    flex: 1,
  },
  historyContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: BLUE_ENERGY,
  },
  historySection: {
    gap: 8,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historySectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  historyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
