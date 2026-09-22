import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';
import { Ionicons, type IconName } from './icons';

/** Friendly placeholder when a list has no content yet. */
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: IconName;
  title: string;
  message?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: colors.fill }]}>
        <Ionicons name={icon} size={30} color={colors.systemGray} />
      </View>
      <AppText variant="headline" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="subheadline"
          color={colors.secondaryLabel}
          align="center"
          style={styles.message}
        >
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 16 },
  circle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  message: { maxWidth: 280 },
});
