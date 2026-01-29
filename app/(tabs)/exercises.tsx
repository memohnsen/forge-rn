import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type ExerciseCard = {
  title: string;
  description: string;
  buttonName: string;
  icon: string;
  accentColor: string;
  route: string;
};

const EXERCISES: ExerciseCard[] = [
  {
    title: 'Box Breathing',
    description: 'Improve focus, calm the nervous system, and reduce stress.',
    buttonName: 'Begin Breathing',
    icon: 'weather-windy',
    accentColor: '#64B4DC',
    route: '/exercises/box-breathing',
  },
  {
    title: 'Visualization',
    description: 'Build consistency and confidence by mentally rehearsing every aspect of your lift.',
    buttonName: 'Start Visualizing',
    icon: 'eye',
    accentColor: '#A078C8',
    route: '/exercises/visualization',
  },
  {
    title: 'Objective Review',
    description: 'Transform emotional reactions into actionable coaching cues.',
    buttonName: 'Start Reframing',
    icon: 'refresh',
    accentColor: '#F0965A',
    route: '/exercises/objective-review',
  },
  {
    title: 'External Anchor',
    description: 'Ground yourself in your environment to escape spiraling thoughts.',
    buttonName: 'Begin Grounding',
    icon: 'leaf',
    accentColor: '#5AB48C',
    route: '/exercises/external-anchor',
  },
];

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const animations = useRef(EXERCISES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const sequence = animations.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, sequence).start();
  }, [animations]);

  const animatedStyles = useMemo(
    () =>
      animations.map((anim) => ({
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      })),
    [animations]
  );

  const handlePress = (exercise: ExerciseCard) => {
    if (exercise.route === '/exercises/box-breathing') {
      router.push('/exercises/box-breathing');
    } else if (exercise.route === '/exercises/visualization') {
      router.push('/exercises/visualization');
    } else if (exercise.route === '/exercises/objective-review') {
      router.push('/exercises/objective-review');
    } else if (exercise.route === '/exercises/external-anchor') {
      router.push('/exercises/external-anchor');
    } else {
      Alert.alert('Coming soon', `${exercise.title} is coming next.`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Exercises
        </Text>

        <View style={styles.cards}>
          {EXERCISES.map((exercise, index) => (
            <Animated.View key={exercise.title} style={animatedStyles[index]}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderColor: `${exercise.accentColor}33`,
                    shadowColor: exercise.accentColor,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={[`${exercise.accentColor}40`, `${exercise.accentColor}1A`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}
                  >
                    <MaterialCommunityIcons
                      name={exercise.icon as never}
                      size={22}
                      color={exercise.accentColor}
                    />
                  </LinearGradient>

                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {exercise.title}
                    </Text>
                    <Text style={styles.cardDescription}>{exercise.description}</Text>
                  </View>
                </View>

                <Pressable onPress={() => handlePress(exercise)} style={styles.cardButton}>
                  <LinearGradient
                    colors={[exercise.accentColor, `${exercise.accentColor}D9`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardButtonGradient}
                  >
                    <Text style={styles.cardButtonText}>{exercise.buttonName}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  cards: {
    gap: 16,
    paddingTop: 12,
  },
  card: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  cardButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
