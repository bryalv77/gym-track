import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { AppText, CalendarMonth, Ionicons, SheetModal } from '../ui';
import { addDays, formatFullDate, isToday } from '../utils/date';

/** Date browser: ‹ day › with a full month calendar sheet. Tapping the date
 *  opens an iOS-style calendar. */
export function DatePager({
  date,
  onChange,
  allowFuture = true,
  markedDays,
}: {
  date: Date;
  onChange: (date: Date) => void;
  /** Pass false to stop the arrow navigation at today. */
  allowFuture?: boolean;
  /** Days that should show a dot in the calendar (e.g. days with activity). */
  markedDays?: Set<string>;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const today = new Date();
  const canGoForward =
    allowFuture || date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [
          styles.arrow,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.5 },
        ]}
        onPress={() => onChange(addDays(date, -1))}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('member.datePager.previous')}
      >
        <Ionicons name="chevron-back" size={18} color={colors.systemBlue} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.dateButton,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.6 },
        ]}
        onPress={() => setCalendarVisible(true)}
        accessibilityLabel={t('member.datePager.openCalendar')}
        accessibilityRole="button"
      >
        <AppText variant="subheadline" style={{ fontWeight: '600' }}>
          {formatFullDate(date)}
        </AppText>
        {isToday(date) ? (
          <AppText variant="caption2" color={colors.systemGreen}>
            {t('member.datePager.today')}
          </AppText>
        ) : null}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.arrow,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.5 },
        ]}
        onPress={() => onChange(addDays(date, 1))}
        disabled={!canGoForward}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canGoForward }}
        accessibilityLabel={t('member.datePager.next')}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={canGoForward ? colors.systemBlue : colors.tertiaryLabel}
        />
      </Pressable>

      <SheetModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        title={t('member.datePager.pick')}
      >
        <CalendarMonth
          selectedDate={date}
          markedDays={markedDays}
          onSelect={(picked) => {
            onChange(picked);
            setCalendarVisible(false);
          }}
        />
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
});
