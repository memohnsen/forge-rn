import React from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

interface ReflectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  accentColor: string;
  onPress: () => void;
  delay?: number;
}

const ReflectionCard: React.FC<ReflectionCardProps> = ({ icon, title, accentColor, onPress, delay = 0 }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(interpolate(pressed.value, [0, 1], [1, 0.93]), { damping: 12, stiffness: 300 }) },
    ],
  }));

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(200 + delay).duration(500).springify().damping(16)} style={{ flex: 1 }}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => { pressed.value = withTiming(1, { duration: 100 }); }}
        onPressOut={() => { pressed.value = withSpring(0, { damping: 12, stiffness: 300 }); }}
        style={[
          animatedStyle,
          {
            paddingVertical: 20,
            paddingHorizontal: 12,
            borderRadius: 20,
            borderCurve: 'continuous',
            borderWidth: 1,
            alignItems: 'center',
            gap: 14,
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderColor: isDark ? `${accentColor}40` : `${accentColor}20`,
            boxShadow: isDark
              ? `0 8px 24px ${accentColor}25`
              : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${accentColor}40`,
          },
        ]}
      >
        <LinearGradient
          colors={[`${accentColor}40`, `${accentColor}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={24} color={accentColor} />
        </LinearGradient>

        <Animated.Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: 18,
            color: isDark ? '#FFFFFF' : '#000000',
          }}
          numberOfLines={2}
        >
          {title}
        </Animated.Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

export const ReflectionSection: React.FC = () => {
  const router = useRouter();

  return (
    <Animated.View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
      <ReflectionCard
        icon="barbell"
        title="Session Reflection"
        accentColor={colors.blueEnergy}
        onPress={() => router.push('/workout' as any)}
        delay={0}
      />
      <ReflectionCard
        icon="trophy"
        title="Competition Analysis"
        accentColor={colors.gold}
        onPress={() => router.push('/competition' as any)}
        delay={80}
      />
    </Animated.View>
  );
};
