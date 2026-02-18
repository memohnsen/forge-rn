import { colors } from '@/constants/colors';
import { useTrends } from '@/hooks/use-trends';
import {
  trackScreenView,
  trackTrendsFilterChanged,
  trackTrendsTimeFrameChanged,
} from '@/utils/analytics';
import { DEFAULT_SELECTED, TIME_FRAMES, type ChartCategory, type ChartConfig, type TrendPoint } from '@/utils/trends-data';
import { buildGraphDetailState } from '@/utils/trends-graph-detail-model';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  createAnimatedComponent,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';

const AnimatedPath = createAnimatedComponent(Path);


export default function TrendsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { categories, ouraConnected, whoopConnected } = useTrends();

  const [selectedFilter, setSelectedFilter] = useState('Check-Ins');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Last 30 Days');
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(DEFAULT_SELECTED);
  const [showTimeFrameSheet, setShowTimeFrameSheet] = useState(false);
  const [showChartSelection, setShowChartSelection] = useState(false);
  const autoSelectedRef = useRef({ oura: false, whoop: false });
  const hasLoadedChartsRef = useRef(false);

  useEffect(() => {
    trackScreenView('trends');
  }, []);

  useEffect(() => {
    trackTrendsFilterChanged(selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    trackTrendsTimeFrameChanged(selectedTimeFrame);
  }, [selectedTimeFrame]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('trends_selected_charts_v1');
        if (!stored || !isActive) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedCharts(new Set(parsed));
        }
      } catch (error) {
        console.warn('Failed to load selected charts:', error);
      } finally {
        if (isActive) {
          hasLoadedChartsRef.current = true;
        }
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedChartsRef.current) return;
    (async () => {
      try {
        await AsyncStorage.setItem(
          'trends_selected_charts_v1',
          JSON.stringify(Array.from(selectedCharts))
        );
      } catch (error) {
        console.warn('Failed to persist selected charts:', error);
      }
    })();
  }, [selectedCharts]);

  const availableCategories = useMemo(
    () =>
      categories.filter((category) => {
        if (category.id === 'Oura') return ouraConnected;
        if (category.id === 'Whoop') return whoopConnected;
        return true;
      }),
    [categories, ouraConnected, whoopConnected]
  );

  const currentCategory = availableCategories.find((category) => category.id === selectedFilter);

  useEffect(() => {
    if (!autoSelectedRef.current.oura && ouraConnected) {
      const ouraCategory = categories.find((category) => category.id === 'Oura');
      if (ouraCategory && !ouraCategory.charts.some((chart) => selectedCharts.has(chart.id))) {
        setSelectedCharts((prev) => {
          const next = new Set(prev);
          ouraCategory.charts.forEach((chart) => next.add(chart.id));
          return next;
        });
      }
      autoSelectedRef.current.oura = true;
    }

    if (!autoSelectedRef.current.whoop && whoopConnected) {
      const whoopCategory = categories.find((category) => category.id === 'Whoop');
      if (whoopCategory && !whoopCategory.charts.some((chart) => selectedCharts.has(chart.id))) {
        setSelectedCharts((prev) => {
          const next = new Set(prev);
          whoopCategory.charts.forEach((chart) => next.add(chart.id));
          return next;
        });
      }
      autoSelectedRef.current.whoop = true;
    }
  }, [categories, ouraConnected, whoopConnected, selectedCharts]);

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
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
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
                    borderColor: isDark ? `${option.accentColor}33` : `${option.accentColor}20`,
                    boxShadow: isSelected
                      ? 'none'
                      : isDark
                        ? `0 4px 12px ${option.accentColor}20`
                        : `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px ${option.accentColor}30`,
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

        <Pressable onPress={() => router.push('/trends/ai')} style={styles.aiCardWrapper}>
          <View
            style={[
              styles.aiCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: isDark ? `${colors.blueEnergy}33` : `${colors.blueEnergy}20`,
                boxShadow: isDark
                  ? `0 8px 24px ${colors.blueEnergy}25`
                  : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${colors.blueEnergy}35`,
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
              .map((chart) => {
                const chartState = buildGraphDetailState(chart, selectedTimeFrame, new Date());
                const displayChart = { ...chart, data: chartState.filteredData };
                return (
                  <TrendCard
                    key={chart.id}
                    chart={displayChart}
                    isDark={isDark}
                    onPress={() => router.push({ pathname: '/trends/[id]', params: { id: chart.id } })}
                  />
                );
              })}
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

    </View>
  );
}

function TrendCard({
  chart,
  isDark,
  onPress,
}: {
  chart: ChartConfig;
  isDark: boolean;
  onPress: () => void;
}) {
  const latest = chart.data[chart.data.length - 1]?.value ?? 0;
  const first = chart.data[0]?.value ?? 0;
  const delta = latest - first;
  const isPositive = delta >= 0;
  const deltaValue = Math.abs(delta).toFixed(chart.unit === '%' || chart.unit === '' ? 1 : 0);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chartCard,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? `${colors.blueEnergy}33` : `${colors.blueEnergy}20`,
          boxShadow: isDark
            ? `0 8px 24px ${colors.blueEnergy}25`
            : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${colors.blueEnergy}35`,
        },
      ]}
    >
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {chart.title}
          </Text>
          <MaterialCommunityIcons name="information-outline" size={18} color={isDark ? '#555' : '#BBB'} />
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
          isDark={isDark}
          yMin={chart.yMin}
          yMax={chart.yMax}
          yStep={chart.yStep}
        />
      </View>
    </Pressable>
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


// Approximate path length for a polyline given coords
function approximatePathLength(coords: { x: number; y: number }[]): number {
  let length = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length || 300;
}

function Sparkline({
  data,
  color,
  isDark,
  yMin,
  yMax,
  yStep,
}: {
  data: TrendPoint[];
  color: string;
  isDark: boolean;
  yMin: number;
  yMax: number;
  yStep: number;
}) {
  const viewWidth = 200;
  const viewHeight = 80;
  const paddingLeft = 4;
  const paddingTop = 0;
  const paddingBottom = 0;
  const rightLabelWidth = 18;
  const plotWidth = viewWidth - rightLabelWidth;
  const plotHeight = viewHeight - paddingTop - paddingBottom;
  const minY = yMin;
  const maxY = yMax;
  const span = maxY - minY || 1;
  const gradientId = `fill-${color.replace('#', '')}`;

  const coords = data.map((point, index) => {
    const x =
      paddingLeft + (index / Math.max(1, data.length - 1)) * (plotWidth - paddingLeft * 2);
    const normalized = (point.value - minY) / span;
    const y = viewHeight - paddingBottom - normalized * plotHeight;
    return { x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');

  const bottomY = viewHeight - paddingBottom;
  const fillPath = coords.length > 0
    ? `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${bottomY} L${coords[0].x.toFixed(2)},${bottomY} Z`
    : '';

  const gridValues: number[] = [];
  for (let value = minY; value <= maxY + 0.001; value += yStep) {
    gridValues.push(Number(value.toFixed(2)));
  }

  // Draw-on animation
  const pathLength = approximatePathLength(coords);
  const dashOffset = useSharedValue(pathLength);
  const fillOpacity = useSharedValue(0);

  useEffect(() => {
    dashOffset.value = withTiming(0, { duration: 900 });
    fillOpacity.value = withTiming(1, { duration: 1100 });
  }, []);

  const animatedLineProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const animatedFillProps = useAnimatedProps(() => ({
    fillOpacity: fillOpacity.value,
  }));

  return (
    <Svg width="100%" height={200} viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.35} />
          <Stop offset="0.6" stopColor={color} stopOpacity={0.1} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>

      {gridValues.map((value) => {
        const normalized = (value - minY) / span;
        const y = viewHeight - paddingBottom - normalized * plotHeight;
        return (
          <React.Fragment key={`grid-${value}`}>
            <Path
              d={`M${paddingLeft},${y.toFixed(2)} L${(plotWidth - paddingLeft).toFixed(2)},${y.toFixed(2)}`}
              stroke={isDark ? 'rgba(150,150,150,0.2)' : 'rgba(0,0,0,0.12)'}
              strokeWidth={0.4}
              strokeDasharray="3 3"
            />
            <SvgText
              x={viewWidth - 2}
              y={y + 1.8}
              fontSize={6}
              fill={color}
              textAnchor="end"
              opacity={0.7}
            >
              {value}
            </SvgText>
          </React.Fragment>
        );
      })}

      {fillPath ? (
        <AnimatedPath
          d={fillPath}
          fill={`url(#${gradientId})`}
          animatedProps={animatedFillProps}
        />
      ) : null}

      <AnimatedPath
        d={linePath}
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={pathLength}
        animatedProps={animatedLineProps}
      />

      {coords.map((c, index) => (
        <Circle key={`dot-${index}`} cx={c.x} cy={c.y} r={2.2} fill={color} />
      ))}
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
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginTop: 2,
    marginHorizontal: -10,
    marginBottom: -12,
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
});
