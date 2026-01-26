import { colors } from '@/constants/colors';
import { findChartById } from '@/utils/trends-data';
import { buildGraphDetailState } from '@/utils/trends-graph-detail-model';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

export default function GraphDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const chartEntry = useMemo(() => (id ? findChartById(id) : null), [id]);
  const chart = chartEntry?.chart;

  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Last 30 Days');
  const [dateRangeEnd, setDateRangeEnd] = useState(new Date());

  if (!chart) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
        <Text style={styles.emptyText}>Chart not found.</Text>
      </View>
    );
  }

  const state = buildGraphDetailState(chart, selectedTimeFrame, dateRangeEnd);
  const themeColor = state.currentZone?.color ?? chart.accentColor;

  const handleNavigate = (direction: 'back' | 'forward') => {
    const date = new Date(dateRangeEnd);
    switch (selectedTimeFrame) {
      case 'Last 30 Days':
        date.setDate(date.getDate() + (direction === 'back' ? -30 : 30));
        break;
      case 'Last 90 Days':
        date.setDate(date.getDate() + (direction === 'back' ? -90 : 90));
        break;
      case 'Last 6 Months':
        date.setMonth(date.getMonth() + (direction === 'back' ? -6 : 6));
        break;
      case 'Last 1 Year':
        date.setFullYear(date.getFullYear() + (direction === 'back' ? -1 : 1));
        break;
      default:
        break;
    }
    const now = new Date();
    setDateRangeEnd(date > now ? now : date);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <LinearGradient
        colors={[`${themeColor}66`, isDark ? '#000000' : '#F5F5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.replace('/trends')} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {chart.title}
          </Text>
          <View style={styles.backButtonSpacer} />
        </View>

        <View style={styles.valueBlock}>
          <View style={styles.valueRow}>
            {state.currentZone && (
              <MaterialCommunityIcons name="heart" size={16} color={state.currentZone.color} />
            )}
            <Text style={[styles.valueTitle, { color: themeColor }]}>{chart.title}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.valueNumber, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {state.currentValue.toFixed(chart.unit === '%' || chart.unit === '' ? 1 : 0)}
            </Text>
            <Text style={styles.valueUnit}>{chart.unit}</Text>
          </View>
          <Text style={styles.valueSubtitle}>{state.dateRangeString}</Text>
          <Text style={styles.valueDescription}>
            Trend is {state.trendDirection === 'flat' ? 'stable' : state.trendDirection} over the
            selected period.
          </Text>
        </View>

        <View style={styles.navigationRow}>
          <Pressable onPress={() => handleNavigate('back')} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-left" size={20} color={colors.blueEnergy} />
          </Pressable>
          <Text style={styles.navText}>{state.dateRangeString}</Text>
          <Pressable onPress={() => handleNavigate('forward')} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.blueEnergy} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeFrameRow}>
          {state.timeFrameOptions.map((option) => {
            const selected = option === selectedTimeFrame;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setSelectedTimeFrame(option);
                  setDateRangeEnd(new Date());
                }}
                style={[
                  styles.timeFrameChip,
                  {
                    backgroundColor: selected ? themeColor : isDark ? '#1A1A1A' : '#FFFFFF',
                    borderColor: `${themeColor}33`,
                  },
                ]}
              >
                <Text style={[styles.timeFrameText, { color: selected ? '#FFFFFF' : '#999' }]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: isDark ? '#101010' : '#FFFFFF',
              borderColor: `${themeColor}33`,
              shadowColor: themeColor,
            },
          ]}
        >
          <LargeChart
            data={state.filteredData}
            color={colors.blueEnergy}
            yMin={chart.yMin}
            yMax={chart.yMax}
            yStep={chart.yStep}
          />
          {chart.zones && (
            <View style={styles.zoneLegend}>
              {chart.zones.map((zone) => (
                <View key={zone.id} style={styles.zoneItem}>
                  <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                  <Text style={styles.zoneLabel}>{zone.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Statistics
          </Text>
          <View style={styles.statsGrid}>
            <StatCard label="Average" value={state.averageValue} unit={chart.unit} />
            <StatCard label="Min" value={state.minValue} unit={chart.unit} />
            <StatCard label="Max" value={state.maxValue} unit={chart.unit} />
            <StatCard label="Trend" value={state.trendPercentage} unit="%" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function LargeChart({
  data,
  color,
  yMin,
  yMax,
  yStep,
}: {
  data: { date: Date; value: number }[];
  color: string;
  yMin: number;
  yMax: number;
  yStep: number;
}) {
  const viewWidth = 220;
  const viewHeight = 120;
  const padding = 8;
  const rightLabelWidth = 28;
  const plotWidth = viewWidth - rightLabelWidth;
  const span = yMax - yMin || 1;

  const gridValues: number[] = [];
  for (let value = yMin; value <= yMax + 0.001; value += yStep) {
    gridValues.push(Number(value.toFixed(2)));
  }

  const points = data.map((point, index) => {
    const x =
      padding + (index / Math.max(1, data.length - 1)) * (plotWidth - padding * 2);
    const normalized = (point.value - yMin) / span;
    const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <Svg width="100%" height={240} viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
      {gridValues.map((value) => {
        const normalized = (value - yMin) / span;
        const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
        return (
          <React.Fragment key={`grid-${value}`}>
            <Path
              d={`M${padding},${y.toFixed(2)} L${(plotWidth - padding).toFixed(2)},${y.toFixed(2)}`}
              stroke="#2D3640"
              strokeWidth={0.8}
              strokeDasharray="3 6"
            />
            <SvgText x={viewWidth - 2} y={y + 4} fontSize={8} fill={color} textAnchor="end">
              {value}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Path d={points.join(' ')} stroke={color} strokeWidth={1.6} fill="none" />
      {data.map((point, index) => {
        const x =
          padding + (index / Math.max(1, data.length - 1)) * (plotWidth - padding * 2);
        const normalized = (point.value - yMin) / span;
        const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
        return <Circle key={`dot-${index}`} cx={x} cy={y} r={3} fill={color} />;
      })}
    </Svg>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  const display =
    unit === '%' || unit === '' ? value.toFixed(1) : Math.round(value).toString();
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {display}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  backButtonSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  valueBlock: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueNumber: {
    fontSize: 52,
    fontWeight: '700',
  },
  valueUnit: {
    fontSize: 18,
    color: '#999',
    paddingTop: 16,
  },
  valueSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  valueDescription: {
    marginTop: 10,
    color: '#999',
    fontSize: 13,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 13,
    color: '#999',
  },
  timeFrameRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 16,
  },
  timeFrameChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  timeFrameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  zoneLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneLabel: {
    fontSize: 11,
    color: '#999',
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.blueEnergy}22`,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 6,
  },
  emptyText: {
    color: '#999',
    padding: 16,
  },
});
