import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tabularNums, useTheme, disabledOpacity, radius } from '../theme';
import { AppText } from './Text';
import { Ionicons } from './icons';
import { useResetOnChange } from '../utils/useResetOnChange';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

/** iOS-style stepper (− / +) with an inline editable numeric readout and press-and-hold repeat. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
}: StepperProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => String(value));
  const [editing, setEditing] = useState(false);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTicksRef = useRef(0);

  useResetOnChange([value, editing], () => setDraft(String(value)), !editing);

  const stopHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdTicksRef.current = 0;
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const normalize = useCallback(
    (raw: number) => {
      const precision = (String(step).split('.')[1] || '').length;
      const clamped = Math.min(max, Math.max(min, raw));
      return precision > 0 ? Number(clamped.toFixed(precision)) : clamped;
    },
    [min, max, step],
  );

  const stepBy = useCallback(
    (delta: number) => {
      const next = normalize(valueRef.current + delta);
      if (next !== valueRef.current) {
        valueRef.current = next;
        setDraft(String(next));
        onChangeRef.current(next);
      } else if ((delta < 0 && next <= min) || (delta > 0 && next >= max)) {
        stopHold();
      }
    },
    [normalize, min, max, stopHold],
  );

  const startHold = useCallback(
    (direction: -1 | 1) => {
      stopHold();
      holdTicksRef.current = 0;
      holdTimerRef.current = setInterval(() => {
        holdTicksRef.current += 1;
        const multiplier = holdTicksRef.current > 16 ? 5 : holdTicksRef.current > 6 ? 2 : 1;
        stepBy(direction * step * multiplier);
      }, 90);
    },
    [step, stepBy, stopHold],
  );

  const commitDraft = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim().replace(',', '.');
    const parsed = Number(trimmed);
    if (trimmed !== '' && Number.isFinite(parsed)) {
      const next = normalize(parsed);
      setDraft(String(next));
      if (next !== value) {
        onChange(next);
      }
    } else {
      setDraft(String(value));
    }
  }, [draft, normalize, onChange, value]);

  const minusDisabled = value <= min;
  const plusDisabled = value >= max;

  const decreaseA11yLabel = label
    ? t('common.decreaseLabel', { label })
    : t('common.decrease');
  const increaseA11yLabel = label
    ? t('common.increaseLabel', { label })
    : t('common.increase');

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
          onPress={() => stepBy(-step)}
          onLongPress={() => startHold(-1)}
          onPressOut={stopHold}
          delayLongPress={280}
          disabled={minusDisabled}
          style={({ pressed }) => [
            styles.segment,
            pressed && { backgroundColor: colors.fill },
            minusDisabled && styles.dimmed,
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ disabled: minusDisabled }}
          accessibilityLabel={decreaseA11yLabel}
        >
          <Ionicons name="remove" size={18} color={colors.label} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />
        <View style={[styles.readoutCell, { backgroundColor: colors.surface }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setEditing(true)}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            accessibilityLabel={label ?? t('common.value')}
            style={[
              styles.input,
              tabularNums,
              { color: colors.label },
            ]}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />
        <Pressable
          onPress={() => stepBy(step)}
          onLongPress={() => startHold(1)}
          onPressOut={stopHold}
          delayLongPress={280}
          disabled={plusDisabled}
          style={({ pressed }) => [
            styles.segment,
            pressed && { backgroundColor: colors.fill },
            plusDisabled && styles.dimmed,
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ disabled: plusDisabled }}
          accessibilityLabel={increaseA11yLabel}
        >
          <Ionicons name="add" size={18} color={colors.label} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  control: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, overflow: 'hidden' },
  segment: { minWidth: 42, minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  readoutCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  input: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dimmed: { opacity: disabledOpacity },
});
