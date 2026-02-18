import { DailyCheckInSection } from '@/components/sections/DailyCheckInSection';
import { HistorySection } from '@/components/sections/HistorySection';
import { MeetCountdownCard } from '@/components/sections/MeetCountdownCard';
import { ReflectionSection } from '@/components/sections/ReflectionSection';
import { useHome } from '@/hooks/use-home';
import { trackMeetUpdated, trackScreenView } from '@/utils/analytics';
import { formatDate, formatToISO } from '@/utils/dateFormatter';
import { useAuth, useUser } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Check for iOS 26+ (iOS 26 = version 26.0)
const isIOS26OrLater = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
  const profileInitial = (clerkUser?.firstName || firstName).charAt(0).toUpperCase();

  const HeaderContent = () => (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 16, justifyContent: 'flex-end', paddingTop: insets.top, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>{formattedToday}</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : '#000000' }}>
            Ready to train, {firstName}?
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/profile');
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0)' : 'rgba(0,0,0,0.08)',
          }}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {clerkUser?.imageUrl ? (
            <Image source={{ uri: clerkUser.imageUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : (
            <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : '#000000' }}>
              {profileInitial}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 100, paddingTop: headerHeight + 16 }}
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
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{
          position: 'absolute',
          top: -10,
          left: -3,
          right: -3,
          height: headerHeight,
        }}
      >
        {isIOS26OrLater ? (
          <GlassView style={{ flex: 1, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
            <HeaderContent />
          </GlassView>
        ) : (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={{ flex: 1, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}
          >
            <HeaderContent />
          </BlurView>
        )}
      </Animated.View>

      <Modal
        visible={editMeetSheetShown}
        transparent
        animationType="slide"
        onRequestClose={() => setEditMeetSheetShown(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderCurve: 'continuous',
              paddingBottom: 32,
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(0,0,0,0.1)',
              }}
            >
              <Pressable onPress={() => setEditMeetSheetShown(false)}>
                <Text style={{ fontSize: 17, color: '#FF3B30' }}>Cancel</Text>
              </Pressable>
              <Text style={{ fontSize: 17, fontWeight: '600', color: isDark ? '#FFFFFF' : '#000000' }}>
                Edit Meet
              </Text>
              <Pressable onPress={handleSaveMeet}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#5386E4' }}>Save</Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 8 }}>Meet Name</Text>
              <TextInput
                style={{
                  borderRadius: 12,
                  borderCurve: 'continuous',
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  color: isDark ? '#FFFFFF' : '#000000',
                }}
                value={newMeetName}
                onChangeText={setNewMeetName}
                placeholder="Meet Name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 8 }}>Meet Date</Text>
              {Platform.OS === 'android' && (
                <Pressable
                  style={{
                    borderRadius: 12,
                    borderCurve: 'continuous',
                    padding: 12,
                    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  }}
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
