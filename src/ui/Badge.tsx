import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';
import { AppText } from './Text';

type BadgeVariant = 'neutral' | 'blue' | 'green' | 'orange';

function palette(colors: ThemeColors): Record<BadgeVariant, { background: string; foreground: string }> {
  return {
    neutral: { background: colors.fill, foreground: colors.secondaryLabel },
    blue: { background: colors.blueTint, foreground: colors.systemBlue },
    green: { background: colors.greenTint, foreground: colors.systemGreen },
    orange: { background: colors.orangeTint, foreground: colors.systemOrange },
  };
}

/** Small tinted capsule with a short label (counts, statuses). */
export function Badge({ label, variant = 'neutral' }: { label: string; variant?: BadgeVariant }) {
  const { colors } = useTheme();
  const tone = palette(colors)[variant];
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <AppText style={{ color: tone.foreground, fontSize: 12, fontWeight: '600' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
