import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';

/** Toggleable capsule used for filters and pickers. */
export function Chip({
  label,
  selected = false,
  disabled = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={
        onPress ? { selected: Boolean(selected), disabled: Boolean(disabled) } : undefined
      }
      accessibilityLabel={onPress ? label : undefined}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? colors.systemBlue : colors.fill },
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: selected ? '#FFFFFF' : colors.secondaryLabel,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
