import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { register } from '../api/auth';
import { storeKeyPair, generateKeyPair } from '../crypto/e2ee';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { useStore } from '../store/useStore';
import { colors, radius } from '../config/theme';

const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const setSession = useStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const keypair = await generateKeyPair();
      await storeKeyPair(keypair.privateKey, keypair.publicKey);
      const response = await register(email.trim(), password, username.trim(), keypair.publicKey);
      await setSession(response.token, response.user);
      navigation.reset({ index: 0, routes: [{ name: 'Chats' }] });
    } catch (err) {
      setError('Registration failed. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Text style={styles.markText}>FX</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Your encryption keys are generated on this device.</Text>
      </View>

      <View style={styles.panel}>
        <AppTextInput label="Username" placeholder="Display name" value={username} onChangeText={setUsername} />
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
          placeholder="At least 12 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title="Create account" onPress={handleRegister} loading={loading} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.smallText}>Already registered?</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>Sign in</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: colors.background },
  hero: { marginBottom: 28 },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  markText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, fontSize: 16, marginTop: 8 },
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
  bottomRow: { marginTop: 22, flexDirection: 'row', justifyContent: 'center' },
  smallText: { color: colors.inkMuted, marginRight: 8 },
  link: { color: colors.primary, fontWeight: '800' },
  error: { color: colors.danger, marginBottom: 14, textAlign: 'center', fontWeight: '600' },
});

export default RegisterScreen;
