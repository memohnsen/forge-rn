import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';

import { Screen } from '@/components/layout/Screen';
import { useTheme } from '@/hooks/use-theme';
import { useHome } from '@/hooks/use-home';
import { MeetCountdownCard } from '@/components/sections/MeetCountdownCard';
import { DailyCheckInSection } from '@/components/sections/DailyCheckInSection';
import { ReflectionSection } from '@/components/sections/ReflectionSection';
import { HistorySection } from '@/components/sections/HistorySection';
import { formatDateString, formatFullDate } from '@/utils/dateFormatter';

export default function HomeScreen() {
  const theme = useTheme();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const {
    users,
    checkIns,
    loadingHistory,
    fetchUsers,
    fetchCheckIns,
    fetchSessionReports,
    refreshStreak,
    meetNameDisplay,
    daysUntilMeet,
    daysUntilMeetText,
    sessionsLeftText,
    streakDisplayText,
    streakLabelText,
    streakStatusText,
    streakColor,
    streakIconName,
  } = useHome();

  useEffect(() => {
    const load = async () => {
      await fetchUsers();
      await fetchCheckIns();
      await fetchSessionReports();
      refreshStreak();
    };
    void load();
  }, [fetchUsers, fetchCheckIns, fetchSessionReports, refreshStreak]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCheckIns();
    await fetchSessionReports();
    refreshStreak();
    setRefreshing(false);
  };

  const meetDate = useMemo(() => users[0]?.next_competition_date ?? '', [users]);
  const formattedDate = meetDate ? formatDateString(meetDate) : 'N/A';

  return (
    <Screen>
      <View style={[styles.header, { backgroundColor: theme.glassTint }]}>
        <View style={styles.headerText}>
          <Text style={[styles.headerDate, { color: theme.textSecondary }]}>
            {formatFullDate(new Date())}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ready to train, {users[0]?.first_name ?? user?.firstName ?? 'athlete'}?
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundAlt }]}> 
          <Ionicons name="person" size={20} color={theme.text} />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <MeetCountdownCard
          meetName={meetNameDisplay}
          daysUntilMeet={daysUntilMeet}
          daysUntilMeetText={daysUntilMeetText}
          meetDate={formattedDate}
          sessionsLeftText={sessionsLeftText}
        />
        <DailyCheckInSection
          streakCount={streakDisplayText}
          streakLabel={streakLabelText}
          streakStatus={streakStatusText}
          streakColor={streakColor}
          streakIcon={streakIconName as keyof typeof Ionicons.glyphMap}
        />
        <ReflectionSection />
        <HistorySection checkins={checkIns} loading={loadingHistory} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerDate: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scroll: {
    paddingTop: 10,
    paddingBottom: 120,
  },
});
