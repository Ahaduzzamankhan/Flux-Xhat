import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { login } from '../api/auth';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { useStore } from '../store/useStore';
import { colors, radius, shadow } from '../theme';

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const setSession = useStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      await setSession(response.token, response.user);
      navigation.reset({ index: 0, routes: [{ name: 'Chats' }] });
    } catch (err) {
      setError('Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Decorative Orbs */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <View style={styles.hero}>
        <View style={styles.mark}>
          <Text style={styles.markText}>FX</Text>
        </View>
        <Text style={styles.title}>FLUX XHAT</Text>
        <Text style={styles.subtitle}>Secure messages, quiet design, fast delivery.</Text>
      </View>

      <View style={styles.panel}>
        <AppTextInput
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <AppTextInput
          label="Password"
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title="Sign in" onPress={handleLogin} loading={loading} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.smallText}>New here?</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          Create account
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  hero: {
    marginBottom: 28,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  markText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 16,
    marginTop: 8,
  },
  panel: {
    backgroundColor: 'rgba(10, 10, 10, 0.65)',
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  orb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.15,
  },
  orbTop: {
    top: -50,
    right: -50,
    backgroundColor: colors.primary,
  },
  orbBottom: {
    bottom: -50,
    left: -50,
    backgroundColor: colors.accent,
  },
  bottomRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  smallText: {
    color: colors.inkMuted,
    marginRight: 8,
  },
  link: {
    color: colors.primary,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    marginBottom: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default LoginScreen;

