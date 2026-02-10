import React, { useEffect } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

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

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (parseInt(streakCount) > 0) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [streakCount]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleButtonPress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/check-in' as any);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500).springify().damping(16)}
      style={{ marginHorizontal: 16 }}
    >
      <Animated.View
        style={{
          borderRadius: 20,
          borderCurve: 'continuous',
          borderWidth: 1,
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? `${colors.checkInOrange}40` : `${colors.checkInOrange}20`,
          boxShadow: isDark
            ? `0 8px 24px ${colors.checkInOrange}25`
            : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${colors.checkInOrange}40`,
        }}
      >
        <Animated.View style={{ padding: 18, gap: 14 }}>
          <Animated.View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <Animated.View style={pulseStyle}>
              <LinearGradient
                colors={[`${colors.checkInOrange}4D`, `${colors.checkInOrange}1A`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="sunny" size={24} color={colors.checkInOrange} />
              </LinearGradient>
            </Animated.View>

            <Animated.View style={{ flex: 1, gap: 6 }}>
              <Animated.View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                  backgroundColor: `${streakColor}1F`,
                }}
              >
                <Ionicons
                  name={streakIcon === 'flame.fill' ? 'flame' : 'flame-outline'}
                  size={12}
                  color={streakColor}
                />
                <Animated.Text style={{ fontSize: 12, fontWeight: '600', color: streakColor }}>
                  {streakCount} {streakLabel} {streakStatus}
                </Animated.Text>
              </Animated.View>

              <Animated.Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : '#000000' }}>
                Daily Check-In
              </Animated.Text>
            </Animated.View>
          </Animated.View>

          <Animated.Text style={{ fontSize: 14, color: '#999', lineHeight: 20 }}>
            How is your body feeling before today&apos;s session? Track your readiness to optimize your
            training.
          </Animated.Text>

          <Pressable
            onPress={handleButtonPress}
          >
            <LinearGradient
              colors={[colors.checkInOrange, `${colors.checkInOrange}D9`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                borderRadius: 12,
                borderCurve: 'continuous',
              }}
            >
              <Animated.Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                Start Check-In
              </Animated.Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
