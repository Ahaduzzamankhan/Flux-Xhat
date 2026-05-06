import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
  online?: boolean;
};

const Avatar = ({ name, uri, size = 48, online }: Props) => {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <View style={[styles.shell, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
      )}
      {typeof online === 'boolean' ? (
        <View
          style={[
            styles.presence,
            {
              backgroundColor: online ? colors.success : colors.inkSoft,
              right: size * 0.04,
              bottom: size * 0.04,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  presence: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

export default Avatar;

