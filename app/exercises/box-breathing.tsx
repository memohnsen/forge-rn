import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import ReAnimated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import {
  trackMentalExerciseCompleted,
  trackMentalExerciseStarted,
  trackScreenView,
} from '@/utils/analytics';

const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);

const PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];

export default function BoxBreathingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [holdDuration, setHoldDuration] = useState(4);
  const [numberOfRounds, setNumberOfRounds] = useState(10);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const exerciseStartRef = useRef<number | null>(null);

  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  useEffect(() => {
    trackScreenView('box_breathing');
  }, []);

  const totalTime = holdDuration * 4 * numberOfRounds;
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = totalTime % 60;
  const totalTimeFormatted =
    totalMinutes > 0 ? `${totalMinutes} min ${totalSeconds} sec` : `${totalSeconds} sec`;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {isExerciseActive ? (
        <BreathingExercise
          holdDuration={holdDuration}
          numberOfRounds={numberOfRounds}
          onComplete={() => {
            if (exerciseStartRef.current) {
              const durationSeconds = (Date.now() - exerciseStartRef.current) / 1000;
              trackMentalExerciseCompleted('box_breathing', durationSeconds);
            }
            setIsExerciseActive(false);
          }}
          isDark={isDark}
        />
      ) : (
        <>
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={isDark ? '#FFF' : '#000'}
              />
            </Pressable>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
              Box Breathing
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ReAnimated.View entering={FadeInDown.delay(0).duration(500).springify().damping(16)}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderColor: '#64B4DC33',
                    boxShadow: isDark
                      ? '0 8px 24px #64B4DC25'
                      : '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px #64B4DC30',
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={['#64B4DC40', '#64B4DC1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}
                  >
                    <MaterialCommunityIcons name="weather-windy" size={20} color="#64B4DC" />
                  </LinearGradient>

                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#000' }]}>
                      Box Breathing
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {holdDuration}-{holdDuration}-{holdDuration}-{holdDuration} pattern
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDescription}>
                  Inhale, hold, exhale, hold. Each phase lasts the same duration to calm your mind
                  and body.
                </Text>
              </View>
            </ReAnimated.View>

            <ReAnimated.View entering={FadeInDown.delay(50).duration(500).springify().damping(16)}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderColor: isDark ? '#64B4DC40' : '#64B4DC20',
                    boxShadow: isDark
                      ? '0 8px 24px #64B4DC20'
                      : '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px #64B4DC25',
                  },
                ]}
              >
                <View style={styles.sliderHeader}>
                  <LinearGradient
                    colors={['#64B4DC40', '#64B4DC1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sliderIcon}
                  >
                    <MaterialCommunityIcons name="timer" size={16} color="#64B4DC" />
                  </LinearGradient>
                  <View style={styles.sliderText}>
                    <Text style={[styles.sliderTitle, { color: isDark ? '#FFF' : '#000' }]}>
                      Breath Duration
                    </Text>
                    <Text style={styles.sliderSubtitle}>seconds per phase</Text>
                  </View>
                  <Text style={[styles.sliderValue, { color: '#64B4DC' }]}>{holdDuration}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={2}
                  maximumValue={8}
                  step={1}
                  value={holdDuration}
                  onValueChange={setHoldDuration}
                  minimumTrackTintColor="#64B4DC"
                  maximumTrackTintColor={isDark ? '#333' : '#E5E5E5'}
                  thumbTintColor="#64B4DC"
                />
              </View>
            </ReAnimated.View>

            <ReAnimated.View entering={FadeInDown.delay(100).duration(500).springify().damping(16)}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderColor: isDark ? '#64B4DC40' : '#64B4DC20',
                    boxShadow: isDark
                      ? '0 8px 24px #64B4DC20'
                      : '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px #64B4DC25',
                  },
                ]}
              >
                <View style={styles.sliderHeader}>
                  <LinearGradient
                    colors={['#64B4DC40', '#64B4DC1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sliderIcon}
                  >
                    <MaterialCommunityIcons name="refresh" size={16} color="#64B4DC" />
                  </LinearGradient>
                  <View style={styles.sliderText}>
                    <Text style={[styles.sliderTitle, { color: isDark ? '#FFF' : '#000' }]}>
                      Number of Rounds
                    </Text>
                    <Text style={styles.sliderSubtitle}>complete cycles</Text>
                  </View>
                  <Text style={[styles.sliderValue, { color: '#64B4DC' }]}>{numberOfRounds}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={20}
                  step={1}
                  value={numberOfRounds}
                  onValueChange={setNumberOfRounds}
                  minimumTrackTintColor="#64B4DC"
                  maximumTrackTintColor={isDark ? '#333' : '#E5E5E5'}
                  thumbTintColor="#64B4DC"
                />
              </View>
            </ReAnimated.View>

            <ReAnimated.View entering={FadeInDown.delay(150).duration(500).springify().damping(16)}>
              <View
                style={[
                  styles.totalTimeCard,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isDark ? '#64B4DC40' : '#64B4DC20',
                    boxShadow: isDark
                      ? '0 8px 24px #64B4DC20'
                      : '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px #64B4DC25',
                  },
                ]}
              >
                <Text style={styles.totalTimeLabel}>Total Time</Text>
                <Text style={[styles.totalTimeValue, { color: '#64B4DC' }]}>
                  {totalTimeFormatted}
                </Text>
              </View>
            </ReAnimated.View>

            <ReAnimated.View entering={FadeInDown.delay(200).duration(500).springify().damping(16)}>
              <AnimatedPressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  exerciseStartRef.current = Date.now();
                  trackMentalExerciseStarted('box_breathing');
                  setIsExerciseActive(true);
                }}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
                style={[styles.startButton, buttonAnimatedStyle]}
              >
                <LinearGradient
                  colors={['#64B4DC', '#64B4DCD9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <MaterialCommunityIcons name="play" size={20} color="#FFF" />
                  <Text style={styles.startButtonText}>Start Breathing</Text>
                </LinearGradient>
              </AnimatedPressable>
            </ReAnimated.View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

function BreathingExercise({
  holdDuration,
  numberOfRounds,
  onComplete,
  isDark,
}: {
  holdDuration: number;
  numberOfRounds: number;
  onComplete: () => void;
  isDark: boolean;
}) {
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  const phaseColors = [
    ['#66CCF2', '#3399E6', '#4D7FD9'], // Inhale - Blue (matches Swift: 0.4,0.8,0.95 / 0.2,0.6,0.9 / 0.3,0.5,0.85)
    ['#9980E6', '#8066D9', '#664DCC'], // Hold - Purple (matches Swift: 0.6,0.5,0.9 / 0.5,0.4,0.85 / 0.4,0.3,0.8)
    ['#F29980', '#E68080', '#D9668C'], // Exhale - Orange-Red (matches Swift: 0.95,0.6,0.5 / 0.9,0.5,0.55 / 0.85,0.4,0.5)
    ['#B299E6', '#9980D9', '#8066CC'], // Hold - Light Purple (matches Swift: 0.7,0.6,0.9 / 0.6,0.5,0.85 / 0.5,0.4,0.8)
  ];

  const currentColors = phaseColors[currentPhase];

  useEffect(() => {
    const totalTime = holdDuration * 4 * numberOfRounds;
    setTotalTimeRemaining(totalTime);

    const interval = setInterval(() => {
      if (!isPaused) {
        setTotalTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete();
            return 0;
          }
          return prev - 1;
        });

        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setCurrentPhase((phase) => {
              const nextPhase = (phase + 1) % 4;
              if (nextPhase === 0) {
                setCurrentRound((round) => round + 1);
              }
              return nextPhase;
            });
            return holdDuration;
          }
          return prev - 1;
        });
      }
    }, 1000);

    setSecondsRemaining(holdDuration);

    return () => clearInterval(interval);
  }, [holdDuration, numberOfRounds, isPaused]);

  useEffect(() => {
    // Glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Scale animation based on phase
    const targetScale = currentPhase === 0 ? 1.0 : currentPhase === 1 ? 1.0 : currentPhase === 2 ? 0.6 : 0.6;

    Animated.timing(scale, {
      toValue: targetScale,
      duration: currentPhase === 0 || currentPhase === 2 ? holdDuration * 1000 : 0,
      useNativeDriver: true,
    }).start();
  }, [currentPhase, holdDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseRound, { color: isDark ? '#FFF' : '#000' }]}>
          Round {currentRound}/{numberOfRounds}
        </Text>
        <Text style={styles.exerciseTime}>{formatTime(totalTimeRemaining)}</Text>
      </View>

      <View style={styles.bubbleContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.glowRing,
              {
                width: 220 + index * 40,
                height: 220 + index * 40,
                borderRadius: (220 + index * 40) / 2,
                borderColor: currentColors[0],
                opacity: glowOpacity.interpolate({
                  inputRange: [0.4, 0.8],
                  outputRange: [0.15 - index * 0.04, 0.15 - index * 0.04],
                }),
                transform: [{ scale }],
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.bubble,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <LinearGradient
            colors={currentColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bubbleGradient}
          >
            <View style={styles.bubbleContent}>
              <Text style={styles.phaseText}>{PHASES[currentPhase]}</Text>
              <Text style={styles.secondsText}>{secondsRemaining}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.phaseIndicators}>
        {PHASES.map((phase, index) => (
          <View key={index} style={styles.phaseIndicator}>
            <View
              style={[
                styles.phaseDot,
                {
                  backgroundColor: index === currentPhase ? currentColors[0] : '#666',
                  transform: [{ scale: index === currentPhase ? 1.3 : 1.0 }],
                },
              ]}
            />
            <Text
              style={[
                styles.phaseLabel,
                { color: index === currentPhase ? currentColors[0] : '#666' },
              ]}
            >
              {phase}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => setIsPaused(!isPaused)}
          style={[styles.controlButton, { flex: 1 }]}
        >
          <LinearGradient
            colors={isPaused ? ['#64B4DC', '#64B4DCD9'] : ['#FF9966', '#FF9966D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.controlButtonGradient}
          >
            <MaterialCommunityIcons
              name={isPaused ? 'play' : 'pause'}
              size={20}
              color="#FFF"
            />
            <Text style={styles.controlButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onComplete} style={[styles.controlButton, { flex: 1 }]}>
          <LinearGradient
            colors={['#FF5555', '#FF5555D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.controlButtonGradient}
          >
            <MaterialCommunityIcons name="stop" size={20} color="#FFF" />
            <Text style={styles.controlButtonText}>Stop</Text>
          </LinearGradient>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#64B4DC22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sliderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderText: {
    flex: 1,
    gap: 2,
  },
  sliderTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderSubtitle: {
    fontSize: 11,
    color: '#666',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  totalTimeCard: {
    padding: 24,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    gap: 8,
  },
  totalTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  totalTimeValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  startButton: {
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginTop: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  exerciseContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  exerciseHeader: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
  },
  exerciseRound: {
    fontSize: 22,
    fontWeight: '700',
  },
  exerciseTime: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
  },
  bubbleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  bubble: {
    width: 250,
    height: 250,
    borderRadius: 125,
    shadowColor: '#64B4DC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  bubbleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContent: {
    alignItems: 'center',
    gap: 8,
  },
  phaseText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  secondsText: {
    fontSize: 48,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  phaseIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 20,
  },
  phaseIndicator: {
    alignItems: 'center',
    gap: 6,
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  phaseLabel: {
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 30,
  },
  controlButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
