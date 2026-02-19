import React from 'react';
import { Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CheckIn } from '@/models/CheckIn';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/dateFormatter';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';

interface HistoryItemCardProps {
  intensity: string;
  lift: string;
  date: string;
  score: number;
  onPress: () => void;
  index: number;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  intensity,
  lift,
  date,
  score,
  onPress,
  index,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scoreColor = (() => {
    if (score >= 80) {
      return colors.scoreGreen;
    } else if (score >= 60) {
      return colors.scoreYellow;
    } else {
      return colors.scoreRed;
    }
  })();

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(300 + index * 60).duration(400).springify().damping(16)}>
      <Pressable
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          borderRadius: 16,
          borderCurve: 'continuous',
          gap: 14,
          borderWidth: 1,
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark
            ? '0 4px 12px rgba(0,0,0,0.2)'
            : '0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <Animated.View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: `${scoreColor}66`,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.Text style={{ fontSize: 14, fontWeight: '700', color: scoreColor, fontVariant: ['tabular-nums'] }}>
            {score}
          </Animated.Text>
        </Animated.View>

        <Animated.View style={{ flex: 1, gap: 4 }}>
          <Animated.Text
            style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#000000' }}
            numberOfLines={1}
          >
            {intensity} {lift}
          </Animated.Text>
          <Animated.Text style={{ fontSize: 12, color: '#999' }}>{date}</Animated.Text>
        </Animated.View>

        <Ionicons name="chevron-forward" size={16} color="#666" />
      </Pressable>
    </Animated.View>
  );
};

interface HistorySectionProps {
  checkIns: CheckIn[];
  isLoading: boolean;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ checkIns, isLoading }) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}
      >
        <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
          <Animated.Text style={{ fontSize: 12, fontWeight: '600', color: '#999', letterSpacing: 0.5 }}>
            RECENT ACTIVITY
          </Animated.Text>
          <Pressable onPress={() => router.push('/history' as any)}>
            <Animated.Text style={{ fontSize: 12, fontWeight: '600', color: colors.blueEnergy }}>View All</Animated.Text>
          </Pressable>
        </Animated.View>
        <Animated.View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.blueEnergy} />
        </Animated.View>
      </Animated.View>
    );
  }

  if (checkIns.length === 0) {
    return null;
  }

  return (
    <Animated.View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
      <Animated.View
        entering={FadeInDown.delay(280).duration(400)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}
      >
        <Animated.Text style={{ fontSize: 12, fontWeight: '600', color: '#999', letterSpacing: 0.5 }}>
          RECENT ACTIVITY
        </Animated.Text>
        <Pressable
          onPress={() => router.push('/history' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Animated.Text style={{ fontSize: 12, fontWeight: '600', color: colors.blueEnergy }}>View All</Animated.Text>
          <Ionicons name="chevron-forward" size={12} color={colors.blueEnergy} />
        </Pressable>
      </Animated.View>

      {checkIns.slice(0, 5).map((checkIn, index) => (
        <HistoryItemCard
          key={checkIn._id}
          intensity={checkIn.selectedIntensity}
          lift={checkIn.selectedLift}
          date={formatDate(checkIn.checkInDate) || checkIn.checkInDate}
          score={checkIn.overallScore}
          index={index}
          onPress={() =>
            router.push({
              pathname: '/history/[id]' as any,
              params: {
                id: checkIn._id,
                title: checkIn.selectedLift,
                date: checkIn.checkInDate,
              },
            })
          }
        />
      ))}
    </Animated.View>
  );
};
