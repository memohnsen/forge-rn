import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Slider from '@react-native-community/slider';

const DRAG_HANDLE_SIZE = 32;

interface SliderSectionProps {
  title: string;
  value: number;
  onValueChange: (value: number) => void;
  minString: string;
  maxString: string;
  minValue?: number;
  maxValue?: number;
  inverseColorRating?: boolean;
  colorByRating?: boolean;
}

export const SliderSection: React.FC<SliderSectionProps> = ({
  title,
  value,
  onValueChange,
  minString,
  maxString,
  minValue = 1,
  maxValue = 5,
  inverseColorRating = false,
  colorByRating = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const showCustomHandle = Platform.OS !== 'ios';
  const [sliderWidth, setSliderWidth] = React.useState(0);

  const range = Math.max(maxValue - minValue, 1);
  const normalizedValue = Math.min(Math.max((value - minValue) / range, 0), 1);
  const normalizedRating = inverseColorRating ? 1 - normalizedValue : normalizedValue;

  const ratingColor = colorByRating
    ? normalizedRating <= 0.4
      ? colors.scoreRed
      : normalizedRating >= 0.6
        ? colors.scoreGreen
        : colors.blueEnergy
    : colors.blueEnergy;
  const dragHandleX = sliderWidth * normalizedValue;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? `${colors.blueEnergy}33` : `${colors.blueEnergy}20`,
          boxShadow: isDark
            ? `0 4px 12px ${colors.blueEnergy}20`
            : `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px ${colors.blueEnergy}30`,
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
          <Ionicons name="analytics" size={18} color={colors.blueEnergy} />
        </LinearGradient>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
      </View>

      <View style={styles.sliderContainer}>
        <View style={styles.valueContainer}>
          <View style={[styles.valueBadge, { backgroundColor: `${ratingColor}1F` }]}>
            <Text style={[styles.valueText, { color: ratingColor }]}>{value}</Text>
          </View>
        </View>

        <View
          style={styles.sliderWrapper}
          onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        >
          <Slider
            style={styles.slider}
            minimumValue={minValue}
            maximumValue={maxValue}
            step={1}
            value={value}
            renderStepNumber={false}
            onValueChange={(val) => onValueChange(Math.round(val))}
            onSlidingComplete={(val) => onValueChange(Math.round(val))}
            minimumTrackTintColor={ratingColor}
            maximumTrackTintColor={isDark ? '#333' : '#E5E5E5'}
            thumbTintColor="transparent"
            tapToSeek
          />
          {showCustomHandle && (
            <View
              pointerEvents="none"
              style={[
                styles.dragHandle,
                {
                  left: Math.max(
                    0,
                    Math.min(dragHandleX - DRAG_HANDLE_SIZE / 2, sliderWidth - DRAG_HANDLE_SIZE)
                  ),
                },
              ]}
            >
              <LinearGradient
                colors={[ratingColor, `${ratingColor}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dragHandleInner}
              >
                <Ionicons name="reorder-horizontal" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.labelsContainer}>
          <Text style={styles.labelText}>{minString}</Text>
          <Text style={styles.labelText}>{maxString}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderWrapper: {
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 6,
  },
  valueContainer: {
    alignItems: 'center',
  },
  valueBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 52,
  },
  dragHandle: {
    position: 'absolute',
    top: 10,
    width: DRAG_HANDLE_SIZE,
    height: DRAG_HANDLE_SIZE,
  },
  dragHandleInner: {
    width: DRAG_HANDLE_SIZE,
    height: DRAG_HANDLE_SIZE,
    borderRadius: DRAG_HANDLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 3px 10px rgba(0,0,0,0.22)',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});
