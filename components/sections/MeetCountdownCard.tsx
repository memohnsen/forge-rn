import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';

interface MeetCountdownCardProps {
  meetName: string;
  daysUntilMeet: number;
  daysUntilMeetText: string;
  meetDate: string;
  sessionsLeftText: string;
}

export const MeetCountdownCard = ({
  meetName,
  daysUntilMeet,
  daysUntilMeetText,
  meetDate,
  sessionsLeftText,
}: MeetCountdownCardProps) => {
  const theme = useTheme();
  const countdownColor =
    daysUntilMeet < 0
      ? theme.successGreen
      : daysUntilMeet <= 7
        ? theme.dangerRed
        : daysUntilMeet <= 14
          ? theme.checkInOrange
          : theme.blueEnergy;

  return (
    <Card accentColor={countdownColor}>
      <View style={styles.row}>
        <View style={styles.column}>
          <View style={styles.meetRow}>
            <Ionicons name="flag" size={14} color={theme.gold} />
            <Text style={[styles.meetName, { color: theme.text }]} numberOfLines={1}>
              {meetName}
            </Text>
          </View>
          <Text style={[styles.sessions, { color: countdownColor }]}>{sessionsLeftText}</Text>
        </View>
        <View style={styles.columnRight}>
          <Text style={[styles.meetDate, { color: theme.textSecondary }]}>{meetDate}</Text>
          <Text style={[styles.daysText, { color: theme.gold }]}>{daysUntilMeetText}</Text>
        </View>
      </View>
      {daysUntilMeet <= 0 && (
        <View style={styles.footer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'transparent']}
            style={styles.divider}
          />
          <View style={styles.footerRow}>
            <Ionicons name="pencil" size={12} color={theme.textSecondary} />
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Tap to edit meet details</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.textTertiary} />
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    gap: 8,
  },
  columnRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  meetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meetName: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessions: {
    fontSize: 26,
    fontWeight: '700',
  },
  meetDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysText: {
    fontSize: 26,
    fontWeight: '700',
  },
  footer: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    flex: 1,
  },
});
