import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';

/** Toggleable capsule used for filters and pickers. */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? colors.systemBlue : colors.fill },
        pressed && { opacity: 0.6 },
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
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
