import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

/** Rounded progress track (iOS-style). `progress` is clamped to 0…1. */
export function ProgressBar({
  progress,
  color,
  height = 8,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, backgroundColor: colors.fill }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: color ?? colors.systemBlue,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
});
