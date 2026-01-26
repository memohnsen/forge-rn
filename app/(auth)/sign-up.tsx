import { useSignUp } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { useTheme } from '@/hooks/use-theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      if (result.status === 'complete' && result.createdSessionId && setActive) {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Check your email for verification.');
      }
    } catch (err) {
      setError((err as Error).message ?? 'Unable to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={theme.textTertiary}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.textTertiary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        {error ? <Text style={[styles.error, { color: theme.dangerRed }]}>{error}</Text> : null}
        <Text
          style={[styles.button, { backgroundColor: theme.blueEnergy }]}
          onPress={loading ? undefined : handleSignUp}
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    color: 'white',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    textAlign: 'center',
  },
});
