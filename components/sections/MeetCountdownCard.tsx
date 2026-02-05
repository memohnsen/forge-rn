import React from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MeetCountdownCardProps {
  meetName: string;
  daysUntilMeet: number;
  daysUntilMeetText: string;
  meetDate: string;
  sessionsLeftText: string;
  onPress?: () => void;
}

export const MeetCountdownCard: React.FC<MeetCountdownCardProps> = ({
  meetName,
  daysUntilMeet,
  daysUntilMeetText,
  meetDate,
  sessionsLeftText,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pressed = useSharedValue(0);

  const countdownColor = (() => {
    if (daysUntilMeet < 0) {
      return colors.scoreGreen;
    } else if (daysUntilMeet <= 7) {
      return colors.scoreRed;
    } else if (daysUntilMeet <= 14) {
      return colors.checkInOrange;
    } else {
      return colors.blueEnergy;
    }
  })();

  const progressPercent = Math.max(0, Math.min(1, 1 - daysUntilMeet / 90));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(interpolate(pressed.value, [0, 1], [1, 0.97]), { damping: 15, stiffness: 300 }) },
    ],
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify().damping(16)}
      style={{ marginHorizontal: 16 }}
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          animatedStyle,
          {
            borderRadius: 20,
            borderCurve: 'continuous',
            borderWidth: 1,
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderColor: isDark ? `${countdownColor}40` : `${countdownColor}20`,
            boxShadow: isDark
              ? `0 8px 24px ${countdownColor}30`
              : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${countdownColor}40`,
          },
        ]}
      >
        <Animated.View style={{ padding: 18, gap: 14 }}>
          <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Animated.View style={{ flex: 1, gap: 8 }}>
              <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="flag" size={14} color={colors.gold} />
                <Animated.Text
                  style={{ fontSize: 14, fontWeight: '600', flex: 1, color: isDark ? '#FFFFFF' : '#000000' }}
                  numberOfLines={1}
                >
                  {meetName}
                </Animated.Text>
              </Animated.View>
              <Animated.Text style={{ fontSize: 22, fontWeight: '800', color: countdownColor, fontVariant: ['tabular-nums'] }}>
                {sessionsLeftText}
              </Animated.Text>
            </Animated.View>

            <Animated.View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Animated.Text style={{ fontSize: 14, fontWeight: '600', color: '#999' }}>
                {meetDate}
              </Animated.Text>
              <Animated.Text style={{ fontSize: 22, fontWeight: '800', color: colors.gold, fontVariant: ['tabular-nums'] }}>
                {daysUntilMeetText}
              </Animated.Text>
            </Animated.View>
          </Animated.View>

          {/* Progress bar */}
          {daysUntilMeet > 0 && (
            <Animated.View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              <Animated.View
                entering={FadeInDown.delay(300).duration(600)}
                style={{
                  height: '100%',
                  width: `${progressPercent * 100}%`,
                  borderRadius: 2,
                  backgroundColor: countdownColor,
                }}
              />
            </Animated.View>
          )}

          {daysUntilMeet <= 0 && (
            <>
              <Animated.View style={{ height: 1, backgroundColor: isDark ? '#333' : '#E5E5E5' }} />
              <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pencil-outline" size={12} color="#999" />
                <Animated.Text style={{ fontSize: 12, color: '#999' }}>Tap to edit meet details</Animated.Text>
                <Animated.View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={12} color="#666" />
              </Animated.View>
            </>
          )}
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
};
