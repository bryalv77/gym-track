import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import {
  AppText,
  BarChart,
  Card,
  EmptyState,
  Ionicons,
  ListGroup,
  ListGroupHeader,
  ListRow,
  NavBar,
  Screen,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectMemberAssignments } from '../../store/slices/assignmentsSlice';
import { selectExerciseById } from '../../store/slices/exercisesSlice';
import { selectCompletionDays } from '../../store/slices/completionsSlice';
import { selectMeasurementsSorted } from '../../store/slices/measurementsSlice';
import {
  addDays,
  computeStreak,
  formatShortDate,
  toDateKey,
  weekdayInitial,
} from '../../utils/date';
import { DEFAULT_BODY_WEIGHT_KG, estimateCalories } from '../../utils/calories';
import type { ThemeColors } from '../../theme';

/** Member dashboard: streak, calories, weekly charts and history. */
export function DashboardScreen() {
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);
  const completionDays = useAppSelector((state) =>
    profile ? selectCompletionDays(state, profile.uid) : {},
  );
  const assignmentsByDate = useAppSelector((state) => state.assignments.byDate);
  const exercisesById = useAppSelector((state) => state.exercises.byId);
  const latestWeight = useAppSelector(
    (state) => selectMeasurementsSorted(state)[0]?.weightKg ?? DEFAULT_BODY_WEIGHT_KG,
  );

  /** kcal burned on a day = calories of the assignments completed that day. */
  const kcalForDay = (dayKey: string): number => {
    const dayCompletions = completionDays[dayKey];
    if (!dayCompletions) return 0;
    const day = assignmentsByDate[dayKey] ?? {};
    return Object.keys(dayCompletions).reduce((total, assignmentId) => {
      const assignment = day[assignmentId];
      if (!assignment || assignment.memberId !== profile?.uid) return total;
      return total + estimateCalories(exercisesById[assignment.exerciseId], assignment.metrics, latestWeight);
    }, 0);
  };

  const history = useMemo(() => {
    if (!profile) return [];
    const today = new Date();
    const rows: Array<{ date: Date; dateKey: string }> = [];
    for (let offset = 0; offset < 30; offset += 1) {
      const date = addDays(today, -offset);
      const dateKey = toDateKey(date);
      const dayCompletions = completionDays[dateKey];
      if (!dayCompletions || Object.keys(dayCompletions).length === 0) continue;
      rows.push({ date, dateKey });
    }
    return rows;
  }, [completionDays, profile]);

  const totals = useMemo(() => {
    const activeDays = new Set(
      Object.entries(completionDays)
        .filter(([, day]) => Object.keys(day).length > 0)
        .map(([dateKey]) => dateKey),
    );
    const totalDone = Object.values(completionDays).reduce(
      (total, day) => total + Object.keys(day).length,
      0,
    );
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      const key = toDateKey(date);
      return {
        label: weekdayInitial(date),
        value: Object.keys(completionDays[key] ?? {}).length,
        highlight: index === 6,
      };
    });
    const kcal7 = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      const key = toDateKey(date);
      return {
        label: weekdayInitial(date),
        value: kcalForDay(key),
        highlight: index === 6,
      };
    });
    return {
      streak: computeStreak(activeDays),
      totalDone,
      weekCount: last7.reduce((total, day) => total + day.value, 0),
      last7,
      kcalThisWeek: kcal7.reduce((total, day) => total + day.value, 0),
      kcal7,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionDays, assignmentsByDate, exercisesById, latestWeight, profile]);

  if (!profile) return null;

  return (
    <Screen>
      <NavBar large title="Dashboard" subtitle="Your training activity" />

      <View style={styles.statsGrid}>
        <StatCard colors={colors} icon="flame" tint={colors.systemOrange} value={`${totals.streak}`} label="Day streak" />
        <StatCard colors={colors} icon="checkmark-done-outline" tint={colors.systemGreen} value={`${totals.totalDone}`} label="Exercises done" />
        <StatCard colors={colors} icon="calendar-outline" tint={colors.systemBlue} value={`${totals.weekCount}`} label="This week" />
        <StatCard colors={colors} icon="flash-outline" tint={colors.systemRed} value={`${totals.kcalThisWeek}`} label="kcal this week" />
      </View>

      <Card style={styles.chartCard}>
        <AppText variant="headline">Last 7 days</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          Exercises completed per day
        </AppText>
        <BarChart data={totals.last7} highlightColor={colors.systemGreen} />
      </Card>

      <Card style={styles.chartCard}>
        <AppText variant="headline">Calories burned</AppText>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          Estimated kcal per day — last 7 days
        </AppText>
        <BarChart data={totals.kcal7} barColor={colors.systemOrange} highlightColor={colors.systemRed} />
      </Card>

      <ListGroupHeader label="History — last 30 days" />
      {history.length === 0 ? (
        <Card>
          <EmptyState
            icon="stats-chart-outline"
            title="No activity yet"
            message="Check off exercises on the Today tab and your history will appear here."
          />
        </Card>
      ) : (
        <ListGroup>
          {history.map((entry) => (
            <HistoryRow key={entry.dateKey} date={entry.date} dateKey={entry.dateKey} kcal={kcalForDay(entry.dateKey)} />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function HistoryRow({ date, dateKey, kcal }: { date: Date; dateKey: string; kcal: number }) {
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);
  const assignments = useAppSelector((state) =>
    profile ? selectMemberAssignments(state, dateKey, profile.uid) : [],
  );
  const dayCompletions =
    useAppSelector(
      (state) => (profile ? state.completions.byUser[profile.uid]?.[dateKey] : undefined),
    ) ?? {};
  const done = Object.keys(dayCompletions).length;
  const lastCompletedAt = Object.values(dayCompletions).reduce(
    (latest, entry) => Math.max(latest, entry.completedAt),
    0,
  );
  const firstName = useAppSelector((state) => {
    const completed = Object.keys(dayCompletions)[0];
    if (!completed) return '';
    const assignment = assignments.find((item) => item.id === completed);
    return assignment ? selectExerciseById(state, assignment.exerciseId)?.name ?? '' : '';
  });

  return (
    <ListRow
      title={formatShortDate(date)}
      subtitle={
        firstName
          ? `${firstName}${done > 1 ? ` +${done - 1} more` : ''} · ≈${kcal} kcal · at ${new Date(
              lastCompletedAt,
            ).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
          : undefined
      }
      value={`${done}/${assignments.length || done}`}
      icon={{
        name: 'checkmark-circle',
        color: colors.systemGreen,
        background: colors.greenTint,
      }}
    />
  );
}

function StatCard({
  colors,
  icon,
  tint,
  value,
  label,
}: {
  colors: ThemeColors;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={18} color={tint} />
      <AppText variant="title2" style={{ marginTop: 6 }}>
        {value}
      </AppText>
      <AppText variant="caption1" color={colors.secondaryLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: radius.xl,
    padding: 14,
    alignItems: 'center',
  },
  chartCard: { gap: 10, marginBottom: 8 },
});
