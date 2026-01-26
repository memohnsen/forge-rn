import { colors } from '@/constants/colors';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

type TrendPoint = { x: number; y: number };

type ChartConfig = {
  id: string;
  title: string;
  unit: string;
  accentColor: string;
  data: TrendPoint[];
  yMin: number;
  yMax: number;
  yStep: number;
};

type ChartCategory = {
  id: string;
  label: string;
  accentColor: string;
  icon: string;
  charts: ChartConfig[];
};

const TIME_FRAMES = ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 1 Year', 'All Time'];

const buildSeries = (values: number[]): TrendPoint[] =>
  values.map((value, index) => ({ x: index + 1, y: value }));

const buildSeriesRange = (min: number, max: number, count = 12): TrendPoint[] => {
  if (count <= 1) return [{ x: 1, y: max }];
  const span = max - min || 1;
  const values = Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const wave = Math.sin(t * Math.PI * 2) * 0.12 + Math.cos(t * Math.PI * 3) * 0.06;
    const value = min + span * (0.35 + 0.5 * t + wave);
    const clamped = Math.min(max, Math.max(min, value));
    return Number(clamped.toFixed(span > 20 ? 0 : 1));
  });
  return buildSeries(values);
};

const CHECK_IN_CHARTS: ChartConfig[] = [
  {
    id: 'checkin_overall',
    title: 'Overall Readiness',
    unit: '%',
    accentColor: '#5AB48C',
    data: buildSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
  },
  {
    id: 'checkin_physical',
    title: 'Physical Readiness',
    unit: '%',
    accentColor: '#5AB48C',
    data: buildSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
  },
  {
    id: 'checkin_mental',
    title: 'Mental Readiness',
    unit: '%',
    accentColor: '#5AB48C',
    data: buildSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
  },
  {
    id: 'checkin_physical_strength',
    title: 'Physical Strength',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_mental_strength',
    title: 'Mental Strength',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_recovery',
    title: 'Recovery',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_confidence',
    title: 'Confidence',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_sleep',
    title: 'Sleep Quality',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_energy',
    title: 'Energy',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_stress',
    title: 'Stress',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_soreness',
    title: 'Soreness',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_readiness',
    title: 'Readiness',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_focus',
    title: 'Focus',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_excitement',
    title: 'Excitement',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'checkin_body_connection',
    title: 'Body Connection',
    unit: '',
    accentColor: '#5AB48C',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
];

const WORKOUT_CHARTS: ChartConfig[] = [
  {
    id: 'workout_rpe',
    title: 'Session RPE',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_quality',
    title: 'Movement Quality',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_focus',
    title: 'Focus',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_misses',
    title: 'Misses',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(0, 5),
    yMin: 0,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_feeling',
    title: 'Feeling',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_satisfaction',
    title: 'Satisfaction',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_confidence',
    title: 'Confidence',
    unit: '',
    accentColor: '#5386E4',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
];

const MEET_CHARTS: ChartConfig[] = [
  {
    id: 'meet_performance',
    title: 'Performance Rating',
    unit: '',
    accentColor: '#FFBF00',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'meet_physical_prep',
    title: 'Physical Preparedness',
    unit: '',
    accentColor: '#FFBF00',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'meet_mental_prep',
    title: 'Mental Preparedness',
    unit: '',
    accentColor: '#FFBF00',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'meet_total',
    title: 'Total',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 500),
    yMin: 0,
    yMax: 500,
    yStep: 100,
  },
  {
    id: 'meet_satisfaction',
    title: 'Satisfaction',
    unit: '',
    accentColor: '#FFBF00',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'meet_confidence',
    title: 'Confidence',
    unit: '',
    accentColor: '#FFBF00',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'meet_pressure',
    title: 'Pressure Handling',
    unit: '',
    accentColor: '#FFBF00',
    data: buildSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'meet_bodyweight',
    title: 'Bodyweight',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 200),
    yMin: 0,
    yMax: 200,
    yStep: 20,
  },
  {
    id: 'meet_snatch_best',
    title: 'Snatch Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 250),
    yMin: 0,
    yMax: 250,
    yStep: 50,
  },
  {
    id: 'meet_cj_best',
    title: 'Clean & Jerk Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 300),
    yMin: 0,
    yMax: 300,
    yStep: 50,
  },
  {
    id: 'meet_squat_best',
    title: 'Squat Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 500),
    yMin: 0,
    yMax: 500,
    yStep: 100,
  },
  {
    id: 'meet_bench_best',
    title: 'Bench Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 300),
    yMin: 0,
    yMax: 300,
    yStep: 50,
  },
  {
    id: 'meet_deadlift_best',
    title: 'Deadlift Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildSeriesRange(0, 500),
    yMin: 0,
    yMax: 500,
    yStep: 100,
  },
];

const OURA_CHARTS: ChartConfig[] = [
  {
    id: 'oura_sleep',
    title: 'Sleep Duration',
    unit: 'hrs',
    accentColor: '#64B4DC',
    data: buildSeriesRange(0, 12),
    yMin: 0,
    yMax: 12,
    yStep: 3,
  },
  {
    id: 'oura_hrv',
    title: 'HRV',
    unit: 'ms',
    accentColor: '#64B4DC',
    data: buildSeriesRange(0, 200),
    yMin: 0,
    yMax: 200,
    yStep: 50,
  },
  {
    id: 'oura_heart_rate',
    title: 'Average Heart Rate',
    unit: 'bpm',
    accentColor: '#64B4DC',
    data: buildSeriesRange(20, 80),
    yMin: 20,
    yMax: 80,
    yStep: 20,
  },
  {
    id: 'oura_readiness',
    title: 'Readiness Score',
    unit: '%',
    accentColor: '#64B4DC',
    data: buildSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
  },
];

const WHOOP_CHARTS: ChartConfig[] = [
  {
    id: 'whoop_recovery',
    title: 'Recovery Score',
    unit: '%',
    accentColor: '#DC6464',
    data: buildSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
  },
  {
    id: 'whoop_sleep',
    title: 'Sleep Duration',
    unit: 'hrs',
    accentColor: '#DC6464',
    data: buildSeriesRange(0, 12),
    yMin: 0,
    yMax: 12,
    yStep: 3,
  },
  {
    id: 'whoop_sleep_performance',
    title: 'Sleep Performance',
    unit: '%',
    accentColor: '#DC6464',
    data: buildSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
  },
  {
    id: 'whoop_strain',
    title: 'Strain',
    unit: '',
    accentColor: '#DC6464',
    data: buildSeriesRange(0, 21),
    yMin: 0,
    yMax: 21,
    yStep: 3,
  },
  {
    id: 'whoop_hrv',
    title: 'HRV',
    unit: 'ms',
    accentColor: '#DC6464',
    data: buildSeriesRange(0, 200),
    yMin: 0,
    yMax: 200,
    yStep: 50,
  },
  {
    id: 'whoop_resting_hr',
    title: 'Resting Heart Rate',
    unit: 'bpm',
    accentColor: '#DC6464',
    data: buildSeriesRange(20, 80),
    yMin: 20,
    yMax: 80,
    yStep: 20,
  },
];

const CATEGORIES: ChartCategory[] = [
  {
    id: 'Check-Ins',
    label: 'Check-Ins',
    accentColor: '#5AB48C',
    icon: 'chart-line-variant',
    charts: CHECK_IN_CHARTS,
  },
  {
    id: 'Workouts',
    label: 'Workouts',
    accentColor: '#5386E4',
    icon: 'weight-lifter',
    charts: WORKOUT_CHARTS,
  },
  {
    id: 'Meets',
    label: 'Meets',
    accentColor: '#FFBF00',
    icon: 'trophy-award',
    charts: MEET_CHARTS,
  },
  {
    id: 'Oura',
    label: 'Oura',
    accentColor: '#64B4DC',
    icon: 'moon-waning-crescent',
    charts: OURA_CHARTS,
  },
  {
    id: 'Whoop',
    label: 'Whoop',
    accentColor: '#DC6464',
    icon: 'heart-pulse',
    charts: WHOOP_CHARTS,
  },
];

const DEFAULT_SELECTED = new Set<string>([
  'checkin_overall',
  'checkin_physical',
  'workout_rpe',
  'meet_total',
  'oura_sleep',
  'whoop_recovery',
]);

export default function TrendsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [selectedFilter, setSelectedFilter] = useState('Check-Ins');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Last 30 Days');
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(DEFAULT_SELECTED);
  const [showTimeFrameSheet, setShowTimeFrameSheet] = useState(false);
  const [showChartSelection, setShowChartSelection] = useState(false);
  const [showAIResults, setShowAIResults] = useState(false);

  const isOuraConnected = true;
  const isWhoopConnected = true;

  const availableCategories = useMemo(
    () =>
      CATEGORIES.filter((category) => {
        if (category.id === 'Oura') return isOuraConnected;
        if (category.id === 'Whoop') return isWhoopConnected;
        return true;
      }),
    [isOuraConnected, isWhoopConnected]
  );

  const currentCategory = availableCategories.find((category) => category.id === selectedFilter);

  const toggleChart = (chartId: string) => {
    setSelectedCharts((prev) => {
      const next = new Set(prev);
      if (next.has(chartId)) {
        next.delete(chartId);
      } else {
        next.add(chartId);
      }
      return next;
    });
  };

  const hasSelectedCharts = (category: ChartCategory | undefined) => {
    if (!category) return false;
    return category.charts.some((chart) => selectedCharts.has(chart.id));
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 120 },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Trends
            </Text>
            <Text style={styles.pageSubtitle}>{selectedTimeFrame}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable onPress={() => setShowTimeFrameSheet(true)} style={styles.iconButton}>
              <MaterialCommunityIcons name="tune-variant" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => setShowChartSelection(true)} style={styles.iconButton}>
              <MaterialCommunityIcons name="chart-bar" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {availableCategories.map((option) => {
            const isSelected = option.id === selectedFilter;
            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedFilter(option.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? option.accentColor : isDark ? '#1A1A1A' : '#FFFFFF',
                    borderColor: `${option.accentColor}33`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as never}
                  size={16}
                  color={isSelected ? '#FFFFFF' : option.accentColor}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000' },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable onPress={() => setShowAIResults(true)} style={styles.aiCardWrapper}>
          <View
            style={[
              styles.aiCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: `${colors.blueEnergy}33`,
                shadowColor: colors.blueEnergy,
              },
            ]}
          >
            <View style={styles.aiIconCircle}>
              <MaterialCommunityIcons name="star-four-points" size={20} color="#8C64C8" />
            </View>
            <View style={styles.aiText}>
              <Text style={[styles.aiTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                AI Trend Analysis
              </Text>
              <Text style={styles.aiSubtitle}>Get personalized insights from your data</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8C64C8" />
          </View>
        </Pressable>

        {currentCategory && hasSelectedCharts(currentCategory) ? (
          <View style={styles.chartsWrapper}>
            {currentCategory.charts
              .filter((chart) => selectedCharts.has(chart.id))
              .map((chart) => (
                <TrendCard
                  key={chart.id}
                  chart={chart}
                  timeFrame={selectedTimeFrame}
                  isDark={isDark}
                />
              ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="chart-bar-stacked" size={30} color="#5386E4" />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              No Charts Selected
            </Text>
            <Text style={styles.emptySubtitle}>
              Use the chart icon to choose which insights you want to track.
            </Text>
          </View>
        )}
      </ScrollView>

      <TimeFrameSheet
        visible={showTimeFrameSheet}
        onClose={() => setShowTimeFrameSheet(false)}
        selected={selectedTimeFrame}
        onSelect={setSelectedTimeFrame}
        isDark={isDark}
      />

      <ChartSelectionSheet
        visible={showChartSelection}
        onClose={() => setShowChartSelection(false)}
        categories={availableCategories}
        selectedCharts={selectedCharts}
        onToggle={toggleChart}
        isDark={isDark}
      />

      <AIResultsSheet
        visible={showAIResults}
        onClose={() => setShowAIResults(false)}
        isDark={isDark}
      />
    </View>
  );
}

function TrendCard({
  chart,
  timeFrame,
  isDark,
}: {
  chart: ChartConfig;
  timeFrame: string;
  isDark: boolean;
}) {
  const latest = chart.data[chart.data.length - 1]?.y ?? 0;
  const first = chart.data[0]?.y ?? 0;
  const delta = latest - first;
  const isPositive = delta >= 0;
  const deltaValue = Math.abs(delta).toFixed(chart.unit === '%' || chart.unit === '' ? 1 : 0);

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: `${colors.blueEnergy}33`,
          shadowColor: colors.blueEnergy,
        },
      ]}
    >
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {chart.title}
          </Text>
        </View>
        <View
          style={[
            styles.trendBadge,
            { backgroundColor: `${chart.accentColor}22`, borderColor: `${chart.accentColor}55` },
          ]}
        >
          <MaterialCommunityIcons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={16}
            color={chart.accentColor}
          />
          <Text style={[styles.trendText, { color: chart.accentColor }]}>
            {deltaValue}
            {chart.unit}
          </Text>
        </View>
      </View>

      <View style={styles.chartCanvas}>
        <Sparkline
          data={chart.data}
          color={colors.blueEnergy}
          yMin={chart.yMin}
          yMax={chart.yMax}
          yStep={chart.yStep}
        />
      </View>
    </View>
  );
}

function TimeFrameSheet({
  visible,
  onClose,
  selected,
  onSelect,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (value: string) => void;
  isDark: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Time Frame
          </Text>
          {TIME_FRAMES.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
              style={styles.sheetRow}
            >
              <Text style={[styles.sheetRowText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {option}
              </Text>
              {selected === option && (
                <MaterialCommunityIcons name="check" size={18} color="#5386E4" />
              )}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChartSelectionSheet({
  visible,
  onClose,
  categories,
  selectedCharts,
  onToggle,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  categories: ChartCategory[];
  selectedCharts: Set<string>;
  onToggle: (chartId: string) => void;
  isDark: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetCardLarge, { backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF' }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.sheetHeaderRow}>
            <Text style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Select Charts
            </Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {categories.map((category) => (
              <View key={category.id} style={styles.sheetSection}>
                <View style={styles.sheetSectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: category.accentColor }]} />
                  <Text style={styles.sheetSectionTitle}>{category.label}</Text>
                </View>
                {category.charts.map((chart) => {
                  const isSelected = selectedCharts.has(chart.id);
                  return (
                    <Pressable
                      key={chart.id}
                      onPress={() => onToggle(chart.id)}
                      style={[
                        styles.sheetOption,
                        { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
                      ]}
                    >
                      <Text style={[styles.sheetOptionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {chart.title}
                      </Text>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected ? category.accentColor : '#99999955',
                            backgroundColor: isSelected ? category.accentColor : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AIResultsSheet({
  visible,
  onClose,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.aiSheetCard, { backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF' }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.sheetHeaderRow}>
            <View style={styles.aiHeader}>
              <MaterialCommunityIcons name="star-four-points" size={20} color="#8C64C8" />
              <Text style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                AI Trend Analysis
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiParagraph}>
              * Training consistency improved over the last two weeks, with higher readiness scores
              following sessions rated as moderate intensity.
            </Text>
            <Text style={styles.aiParagraph}>
              * Recovery trends look strongest on days after higher sleep duration, especially when
              sleep stays above 7.5 hours.
            </Text>
            <Text style={styles.aiParagraph}>
              * Confidence and performance ratings are climbing steadily, suggesting the current
              training block is building momentum.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Sparkline({
  data,
  color,
  yMin,
  yMax,
  yStep,
}: {
  data: TrendPoint[];
  color: string;
  yMin: number;
  yMax: number;
  yStep: number;
}) {
  const viewWidth = 140;
  const viewHeight = 48;
  const padding = 2;
  const rightLabelWidth = 18;
  const plotWidth = viewWidth - rightLabelWidth;
  const minY = yMin;
  const maxY = yMax;
  const span = maxY - minY || 1;

  const points = data.map((point, index) => {
    const x =
      padding + (index / Math.max(1, data.length - 1)) * (plotWidth - padding * 2);
    const normalized = (point.y - minY) / span;
    const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const gridValues: number[] = [];
  for (let value = minY; value <= maxY + 0.001; value += yStep) {
    gridValues.push(Number(value.toFixed(2)));
  }

  return (
    <Svg width="100%" height={140} viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
      {gridValues.map((value) => {
        const normalized = (value - minY) / span;
        const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
        return (
          <React.Fragment key={`grid-${value}`}>
            <Path
              d={`M${padding},${y.toFixed(2)} L${(plotWidth - padding).toFixed(2)},${y.toFixed(2)}`}
              stroke="#2D3640"
              strokeWidth={0.8}
              strokeDasharray="2 4"
            />
            <SvgText
              x={viewWidth - 2}
              y={y + 3}
              fontSize={5}
              fill={color}
              textAnchor="end"
            >
              {value}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Path
        d={points.join(' ')}
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {data.map((point, index) => {
        const x =
          padding + (index / Math.max(1, data.length - 1)) * (plotWidth - padding * 2);
        const normalized = (point.y - minY) / span;
        const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
        return <Circle key={`dot-${index}`} cx={x} cy={y} r={2} fill={color} />;
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5386E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  aiCardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  aiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C64C822',
  },
  aiText: {
    flex: 1,
    gap: 4,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  chartsWrapper: {
    gap: 16,
    paddingTop: 16,
  },
  chartCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCanvas: {
    marginTop: 12,
    marginLeft: -6,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  chartFooterLabel: {
    fontSize: 12,
    color: '#999',
  },
  chartFooterValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5386E422',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetCardLarge: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetRowText: {
    fontSize: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetContent: {
    paddingBottom: 40,
    gap: 24,
  },
  sheetSection: {
    gap: 12,
  },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheetSectionTitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
  },
  sheetOptionText: {
    fontSize: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiContent: {
    backgroundColor: '#8C64C812',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  aiParagraph: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
});
