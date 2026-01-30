import { colors } from '@/constants/colors';
import { useNotifications } from '@/hooks/use-notifications';
import { useHome } from '@/hooks/use-home';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackNotificationSettingsViewed } from '@/utils/analytics';
import { useAuth } from '@clerk/clerk-expo';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const WEEKDAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS = [
  '4:00 AM',
  '5:00 AM',
  '6:00 AM',
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
];

const TIME_REGEX = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i;

function parseTimeString(timeString: string): { hour: number; minute: number } | null {
  const match = TIME_REGEX.exec(timeString);
  if (!match) return null;

  const hourRaw = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hourRaw) || Number.isNaN(minute)) return null;
  if (hourRaw < 1 || hourRaw > 12) return null;
  if (minute < 0 || minute > 59) return null;

  let hour = hourRaw % 12;
  if (meridiem === 'PM') hour += 12;
  if (hour < 0 || hour > 23) return null;

  return { hour, minute };
}

function formatTime(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function calculateSessionTime(timeString: string) {
  const time = parseTimeString(timeString);
  if (!time) return '2 hours after';

  const totalMinutes = time.hour * 60 + time.minute + 120;
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return formatTime(Math.floor(wrapped / 60), wrapped % 60);
}

function formatMeetDate(dateString: string) {
  if (!dateString) return dateString;
  const parsed = /^\\d{4}-\\d{2}-\\d{2}$/.test(dateString)
    ? new Date(
        Number(dateString.slice(0, 4)),
        Number(dateString.slice(5, 7)) - 1,
        Number(dateString.slice(8, 10))
      )
    : new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { user, fetchUsers } = useHome();
  const {
    trainingDays,
    isEnabled,
    hasPermission,
    isLoading,
    enableNotifications,
    disableNotifications,
    saveTrainingDays,
    updateMeetData,
    rescheduleNotifications,
  } = useNotifications();

  const [showEditTrainingDays, setShowEditTrainingDays] = useState(false);

  const sortedDays = useMemo(() => {
    return Object.keys(trainingDays).sort((a, b) => {
      const indexA = WEEKDAY_ORDER.indexOf(a);
      const indexB = WEEKDAY_ORDER.indexOf(b);
      return indexA - indexB;
    });
  }, [trainingDays]);

  useEffect(() => {
    trackNotificationSettingsViewed();
  }, []);

  useEffect(() => {
    let isActive = true;

    (async () => {
      const meetDate = user?.next_competition_date;
      const meetName = user?.next_competition;

      if (meetDate && meetName) {
        await updateMeetData(meetDate, meetName);
      } else {
        await updateMeetData(undefined, undefined);
      }

      if (isActive) {
        await rescheduleNotifications();
      }
    })();

    return () => {
      isActive = false;
    };
  }, [rescheduleNotifications, updateMeetData, user?.next_competition, user?.next_competition_date]);

  useEffect(() => {
    if (userId) {
      fetchUsers(userId);
    }
  }, [fetchUsers, userId]);

  const handleToggleNotifications = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await enableNotifications();
        if (!granted) {
          Alert.alert(
            'Notifications Disabled',
            'Enable notifications in your device settings to receive reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        await disableNotifications();
      }
    },
    [disableNotifications, enableNotifications]
  );

  const meetName = user?.next_competition || '';
  const meetDate = user?.next_competition_date || '';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#111111' : '#FFFFFF',
              borderColor: `${colors.blueEnergy}1A`,
            },
          ]}
        >
          <View style={styles.toggleRow}>
            <LinearGradient
              colors={[
                `${(isEnabled ? colors.orange : '#9A9A9A')}40`,
                `${(isEnabled ? colors.orange : '#9A9A9A')}1A`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons
                name="notifications"
                size={16}
                color={isEnabled ? colors.orange : '#9A9A9A'}
              />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}> 
              Enable Notifications
            </Text>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isLoading}
              trackColor={{ false: '#767577', true: `${colors.blueEnergy}80` }}
              thumbColor={isEnabled ? colors.blueEnergy : '#f4f3f4'}
            />
          </View>
          <Text style={styles.cardDescription}>
            Receive reminders for daily check-ins, session reflections, and competition analysis
          </Text>
          {!hasPermission && isEnabled ? (
            <Text style={styles.permissionWarning}>Notifications are disabled in system settings.</Text>
          ) : null}
        </View>

        {isEnabled ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: `${colors.blueEnergy}1A`,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardHeaderTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}> 
                Training Schedule
              </Text>
              <Pressable onPress={() => setShowEditTrainingDays(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </Pressable>
            </View>

            {sortedDays.length === 0 ? (
              <Text style={styles.emptyText}>No training days set</Text>
            ) : (
              <View style={styles.trainingDaysList}>
                {sortedDays.map((day) => (
                  <TrainingDayCard
                    key={day}
                    day={day}
                    trainingTime={trainingDays[day] || ''}
                    sessionTime={calculateSessionTime(trainingDays[day] || '')}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {isEnabled && meetName && meetDate ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: `${colors.gold}26`,
              },
            ]}
          >
            <Text style={[styles.cardHeaderTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}> 
              Competition Reminder
            </Text>
            <View
              style={[
                styles.compCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 191, 0, 0.08)' : 'rgba(255, 191, 0, 0.06)',
                  borderColor: 'rgba(255, 191, 0, 0.15)',
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 191, 0, 0.25)', 'rgba(255, 191, 0, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.compIconCircle}
              >
                <Ionicons name="trophy" size={18} color={colors.gold} />
              </LinearGradient>
              <View style={styles.compTextContainer}>
                <Text style={[styles.compTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}> 
                  {meetName}
                </Text>
                <Text style={styles.compSubtitle}>
                  Notification at 5:00 PM on {formatMeetDate(meetDate)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <EditTrainingScheduleModal
        visible={showEditTrainingDays}
        isDark={isDark}
        trainingDays={trainingDays}
        onDismiss={() => setShowEditTrainingDays(false)}
        onSave={async (updatedDays) => {
          const success = await saveTrainingDays(updatedDays);
          if (success) {
            setShowEditTrainingDays(false);
          } else {
            Alert.alert('Save Failed', 'Unable to save your training schedule. Please try again.');
          }
        }}
      />
    </View>
  );
}

function TrainingDayCard({
  day,
  trainingTime,
  sessionTime,
  isDark,
}: {
  day: string;
  trainingTime: string;
  sessionTime: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.trainingCard,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
        },
      ]}
    >
      <Text style={[styles.trainingDay, { color: isDark ? '#FFFFFF' : '#000000' }]}>{day}</Text>
      <View style={styles.trainingTimesRow}>
        <NotificationTimeRow
          icon="sunny"
          iconColor={colors.orange}
          label="Check-in"
          time={trainingTime}
        />
        <NotificationTimeRow
          icon="barbell"
          iconColor={colors.blueEnergy}
          label="Reflection"
          time={sessionTime}
        />
      </View>
    </View>
  );
}

function NotificationTimeRow({
  icon,
  iconColor,
  label,
  time,
}: {
  icon: string;
  iconColor: string;
  label: string;
  time: string;
}) {
  return (
    <View style={styles.timeRow}>
      <Ionicons name={icon as never} size={12} color={iconColor} style={styles.timeIcon} />
      <Text style={styles.timeText}>{`${label} ${time}`}</Text>
    </View>
  );
}

function EditTrainingScheduleModal({
  visible,
  isDark,
  trainingDays,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  isDark: boolean;
  trainingDays: Record<string, string>;
  onDismiss: () => void;
  onSave: (days: Record<string, string>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [editableDays, setEditableDays] = useState<Record<string, string>>({});
  const [selectedDayForTime, setSelectedDayForTime] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEditableDays(trainingDays);
    }
  }, [trainingDays, visible]);

  const toggleDay = (day: string) => {
    setEditableDays((prev) => {
      const next = { ...prev };
      if (next[day]) {
        delete next[day];
        if (selectedDayForTime === day) {
          setSelectedDayForTime(null);
        }
      } else {
        next[day] = TIME_OPTIONS[0];
      }
      return next;
    });
  };

  const updateTime = (day: string, time: string) => {
    setEditableDays((prev) => ({ ...prev, [day]: time }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onDismiss} />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#111111' : '#FFFFFF',
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={onDismiss}>
              <Text style={styles.modalAction}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}> 
              Edit Training Days
            </Text>
            <Pressable onPress={() => onSave(editableDays)}>
              <Text style={[styles.modalAction, styles.modalActionPrimary]}>Save</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalSubtitle}>When do you train?</Text>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = !!editableDays[day];
              return (
                <View key={day} style={styles.dayRow}>
                  <Pressable
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isSelected
                          ? colors.blueEnergy
                          : isDark
                            ? 'rgba(83, 134, 228, 0.15)'
                            : 'rgba(83, 134, 228, 0.12)',
                        borderColor: isSelected ? 'transparent' : 'rgba(83, 134, 228, 0.3)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        { color: isSelected ? '#FFFFFF' : colors.blueEnergy },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>

                  {isSelected ? (
                    <Pressable
                      onPress={() => setSelectedDayForTime(day)}
                      style={[
                        styles.timeButton,
                        {
                          backgroundColor: isDark
                            ? 'rgba(83, 134, 228, 0.15)'
                            : 'rgba(83, 134, 228, 0.12)',
                          borderColor: 'rgba(83, 134, 228, 0.3)',
                        },
                      ]}
                    >
                      <Text style={styles.timeButtonText}>{editableDays[day]}</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.timePlaceholder}>
                      <Text style={styles.timePlaceholderText}>Select time</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <TimePickerModal
        visible={!!selectedDayForTime}
        isDark={isDark}
        selectedTime={selectedDayForTime ? editableDays[selectedDayForTime] : TIME_OPTIONS[0]}
        onSelect={(time) => {
          if (selectedDayForTime) {
            updateTime(selectedDayForTime, time);
          }
        }}
        onClose={() => setSelectedDayForTime(null)}
      />
    </Modal>
  );
}

function TimePickerModal({
  visible,
  isDark,
  selectedTime,
  onSelect,
  onClose,
}: {
  visible: boolean;
  isDark: boolean;
  selectedTime: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.timeModalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View
          style={[
            styles.timeModalCard,
            {
              backgroundColor: isDark ? '#111111' : '#FFFFFF',
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <Text style={[styles.timeModalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}> 
            Select Time
          </Text>
          <ScrollView style={styles.timeOptions}>
            {TIME_OPTIONS.map((time) => {
              const isSelected = time === selectedTime;
              return (
                <Pressable
                  key={time}
                  onPress={() => onSelect(time)}
                  style={[
                    styles.timeOptionRow,
                    {
                      backgroundColor: isSelected
                        ? `${colors.blueEnergy}1F`
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      {
                        color: isSelected ? colors.blueEnergy : isDark ? '#FFFFFF' : '#000000',
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {time}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.blueEnergy} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={styles.timeDoneButton} onPress={onClose}>
            <LinearGradient
              colors={[colors.blueEnergy, `${colors.blueEnergy}D9`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.timeDoneButtonGradient}
            >
              <Text style={styles.timeDoneButtonText}>Done</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 12,
    color: '#9A9A9A',
  },
  permissionWarning: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF9500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.blueEnergy,
  },
  emptyText: {
    fontSize: 13,
    color: '#9A9A9A',
  },
  trainingDaysList: {
    gap: 12,
  },
  trainingCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  trainingDay: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  trainingTimesRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    width: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#9A9A9A',
  },
  compCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  compIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compTextContainer: {
    flex: 1,
  },
  compTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  compSubtitle: {
    fontSize: 12,
    color: '#9A9A9A',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  timeModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalAction: {
    fontSize: 14,
    color: '#9A9A9A',
  },
  modalActionPrimary: {
    color: colors.blueEnergy,
    fontWeight: '600',
  },
  modalContent: {
    paddingBottom: 20,
    gap: 12,
  },
  modalSubtitle: {
    textAlign: 'center',
    color: '#9A9A9A',
    fontSize: 13,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 110,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.blueEnergy,
  },
  timePlaceholder: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: 'rgba(154, 154, 154, 0.1)',
  },
  timePlaceholderText: {
    fontSize: 13,
    color: '#9A9A9A',
  },
  timeModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    maxHeight: '60%',
  },
  timeModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeOptions: {
    marginBottom: 12,
  },
  timeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  timeOptionText: {
    fontSize: 14,
  },
  timeDoneButton: {
    marginTop: 4,
  },
  timeDoneButtonGradient: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
