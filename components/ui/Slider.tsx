import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/hooks/use-theme';

interface SliderProps {
  title: string;
  value: number;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  inverseColorRating?: boolean;
  onChange: (value: number) => void;
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const Slider = ({
  title,
  value,
  min,
  max,
  minLabel,
  maxLabel,
  inverseColorRating = false,
  onChange,
}: SliderProps) => {
  const theme = useTheme();
  const trackWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);

  const decideColor = useMemo(() => {
    if (title === 'How many years have you been training?' || title === 'How many meets do you do per year?') {
      return theme.blueEnergy;
    }

    const ratingColor = value <= 2 ? theme.dangerRed : value === 3 ? theme.blueEnergy : theme.successGreen;
    const inverseColor = value <= 2 ? theme.successGreen : value === 3 ? theme.blueEnergy : theme.dangerRed;
    return inverseColorRating ? inverseColor : ratingColor;
  }, [inverseColorRating, theme, title, value]);

  const updateValue = (newValue: number) => {
    onChange(clamp(newValue, min, max));
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      const width = trackWidth.value || 1;
      const usable = width - 32;
      const nextX = clamp(event.x - 16, 0, usable);
      thumbX.value = nextX;
      const segment = usable / (max - min);
      const nextValue = Math.round(nextX / segment) + min;
      runOnJS(updateValue)(nextValue);
    })
    .onEnd(() => {
      const width = trackWidth.value || 1;
      const usable = width - 32;
      const segment = usable / (max - min);
      const nextX = clamp((value - min) * segment, 0, usable);
      thumbX.value = nextX;
    });

  useEffect(() => {
    if (!trackWidth.value) return;
    const usable = trackWidth.value - 32;
    const segment = usable / (max - min);
    thumbX.value = clamp((value - min) * segment, 0, usable);
  }, [max, min, value, thumbX, trackWidth]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: trackWidth.value ? (trackWidth.value * (value - min)) / (max - min) : 0,
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      <View style={styles.circleWrapper}>
        <View style={[styles.circleOutline, { borderColor: `${decideColor}66` }]}
        />
        <Text style={[styles.circleValue, { color: decideColor }]}>{value}</Text>
      </View>
      <View style={styles.trackContainer}>
        <View
          style={styles.track}
          onLayout={(event) => {
            trackWidth.value = event.nativeEvent.layout.width;
            const usable = event.nativeEvent.layout.width - 32;
            const segment = usable / (max - min);
            thumbX.value = clamp((value - min) * segment, 0, usable);
          }}
        >
          <View style={[styles.trackBase, { backgroundColor: `${decideColor}22` }]} />
          <Animated.View style={[styles.trackProgress, { backgroundColor: decideColor }, progressStyle]} />
          <View style={styles.tickRow}>
            {Array.from({ length: max - min + 1 }, (_, idx) => {
              const step = min + idx;
              const active = value >= step;
              return (
                <View
                  key={step}
                  style={[styles.tick, { backgroundColor: active ? decideColor : `${decideColor}33` }]}
                />
              );
            })}
          </View>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.thumb, { backgroundColor: decideColor }, thumbStyle]}>
              <View style={styles.thumbStroke} />
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: theme.textTertiary }]}>{minLabel}</Text>
        <Text style={[styles.label, { color: theme.textTertiary }]}>{maxLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circleOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    position: 'absolute',
  },
  circleValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  trackContainer: {
    paddingHorizontal: 18,
  },
  track: {
    height: 32,
    justifyContent: 'center',
  },
  trackBase: {
    height: 6,
    borderRadius: 999,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  trackProgress: {
    height: 6,
    borderRadius: 999,
    position: 'absolute',
    left: 0,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  tick: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  thumbStroke: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 12,
  },
  label: {
    fontSize: 12,
  },
});
