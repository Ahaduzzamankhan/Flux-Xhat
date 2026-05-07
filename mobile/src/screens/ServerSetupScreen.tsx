import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import { colors, radius } from '../config/theme';

const PRESETS = [
  { name: 'Self-Hosted', detail: 'Your own VPS, Docker, or bare metal server', hint: 'https://chat.yourdomain.com' },
  { name: 'Railway / Render', detail: 'One-click cloud deploy on Railway, Render, or Fly.io', hint: 'https://your-app.railway.app' },
  { name: 'Company Intranet', detail: 'Private deployment behind VPN or firewall', hint: 'https://chat.yourcompany.internal' },
  { name: 'Local / Dev', detail: 'Backend running on your local machine', hint: 'http://10.0.2.2:8080' },
];

async function pingServer(url: string): Promise<{ ok: boolean; msg: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${url}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return { ok: false, msg: `Server returned HTTP ${res.status}` };
    const json = await res.json();
    if (json?.ok) return { ok: true, msg: 'Connected successfully' };
    return { ok: false, msg: 'Unexpected response from server' };
  } catch (e: any) {
    clearTimeout(t);
    if (e?.name === 'AbortError') return { ok: false, msg: 'Timed out after 8s' };
    return { ok: false, msg: e?.message ?? 'Cannot reach server' };
  }
}

export default function ServerSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const setServerUrl = useStore((s) => s.setServerUrl);
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const clean = url.trim().replace(/\/$/, '');

  const pickPreset = (i: number) => { setSelected(i); setUrl(PRESETS[i].hint); setResult(null); };

  const verify = async () => {
    if (!clean) return;
    setBusy(true);
    setResult(null);
    const r = await pingServer(clean);
    setResult(r);
    setBusy(false);
  };

  const connect = async () => {
    if (!clean) return;
    setBusy(true);
    const r = await pingServer(clean);
    setBusy(false);
    if (!r.ok) { setResult(r); return; }
    await setServerUrl(clean);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <View style={s.logo}><Text style={s.logoText}>FX</Text></View>
            <Text style={s.title}>Connect to Server</Text>
            <Text style={s.sub}>Flux Xhat is self-hosted. Enter the URL of your backend to get started.</Text>
          </View>

          <Text style={s.sectionLabel}>Quick presets</Text>
          {PRESETS.map((p, i) => (
            <Pressable key={i} style={[s.preset, selected === i && s.presetActive]} onPress={() => pickPreset(i)}>
              <View style={s.presetDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.presetName}>{p.name}</Text>
                <Text style={s.presetDetail}>{p.detail}</Text>
              </View>
              {selected === i && <View style={s.checkDot} />}
            </Pressable>
          ))}

          <Text style={s.sectionLabel}>Server URL</Text>
          <AppTextInput
            placeholder="https://chat.yourdomain.com"
            value={url}
            onChangeText={(v) => { setUrl(v); setResult(null); setSelected(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {result && (
            <View style={[s.banner, result.ok ? s.bannerOk : s.bannerErr]}>
              <Text style={[s.bannerText, result.ok ? s.bannerTextOk : s.bannerTextErr]}>{result.msg}</Text>
            </View>
          )}

          <View style={s.actions}>
            <Pressable onPress={verify} disabled={busy || !clean} style={s.verifyBtn}>
              {busy
                ? <ActivityIndicator color={colors.primary} size="small" />
                : <Text style={[s.verifyText, !clean && { opacity: 0.4 }]}>Test connection</Text>
              }
            </Pressable>
            <AppButton title="Connect" onPress={connect} loading={busy} disabled={!clean} style={{ flex: 1 }} />
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoTitle}>How to deploy your backend</Text>
            <Text style={s.infoLine}>1. Clone the repo and run cargo build --release</Text>
            <Text style={s.infoLine}>2. Set environment variables (Firebase, JWT, R2)</Text>
            <Text style={s.infoLine}>3. Start the server and note the public URL</Text>
            <Text style={s.infoLine}>4. Paste that URL here and tap Connect</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 28 },
  logo: {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoText: { color: '#000', fontSize: 17, fontWeight: '900' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900', marginBottom: 8 },
  sub: { color: colors.inkMuted, fontSize: 15, lineHeight: 22 },
  sectionLabel: {
    color: colors.inkMuted, fontSize: 12, fontWeight: '800',
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  preset: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8, gap: 12,
  },
  presetActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  presetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkSoft },
  presetName: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  presetDetail: { color: colors.inkMuted, fontSize: 13, marginTop: 2 },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  banner: { padding: 12, borderRadius: radius.sm, marginBottom: 12 },
  bannerOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  bannerErr: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)' },
  bannerText: { fontWeight: '700', fontSize: 14 },
  bannerTextOk: { color: colors.success },
  bannerTextErr: { color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'center' },
  verifyBtn: {
    height: 48, paddingHorizontal: 16, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  verifyText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  infoBox: { padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  infoTitle: { color: colors.ink, fontWeight: '800', marginBottom: 10 },
  infoLine: { color: colors.inkMuted, fontSize: 13, lineHeight: 22 },
});
