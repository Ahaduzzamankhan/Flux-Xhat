import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { register } from '../api/auth';
import { storeKeyPair, generateKeyPair } from '../crypto/e2ee';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { useStore } from '../store/useStore';
import { colors, radius, shadow } from '../theme';

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
  title: { color: colors.ink, fontSize: 34, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, fontSize: 16, marginTop: 8 },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  bottomRow: { marginTop: 22, flexDirection: 'row', justifyContent: 'center' },
  smallText: { color: colors.inkMuted, marginRight: 8 },
  link: { color: colors.primary, fontWeight: '800' },
  error: { color: colors.danger, marginBottom: 14, textAlign: 'center', fontWeight: '600' },
});

export default RegisterScreen;
