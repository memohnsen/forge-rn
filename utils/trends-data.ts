export type TrendPoint = { date: Date; value: number };

export type ZoneRange = {
  id: string;
  label: string;
  minValue: number;
  maxValue: number;
  color: string;
};

export type ChartConfig = {
  id: string;
  title: string;
  unit: string;
  accentColor: string;
  data: TrendPoint[];
  yMin: number;
  yMax: number;
  yStep: number;
  zones?: ZoneRange[];
};

export type ChartCategory = {
  id: string;
  label: string;
  accentColor: string;
  icon: string;
  charts: ChartConfig[];
};

const TIME_SERIES_POINTS = 16;

const buildDateSeriesRange = (min: number, max: number, count = TIME_SERIES_POINTS) => {
  if (count <= 1) return [{ date: new Date(), value: max }];
  const span = max - min || 1;
  const endDate = new Date();
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const wave = Math.sin(t * Math.PI * 2) * 0.12 + Math.cos(t * Math.PI * 3) * 0.06;
    const raw = min + span * (0.35 + 0.5 * t + wave);
    const clamped = Math.min(max, Math.max(min, raw));
    const daysAgo = Math.round((count - 1 - index) * 4);
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - daysAgo);
    return { date, value: Number(clamped.toFixed(span > 20 ? 0 : 1)) };
  });
};

const percentZones: ZoneRange[] = [
  { id: 'low', label: 'Low', minValue: 0, maxValue: 60, color: '#DC6464' },
  { id: 'moderate', label: 'Moderate', minValue: 60, maxValue: 80, color: '#FFB450' },
  { id: 'high', label: 'High', minValue: 80, maxValue: 101, color: '#5AB48C' },
];

const fivePointZones: ZoneRange[] = [
  { id: 'low', label: 'Low', minValue: 1, maxValue: 2.5, color: '#DC6464' },
  { id: 'mid', label: 'Moderate', minValue: 2.5, maxValue: 3.7, color: '#FFB450' },
  { id: 'high', label: 'High', minValue: 3.7, maxValue: 5.1, color: '#5AB48C' },
];

const CHECK_IN_CHARTS: ChartConfig[] = [
  {
    id: 'checkin_overall',
    title: 'Overall Readiness',
    unit: '%',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
    zones: percentZones,
  },
  {
    id: 'checkin_physical',
    title: 'Physical Readiness',
    unit: '%',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
    zones: percentZones,
  },
  {
    id: 'checkin_mental',
    title: 'Mental Readiness',
    unit: '%',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
    zones: percentZones,
  },
  {
    id: 'checkin_physical_strength',
    title: 'Physical Strength',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_mental_strength',
    title: 'Mental Strength',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_recovery',
    title: 'Recovery',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_confidence',
    title: 'Confidence',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_sleep',
    title: 'Sleep Quality',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_energy',
    title: 'Energy',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_stress',
    title: 'Stress',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_soreness',
    title: 'Soreness',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_readiness',
    title: 'Readiness',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_focus',
    title: 'Focus',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_excitement',
    title: 'Excitement',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'checkin_body_connection',
    title: 'Body Connection',
    unit: '',
    accentColor: '#5AB48C',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
];

const WORKOUT_CHARTS: ChartConfig[] = [
  {
    id: 'workout_rpe',
    title: 'Session RPE',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'workout_quality',
    title: 'Movement Quality',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'workout_focus',
    title: 'Focus',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'workout_misses',
    title: 'Misses',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(0, 5),
    yMin: 0,
    yMax: 5,
    yStep: 1,
  },
  {
    id: 'workout_feeling',
    title: 'Feeling',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'workout_satisfaction',
    title: 'Satisfaction',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'workout_confidence',
    title: 'Confidence',
    unit: '',
    accentColor: '#5386E4',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
];

const MEET_CHARTS: ChartConfig[] = [
  {
    id: 'meet_performance',
    title: 'Performance Rating',
    unit: '',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'meet_physical_prep',
    title: 'Physical Preparedness',
    unit: '',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'meet_mental_prep',
    title: 'Mental Preparedness',
    unit: '',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'meet_total',
    title: 'Total',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 500),
    yMin: 0,
    yMax: 500,
    yStep: 100,
  },
  {
    id: 'meet_satisfaction',
    title: 'Satisfaction',
    unit: '',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'meet_confidence',
    title: 'Confidence',
    unit: '',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'meet_pressure',
    title: 'Pressure Handling',
    unit: '',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(1, 5),
    yMin: 1,
    yMax: 5,
    yStep: 1,
    zones: fivePointZones,
  },
  {
    id: 'meet_bodyweight',
    title: 'Bodyweight',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 200),
    yMin: 0,
    yMax: 200,
    yStep: 20,
  },
  {
    id: 'meet_snatch_best',
    title: 'Snatch Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 250),
    yMin: 0,
    yMax: 250,
    yStep: 50,
  },
  {
    id: 'meet_cj_best',
    title: 'Clean & Jerk Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 300),
    yMin: 0,
    yMax: 300,
    yStep: 50,
  },
  {
    id: 'meet_squat_best',
    title: 'Squat Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 500),
    yMin: 0,
    yMax: 500,
    yStep: 100,
  },
  {
    id: 'meet_bench_best',
    title: 'Bench Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 300),
    yMin: 0,
    yMax: 300,
    yStep: 50,
  },
  {
    id: 'meet_deadlift_best',
    title: 'Deadlift Best',
    unit: 'kg',
    accentColor: '#FFBF00',
    data: buildDateSeriesRange(0, 500),
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
    data: buildDateSeriesRange(0, 12),
    yMin: 0,
    yMax: 12,
    yStep: 3,
  },
  {
    id: 'oura_hrv',
    title: 'HRV',
    unit: 'ms',
    accentColor: '#64B4DC',
    data: buildDateSeriesRange(0, 200),
    yMin: 0,
    yMax: 200,
    yStep: 50,
  },
  {
    id: 'oura_heart_rate',
    title: 'Average Heart Rate',
    unit: 'bpm',
    accentColor: '#64B4DC',
    data: buildDateSeriesRange(20, 80),
    yMin: 20,
    yMax: 80,
    yStep: 20,
  },
  {
    id: 'oura_readiness',
    title: 'Readiness Score',
    unit: '%',
    accentColor: '#64B4DC',
    data: buildDateSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
    zones: percentZones,
  },
];

const WHOOP_CHARTS: ChartConfig[] = [
  {
    id: 'whoop_recovery',
    title: 'Recovery Score',
    unit: '%',
    accentColor: '#DC6464',
    data: buildDateSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
    zones: percentZones,
  },
  {
    id: 'whoop_sleep',
    title: 'Sleep Duration',
    unit: 'hrs',
    accentColor: '#DC6464',
    data: buildDateSeriesRange(0, 12),
    yMin: 0,
    yMax: 12,
    yStep: 3,
  },
  {
    id: 'whoop_sleep_performance',
    title: 'Sleep Performance',
    unit: '%',
    accentColor: '#DC6464',
    data: buildDateSeriesRange(0, 100),
    yMin: 0,
    yMax: 100,
    yStep: 20,
    zones: percentZones,
  },
  {
    id: 'whoop_strain',
    title: 'Strain',
    unit: '',
    accentColor: '#DC6464',
    data: buildDateSeriesRange(0, 21),
    yMin: 0,
    yMax: 21,
    yStep: 3,
  },
  {
    id: 'whoop_hrv',
    title: 'HRV',
    unit: 'ms',
    accentColor: '#DC6464',
    data: buildDateSeriesRange(0, 200),
    yMin: 0,
    yMax: 200,
    yStep: 50,
  },
  {
    id: 'whoop_resting_hr',
    title: 'Resting Heart Rate',
    unit: 'bpm',
    accentColor: '#DC6464',
    data: buildDateSeriesRange(20, 80),
    yMin: 20,
    yMax: 80,
    yStep: 20,
  },
];

export const CATEGORIES: ChartCategory[] = [
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

export const DEFAULT_SELECTED = new Set<string>([
  'checkin_overall',
  'checkin_physical',
  'workout_rpe',
  'meet_total',
  'oura_sleep',
  'whoop_recovery',
]);

export const TIME_FRAMES = ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 1 Year', 'All Time'];

export const findChartById = (id: string, categories: ChartCategory[] = CATEGORIES) => {
  for (const category of categories) {
    const chart = category.charts.find((item) => item.id === id);
    if (chart) {
      return { chart, category };
    }
  }
  return null;
};
