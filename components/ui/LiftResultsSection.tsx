import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

interface LiftAttemptRowProps {
  liftName: string;
  attempt1: string;
  attempt2: string;
  attempt3: string;
  onChangeAttempt1: (value: string) => void;
  onChangeAttempt2: (value: string) => void;
  onChangeAttempt3: (value: string) => void;
  isDark: boolean;
}

const LiftAttemptRow: React.FC<LiftAttemptRowProps> = ({
  liftName,
  attempt1,
  attempt2,
  attempt3,
  onChangeAttempt1,
  onChangeAttempt2,
  onChangeAttempt3,
  isDark,
}) => {
  const attempts = [
    { value: attempt1, onChange: onChangeAttempt1 },
    { value: attempt2, onChange: onChangeAttempt2 },
    { value: attempt3, onChange: onChangeAttempt3 },
  ];

  return (
    <View style={styles.liftRow}>
      <Text style={[styles.liftName, { color: colors.blueEnergy }]}>{liftName}</Text>
      <View style={styles.attemptsRow}>
        {attempts.map((attempt, index) => (
          <TextInput
            key={index}
            style={[
              styles.attemptInput,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                color: isDark ? '#FFFFFF' : '#000000',
              },
            ]}
            value={attempt.value}
            onChangeText={attempt.onChange}
            placeholder={`${index + 1}`}
            placeholderTextColor="#999"
            keyboardType="numbers-and-punctuation"
            textAlign="center"
          />
        ))}
      </View>
    </View>
  );
};

interface PLLiftResultsSectionProps {
  squat1: string;
  squat2: string;
  squat3: string;
  bench1: string;
  bench2: string;
  bench3: string;
  deadlift1: string;
  deadlift2: string;
  deadlift3: string;
  onChangeSquat1: (v: string) => void;
  onChangeSquat2: (v: string) => void;
  onChangeSquat3: (v: string) => void;
  onChangeBench1: (v: string) => void;
  onChangeBench2: (v: string) => void;
  onChangeBench3: (v: string) => void;
  onChangeDeadlift1: (v: string) => void;
  onChangeDeadlift2: (v: string) => void;
  onChangeDeadlift3: (v: string) => void;
}

interface WLLiftResultsSectionProps {
  snatch1: string;
  snatch2: string;
  snatch3: string;
  cj1: string;
  cj2: string;
  cj3: string;
  onChangeSnatch1: (v: string) => void;
  onChangeSnatch2: (v: string) => void;
  onChangeSnatch3: (v: string) => void;
  onChangeCj1: (v: string) => void;
  onChangeCj2: (v: string) => void;
  onChangeCj3: (v: string) => void;
}

export const PLLiftResultsSection: React.FC<PLLiftResultsSectionProps> = ({
  squat1,
  squat2,
  squat3,
  bench1,
  bench2,
  bench3,
  deadlift1,
  deadlift2,
  deadlift3,
  onChangeSquat1,
  onChangeSquat2,
  onChangeSquat3,
  onChangeBench1,
  onChangeBench2,
  onChangeBench3,
  onChangeDeadlift1,
  onChangeDeadlift2,
  onChangeDeadlift3,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const calculateBest = (a1: string, a2: string, a3: string) => {
    return Math.max(parseInt(a1) || 0, parseInt(a2) || 0, parseInt(a3) || 0);
  };

  const squatBest = calculateBest(squat1, squat2, squat3);
  const benchBest = calculateBest(bench1, bench2, bench3);
  const deadliftBest = calculateBest(deadlift1, deadlift2, deadlift3);
  const total = squatBest + benchBest + deadliftBest;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          shadowColor: colors.blueEnergy,
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
          <Ionicons name="barbell" size={18} color={colors.blueEnergy} />
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            What numbers did you hit?
          </Text>
          <Text style={styles.subtitle}>Write a miss as a negative (ex: -115)</Text>
        </View>
      </View>

      <LiftAttemptRow
        liftName="Squat"
        attempt1={squat1}
        attempt2={squat2}
        attempt3={squat3}
        onChangeAttempt1={onChangeSquat1}
        onChangeAttempt2={onChangeSquat2}
        onChangeAttempt3={onChangeSquat3}
        isDark={isDark}
      />

      <LiftAttemptRow
        liftName="Bench"
        attempt1={bench1}
        attempt2={bench2}
        attempt3={bench3}
        onChangeAttempt1={onChangeBench1}
        onChangeAttempt2={onChangeBench2}
        onChangeAttempt3={onChangeBench3}
        isDark={isDark}
      />

      <LiftAttemptRow
        liftName="Deadlift"
        attempt1={deadlift1}
        attempt2={deadlift2}
        attempt3={deadlift3}
        onChangeAttempt1={onChangeDeadlift1}
        onChangeAttempt2={onChangeDeadlift2}
        onChangeAttempt3={onChangeDeadlift3}
        isDark={isDark}
      />

      {total > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.blueEnergy }]}>{total}kg</Text>
        </View>
      )}
    </View>
  );
};

export const WLLiftResultsSection: React.FC<WLLiftResultsSectionProps> = ({
  snatch1,
  snatch2,
  snatch3,
  cj1,
  cj2,
  cj3,
  onChangeSnatch1,
  onChangeSnatch2,
  onChangeSnatch3,
  onChangeCj1,
  onChangeCj2,
  onChangeCj3,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const calculateBest = (a1: string, a2: string, a3: string) => {
    return Math.max(parseInt(a1) || 0, parseInt(a2) || 0, parseInt(a3) || 0);
  };

  const snatchBest = calculateBest(snatch1, snatch2, snatch3);
  const cjBest = calculateBest(cj1, cj2, cj3);
  const total = snatchBest + cjBest;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          shadowColor: colors.blueEnergy,
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
          <Ionicons name="barbell" size={18} color={colors.blueEnergy} />
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            What numbers did you hit?
          </Text>
          <Text style={styles.subtitle}>Write a miss as a negative (ex: -115)</Text>
        </View>
      </View>

      <LiftAttemptRow
        liftName="Snatch"
        attempt1={snatch1}
        attempt2={snatch2}
        attempt3={snatch3}
        onChangeAttempt1={onChangeSnatch1}
        onChangeAttempt2={onChangeSnatch2}
        onChangeAttempt3={onChangeSnatch3}
        isDark={isDark}
      />

      <LiftAttemptRow
        liftName="Clean & Jerk"
        attempt1={cj1}
        attempt2={cj2}
        attempt3={cj3}
        onChangeAttempt1={onChangeCj1}
        onChangeAttempt2={onChangeCj2}
        onChangeAttempt3={onChangeCj3}
        isDark={isDark}
      />

      {total > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.gold }]}>{total}kg</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  liftRow: {
    gap: 10,
  },
  liftName: {
    fontSize: 15,
    fontWeight: '600',
  },
  attemptsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attemptInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});
