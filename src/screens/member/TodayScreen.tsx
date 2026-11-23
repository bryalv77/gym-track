import React, { useMemo, useState } from 'react';
import { exerciseName } from '../../utils/defaultExerciseData';
import { Image, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tabularNums, radius, useTheme, pressedOpacity } from '../../theme';
import {
  AppText,
  Card,
  EmptyState,
  Ionicons,
  ListGroupHeader,
  NavBar,
  ProgressBar,
  Screen,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectMemberAssignments } from '../../store/slices/assignmentsSlice';
import { selectExerciseById } from '../../store/slices/exercisesSlice';
import { NO_COMPLETIONS, selectCompletionsForDate } from '../../store/slices/completionsSlice';
import { selectMeasurementsSorted } from '../../store/slices/measurementsSlice';
import { selectSelfieForDate } from '../../store/slices/selfiesSlice';
import { setCompletion } from '../../services/completions';
import { deleteSelfie } from '../../services/selfies';
import { DatePager } from '../../components/DatePager';
import { ExerciseDetailSheet } from '../../components/ExerciseDetailSheet';
import { SelfieFormModal } from '../../components/SelfieFormModal';
import { confirmAction } from '../../utils/confirm';
import { formatTime, isToday, toDateKey } from '../../utils/date';
import { metricLabel } from '../../utils/exercisePresets';
import {
  DEFAULT_BODY_WEIGHT_KG,
  estimateCalories,
} from '../../utils/calories';
import type { Assignment, Completion } from '../../types';
import { useResetOnChange } from '../../utils/useResetOnChange';
import { shallowEqual } from 'react-redux';

/** Best-effort haptics on success. expo-haptics isn't installed; Vibration is
 *  the built-in, dependency-free fallback (a no-op where unsupported). */
function successHaptic() {
  try {
    Vibration.vibrate(12);
  } catch {
    // Feedback is best-effort — never let it break completion.
  }
}

/** Member home: their personalized exercises for the day, one completion target each. */
export function TodayScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [detailAssignmentId, setDetailAssignmentId] = useState<string | null>(null);
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const [optimistic, setOptimistic] = useState<Record<string, number | null>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);

  const dateKey = toDateKey(selectedDate);
  const assignments = useAppSelector(
    (state) => (profile ? selectMemberAssignments(state, dateKey, profile.uid) : []),
    shallowEqual,
  );
  const completions = useAppSelector((state) =>
    profile ? selectCompletionsForDate(state, profile.uid, dateKey) : NO_COMPLETIONS,
  );
  const completionDays = useAppSelector(
    (state) => (profile ? Object.keys(state.completions.byUser[profile.uid] ?? {}) : []),
    shallowEqual,
  );
  const exercisesById = useAppSelector((state) => state.exercises.byId);
  const latestWeight = useAppSelector(
    (state) => selectMeasurementsSorted(state)[0]?.weightKg ?? DEFAULT_BODY_WEIGHT_KG,
  );
  const selfie = useAppSelector((state) => selectSelfieForDate(state, dateKey));
  const detailAssignment = useAppSelector((state) =>
    detailAssignmentId && state.assignments.byDate[dateKey]
      ? state.assignments.byDate[dateKey][detailAssignmentId] ?? null
      : null,
  );
  const detailExercise = useAppSelector((state) =>
    detailAssignment ? selectExerciseById(state, detailAssignment.exerciseId) : undefined,
  );

  useResetOnChange([dateKey, profile?.uid], () => {
    setOptimistic({});
    setToggleError(null);
  });

  // Drop an optimistic override once the store reflects the intended state,
  // so the subscription's eventual update doesn't cause a visible flicker.
  useResetOnChange([completions], () => {
    setOptimistic((prev) => {
      let changed = false;
      const next: Record<string, number | null> = {};
      for (const [id, doneAt] of Object.entries(prev)) {
        if ((completions[id] != null) === (doneAt !== null)) {
          changed = true;
        } else {
          next[id] = doneAt;
        }
      }
      return changed ? next : prev;
    });
  });

  const isDone = (id: string): boolean =>
    Object.prototype.hasOwnProperty.call(optimistic, id)
      ? optimistic[id] !== null
      : completions[id] != null;

  const completionFor = (id: string): Completion | undefined => {
    if (Object.prototype.hasOwnProperty.call(optimistic, id)) {
      const doneAt = optimistic[id];
      return doneAt !== null ? { completedAt: doneAt } : undefined;
    }
    return completions[id];
  };

  const caloriesFor = (assignment: Assignment): number =>
    estimateCalories(
      exercisesById[assignment.exerciseId],
      assignment.metrics,
      latestWeight,
    );

  const markedDays = new Set(completionDays);

  const doneIds = useMemo(() => {
    const ids = new Set<string>();
    for (const assignment of assignments) {
      const overridden = Object.prototype.hasOwnProperty.call(optimistic, assignment.id);
      const done = overridden ? optimistic[assignment.id] : completions[assignment.id] != null;
      if (done) ids.add(assignment.id);
    }
    return ids;
  }, [assignments, completions, optimistic]);
  const doneCount = doneIds.size;
  const burnedKcal = useMemo(
    () =>
      assignments
        .filter((assignment) => doneIds.has(assignment.id))
        .reduce((total, assignment) => total + caloriesFor(assignment), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments, doneIds, exercisesById, latestWeight],
  );
  // Exercises that came from a routine are shown under the routine's name
  // (read-only for the member); individually assigned ones go in their own group.
  const groups = useMemo(() => {
    const routineGroups = new Map<string, { title: string; items: Assignment[] }>();
    const individual: Assignment[] = [];
    for (const assignment of assignments) {
      if (assignment.routineId) {
        const group = routineGroups.get(assignment.routineId) ?? {
          title: assignment.routineName ?? '',
          items: [],
        };
        group.items.push(assignment);
        routineGroups.set(assignment.routineId, group);
      } else {
        individual.push(assignment);
      }
    }
    return { routines: [...routineGroups.values()], individual };
  }, [assignments]);
  const allDone = assignments.length > 0 && doneCount === assignments.length;

  if (!profile) return null;

  const toggle = async (assignment: Assignment) => {
    const desired = !isDone(assignment.id);
    setToggleError(null);
    setOptimistic((prev) => ({ ...prev, [assignment.id]: desired ? Date.now() : null }));
    try {
      await setCompletion(profile.uid, dateKey, assignment.id, desired);
      if (desired) successHaptic();
    } catch (error) {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[assignment.id];
        return next;
      });
      setToggleError(
        error instanceof Error && error.message
          ? error.message
          : t('common.genericError'),
      );
    }
  };

  const handleDeleteSelfie = () => {
    if (!selfie) return;
    confirmAction(
      t('member.selfie.deleteTitle'),
      t('member.selfie.deleteMessage'),
      async () => {
        try {
          await deleteSelfie(profile.uid, selfie.id);
        } catch (error) {
          console.warn('[TodayScreen] delete selfie failed', error);
        }
      },
    );
  };

  return (
    <Screen>
      <NavBar
        large
        title={t('member.today.title')}
        subtitle={t('member.today.welcome', { name: profile.name.split(' ')[0] })}
      />
      <DatePager date={selectedDate} onChange={setSelectedDate} markedDays={markedDays} />

      {assignments.length === 0 ? (
        <Card>
          <EmptyState
            icon="barbell-outline"
            title={isToday(selectedDate) ? t('member.today.noExercises') : t('member.today.nothingPlanned')}
            message={
              isToday(selectedDate)
                ? t('member.today.noExercisesMsg')
                : t('member.today.nothingPlannedMsg')
            }
          />
        </Card>
      ) : (
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="headline">
                {allDone
                  ? t('member.today.allDone')
                  : t('member.today.progress', { done: doneCount, total: assignments.length })}
              </AppText>
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {allDone
                  ? t('member.today.allDoneMsg')
                  : t('member.today.percent', {
                      percent: Math.round((doneCount / assignments.length) * 100),
                    })}
              </AppText>
            </View>
            <View
              style={[
                styles.checkBadge,
                { backgroundColor: allDone ? colors.systemGreen : colors.fill },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={20}
                color={allDone ? colors.onAccent : colors.systemGray2}
              />
            </View>
          </View>
          <ProgressBar
            progress={doneCount / assignments.length}
            color={allDone ? colors.systemGreen : colors.systemBlue}
          />
          <View style={styles.kcalRow}>
            <Ionicons name="flame" size={16} color={colors.systemOrange} />
            <AppText variant="footnote" color={colors.secondaryLabel}>
              ≈ <AppText variant="footnote" style={{ color: colors.systemOrange, fontWeight: '700' }}>
                {t('member.today.kcal', { kcal: burnedKcal })}
              </AppText>{' '}
              {t('member.today.burned', { count: doneCount })}
            </AppText>
          </View>
        </Card>
      )}

      {toggleError ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.redTint }]} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color={colors.systemRed} />
          <AppText variant="subheadline" color={colors.systemRed} style={{ flex: 1 }}>
            {toggleError}
          </AppText>
        </View>
      ) : null}

      {assignments.length > 0 ? (
        <View style={styles.list}>
          {[
            ...groups.routines,
            ...(groups.individual.length > 0
              ? [{ title: groups.routines.length > 0 ? t('member.today.otherExercises') : '', items: groups.individual }]
              : []),
          ].map((group, index) => (
            <View key={`${group.title}-${index}`}>
              {group.title ? <ListGroupHeader label={group.title} /> : null}
              <View style={styles.cardGroup}>
                {group.items.map((assignment) => (
                  <WorkoutExerciseCard
                    key={assignment.id}
                    assignment={assignment}
                    completion={completionFor(assignment.id)}
                    kcal={caloriesFor(assignment)}
                    onToggle={() => toggle(assignment)}
                    onOpenDetail={() => setDetailAssignmentId(assignment.id)}
                  />
                ))}
              </View>
            </View>
          ))}
          <AppText variant="caption1" color={colors.tertiaryLabel} style={styles.hint}>
            {t('member.today.hint')}
          </AppText>
        </View>
      ) : null}

      {/* Daily selfie is deliberately demoted below the workout list so a
          member mid-lift reaches their first exercise without scrolling. */}
      {profile.guest ? null : (
      <Card style={styles.selfieCard}>
        <View style={styles.selfieRow}>
          {selfie ? (
            <Image source={{ uri: selfie.photoData }} style={styles.selfieThumb} />
          ) : (
            <View
              style={[styles.selfieThumb, styles.selfieThumbPlaceholder, { backgroundColor: colors.fill }]}
            >
              <Ionicons name="camera-outline" size={24} color={colors.secondaryLabel} />
            </View>
          )}
          <View style={styles.selfieInfo}>
            <AppText variant="headline" numberOfLines={1}>
              {t('member.selfie.daily')}
            </AppText>
            <AppText variant="footnote" color={colors.secondaryLabel} numberOfLines={2}>
              {selfie?.notes
                ? selfie.notes
                : isToday(selectedDate)
                  ? t('member.selfie.takeToday')
                  : t('member.selfie.add')}
            </AppText>
          </View>
          {selfie ? (
            <View style={styles.selfieActions}>
              <Pressable
                onPress={() => setSelfieModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={t('member.selfie.editA11y')}
                style={({ pressed }) => [styles.selfieActionButton, pressed && styles.pressed]}
              >
                <Ionicons name="pencil" size={20} color={colors.systemBlue} />
              </Pressable>
              <Pressable
                onPress={handleDeleteSelfie}
                accessibilityRole="button"
                accessibilityLabel={t('member.selfie.deleteA11y')}
                style={({ pressed }) => [styles.selfieActionButton, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.systemRed} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setSelfieModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={
                isToday(selectedDate) ? t('member.selfie.takeToday') : t('member.selfie.add')
              }
              style={({ pressed }) => [
                styles.selfieActionButton,
                { backgroundColor: colors.blueTint },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="camera" size={20} color={colors.systemBlue} />
            </Pressable>
          )}
        </View>
      </Card>
      )}

      <ExerciseDetailSheet
        visible={detailAssignment != null}
        onClose={() => setDetailAssignmentId(null)}
        exercise={detailExercise}
        assignment={detailAssignment}
        completion={detailAssignment ? completionFor(detailAssignment.id) : undefined}
        onToggle={() => {
          if (detailAssignment) toggle(detailAssignment);
        }}
      />

      <SelfieFormModal
        visible={selfieModalVisible}
        onClose={() => setSelfieModalVisible(false)}
        dateKey={dateKey}
        editing={selfie ?? null}
      />
    </Screen>
  );
}

/** Arm's-length-legible workout row: prominent name, big tabular metric pills,
 *  a distinct coach-note callout and a large 48x48 completion target. */
function WorkoutExerciseCard({
  assignment,
  completion,
  kcal,
  onToggle,
  onOpenDetail,
}: {
  assignment: Assignment;
  completion?: Completion;
  kcal: number;
  onToggle: () => void;
  onOpenDetail: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const exercise = useAppSelector((state) =>
    selectExerciseById(state, assignment.exerciseId),
  );
  const done = completion != null;
  const doneAt = done
    ? t('member.today.doneAt', {
        time: formatTime(completion.completedAt),
      })
    : null;
  const icon =
    exercise?.type === 'cardio'
      ? {
          name: 'speedometer-outline' as const,
          color: colors.systemOrange,
          background: colors.orangeTint,
        }
      : {
          name: 'barbell-outline' as const,
          color: colors.systemBlue,
          background: colors.blueTint,
        };
  const name = (exercise ? exerciseName(exercise) : null) ?? t('member.today.exercise');

  return (
    <Card style={styles.exerciseCard}>
      <Pressable
        onPress={onOpenDetail}
        accessibilityRole="button"
        accessibilityLabel={name}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.exerciseIcon, { backgroundColor: icon.background }]}>
            <Ionicons name={icon.name} size={22} color={icon.color} />
          </View>
          <View style={styles.exerciseTitleWrap}>
            <AppText variant="title3" numberOfLines={2}>
              {name}
            </AppText>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={done ? t('member.detail.markNotDone') : t('member.detail.markDone')}
            style={({ pressed }) => [
              styles.completeButton,
              {
                backgroundColor: done ? colors.systemGreen : colors.fill,
                borderColor: done ? colors.systemGreen : colors.systemGray2,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="checkmark" size={26} color={done ? colors.onAccent : colors.secondaryLabel} />
          </Pressable>
        </View>

        {exercise && exercise.metricFields.length > 0 ? (
          <View style={styles.metricPillsRow}>
            {exercise.metricFields.map((field) => {
              const value = assignment.metrics[field.key];
              const label = field.unit ? field.unit : metricLabel(field);
              return (
                <View key={field.key} style={[styles.metricPill, { backgroundColor: colors.fill }]}>
                  <AppText variant="title2" style={[tabularNums, styles.metricValue]}>
                    {value ?? '—'}
                  </AppText>
                  <AppText variant="caption2" color={colors.secondaryLabel} style={styles.metricPillLabel}>
                    {label.toUpperCase()}
                  </AppText>
                </View>
              );
            })}
          </View>
        ) : null}

        {assignment.notes ? (
          <View
            style={[
              styles.coachNote,
              { backgroundColor: colors.blueTint, borderLeftColor: colors.systemBlue },
            ]}
          >
            <AppText variant="caption2" color={colors.systemBlue} style={styles.coachNoteLabel}>
              {t('member.today.coachNote')}
            </AppText>
            <AppText variant="subheadline">{assignment.notes}</AppText>
          </View>
        ) : null}

        <View style={styles.cardMetaRow}>
          <Ionicons name="flame" size={15} color={colors.systemOrange} />
          <AppText variant="footnote" color={colors.secondaryLabel}>
            ≈ {kcal} {t('member.units.kcal')}
          </AppText>
          {doneAt ? (
            <>
              <View style={[styles.metaDot, { backgroundColor: colors.systemGray2 }]} />
              <Ionicons name="checkmark-circle" size={15} color={colors.systemGreen} />
              <AppText variant="footnote" color={colors.systemGreen} style={tabularNums}>
                {doneAt}
              </AppText>
            </>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  progressCard: { marginBottom: 16, gap: 12 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  list: { gap: 8 },
  cardGroup: { gap: 10 },
  hint: { marginLeft: 4, marginTop: 2 },
  exerciseCard: { overflow: 'hidden' },
  cardPressable: { gap: 12 },
  pressed: { opacity: pressedOpacity },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitleWrap: { flex: 1 },
  completeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricPill: {
    flex: 1,
    minWidth: 84,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: { letterSpacing: -0.5 },
  metricPillLabel: { fontWeight: '700', letterSpacing: 0.5 },
  coachNote: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  coachNoteLabel: { fontWeight: '700', letterSpacing: 0.5 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 2 },
  selfieCard: { marginTop: 16 },
  selfieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selfieThumb: { width: 64, height: 64, borderRadius: radius.sm },
  selfieThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  selfieInfo: { flex: 1, gap: 2 },
  selfieActions: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  selfieActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
