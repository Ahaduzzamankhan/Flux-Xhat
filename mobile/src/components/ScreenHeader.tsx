import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../config/theme';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack?: () => void;
};

const ScreenHeader = ({ title, subtitle, actionLabel, onAction, onBack }: Props) => {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </Pressable>
        ) : null}
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.inkMuted, fontSize: 13, marginTop: 3 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backText: { color: colors.ink, fontSize: 23, fontWeight: '700', marginTop: -2 },
  action: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  actionText: { color: colors.primary, fontWeight: '800' },
});

export default ScreenHeader;
