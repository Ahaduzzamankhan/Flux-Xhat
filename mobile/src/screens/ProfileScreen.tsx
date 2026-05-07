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
import { colors, radius } from '../theme';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const serverUrl = useStore((state) => state.serverUrl);
  const setSession = useStore((state) => state.setSession);
  const clearSession = useStore((state) => state.clearSession);
  const clearServerUrl = useStore((state) => state.clearServerUrl);

  const [username, setUsername] = useState(user?.username ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [status, setStatus] = useState(user?.status ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user || !token) return null;

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
    } catch {
      setError('Unable to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleChangeServer = async () => {
    await clearServerUrl();
    navigation.reset({ index: 0, routes: [{ name: 'ServerSetup' }] });
  };

  return (
    <SafeAreaView style={s.root}>
      <ScreenHeader title="Profile" subtitle="Account settings" onBack={() => navigation.goBack()} />

      <View style={s.card}>
        <Avatar name={username || user.email} uri={avatar} size={72} online />
        <View style={s.identity}>
          <Text style={s.name}>{username || user.username}</Text>
          <Text style={s.email}>{user.email}</Text>
        </View>
      </View>

      <View style={s.form}>
        <AppTextInput label="Username" value={username} onChangeText={setUsername} />
        <AppTextInput label="Avatar URL" value={avatar} onChangeText={setAvatar} autoCapitalize="none" />
        <AppTextInput label="Status" value={status} onChangeText={setStatus} />

        <View style={s.keyBox}>
          <Text style={s.keyLabel}>Public key</Text>
          <Text style={s.keyText} numberOfLines={2}>{user.public_key}</Text>
        </View>

        <View style={s.serverBox}>
          <Text style={s.keyLabel}>Connected server</Text>
          <Text style={s.serverText} numberOfLines={1}>{serverUrl}</Text>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <AppButton title="Save profile" onPress={handleSave} loading={saving} />
        <AppButton title="Change server" variant="secondary" onPress={handleChangeServer} style={s.mt} />
        <AppButton title="Logout" variant="danger" onPress={handleLogout} style={s.mt} />
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  },
  identity: { flex: 1, marginLeft: 16 },
  name: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  email: { color: colors.inkMuted, marginTop: 4 },
  form: {
    marginHorizontal: 20,
    borderRadius: radius.md,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyBox: { padding: 12, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, marginBottom: 10 },
  serverBox: {
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.2)',
    marginBottom: 14,
  },
  keyLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  keyText: { color: colors.ink, fontSize: 12 },
  serverText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  error: { color: colors.danger, marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  mt: { marginTop: 10 },
});

export default ProfileScreen;
