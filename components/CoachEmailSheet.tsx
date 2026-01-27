import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface CoachEmailSheetProps {
  visible: boolean;
  initialEmail: string;
  onSave: (email: string) => void;
  onCancel: () => void;
}

export function CoachEmailSheet({ visible, initialEmail, onSave, onCancel }: CoachEmailSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [emailText, setEmailText] = useState(initialEmail);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update email text when initialEmail changes or modal opens
  useEffect(() => {
    if (visible) {
      setEmailText(initialEmail);
      setShowError(false);
    }
  }, [visible, initialEmail]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    const trimmedEmail = emailText.trim();

    if (trimmedEmail === '') {
      onSave('');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setShowError(true);
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setShowError(false);
    onSave(trimmedEmail);
  };

  const handleCancel = () => {
    setShowError(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Auto-Send Results
            </Text>
            <Pressable onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Coach Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : 'rgba(255,255,255,0.6)',
                    color: isDark ? '#FFFFFF' : '#000000',
                    borderColor: showError ? '#FF3B30' : 'transparent',
                  },
                ]}
                value={emailText}
                onChangeText={(text) => {
                  setEmailText(text);
                  setShowError(false);
                }}
                placeholder="coach@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              {showError && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>

            <View
              style={[
                styles.noticeContainer,
                {
                  backgroundColor: isDark ? 'rgba(255, 160, 80, 0.2)' : 'rgba(255, 160, 80, 0.1)',
                  borderColor: 'rgba(255, 160, 80, 0.3)',
                },
              ]}
            >
              <View style={styles.noticeHeader}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#FFA050"
                />
                <Text style={[styles.noticeTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Privacy Notice
                </Text>
              </View>

              <Text style={[styles.noticeSubtext, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]}>
                By entering a coach email address, you acknowledge and accept that:
              </Text>

              <View style={styles.bulletPoints}>
                <BulletPoint
                  text="Your private performance data (check-ins, competition reports, and session reports) and wearable data (Oura/Whoop if you have agreed to store this) will be automatically shared with the email address you provide."
                  isDark={isDark}
                />
                <BulletPoint
                  text="Data will be sent weekly on Sunday morning via email."
                  isDark={isDark}
                />
                <BulletPoint
                  text="You are responsible for ensuring the email address is correct and that the recipient is authorized to receive your data."
                  isDark={isDark}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BulletPoint({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <View style={styles.bulletPoint}>
      <Text style={styles.bullet}>•</Text>
      <Text style={[styles.bulletText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    height: '85%',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
  noticeContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  noticeSubtext: {
    fontSize: 14,
    marginBottom: 12,
  },
  bulletPoints: {
    gap: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
