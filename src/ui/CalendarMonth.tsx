import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { AppText } from './Text';
import { Ionicons } from './icons';
import { formatMonthYear, weekdayInitial } from '../utils/date';

/** Sunday-first weekday initials in the active language (2023-01-01 is a Sunday). */
const weekdayInitials = () =>
  Array.from({ length: 7 }, (_, index) => weekdayInitial(new Date(2023, 0, 1 + index)));

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export interface CalendarMonthProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  /** Latest selectable day. Omit to allow every day, future included. */
  maxDate?: Date;
  /** Days with content — shown as a dot under the day number. */
  markedDays?: Set<string>;
  /** Key function for marked days (YYYY-MM-DD). */
  toKey?: (date: Date) => string;
}

/** iOS-style month calendar. Days outside the month are dimmed, the selected
 *  day is a filled blue circle and marked days show a small dot. Every day is
 *  selectable unless a maxDate is given. */
export function CalendarMonth({
  selectedDate,
  onSelect,
  maxDate,
  markedDays,
  toKey = defaultKey,
}: CalendarMonthProps) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const initials = weekdayInitials();
  const [cursor, setCursor] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const today = useMemo(() => new Date(), []);

  const cells = useMemo(() => {
    const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return date;
    });
  }, [cursor]);

  const goMonth = (delta: number) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => goMonth(-1)} hitSlop={10} accessibilityLabel={t('member.calendar.previousMonth')}>
          <Ionicons name="chevron-back" size={20} color={colors.systemBlue} />
        </Pressable>
        <AppText variant="headline">
          {formatMonthYear(cursor)}
        </AppText>
        <Pressable onPress={() => goMonth(1)} hitSlop={10} accessibilityLabel={t('member.calendar.nextMonth')}>
          <Ionicons name="chevron-forward" size={20} color={colors.systemBlue} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {initials.map((initial, index) => (
          <AppText key={`${initial}-${index}`} variant="caption1" color={colors.secondaryLabel} style={styles.weekday}>
            {initial}
          </AppText>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date) => {
          const isOtherMonth = date.getMonth() !== cursor.getMonth();
          const isSelected = sameDay(date, selectedDate);
          const isToday = sameDay(date, today);
          const isFuture = maxDate ? date > maxDate && !sameDay(date, maxDate) : false;
          const disabled = isOtherMonth || isFuture;
          const marked = markedDays?.has(toKey(date)) ?? false;
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => !disabled && onSelect(date)}
              disabled={disabled}
              style={[styles.cell, isSelected && { backgroundColor: colors.systemBlue }]}
              accessibilityLabel={date.toDateString()}
            >
              <AppText
                style={{
                  fontSize: 17,
                  color: isSelected
                    ? '#FFFFFF'
                    : disabled
                      ? colors.tertiaryLabel
                      : isToday
                        ? colors.systemBlue
                        : colors.label,
                  fontWeight: isToday && !isSelected ? '700' : '400',
                }}
              >
                {date.getDate()}
              </AppText>
              {marked && !isSelected ? (
                <View style={[styles.dot, { backgroundColor: colors.systemGreen }]} />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function defaultKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    gap: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotPlaceholder: { width: 5, height: 5 },
});
