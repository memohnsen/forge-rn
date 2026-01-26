import { DailyCheckInSection } from '@/components/sections/DailyCheckInSection';
import { HistorySection } from '@/components/sections/HistorySection';
import { MeetCountdownCard } from '@/components/sections/MeetCountdownCard';
import { ReflectionSection } from '@/components/sections/ReflectionSection';
import { CheckIn } from '@/models/CheckIn';
import { formatDate, formatToISO } from '@/utils/dateFormatter';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Check for iOS 26+ (iOS 26 = version 26.0)
const isIOS26OrLater = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26;

// Fake data for UI development
const FAKE_USER = {
  first_name: 'Maddisen',
  last_name: 'Mohnsen',
  next_competition: 'USAPL Nationals',
  next_competition_date: '2026-03-15',
  training_days: {
    Monday: 'Squat',
    Wednesday: 'Bench',
    Friday: 'Deadlift',
    Saturday: 'Accessories',
  },
};

const FAKE_CHECK_INS: CheckIn[] = [
  {
    id: 1,
    user_id: 'fake-user',
    check_in_date: '2026-01-25',
    selected_lift: 'Squat',
    selected_intensity: 'Heavy',
    overall_score: 85,
    sleep_quality: 8,
    stress_level: 3,
    energy_level: 7,
    soreness_level: 4,
    motivation_level: 9,
  },
  {
    id: 2,
    user_id: 'fake-user',
    check_in_date: '2026-01-24',
    selected_lift: 'Bench',
    selected_intensity: 'Moderate',
    overall_score: 72,
    sleep_quality: 6,
    stress_level: 5,
    energy_level: 6,
    soreness_level: 5,
    motivation_level: 7,
  },
  {
    id: 3,
    user_id: 'fake-user',
    check_in_date: '2026-01-22',
    selected_lift: 'Deadlift',
    selected_intensity: 'Light',
    overall_score: 91,
    sleep_quality: 9,
    stress_level: 2,
    energy_level: 8,
    soreness_level: 3,
    motivation_level: 9,
  },
  {
    id: 4,
    user_id: 'fake-user',
    check_in_date: '2026-01-20',
    selected_lift: 'Squat',
    selected_intensity: 'Heavy',
    overall_score: 58,
    sleep_quality: 5,
    stress_level: 7,
    energy_level: 4,
    soreness_level: 6,
    motivation_level: 5,
  },
  {
    id: 5,
    user_id: 'fake-user',
    check_in_date: '2026-01-18',
    selected_lift: 'Accessories',
    selected_intensity: 'Moderate',
    overall_score: 78,
    sleep_quality: 7,
    stress_level: 4,
    energy_level: 7,
    soreness_level: 4,
    motivation_level: 8,
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [editMeetSheetShown, setEditMeetSheetShown] = useState(false);
  const [newMeetName, setNewMeetName] = useState(FAKE_USER.next_competition);
  const [newMeetDate, setNewMeetDate] = useState(new Date(FAKE_USER.next_competition_date));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Computed values from fake data
  const daysUntilMeet = (() => {
    const meetDate = new Date(FAKE_USER.next_competition_date);
    const today = new Date();
    const diffTime = meetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  })();

  const sessionsLeft = (() => {
    const trainingDaysPerWeek = Object.keys(FAKE_USER.training_days).length;
    const weeksRemaining = Math.max(0, daysUntilMeet / 7);
    return Math.ceil(weeksRemaining * trainingDaysPerWeek);
  })();

  const daysUntilMeetText =
    daysUntilMeet < 0
      ? 'Completed'
      : daysUntilMeet === 0
        ? 'Today!'
        : `${daysUntilMeet} day${daysUntilMeet === 1 ? '' : 's'} left`;

  const sessionsLeftText =
    daysUntilMeet <= 0 ? '0' : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} left`;

  // Fake streak data
  const streakDisplayText = '12';
  const streakLabelText = 'day streak!';
  const streakStatusText = "You're on fire!";
  const streakColor = '#FF9500';
  const streakIconName = 'flame';

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleEditMeet = () => {
    setNewMeetName(FAKE_USER.next_competition);
    setNewMeetDate(new Date(FAKE_USER.next_competition_date));
    setEditMeetSheetShown(true);
  };

  const handleSaveMeet = async () => {
    console.log('Saving meet:', { name: newMeetName, date: formatToISO(newMeetDate) });
    setEditMeetSheetShown(false);
  };

  const today = new Date();
  const formattedToday = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const headerHeight = 80 + insets.top;

  const HeaderContent = () => (
    <View style={[styles.headerContent, { paddingTop: insets.top }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.dateText}>{formattedToday}</Text>
        <Text style={[styles.greetingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Ready to train, {FAKE_USER.first_name}?
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#5386E4"
            progressViewOffset={headerHeight}
          />
        }
      >
        <MeetCountdownCard
          meetName={FAKE_USER.next_competition}
          daysUntilMeet={daysUntilMeet}
          daysUntilMeetText={daysUntilMeetText}
          meetDate={formatDate(FAKE_USER.next_competition_date) || 'N/A'}
          sessionsLeftText={sessionsLeftText}
          onPress={handleEditMeet}
        />

        <DailyCheckInSection
          streakCount={streakDisplayText}
          streakLabel={streakLabelText}
          streakStatus={streakStatusText}
          streakColor={streakColor}
          streakIcon={streakIconName}
        />

        <ReflectionSection />

        <HistorySection checkIns={FAKE_CHECK_INS} isLoading={false} />
      </ScrollView>

      {/* Glass/Blur Header Overlay */}
      <View style={[styles.headerOverlay, { height: headerHeight }]}>
        {isIOS26OrLater ? (
          <GlassView style={styles.headerBlur}>
            <HeaderContent />
          </GlassView>
        ) : (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={styles.headerBlur}
          >
            <HeaderContent />
          </BlurView>
        )}
      </View>

      <Modal
        visible={editMeetSheetShown}
        transparent
        animationType="slide"
        onRequestClose={() => setEditMeetSheetShown(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditMeetSheetShown(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Edit Meet
              </Text>
              <Pressable onPress={handleSaveMeet}>
                <Text style={styles.saveButton}>Save</Text>
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Meet Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                    color: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                value={newMeetName}
                onChangeText={setNewMeetName}
                placeholder="Meet Name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Meet Date</Text>
              <Pressable
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                  {newMeetDate.toLocaleDateString()}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newMeetDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setNewMeetDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerBlur: {
    flex: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 17,
    color: '#FF3B30',
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5386E4',
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    borderRadius: 12,
    padding: 12,
  },
});
