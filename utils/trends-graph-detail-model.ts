import type { ChartConfig, TrendPoint, ZoneRange } from '@/utils/trends-data';

export type TrendDirection = 'up' | 'down' | 'flat';

const TIME_FRAME_OPTIONS = ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 1 Year', 'All Time'];

const getDateRangeStart = (timeFrame: string, endDate: Date) => {
  const date = new Date(endDate);
  switch (timeFrame) {
    case 'Last 30 Days':
      date.setDate(date.getDate() - 30);
      return date;
    case 'Last 90 Days':
      date.setDate(date.getDate() - 90);
      return date;
    case 'Last 6 Months':
      date.setMonth(date.getMonth() - 6);
      return date;
    case 'Last 1 Year':
      date.setFullYear(date.getFullYear() - 1);
      return date;
    case 'All Time':
      return new Date(0);
    default:
      date.setDate(date.getDate() - 30);
      return date;
  }
};

const groupData = (data: TrendPoint[], timeFrame: string) => {
  const shouldAggregate =
    timeFrame === 'Last 90 Days' || timeFrame === 'Last 6 Months' || timeFrame === 'Last 1 Year' || timeFrame === 'All Time';
  if (!shouldAggregate) {
    return [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const groupBy = timeFrame === 'Last 90 Days' ? 'week' : 'month';
  const grouped = new Map<string, { date: Date; values: number[] }>();

  data.forEach((point) => {
    const date = point.date;
    const key =
      groupBy === 'week'
        ? `${date.getFullYear()}-${getWeekNumber(date)}`
        : `${date.getFullYear()}-${date.getMonth()}`;
    if (!grouped.has(key)) {
      grouped.set(key, { date, values: [point.value] });
    } else {
      grouped.get(key)!.values.push(point.value);
    }
  });

  return Array.from(grouped.values())
    .map((entry) => ({
      date: entry.date,
      value: entry.values.reduce((sum, value) => sum + value, 0) / entry.values.length,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const getWeekNumber = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const buildGraphDetailState = (
  config: ChartConfig,
  timeFrame: string,
  dateRangeEnd: Date
) => {
  const rangeStart = getDateRangeStart(timeFrame, dateRangeEnd);
  const filteredRaw = config.data.filter(
    (point) => point.date >= rangeStart && point.date <= dateRangeEnd
  );
  const filteredData = groupData(filteredRaw, timeFrame);

  const values = filteredData.map((point) => point.value);
  const currentValue = values[values.length - 1] ?? 0;
  const averageValue = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;

  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);
  const firstAvg = firstHalf.length
    ? firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length
    : 0;
  const secondAvg = secondHalf.length
    ? secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length
    : 0;
  const trendPercentage = firstAvg === 0 ? 0 : ((secondAvg - firstAvg) / firstAvg) * 100;
  const trendDirection: TrendDirection =
    trendPercentage > 3 ? 'up' : trendPercentage < -3 ? 'down' : 'flat';

  const currentZone = config.zones?.find(
    (zone) => currentValue >= zone.minValue && currentValue < zone.maxValue
  );

  const dateRangeString = (() => {
    if (!filteredData.length) return '';
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const startDate = filteredData[0].date;
    const endDate = dateRangeEnd;
    return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
  })();

  return {
    timeFrameOptions: TIME_FRAME_OPTIONS,
    rangeStart,
    filteredData,
    currentValue,
    averageValue,
    minValue,
    maxValue,
    trendPercentage,
    trendDirection,
    currentZone: currentZone ?? null,
    dateRangeString,
  };
};

export type GraphDetailState = ReturnType<typeof buildGraphDetailState>;

export default function GraphDetailModelRoute() {
  return null;
}
