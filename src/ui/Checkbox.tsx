import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Ionicons } from './icons';

/** iOS-style circular checkbox. Green with a white checkmark when checked. */
export function Checkbox({ checked, onPress }: { checked: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [
        styles.box,
        checked
          ? { borderWidth: 1.5, borderColor: colors.systemGreen, backgroundColor: colors.systemGreen }
          : { borderWidth: 1.5, borderColor: colors.systemGray2 },
        pressed && styles.pressed,
      ]}
    >
      {checked ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.9 }] },
});
