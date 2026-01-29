import { DailyCheckInSection } from '@/components/sections/DailyCheckInSection';
import { HistorySection } from '@/components/sections/HistorySection';
import { MeetCountdownCard } from '@/components/sections/MeetCountdownCard';
import { ReflectionSection } from '@/components/sections/ReflectionSection';
import { useHome } from '@/hooks/use-home';
import { formatDate, formatToISO } from '@/utils/dateFormatter';
import { useAuth, useUser } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { trackMeetUpdated, trackScreenView } from '@/utils/analytics';

// Check for iOS 26+ (iOS 26 = version 26.0)
const isIOS26OrLater = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { userId } = useAuth();
  const { user: clerkUser } = useUser();

  const {
    user,
    checkIns,
    loadingHistory,
    streakDisplayText,
    streakLabelText,
    streakStatusText,
    streakColor,
    streakIconName,
    daysUntilMeet,
    meetNameDisplay,
    daysUntilMeetText,
    sessionsLeftText,
    fetchUsers,
    fetchCheckIns,
    fetchSessionReports,
    calculateStreak,
    updateUserMeet,
    refreshData,
  } = useHome();

  const [refreshing, setRefreshing] = useState(false);
  const [editMeetSheetShown, setEditMeetSheetShown] = useState(false);
  const [newMeetName, setNewMeetName] = useState('');
  const [newMeetDate, setNewMeetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    trackScreenView('home');
  }, []);

  // Fetch data on mount
  useEffect(() => {
    if (userId) {
      fetchUsers(userId);
      fetchCheckIns(userId);
      fetchSessionReports(userId);
    }
  }, [userId]);

  // Calculate streak when data changes
  useEffect(() => {
    calculateStreak();
  }, [checkIns, user]);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await refreshData(userId);
    setRefreshing(false);
  };

  const handleEditMeet = () => {
    setNewMeetName(user?.next_competition || '');
    const parseMeetDate = (value?: string) => {
      if (!value) return new Date();
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    setNewMeetDate(parseMeetDate(user?.next_competition_date));
    setEditMeetSheetShown(true);
  };

  const handleSaveMeet = async () => {
    if (!userId) return;
    const fallbackProfile = user
      ? undefined
      : {
          first_name: clerkUser?.firstName || '',
          last_name: clerkUser?.lastName || '',
          sport: 'Powerlifting',
          years_of_experience: 0,
          meets_per_year: 0,
          goal: '',
          biggest_struggle: '',
          training_days: {},
          current_tracking_method: '',
          biggest_frustration: '',
          reflection_frequency: '',
          what_holding_back: '',
          coach_email: null,
          oura_refresh_token: null,
          whoop_refresh_token: null,
          store_token: false,
          created_at: new Date().toISOString(),
        };

    const success = await updateUserMeet(
      userId,
      newMeetName,
      formatToISO(newMeetDate),
      fallbackProfile
    );

    if (!success) {
      Alert.alert('Unable to save meet', 'Please try again.');
      return;
    }

    await fetchUsers(userId);
    trackMeetUpdated(newMeetName, formatToISO(newMeetDate));
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
  const firstName = user?.first_name || clerkUser?.firstName || 'Athlete';

  const HeaderContent = () => (
    <View style={[styles.headerContent, { paddingTop: insets.top }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.dateText}>{formattedToday}</Text>
        <Text style={[styles.greetingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Ready to train, {firstName}?
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
          meetName={meetNameDisplay}
          daysUntilMeet={daysUntilMeet}
          daysUntilMeetText={daysUntilMeetText}
          meetDate={user?.next_competition_date ? formatDate(user.next_competition_date) || 'N/A' : 'N/A'}
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

        <HistorySection checkIns={checkIns} isLoading={loadingHistory} />
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
              {Platform.OS === 'android' && (
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
              )}
            </View>

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={newMeetDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNewMeetDate(selectedDate);
                  }
                }}
              />
            )}
            {Platform.OS === 'ios' && (
              <DateTimePicker
               style={{ marginLeft: 8 }}
                value={newMeetDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
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
    top: -10,
    left: -3,
    right: -3,
  },
  headerBlur: {
    flex: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 24,
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
    paddingBottom: 100,
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
  dateRow: {
    paddingVertical: 6,
  },
});
