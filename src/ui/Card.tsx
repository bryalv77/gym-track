import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme';

/** White (dark: elevated) rounded card used on the grouped background. */
export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl },
  padded: { padding: 16 },
});
