import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polyline } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

interface LineGraphProps {
  data: Array<{ x: number | string; y: number }>;
  color?: string;
  height?: number;
}

export const LineGraph = ({ data, color, height = 180 }: LineGraphProps) => {
  const theme = useTheme();
  const accent = color ?? theme.blueEnergy;
  const [width, setWidth] = useState(0);

  const points = useMemo(() => {
    if (!width || data.length === 0) return '';
    const minY = Math.min(...data.map((d) => d.y));
    const maxY = Math.max(...data.map((d) => d.y));
    const range = maxY - minY || 1;
    const paddingX = 12;
    const paddingY = 16;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;

    return data
      .map((point, index) => {
        const x = paddingX + (usableWidth * index) / Math.max(1, data.length - 1);
        const y = paddingY + usableHeight - ((point.y - minY) / range) * usableHeight;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, height, width]);

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={accent} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={accent} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Polyline
            points={points}
            fill="none"
            stroke={accent}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      )}
    </View>
  );
};
