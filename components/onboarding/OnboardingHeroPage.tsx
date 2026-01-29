import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroPageData {
  primaryIcon: keyof typeof Ionicons.glyphMap;
  secondaryIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  buttonText: string;
  accentColor: string;
}

interface OnboardingHeroPageProps {
  pageData: HeroPageData;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
}

export const OnboardingHeroPage: React.FC<OnboardingHeroPageProps> = ({
  pageData,
  onNext,
  currentStep,
  totalSteps,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const iconScale = useRef(new Animated.Value(0)).current;
  const secondaryScale = useRef(new Animated.Value(0)).current;
  const secondaryOpacity = useRef(new Animated.Value(0)).current;
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Reset animations
    iconScale.setValue(0);
    secondaryScale.setValue(0);
    secondaryOpacity.setValue(0);
    orbitRotation.setValue(0);
    buttonOpacity.setValue(0);
    buttonTranslateY.setValue(20);

    // Start animations
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(secondaryScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(secondaryOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Button fade in
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(buttonTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous orbit rotation - store reference for cleanup
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    orbitLoop.start();

    // Cleanup: stop the orbit animation when currentStep changes or component unmounts
    return () => {
      orbitLoop.stop();
    };
  }, [currentStep]);

  const orbitRotateStyle = {
    transform: [
      {
        rotate: orbitRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Background with gradient */}
      <LinearGradient
        colors={
          isDark
            ? [`${pageData.accentColor}15`, '#000000']
            : [`${pageData.accentColor}08`, '#F5F5F5']
        }
        locations={[0, 0.9]}
        style={styles.backgroundGradient}
      />

      {/* Content wrapper */}
      <View style={styles.contentWrapper}>
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index < currentStep ? pageData.accentColor : isDark ? '#333333' : '#DDDDDD',
                  width: index === currentStep - 1 ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Hero Graphic */}
        <View style={styles.heroContainer}>
        {/* Background circles */}
        <View style={[styles.circle, styles.circle1, { borderColor: `${pageData.accentColor}15` }]} />
        <View style={[styles.circle, styles.circle2, { borderColor: `${pageData.accentColor}10` }]} />
        <View style={[styles.circle, styles.circle3, { borderColor: `${pageData.accentColor}08` }]} />

        {/* Main Icon */}
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <LinearGradient
            colors={[pageData.accentColor, `${pageData.accentColor}99`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainIconCircle}
          >
            <Ionicons name={pageData.primaryIcon} size={48} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Secondary Icon */}
        <Animated.View
          style={[
            styles.secondaryIconContainer,
            {
              transform: [{ scale: secondaryScale }],
              opacity: secondaryOpacity,
            },
          ]}
        >
          <View style={[styles.secondaryIconCircle, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <Ionicons name={pageData.secondaryIcon} size={20} color={pageData.accentColor} />
          </View>
        </Animated.View>
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {pageData.title}
        </Text>
        <Text style={[styles.message, { color: isDark ? '#AAAAAA' : '#666666' }]}>
          {pageData.message}
        </Text>
      </View>

        {/* Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onNext}
          >
            <LinearGradient
              colors={[pageData.accentColor, `${pageData.accentColor}D9`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.buttonGradient, { shadowColor: pageData.accentColor }]}
            >
              <Text style={styles.buttonText}>{pageData.buttonText}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
  },
  circle1: {
    width: 200,
    height: 200,
  },
  circle2: {
    width: 260,
    height: 260,
  },
  circle3: {
    width: 320,
    height: 320,
  },
  orbitContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignItems: 'center',
  },
  orbitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mainIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  secondaryIconContainer: {
    position: 'absolute',
    top: 60,
    right: SCREEN_WIDTH / 2 - 100,
  },
  secondaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  message: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
