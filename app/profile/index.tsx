import { colors } from '@/constants/colors';
import { createClerkSupabaseClient } from '@/services/supabase';
import { trackScreenView } from '@/utils/analytics';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const { signOut, getToken } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    trackScreenView('profile');
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
  }, [isLoaded, user]);

  const email = user?.primaryEmailAddress?.emailAddress ?? '—';
  const initials = useMemo(() => {
    const first = (user?.firstName || 'A').charAt(0).toUpperCase();
    const last = (user?.lastName || '').charAt(0).toUpperCase();
    return `${first}${last}`.trim();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      await user.update({
        firstName: trimmedFirst,
        lastName: trimmedLast,
      });

      const supabase = createClerkSupabaseClient(async () => {
        return getToken({ template: 'supabase', skipCache: true });
      });

      let supabaseSynced = true;
      try {
        const { data, error } = await supabase
          .from('journal_users')
          .update({
            first_name: trimmedFirst,
            last_name: trimmedLast,
          })
          .eq('user_id', user.id)
          .select('user_id');

        if (error) throw error;
        if (!data || data.length === 0) {
          supabaseSynced = false;
        }
      } catch (error) {
        supabaseSynced = false;
        console.error('Failed to sync profile to Supabase:', error);
      }

      if (supabaseSynced) {
        Alert.alert('Profile Updated', 'Your profile information has been saved.');
      } else {
        Alert.alert(
          'Profile Updated',
          'Your profile was saved, but we could not sync it yet. It should update shortly.'
        );
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Update Failed', 'Unable to update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
      Alert.alert('Sign Out Failed', 'Unable to sign out. Please try again.');
    }
  };

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color={colors.blueEnergy} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#F5F5F5', paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrapper}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {initials}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>Email</Text>
          <View
            style={[
              styles.readOnlyField,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.readOnlyText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            First Name
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#000000' },
            ]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={isDark ? '#8E8E93' : '#999999'}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Last Name
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#000000' },
            ]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={isDark ? '#8E8E93' : '#999999'}
          />
        </View>

        <Pressable
          onPress={handleSave}
          style={[styles.primaryButton, { opacity: isSaving ? 0.6 : 1 }]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          style={[
            styles.secondaryButton,
            { borderColor: isDark ? '#444' : '#DDD' },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  readOnlyField: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyText: {
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: colors.blueEnergy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
