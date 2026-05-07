import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = TextInputProps & { label?: string };

const AppTextInput = ({ label, style, onFocus, onBlur, ...props }: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, isFocused && styles.inputFocused, style]}
        onFocus={(e) => { setIsFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setIsFocused(false); onBlur && onBlur(e); }}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.inkMuted, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default AppTextInput;
