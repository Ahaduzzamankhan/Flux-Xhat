import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from './src/store/useStore';
import { AppNavigator } from './src/navigation';
import { colors, radius } from './src/theme';

const App = () => {
  const restoreSession = useStore((state) => state.restoreSession);
  const token = useStore((state) => state.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setHydrated(true));
  }, [restoreSession]);

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingMarkText}>FX</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator authenticated={Boolean(token)} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingMark: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  loadingMarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default App;
