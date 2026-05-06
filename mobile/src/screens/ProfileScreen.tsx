import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { updateProfile } from '../api/chat';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { colors, radius, shadow } from '../theme';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const setSession = useStore((state) => state.setSession);
  const clearSession = useStore((state) => state.clearSession);

  const [username, setUsername] = useState(user?.username ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user || !token) {
    return null;
  }

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateProfile(token, {
        username: username.trim(),
        avatar: avatar.trim() || undefined,
        status: status.trim() || undefined,
      });
      await setSession(token, updated);
    } catch (err) {
      setError('Unable to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Profile" subtitle="Account and public key" onBack={() => navigation.goBack()} />

      <View style={styles.card}>
        <Avatar name={username || user.email} uri={avatar} size={78} online />
        <View style={styles.identity}>
          <Text style={styles.name}>{username || user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <AppTextInput label="Username" value={username} onChangeText={setUsername} />
        <AppTextInput
          label="Avatar URL"
          value={avatar}
          onChangeText={setAvatar}
          autoCapitalize="none"
        />
        <AppTextInput label="Status" value={status} onChangeText={setStatus} />
        <View style={styles.keyBox}>
          <Text style={styles.keyLabel}>Public key</Text>
          <Text style={styles.keyText} numberOfLines={2}>{user.public_key}</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title="Save profile" onPress={handleSave} loading={saving} />
        <AppButton title="Logout" variant="danger" onPress={handleLogout} style={styles.logout} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow,
  },
  identity: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  email: {
    color: colors.inkMuted,
    marginTop: 5,
  },
  form: {
    marginHorizontal: 20,
    borderRadius: radius.md,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyBox: {
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 14,
  },
  keyLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  keyText: {
    color: colors.ink,
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  logout: {
    marginTop: 12,
  },
});

export default ProfileScreen;

