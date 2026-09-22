import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';
import { Ionicons } from './icons';

/** iOS-style stepper (− / +) with a value readout, used for prescriptions. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  const { colors } = useTheme();
  const minusDisabled = value <= min;
  const plusDisabled = value >= max;
  return (
    <View style={styles.row}>
      {label ? (
        <AppText style={{ flex: 1, fontSize: 15 }}>{label}</AppText>
      ) : null}
      <View
        style={[
          styles.control,
          {
            backgroundColor: colors.systemGray5,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.separator,
          },
        ]}
      >
        <Pressable
          onPress={() => onChange(value - step)}
          disabled={minusDisabled}
          style={({ pressed }) => [
            styles.segment,
            pressed && { backgroundColor: colors.fill },
            minusDisabled && styles.dimmed,
          ]}
          hitSlop={0}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
        >
          <Ionicons name="remove" size={18} color={colors.label} />
        </Pressable>
        <View style={{ width: StyleSheet.hairlineWidth, height: '100%', backgroundColor: colors.separator }} />
        <Pressable
          onPress={() => onChange(value + step)}
          disabled={plusDisabled}
          style={({ pressed }) => [
            styles.segment,
            pressed && { backgroundColor: colors.fill },
            plusDisabled && styles.dimmed,
          ]}
          hitSlop={0}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
        >
          <Ionicons name="add" size={18} color={colors.label} />
        </Pressable>
      </View>
      <AppText variant="title3" style={{ minWidth: 34, textAlign: 'center' }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  control: { flexDirection: 'row', alignItems: 'center', borderRadius: 9, overflow: 'hidden' },
  segment: { width: 38, height: 32, alignItems: 'center', justifyContent: 'center' },
  dimmed: { opacity: 0.35 },
});
