import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';
import { Ionicons } from './icons';

export interface NavBarProps {
  title: string;
  subtitle?: string;
  /** Large-title mode (iOS large title placed below the compact bar). */
  large?: boolean;
  onBack?: () => void;
  backLabel?: string;
  rightLabel?: string;
  onRight?: () => void;
  rightDisabled?: boolean;
}

/** iOS navigation bar, theme-aware. */
export function NavBar({
  title,
  subtitle,
  large = false,
  onBack,
  backLabel,
  rightLabel,
  onRight,
  rightDisabled = false,
}: NavBarProps) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.bar}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.sideButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.systemBlue} />
            {backLabel ? <AppText color={colors.systemBlue} style={styles.actionText}>{backLabel}</AppText> : null}
          </Pressable>
        ) : (
          <View style={{ width: 16 }} />
        )}
        {large ? (
          <View style={{ flex: 1 }} />
        ) : (
          <AppText variant="headline" numberOfLines={1} style={styles.compactTitle}>
            {title}
          </AppText>
        )}
        {rightLabel && onRight ? (
          <Pressable onPress={onRight} disabled={rightDisabled} style={styles.sideButton} hitSlop={8}>
            <AppText style={[styles.actionText, { color: colors.systemBlue }, rightDisabled && { opacity: 0.4 }]}>
              {rightLabel}
            </AppText>
          </Pressable>
        ) : (
          <View style={{ width: 16 }} />
        )}
      </View>
      {large ? (
        <View style={styles.largeWrap}>
          <AppText variant="largeTitle">{title}</AppText>
          {subtitle ? (
            <AppText variant="subheadline" color={colors.secondaryLabel}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  sideButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: '100%' },
  actionText: { fontSize: 17 },
  compactTitle: { flex: 1, textAlign: 'center' },
  largeWrap: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8, gap: 2 },
});
