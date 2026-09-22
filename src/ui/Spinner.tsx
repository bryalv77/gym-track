import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

/** Full-screen centered loader (used while auth state resolves). */
export function ScreenLoader() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.systemBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
