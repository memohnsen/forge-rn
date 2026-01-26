import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface MeetCountdownCardProps {
  meetName: string;
  daysUntilMeet: number;
  daysUntilMeetText: string;
  meetDate: string;
  sessionsLeftText: string;
  onPress?: () => void;
}

export const MeetCountdownCard: React.FC<MeetCountdownCardProps> = ({
  meetName,
  daysUntilMeet,
  daysUntilMeetText,
  meetDate,
  sessionsLeftText,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const countdownColor = (() => {
    if (daysUntilMeet < 0) {
      return colors.scoreGreen;
    } else if (daysUntilMeet <= 7) {
      return colors.scoreRed;
    } else if (daysUntilMeet <= 14) {
      return colors.checkInOrange;
    } else {
      return colors.blueEnergy;
    }
  })();

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            shadowColor: countdownColor,
            borderColor: `${countdownColor}40`,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.leftSection}>
              <View style={styles.meetNameRow}>
                <Ionicons name="flag" size={14} color={colors.gold} />
                <Text
                  style={[styles.meetName, { color: isDark ? '#FFFFFF' : '#000000' }]}
                  numberOfLines={1}
                >
                  {meetName}
                </Text>
              </View>
              <Text style={[styles.sessionsLeft, { color: countdownColor }]}>
                {sessionsLeftText}
              </Text>
            </View>

            <View style={styles.rightSection}>
              <Text style={styles.meetDate}>{meetDate}</Text>
              <Text style={[styles.daysLeft, { color: colors.gold }]}>{daysUntilMeetText}</Text>
            </View>
          </View>

          {daysUntilMeet <= 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]} />
              <View style={styles.editRow}>
                <Ionicons name="pencil-outline" size={12} color="#999" />
                <Text style={styles.editText}>Tap to edit meet details</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={12} color="#666" />
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  content: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    gap: 8,
  },
  meetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meetName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sessionsLeft: {
    fontSize: 20,
    fontWeight: '700',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  meetDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  daysLeft: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    fontSize: 12,
    color: '#999',
  },
});
