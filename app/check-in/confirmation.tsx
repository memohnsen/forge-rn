import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckInConfirmationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { overallScore, physicalScore, mentalScore, selectedLift, selectedIntensity } =
    useLocalSearchParams<{
      overallScore: string;
      physicalScore: string;
      mentalScore: string;
      selectedLift: string;
      selectedIntensity: string;
    }>();

  const overall = parseInt(overallScore || '0');
  const physical = parseInt(physicalScore || '0');
  const mental = parseInt(mentalScore || '0');

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.scoreGreen;
    if (score >= 60) return colors.scoreYellow;
    return colors.scoreRed;
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "You're ready to crush it!";
    if (score >= 60) return 'Solid foundation for training';
    return 'Consider adjusting intensity today';
  };

  const overallColor = getScoreColor(overall);

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[`${colors.scoreGreen}40`, `${colors.scoreGreen}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark-circle" size={48} color={colors.scoreGreen} />
          </LinearGradient>
        </View>

        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Check-In Complete!
        </Text>

        <Text style={styles.subtitle}>
          {selectedIntensity} {selectedLift} Session
        </Text>

        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              shadowColor: overallColor,
              borderColor: `${overallColor}40`,
            },
          ]}
        >
          <Text style={styles.scoreLabel}>Overall Readiness</Text>
          <View style={[styles.scoreCircle, { borderColor: `${overallColor}4D` }]}>
            <LinearGradient
              colors={[`${overallColor}4D`, `${overallColor}1A`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreGradient}
            >
              <Text style={[styles.scoreValue, { color: overallColor }]}>{overall}%</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.scoreMessage, { color: overallColor }]}>
            {getScoreMessage(overall)}
          </Text>
        </View>

        <View style={styles.breakdownContainer}>
          <View
            style={[
              styles.breakdownCard,
              { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
            ]}
          >
            <Text style={styles.breakdownLabel}>Physical</Text>
            <Text style={[styles.breakdownValue, { color: getScoreColor(physical) }]}>
              {physical}%
            </Text>
          </View>
          <View
            style={[
              styles.breakdownCard,
              { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
            ]}
          >
            <Text style={styles.breakdownLabel}>Mental</Text>
            <Text style={[styles.breakdownValue, { color: getScoreColor(mental) }]}>
              {mental}%
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <Pressable style={styles.doneButton} onPress={handleDone}>
          <LinearGradient
            colors={[colors.blueEnergy, `${colors.blueEnergy}D9`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneGradient}
          >
            <Text style={styles.doneText}>Done</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  scoreCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scoreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreMessage: {
    fontSize: 15,
    fontWeight: '600',
  },
  breakdownContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  doneButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  doneGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
