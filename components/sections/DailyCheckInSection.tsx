import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

interface DailyCheckInSectionProps {
  streakCount: string;
  streakLabel: string;
  streakStatus: string;
  streakColor: string;
  streakIcon: string;
}

export const DailyCheckInSection: React.FC<DailyCheckInSectionProps> = ({
  streakCount,
  streakLabel,
  streakStatus,
  streakColor,
  streakIcon,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            shadowColor: colors.checkInOrange,
            borderColor: `${colors.checkInOrange}40`,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={[`${colors.checkInOrange}4D`, `${colors.checkInOrange}1A`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="sunny" size={24} color={colors.checkInOrange} />
            </LinearGradient>

            <View style={styles.headerText}>
              <View style={[styles.streakBadge, { backgroundColor: `${streakColor}1F` }]}>
                <Ionicons
                  name={streakIcon === 'flame.fill' ? 'flame' : 'flame-outline'}
                  size={12}
                  color={streakColor}
                />
                <Text style={[styles.streakText, { color: streakColor }]}>
                  {streakCount} {streakLabel} {streakStatus}
                </Text>
              </View>

              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Daily Check-In
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            How is your body feeling before today&apos;s session? Track your readiness to optimize your
            training.
          </Text>

          <Pressable onPress={() => router.push('/check-in' as any)}>
            <LinearGradient
              colors={[colors.checkInOrange, `${colors.checkInOrange}D9`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Start Check-In</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  content: {
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 18,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
